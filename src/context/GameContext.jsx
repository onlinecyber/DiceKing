import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { callApi, BACKEND_URL } from '../firebase/api';
import { soundManager } from '../utils/soundManager';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  // Game Mode: '30s' or '1m'
  const [gameMode, setGameMode] = useState('30s');

  // 30s Game States
  const [activeRound, setActiveRound] = useState(null);
  const [history, setHistory] = useState([]);
  const [countdown, setCountdown] = useState(30);
  const [rolling, setRolling] = useState(false);
  const [rolledDice, setRolledDice] = useState({ dice1: 1, dice2: 1, total: 2 });
  const [settling, setSettling] = useState(false);

  // 1-Minute Game States
  const [activeRound1m, setActiveRound1m] = useState(null);
  const [history1m, setHistory1m] = useState([]);
  const [countdown1m, setCountdown1m] = useState(60);
  const [rolling1m, setRolling1m] = useState(false);
  const [rolledDice1m, setRolledDice1m] = useState({ dice1: 1, dice2: 1, total: 2 });
  const [settling1m, setSettling1m] = useState(false);

  // Shared States
  const [leaderboard, setLeaderboard] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [recentBets, setRecentBets] = useState([]);
  const [toast, setToast] = useState(null);
  const [roundResultModal, setRoundResultModal] = useState(null);

  const closeResultModal = () => setRoundResultModal(null);

  // Safety watchdogs: ensure rolling state never freezes
  useEffect(() => {
    if (rolling) {
      const timer = setTimeout(() => setRolling(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [rolling]);

  useEffect(() => {
    if (rolling1m) {
      const timer = setTimeout(() => setRolling1m(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [rolling1m]);

  // App Settings state with default Indian settings values
  const [appSettings, setAppSettings] = useState({
    upiId: '8406884196@ptaxis',
    qrUrl: 'upi://pay?pa=8406884196@ptaxis&pn=DiceKing&cu=INR',
    minDeposit: 100,
    minWithdrawal: 100,
    supportPhone: '7070536545',
    supportTelegram: 'https://t.me/Doublepattiin'
  });

  // References to track changes
  const prevCompletedRoundIdRef = useRef(null);
  const prevCompletedRoundId1mRef = useRef(null);
  const triggerInProgress = useRef(false);
  const triggerInProgress1m = useRef(false);
  const nextAllowedSettleTimeRef = useRef(0);
  const nextAllowedSettleTime1mRef = useRef(0);
  const serverTimeOffsetRef = useRef(0);

  // Initial server wake-up & clock sync
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/version`)
      .then(res => res.json())
      .then(data => {
        if (data?.serverTime) {
          serverTimeOffsetRef.current = data.serverTime - Date.now();
        }
      })
      .catch(() => {});
  }, []);

  // Sound effects or visual notifications helper
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Standalone Backend API Calls Bindings
  const placeBetFn = (data) => callApi('placeBet', data);
  const settleRoundFn = (data) => callApi('settleRoundAndStartNew', data);
  const settleRound1mFn = (data) => callApi('settleRound1m', data);
  const submitDepositFn = (data) => callApi('submitDepositRequest', data);
  const submitWithdrawalFn = (data) => callApi('submitWithdrawalRequest', data);

  // Place Bet wrapper (Instant Optimistic Feedback)
  const placeBet = async (type, exactValue, amount) => {
    const currentActive = gameMode === '1m' ? activeRound1m : activeRound;
    if (!currentActive) throw new Error("No active round available.");

    // Instant local wallet balance deduction
    const prevBalance = wallet?.balance;
    if (wallet && typeof wallet.balance === 'number') {
      setWallet(prev => prev ? { ...prev, balance: Math.max(0, prev.balance - amount) } : prev);
    }

    try {
      const result = await placeBetFn({
        roundId: currentActive.id,
        type,
        exactValue: type === 'exact' ? Number(exactValue) : null,
        amount: Number(amount),
        displayName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Player',
        gameMode
      });
      showToast(`Bet of ₹${amount} placed on ${gameMode === '1m' ? '1-Min' : '30s'} successfully!`, 'success');
      return result.data;
    } catch (error) {
      // Revert optimistic balance if failed
      if (typeof prevBalance === 'number') {
        setWallet(prev => prev ? { ...prev, balance: prevBalance } : prev);
      }
      showToast(error.message || "Failed to place bet.", 'error');
      throw error;
    }
  };

  // Settle Round trigger (30s)
  const triggerSettleRound = async () => {
    if (triggerInProgress.current) return;
    if (Date.now() < nextAllowedSettleTimeRef.current) return;

    triggerInProgress.current = true;
    setSettling(true);

    const safetyTimer = setTimeout(() => {
      triggerInProgress.current = false;
      setSettling(false);
    }, 6000);

    try {
      const result = await settleRoundFn();
      if (result?.data?.serverTime) {
        serverTimeOffsetRef.current = result.data.serverTime - Date.now();
      }

      if (result?.data?.success) {
        nextAllowedSettleTimeRef.current = Date.now() + 2000;
      } else {
        const waitMs = result?.data?.remainingMs ? Math.max(2000, result.data.remainingMs) : 3500;
        nextAllowedSettleTimeRef.current = Date.now() + waitMs;
      }
    } catch (error) {
      console.error("Error triggering round settlement:", error);
      nextAllowedSettleTimeRef.current = Date.now() + 5000;
    } finally {
      clearTimeout(safetyTimer);
      triggerInProgress.current = false;
      setSettling(false);
    }
  };

  // Settle Round trigger (1m)
  const triggerSettleRound1m = async () => {
    if (triggerInProgress1m.current) return;
    if (Date.now() < nextAllowedSettleTime1mRef.current) return;

    triggerInProgress1m.current = true;
    setSettling1m(true);

    const safetyTimer = setTimeout(() => {
      triggerInProgress1m.current = false;
      setSettling1m(false);
    }, 6000);

    try {
      const result = await settleRound1mFn();
      if (result?.data?.serverTime) {
        serverTimeOffsetRef.current = result.data.serverTime - Date.now();
      }

      if (result?.data?.success) {
        nextAllowedSettleTime1mRef.current = Date.now() + 2000;
      } else {
        const waitMs = result?.data?.remainingMs ? Math.max(2000, result.data.remainingMs) : 3500;
        nextAllowedSettleTime1mRef.current = Date.now() + waitMs;
      }
    } catch (error) {
      console.error("Error triggering 1m round settlement:", error);
      nextAllowedSettleTime1mRef.current = Date.now() + 5000;
    } finally {
      clearTimeout(safetyTimer);
      triggerInProgress1m.current = false;
      setSettling1m(false);
    }
  };

  // Deposit Request
  const requestDeposit = async (amount, paymentMethod, transactionReference) => {
    try {
      const result = await submitDepositFn({
        amount: Number(amount),
        paymentMethod,
        transactionReference
      });
      showToast("Deposit request submitted for admin review.", "success");
      return result.data;
    } catch (error) {
      showToast(error.message || "Deposit request failed.", "error");
      throw error;
    }
  };

  // Withdrawal Request
  const requestWithdrawal = async (amount, paymentMethod, walletAddress) => {
    try {
      const result = await submitWithdrawalFn({
        amount: Number(amount),
        paymentMethod,
        walletAddress
      });
      showToast("Withdrawal request submitted! Payout processing...", "success");
      return result.data;
    } catch (error) {
      showToast(error.message || "Withdrawal request failed.", "error");
      throw error;
    }
  };

  // 2. Real-time Listeners (Active Round, History, Leaderboard, Settings)
  useEffect(() => {
    // Listen to app settings config doc
    const unsubscribeSettings = onSnapshot(doc(db, 'config', 'settings'), (snapshot) => {
      if (snapshot.exists()) {
        setAppSettings(snapshot.data());
      }
    }, (error) => console.error("Settings snapshot error:", error));

    // Listen to current active round
    const activeRoundQuery = query(
      collection(db, 'gameRounds'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribeActiveRound = onSnapshot(activeRoundQuery, (snapshot) => {
      if (!snapshot.empty) {
        setActiveRound(snapshot.docs[0].data());
      } else {
        // No active round, bootstrap by settling/starting one
        triggerSettleRound();
      }
    }, (error) => console.error("Active round snapshot error:", error));

    // Listen to history of last 20 completed rounds
    const historyQuery = query(
      collection(db, 'gameRounds'),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      const rounds = snapshot.docs.map(doc => doc.data());
      setHistory(rounds);

      // Handle roll animations for all users when a new completed round is recorded
      if (rounds.length > 0) {
        const latestCompleted = rounds[0];
        if (prevCompletedRoundIdRef.current && prevCompletedRoundIdRef.current !== latestCompleted.id) {
          // Play roll animation and audio sound
          setRolling(true);
          soundManager.playDiceRoll();
          setRolledDice({
            dice1: latestCompleted.dice1,
            dice2: latestCompleted.dice2,
            total: latestCompleted.total
          });
          
          // Stop rolling and reveal outcome after 1.5s
          setTimeout(() => {
            setRolling(false);
            
            // Look up if user had placed bets in this round to display result modal
            if (currentUser) {
              const userRoundBetQuery = query(
                collection(db, 'bets'),
                where('uid', '==', currentUser.uid),
                where('roundId', '==', latestCompleted.id)
              );
              
              onSnapshot(userRoundBetQuery, (betSnap) => {
                if (betSnap.empty) return;

                let wonAmount = 0;
                let totalBetAmount = 0;
                const userBets = [];

                betSnap.forEach(bDoc => {
                  const b = bDoc.data();
                  totalBetAmount += (Number(b.amount) || 0);
                  if (b.status === 'won') {
                    wonAmount += (Number(b.payout) || 0);
                  }
                  userBets.push(b);
                });

                // Format period string: YYYYMMDD000{roundNumber}
                let date = new Date();
                if (latestCompleted.createdAt) {
                  if (typeof latestCompleted.createdAt.toDate === 'function') {
                    date = latestCompleted.createdAt.toDate();
                  } else if (latestCompleted.createdAt.seconds) {
                    date = new Date(latestCompleted.createdAt.seconds * 1000);
                  } else {
                    date = new Date(latestCompleted.createdAt);
                  }
                }
                const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
                const dateStr = formatter.format(date).replace(/-/g, '');
                const period = `${dateStr}000${latestCompleted.roundNumber}`;

                const isWin = wonAmount > 0;
                if (isWin) {
                  soundManager.playWin();
                  showToast(`🎉 You Won ₹${wonAmount.toFixed(2)} in Round #${latestCompleted.roundNumber}!`, 'success');
                } else {
                  soundManager.playLoss();
                  showToast(`Round #${latestCompleted.roundNumber} completed: Rolled ${latestCompleted.total}`, 'info');
                }

                setRoundResultModal({
                  type: isWin ? 'win' : 'loss',
                  period,
                  roundNumber: latestCompleted.roundNumber,
                  dice1: latestCompleted.dice1,
                  dice2: latestCompleted.dice2,
                  total: latestCompleted.total,
                  resultType: latestCompleted.resultType,
                  wonAmount,
                  totalBetAmount,
                  bets: userBets
                });
              }, { onlyOnce: true });
            }
          }, 1500);
        }
        // Save ref of current completed round
        prevCompletedRoundIdRef.current = latestCompleted.id;
      }
    }, (error) => console.error("History snapshot error:", error));

    // Listen to current active round for 1-Minute Mode
    const activeRound1mQuery = query(
      collection(db, 'gameRounds_1m'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribeActiveRound1m = onSnapshot(activeRound1mQuery, (snapshot) => {
      if (!snapshot.empty) {
        setActiveRound1m(snapshot.docs[0].data());
      } else {
        triggerSettleRound1m();
      }
    }, (error) => console.error("Active round 1m snapshot error:", error));

    // Listen to history of last 20 completed rounds for 1-Minute Mode
    const history1mQuery = query(
      collection(db, 'gameRounds_1m'),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribeHistory1m = onSnapshot(history1mQuery, (snapshot) => {
      const rounds = snapshot.docs.map(doc => doc.data());
      setHistory1m(rounds);

      if (rounds.length > 0) {
        const latestCompleted = rounds[0];
        if (prevCompletedRoundId1mRef.current && prevCompletedRoundId1mRef.current !== latestCompleted.id) {
          setRolling1m(true);
          if (gameMode === '1m') {
            soundManager.playDiceRoll();
          }
          setRolledDice1m({
            dice1: latestCompleted.dice1,
            dice2: latestCompleted.dice2,
            total: latestCompleted.total
          });

          setTimeout(() => {
            setRolling1m(false);

            if (currentUser) {
              const userRoundBetQuery = query(
                collection(db, 'bets'),
                where('uid', '==', currentUser.uid),
                where('roundId', '==', latestCompleted.id)
              );

              onSnapshot(userRoundBetQuery, (betSnap) => {
                if (betSnap.empty) return;

                let wonAmount = 0;
                let totalBetAmount = 0;
                const userBets = [];

                betSnap.forEach(bDoc => {
                  const b = bDoc.data();
                  totalBetAmount += (Number(b.amount) || 0);
                  if (b.status === 'won') {
                    wonAmount += (Number(b.payout) || 0);
                  }
                  userBets.push(b);
                });

                let date = new Date();
                if (latestCompleted.createdAt) {
                  if (typeof latestCompleted.createdAt.toDate === 'function') {
                    date = latestCompleted.createdAt.toDate();
                  } else if (latestCompleted.createdAt.seconds) {
                    date = new Date(latestCompleted.createdAt.seconds * 1000);
                  } else {
                    date = new Date(latestCompleted.createdAt);
                  }
                }
                const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
                const dateStr = formatter.format(date).replace(/-/g, '');
                const period = `${dateStr}000${latestCompleted.roundNumber}`;

                const isWin = wonAmount > 0;
                if (isWin) {
                  soundManager.playWin();
                  showToast(`🎉 You Won ₹${wonAmount.toFixed(2)} in 1-Min Round #${latestCompleted.roundNumber}!`, 'success');
                } else {
                  soundManager.playLoss();
                  showToast(`1-Min Round #${latestCompleted.roundNumber} completed: Rolled ${latestCompleted.total}`, 'info');
                }

                setRoundResultModal({
                  type: isWin ? 'win' : 'loss',
                  period,
                  roundNumber: latestCompleted.roundNumber,
                  dice1: latestCompleted.dice1,
                  dice2: latestCompleted.dice2,
                  total: latestCompleted.total,
                  resultType: latestCompleted.resultType,
                  wonAmount,
                  totalBetAmount,
                  bets: userBets
                });
              }, { onlyOnce: true });
            }
          }, 1500);
        }
        prevCompletedRoundId1mRef.current = latestCompleted.id;
      }
    }, (error) => console.error("History 1m snapshot error:", error));

    // Listen to leaderboard
    const leaderboardQuery = query(
      collection(db, 'leaderboard'),
      orderBy('totalWinnings', 'desc'),
      limit(10)
    );

    const unsubscribeLeaderboard = onSnapshot(leaderboardQuery, (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => doc.data()));
    }, (error) => console.error("Leaderboard snapshot error:", error));

    return () => {
      unsubscribeActiveRound();
      unsubscribeHistory();
      unsubscribeActiveRound1m();
      unsubscribeHistory1m();
      unsubscribeLeaderboard();
      unsubscribeSettings();
    };
  }, [currentUser, gameMode]);

  // 3. User Wallet & Active Bets Real-time Listeners
  useEffect(() => {
    if (!currentUser) {
      setWallet(null);
      setRecentBets([]);
      return;
    }

    // Subscribe to Wallet document
    const walletRef = doc(db, 'wallets', currentUser.uid);
    const unsubscribeWallet = onSnapshot(walletRef, (snapshot) => {
      if (snapshot.exists()) {
        setWallet(snapshot.data());
      }
    }, (error) => console.error("Wallet snapshot error:", error));

    // Subscribe to User's recent bets
    const betsQuery = query(
      collection(db, 'bets'),
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribeBets = onSnapshot(betsQuery, (snapshot) => {
      setRecentBets(snapshot.docs.map(doc => doc.data()));
    }, (error) => console.error("Bets snapshot error:", error));

    return () => {
      unsubscribeWallet();
      unsubscribeBets();
    };
  }, [currentUser]);

  // Safe helper to convert any timestamp format to milliseconds
  const getMillis = (timeVal) => {
    if (!timeVal) return Date.now() + 30000;
    if (typeof timeVal.toMillis === 'function') return timeVal.toMillis();
    if (typeof timeVal.toDate === 'function') return timeVal.toDate().getTime();
    if (typeof timeVal.seconds === 'number') return timeVal.seconds * 1000;
    if (typeof timeVal === 'number') return timeVal;
    if (typeof timeVal === 'string') return new Date(timeVal).getTime();
    if (timeVal instanceof Date) return timeVal.getTime();
    return Date.now() + 30000;
  };

  // 4. Timer ticking interval
  useEffect(() => {
    if (!activeRound || !activeRound.endTime) return;

    const tick = () => {
      // Use calibrated time (local time + server clock offset) to prevent false early triggers
      const now = Date.now() + serverTimeOffsetRef.current;
      const endTime = getMillis(activeRound.endTime);
      const deltaSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setCountdown(deltaSeconds);

      if (deltaSeconds > 0 && deltaSeconds <= 5 && !rolling) {
        soundManager.playTick();
      }

      // If timer hit 0, settle the round (with rate-limiting guard)
      if (deltaSeconds <= 0 && activeRound.status === 'active' && !settling && !triggerInProgress.current && Date.now() >= nextAllowedSettleTimeRef.current) {
        triggerSettleRound();
      }
    };

    tick(); // Initial tick
    const intervalId = setInterval(tick, 1000);

    return () => clearInterval(intervalId);
  }, [activeRound, settling, rolling, gameMode]);

  // 1-Minute Timer ticking interval
  useEffect(() => {
    if (!activeRound1m || !activeRound1m.endTime) return;

    const tick1m = () => {
      const now = Date.now() + serverTimeOffsetRef.current;
      const endTime = getMillis(activeRound1m.endTime);
      const deltaSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setCountdown1m(deltaSeconds);

      if (gameMode === '1m' && deltaSeconds > 0 && deltaSeconds <= 5 && !rolling1m) {
        soundManager.playTick();
      }

      if (deltaSeconds <= 0 && activeRound1m.status === 'active' && !settling1m && !triggerInProgress1m.current && Date.now() >= nextAllowedSettleTime1mRef.current) {
        triggerSettleRound1m();
      }
    };

    tick1m();
    const intervalId = setInterval(tick1m, 1000);
    return () => clearInterval(intervalId);
  }, [activeRound1m, settling1m, rolling1m, gameMode]);

  // Admin Settings update helper
  const saveAppSettings = async (newSettings) => {
    try {
      await setDoc(doc(db, 'config', 'settings'), newSettings, { merge: true });
      showToast("Platform settings updated!", "success");
    } catch (error) {
      showToast("Failed to update settings: " + error.message, "error");
      throw error;
    }
  };

  // Support ticket creation helper
  const submitSupportTicket = async (subject, message) => {
    if (!currentUser) throw new Error("Must be logged in.");
    try {
      const ticketRef = doc(collection(db, 'supportTickets'));
      await setDoc(ticketRef, {
        id: ticketRef.id,
        userId: currentUser.uid,
        userName: profile?.displayName || 'Player',
        userEmail: currentUser.email || 'N/A',
        status: 'pending',
        subject,
        message,
        reply: '',
        createdAt: serverTimestamp()
      });
      showToast("Support ticket raised successfully!", "success");
      return ticketRef.id;
    } catch (error) {
      showToast("Failed to submit ticket: " + error.message, "error");
      throw error;
    }
  };

  // Mapped active objects depending on current gameMode ('30s' vs '1m')
  const currentActiveRound = gameMode === '1m' ? activeRound1m : activeRound;
  const currentCountdown = gameMode === '1m' ? countdown1m : countdown;
  const currentRolling = gameMode === '1m' ? rolling1m : rolling;
  const currentRolledDice = gameMode === '1m' ? rolledDice1m : rolledDice;
  const currentHistory = gameMode === '1m' ? history1m : history;

  const value = {
    gameMode,
    setGameMode,
    activeRound: currentActiveRound,
    history: currentHistory,
    countdown: currentCountdown,
    rolling: currentRolling,
    rolledDice: currentRolledDice,
    settling: gameMode === '1m' ? settling1m : settling,
    // Explicit raw mode data
    activeRound30s: activeRound,
    activeRound1m,
    history30s: history,
    history1m,
    countdown30s: countdown,
    countdown1m,
    // Shared user & app state
    leaderboard,
    wallet,
    recentBets,
    toast,
    roundResultModal,
    closeResultModal,
    appSettings,
    placeBet,
    requestDeposit,
    requestWithdrawal,
    triggerSettleRound: gameMode === '1m' ? triggerSettleRound1m : triggerSettleRound,
    showToast,
    saveAppSettings,
    submitSupportTicket
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
