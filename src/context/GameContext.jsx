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
import { callApi } from '../firebase/api';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  // Game States
  const [activeRound, setActiveRound] = useState(null);
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [recentBets, setRecentBets] = useState([]);
  
  // UI States
  const [countdown, setCountdown] = useState(30);
  const [rolling, setRolling] = useState(false);
  const [rolledDice, setRolledDice] = useState({ dice1: 1, dice2: 1, total: 2 });
  const [toast, setToast] = useState(null);
  const [settling, setSettling] = useState(false);

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
  const triggerInProgress = useRef(false);

  // Sound effects or visual notifications helper
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Standalone Backend API Calls Bindings
  const placeBetFn = (data) => callApi('placeBet', data);
  const settleRoundFn = (data) => callApi('settleRoundAndStartNew', data);
  const submitDepositFn = (data) => callApi('submitDepositRequest', data);
  const submitWithdrawalFn = (data) => callApi('submitWithdrawalRequest', data);

  // Place Bet wrapper
  const placeBet = async (type, exactValue, amount) => {
    if (!activeRound) throw new Error("No active round available.");
    try {
      const result = await placeBetFn({
        roundId: activeRound.id,
        type,
        exactValue: type === 'exact' ? Number(exactValue) : null,
        amount: Number(amount)
      });
      showToast(`Bet of ₹${amount} placed successfully!`, 'success');
      return result.data;
    } catch (error) {
      showToast(error.message || "Failed to place bet.", 'error');
      throw error;
    }
  };

  // Settle Round trigger
  const triggerSettleRound = async () => {
    if (triggerInProgress.current) return;
    triggerInProgress.current = true;
    setSettling(true);
    try {
      console.log("Triggering round settlement...");
      const result = await settleRoundFn();
      console.log("Round settlement result:", result.data);
      if (result.data && !result.data.success) {
        // Wait 2 seconds before letting it retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("Error triggering round settlement:", error);
      // Wait 2 seconds before letting it retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      triggerInProgress.current = false;
      setSettling(false);
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
          // Play roll animation
          setRolling(true);
          setRolledDice({
            dice1: latestCompleted.dice1,
            dice2: latestCompleted.dice2,
            total: latestCompleted.total
          });
          
          // Stop rolling and reveal outcome after 1.5s
          setTimeout(() => {
            setRolling(false);
            
            // Look up if user had a winning bet in this round to display win alert
            if (currentUser) {
              const userRoundBetQuery = query(
                collection(db, 'bets'),
                where('uid', '==', currentUser.uid),
                where('roundId', '==', latestCompleted.id)
              );
              
              onSnapshot(userRoundBetQuery, (betSnap) => {
                let wonAmount = 0;
                betSnap.forEach(bDoc => {
                  const b = bDoc.data();
                  if (b.status === 'won') wonAmount += b.payout;
                });
                if (wonAmount > 0) {
                  showToast(`🎉 You Won ₹${wonAmount.toFixed(2)} in Round #${latestCompleted.roundNumber}!`, 'success');
                } else if (!betSnap.empty) {
                  showToast(`Round #${latestCompleted.roundNumber} completed: Rolled ${latestCompleted.total}`, 'info');
                }
              }, { onlyOnce: true });
            }
          }, 1500);
        }
        // Save ref of current completed round
        prevCompletedRoundIdRef.current = latestCompleted.id;
      }
    }, (error) => console.error("History snapshot error:", error));

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
      unsubscribeLeaderboard();
      unsubscribeSettings();
    };
  }, [currentUser]);

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

  // 4. Timer ticking interval
  useEffect(() => {
    if (!activeRound) return;

    const tick = () => {
      const now = Date.now();
      const endTime = activeRound.endTime.toMillis();
      const deltaSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setCountdown(deltaSeconds);

      // If timer hit 0, settle the round
      if (deltaSeconds <= 0 && activeRound.status === 'active' && !settling) {
        triggerSettleRound();
      }
    };

    tick(); // Initial tick
    const intervalId = setInterval(tick, 1000);

    return () => clearInterval(intervalId);
  }, [activeRound, settling]);

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

  const value = {
    activeRound,
    history,
    leaderboard,
    wallet,
    recentBets,
    countdown,
    rolling,
    rolledDice,
    settling,
    toast,
    appSettings,
    placeBet,
    requestDeposit,
    requestWithdrawal,
    triggerSettleRound,
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
