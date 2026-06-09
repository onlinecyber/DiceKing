require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// 1. Initialize Firebase Admin SDK
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  // Emulator Mode
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
  
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'diceking-eeea2'
  });
  console.log("Connected to local Firebase Emulators!");
} else {
  // Production Mode
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
    
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    })
  });
  console.log("Connected to live Firebase Production!");
}

const db = admin.firestore();
const { Timestamp, FieldValue } = require('firebase-admin/firestore');

// Initialize Express App
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Custom HttpsError class for compatibility with existing functions logic
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // e.g., 'unauthenticated', 'invalid-argument', 'failed-precondition'
  }
}

// 2. Auth Middleware
const decodeToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      req.user = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error.message);
    }
  }
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: { message: 'Authentication required.', code: 'unauthenticated' } });
  }
  next();
};

// Wrapper to standardise Express request/response to Firebase https.onCall format
const handleRequest = (fn) => async (req, res) => {
  try {
    const data = req.body.data || {};
    const context = { auth: req.user };
    const result = await fn(data, context);
    res.json({ result });
  } catch (error) {
    console.error('Request failed:', error);
    
    let status = 500;
    if (error.code === 'unauthenticated') status = 401;
    else if (error.code === 'permission-denied') status = 403;
    else if (error.code === 'not-found') status = 404;
    else if (error.code === 'already-exists') status = 409;
    else if (error.code === 'invalid-argument' || error.code === 'failed-precondition') status = 400;
    
    res.status(status).json({
      error: {
        status,
        message: error.message || 'Internal Server Error',
        code: error.code || 'internal'
      }
    });
  }
};

// 3. Re-implement Ported Functions Logic

const onUserCreated = async (data, context) => {
  const uid = context.auth.uid;
  const email = context.auth.email;
  const displayName = context.auth.name;

  const userRef = db.collection('users').doc(uid);
  const walletRef = db.collection('wallets').doc(uid);

  // Check if user already exists
  const userCheck = await userRef.get();
  if (userCheck.exists) {
    return { success: true, message: 'User profile already exists.' };
  }

  // Check if first user in the system to make them admin
  const usersSnap = await db.collection('users').limit(1).get();
  const role = usersSnap.empty ? 'admin' : 'user';

  await db.runTransaction(async (transaction) => {
    const referralCode = 'DK' + Math.random().toString(36).substring(2, 8).toUpperCase();
    transaction.set(userRef, {
      uid,
      email: email || '',
      displayName: displayName || (email ? email.split('@')[0] : 'Player'),
      role,
      referralCode,
      referredBy: '',
      referralEarnings: 0,
      referralStatus: 'none',
      createdAt: FieldValue.serverTimestamp()
    });

    transaction.set(walletRef, {
      uid,
      balance: 10.0, // Starter bonus ₹10
      wageringRequired: 0.0,
      totalDeposits: 0.0,
      totalBets: 0.0,
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  return { success: true };
};

const placeBet = async (data, context) => {
  const uid = context.auth.uid;
  const { roundId, type, exactValue, amount } = data;

  if (!roundId || !type || typeof amount !== 'number' || amount <= 0) {
    throw new HttpsError('invalid-argument', 'Invalid bet parameters.');
  }

  if (amount > 2000) {
    throw new HttpsError('failed-precondition', 'Maximum bet limit per round is ₹2,000.');
  }

  const validTypes = ['up', 'down', 'odd', 'even', 'exact'];
  if (!validTypes.includes(type)) {
    throw new HttpsError('invalid-argument', 'Invalid bet type.');
  }

  if (type === 'exact' && (typeof exactValue !== 'number' || exactValue < 2 || exactValue > 12)) {
    throw new HttpsError('invalid-argument', 'Exact number betting requires a value from 2 to 12.');
  }

  const roundRef = db.collection('gameRounds').doc(roundId);
  const walletRef = db.collection('wallets').doc(uid);
  const betRef = db.collection('bets').doc();
  const txRef = db.collection('transactions').doc();

  return db.runTransaction(async (transaction) => {
    const roundSnap = await transaction.get(roundRef);
    if (!roundSnap.exists) {
      throw new HttpsError('not-found', 'Game round not found.');
    }
    const round = roundSnap.data();
    if (round.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Betting is closed for this round.');
    }

    const now = Date.now();
    const endTime = round.endTime.toMillis();
    if (now >= endTime - 2000) {
      throw new HttpsError('failed-precondition', 'Betting is closed for this round.');
    }

    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) {
      throw new HttpsError('not-found', 'User wallet not found.');
    }
    const wallet = walletSnap.data();
    if (wallet.balance < amount) {
      throw new HttpsError('failed-precondition', 'Insufficient balance to place bet.');
    }

    const userSnap = await transaction.get(db.collection('users').doc(uid));
    const displayName = userSnap.exists ? userSnap.data().displayName : 'Player';

    const newBalance = wallet.balance - amount;
    const newWageringRequired = Math.max(0, (wallet.wageringRequired || 0) - amount);
    const newTotalBets = (wallet.totalBets || 0) + amount;

    transaction.update(walletRef, {
      balance: newBalance,
      wageringRequired: newWageringRequired,
      totalBets: newTotalBets,
      updatedAt: FieldValue.serverTimestamp()
    });

    transaction.set(betRef, {
      id: betRef.id,
      uid,
      displayName,
      roundId,
      roundNumber: round.roundNumber,
      amount,
      type,
      exactValue: type === 'exact' ? exactValue : null,
      status: 'pending',
      payout: 0,
      createdAt: FieldValue.serverTimestamp()
    });

    transaction.set(txRef, {
      id: txRef.id,
      uid,
      amount: -amount,
      type: 'bet_place',
      status: 'success',
      description: `Placed bet on ${type === 'exact' ? `exact ${exactValue}` : type} for Round #${round.roundNumber}`,
      referenceId: betRef.id,
      createdAt: FieldValue.serverTimestamp()
    });

    return { success: true, balance: newBalance };
  });
};

const settleRoundAndStartNew = async (data, context) => {
  console.log("settleRoundAndStartNew called.");
  const activeRoundsQuery = db.collection('gameRounds').where('status', '==', 'active').limit(1);

  return db.runTransaction(async (transaction) => {
    const activeRoundsSnap = await transaction.get(activeRoundsQuery);
    const now = Timestamp.now();

    if (activeRoundsSnap.empty) {
      console.log("No active round found. Bootstrapping initial round.");
      const nextRoundNumber = 1;
      const endTime = Timestamp.fromMillis(now.toMillis() + 30000);
      const newRoundRef = db.collection('gameRounds').doc();
      
      transaction.set(newRoundRef, {
        id: newRoundRef.id,
        roundNumber: nextRoundNumber,
        status: 'active',
        startTime: now,
        endTime: endTime,
        dice1: null,
        dice2: null,
        total: null,
        resultType: null,
        createdAt: now
      });
      return { success: true, message: 'Created initial active round.' };
    }

    const activeRoundDoc = activeRoundsSnap.docs[0];
    const activeRound = activeRoundDoc.data();
    console.log(`Active round found: #${activeRound.roundNumber}, ID: ${activeRound.id}, EndTime: ${activeRound.endTime.toMillis()}, Now: ${now.toMillis()}`);

    if (now.toMillis() + 2000 < activeRound.endTime.toMillis()) {
      console.log(`Round #${activeRound.roundNumber} is still active. Remaining time: ${activeRound.endTime.toMillis() - now.toMillis()}ms`);
      return { success: false, message: 'Current round is still active.', activeRound };
    }

    console.log(`Settling round #${activeRound.roundNumber}...`);

    const betsQuery = db.collection('bets')
      .where('roundId', '==', activeRound.id)
      .where('status', '==', 'pending');
    const betsSnap = await transaction.get(betsQuery);

    const DICE_PAIRS_BY_SUM = {
      3: [[1, 2], [2, 1]],
      4: [[1, 3], [2, 2], [3, 1]],
      5: [[1, 4], [2, 3], [3, 2], [4, 1]],
      6: [[1, 5], [2, 4], [3, 3], [4, 2], [5, 1]],
      7: [[1, 6], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1]],
      8: [[2, 6], [3, 5], [4, 4], [5, 3], [6, 2]],
      9: [[3, 6], [4, 5], [5, 4], [6, 3]],
      10: [[4, 6], [5, 5], [6, 4]],
      11: [[5, 6], [6, 5]]
    };

    const getExactMultiplier = (num) => {
      switch (num) {
        case 3: case 11: return 15.0;
        case 4: case 10: return 10.0;
        case 5: case 9: return 8.0;
        case 6: case 8: return 6.0;
        case 7: return 5.0;
        default: return 0.0;
      }
    };

    const candidateSums = [3, 4, 5, 6, 7, 8, 9, 10, 11];
    const payoutsBySum = {};

    candidateSums.forEach(S => {
      let totalPayout = 0;
      betsSnap.docs.forEach(doc => {
        const bet = doc.data();
        let multiplier = 0;
        
        if (bet.type === 'up' && S >= 8) {
          multiplier = 2.0;
        } else if (bet.type === 'down' && S <= 6) {
          multiplier = 2.0;
        } else if (bet.type === 'odd' && S % 2 !== 0) {
          multiplier = 1.9;
        } else if (bet.type === 'even' && S % 2 === 0) {
          multiplier = 1.9;
        } else if (bet.type === 'exact' && bet.exactValue === S) {
          multiplier = getExactMultiplier(S);
        }

        if (multiplier > 0) {
          totalPayout += bet.amount * multiplier;
        }
      });
      payoutsBySum[S] = totalPayout;
    });

    let minPayout = Infinity;
    candidateSums.forEach(S => {
      if (payoutsBySum[S] < minPayout) {
        minPayout = payoutsBySum[S];
      }
    });

    const bestSums = candidateSums.filter(S => payoutsBySum[S] === minPayout);
    const chosenSum = bestSums[Math.floor(Math.random() * bestSums.length)];

    const pairs = DICE_PAIRS_BY_SUM[chosenSum];
    const chosenPair = pairs[Math.floor(Math.random() * pairs.length)];
    const dice1 = chosenPair[0];
    const dice2 = chosenPair[1];
    const total = chosenSum;

    const upDown = total > 7 ? 'up' : (total < 7 ? 'down' : 'seven');
    const oddEven = total % 2 === 0 ? 'even' : 'odd';

    const betsToUpdate = [];
    const walletsToUpdate = {};
    const leaderboardToUpdate = {};

    const getMultiplier = (type, exactValue) => {
      if (type === 'up' && total >= 8 && total <= 12) return 2.0;
      if (type === 'down' && total >= 2 && total <= 6) return 2.0;
      if (type === 'odd' && oddEven === 'odd') return 1.9;
      if (type === 'even' && oddEven === 'even') return 1.9;
      if (type === 'exact' && exactValue === total) {
        switch (total) {
          case 2: case 12: return 30.0;
          case 3: case 11: return 15.0;
          case 4: case 10: return 10.0;
          case 5: case 9: return 8.0;
          case 6: case 8: return 6.0;
          case 7: return 5.0;
          default: return 0.0;
        }
      }
      return 0.0;
    };

    for (const doc of betsSnap.docs) {
      const bet = doc.data();
      const multiplier = getMultiplier(bet.type, bet.exactValue);
      const won = multiplier > 0;
      const grossPayout = won ? bet.amount * multiplier : 0;
      const payout = won ? Math.round(grossPayout * 0.95 * 100) / 100 : 0;

      betsToUpdate.push({
        ref: doc.ref,
        status: won ? 'won' : 'lost',
        payout
      });

      if (won) {
        if (!walletsToUpdate[bet.uid]) {
          walletsToUpdate[bet.uid] = 0;
        }
        walletsToUpdate[bet.uid] += payout;

        if (!leaderboardToUpdate[bet.uid]) {
          leaderboardToUpdate[bet.uid] = { displayName: bet.displayName, winnings: 0 };
        }
        leaderboardToUpdate[bet.uid].winnings += payout;
      }
    }

    for (const update of betsToUpdate) {
      transaction.update(update.ref, {
        status: update.status,
        payout: update.payout
      });
    }

    for (const [uid, payout] of Object.entries(walletsToUpdate)) {
      const walletRef = db.collection('wallets').doc(uid);
      const walletSnap = await transaction.get(walletRef);
      if (walletSnap.exists) {
        transaction.update(walletRef, {
          balance: walletSnap.data().balance + payout,
          updatedAt: now
        });
      }

      const txRef = db.collection('transactions').doc();
      transaction.set(txRef, {
        id: txRef.id,
        uid,
        amount: payout,
        type: 'bet_win',
        status: 'success',
        description: `Payout for winning bet in Round #${activeRound.roundNumber} (5% GST Deducted)`,
        referenceId: activeRound.id,
        createdAt: now
      });
    }

    for (const [uid, data] of Object.entries(leaderboardToUpdate)) {
      const lbRef = db.collection('leaderboard').doc(uid);
      const lbSnap = await transaction.get(lbRef);
      if (lbSnap.exists) {
        transaction.update(lbRef, {
          totalWinnings: lbSnap.data().totalWinnings + data.winnings,
          updatedAt: now
        });
      } else {
        transaction.set(lbRef, {
          uid,
          displayName: data.displayName,
          totalWinnings: data.winnings,
          updatedAt: now
        });
      }
    }

    transaction.update(activeRoundDoc.ref, {
      status: 'completed',
      dice1,
      dice2,
      total,
      resultType: {
        upDown,
        oddEven
      }
    });

    const newRoundRef = db.collection('gameRounds').doc();
    const newEndTime = Timestamp.fromMillis(now.toMillis() + 30000);
    transaction.set(newRoundRef, {
      id: newRoundRef.id,
      roundNumber: activeRound.roundNumber + 1,
      status: 'active',
      startTime: now,
      endTime: newEndTime,
      dice1: null,
      dice2: null,
      total: null,
      resultType: null,
      createdAt: now
    });

    return {
      success: true,
      settledRound: activeRound.id,
      rolled: { dice1, dice2, total },
      newRoundId: newRoundRef.id
    };
  });
};

const submitDepositRequest = async (data, context) => {
  const uid = context.auth.uid;
  const { amount, paymentMethod, transactionReference } = data;

  if (typeof amount !== 'number' || amount <= 0 || !paymentMethod || !transactionReference) {
    throw new HttpsError('invalid-argument', 'Invalid deposit parameters.');
  }

  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'User profile not found.');
  }
  const user = userSnap.data();

  const depositRef = db.collection('deposits').doc();
  const depositData = {
    id: depositRef.id,
    uid,
    displayName: user.displayName,
    email: user.email,
    amount,
    status: 'pending',
    paymentMethod,
    transactionReference,
    createdAt: FieldValue.serverTimestamp(),
    processedBy: null,
    processedAt: null
  };

  await depositRef.set(depositData);
  return { success: true, depositId: depositRef.id };
};

const submitWithdrawalRequest = async (data, context) => {
  const uid = context.auth.uid;
  const { amount, paymentMethod, walletAddress } = data;

  if (typeof amount !== 'number' || amount <= 0 || !paymentMethod || !walletAddress) {
    throw new HttpsError('invalid-argument', 'Invalid withdrawal parameters.');
  }

  const walletRef = db.collection('wallets').doc(uid);
  const withdrawalRef = db.collection('withdrawals').doc();
  const txRef = db.collection('transactions').doc();

  return db.runTransaction(async (transaction) => {
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) {
      throw new HttpsError('not-found', 'Wallet record not found.');
    }
    const wallet = walletSnap.data();

    if (wallet.wageringRequired && wallet.wageringRequired > 0) {
      throw new HttpsError('failed-precondition', `Wagering requirement not met. Please place bets of at least ₹${wallet.wageringRequired.toFixed(2)} more before withdrawing.`);
    }

    if (wallet.balance < amount) {
      throw new HttpsError('failed-precondition', 'Insufficient wallet balance for withdrawal.');
    }

    const userSnap = await transaction.get(db.collection('users').doc(uid));
    const user = userSnap.data();

    transaction.update(walletRef, {
      balance: wallet.balance - amount,
      updatedAt: FieldValue.serverTimestamp()
    });

    transaction.set(withdrawalRef, {
      id: withdrawalRef.id,
      uid,
      displayName: user.displayName,
      email: user.email,
      amount,
      status: 'pending',
      paymentMethod,
      walletAddress,
      createdAt: FieldValue.serverTimestamp(),
      processedBy: null,
      processedAt: null
    });

    transaction.set(txRef, {
      id: txRef.id,
      uid,
      amount: -amount,
      type: 'withdrawal',
      status: 'pending',
      description: `Withdrawal request submitted (${paymentMethod})`,
      referenceId: withdrawalRef.id,
      createdAt: FieldValue.serverTimestamp()
    });

    return { success: true, withdrawalId: withdrawalRef.id };
  });
};

const adminApproveDeposit = async (data, context) => {
  const adminUid = context.auth.uid;
  const { depositId } = data;

  if (!depositId) {
    throw new HttpsError('invalid-argument', 'Missing depositId.');
  }

  const adminUserSnap = await db.collection('users').doc(adminUid).get();
  if (!adminUserSnap.exists || adminUserSnap.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only system admins can approve deposits.');
  }

  const depositRef = db.collection('deposits').doc(depositId);
  const txRef = db.collection('transactions').doc();

  return db.runTransaction(async (transaction) => {
    const depositSnap = await transaction.get(depositRef);
    if (!depositSnap.exists) {
      throw new HttpsError('not-found', 'Deposit ticket not found.');
    }
    const deposit = depositSnap.data();

    if (deposit.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Deposit is already processed.');
    }

    const walletRef = db.collection('wallets').doc(deposit.uid);
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) {
      throw new HttpsError('not-found', 'User wallet not found.');
    }

    const userRef = db.collection('users').doc(deposit.uid);
    const userSnap = await transaction.get(userRef);
    const user = userSnap.data();

    const wallet = walletSnap.data();
    const newBalance = wallet.balance + deposit.amount;
    const newWageringRequired = (wallet.wageringRequired || 0) + deposit.amount;
    const newTotalDeposits = (wallet.totalDeposits || 0) + deposit.amount;

    transaction.update(walletRef, {
      balance: newBalance,
      wageringRequired: newWageringRequired,
      totalDeposits: newTotalDeposits,
      updatedAt: FieldValue.serverTimestamp()
    });

    if (user && user.referralStatus === 'pending' && user.referredBy) {
      const referrersQuery = db.collection('users').where('referralCode', '==', user.referredBy).limit(1);
      const referrersSnap = await transaction.get(referrersQuery);
      
      if (!referrersSnap.empty) {
        const referrerDoc = referrersSnap.docs[0];
        const referrerUid = referrerDoc.id;
        const referrerData = referrerDoc.data();

        const referrerWalletRef = db.collection('wallets').doc(referrerUid);
        const referrerWalletSnap = await transaction.get(referrerWalletRef);

        if (referrerWalletSnap.exists) {
          transaction.update(referrerWalletRef, {
            balance: referrerWalletSnap.data().balance + 10.0,
            updatedAt: FieldValue.serverTimestamp()
          });

          transaction.update(referrerDoc.ref, {
            referralEarnings: (referrerData.referralEarnings || 0) + 10.0
          });

          const refTxRef = db.collection('transactions').doc();
          transaction.set(refTxRef, {
            id: refTxRef.id,
            uid: referrerUid,
            amount: 10.0,
            type: 'referral_bonus',
            status: 'success',
            description: `Referral bonus from first deposit of player ${user.displayName || 'Player'}`,
            referenceId: deposit.uid,
            createdAt: FieldValue.serverTimestamp()
          });
        }
      }
      
      transaction.update(userRef, {
        referralStatus: 'claimed'
      });
    }

    transaction.update(depositRef, {
      status: 'approved',
      processedBy: adminUid,
      processedAt: FieldValue.serverTimestamp()
    });

    transaction.set(txRef, {
      id: txRef.id,
      uid: deposit.uid,
      amount: deposit.amount,
      type: 'deposit',
      status: 'success',
      description: `Deposit approved via ${deposit.paymentMethod}`,
      referenceId: deposit.id,
      createdAt: FieldValue.serverTimestamp()
    });

    return { success: true };
  });
};

const adminRejectDeposit = async (data, context) => {
  const adminUid = context.auth.uid;
  const { depositId } = data;

  const adminUserSnap = await db.collection('users').doc(adminUid).get();
  if (!adminUserSnap.exists || adminUserSnap.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only system admins can process deposits.');
  }

  const depositRef = db.collection('deposits').doc(depositId);
  await depositRef.update({
    status: 'rejected',
    processedBy: adminUid,
    processedAt: FieldValue.serverTimestamp()
  });

  return { success: true };
};

const adminApproveWithdrawal = async (data, context) => {
  const adminUid = context.auth.uid;
  const { withdrawalId } = data;

  const adminUserSnap = await db.collection('users').doc(adminUid).get();
  if (!adminUserSnap.exists || adminUserSnap.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only system admins can approve withdrawals.');
  }

  const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
  return db.runTransaction(async (transaction) => {
    const withdrawalSnap = await transaction.get(withdrawalRef);
    if (!withdrawalSnap.exists) {
      throw new HttpsError('not-found', 'Withdrawal record not found.');
    }
    const withdrawal = withdrawalSnap.data();

    if (withdrawal.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Withdrawal has already been processed.');
    }

    transaction.update(withdrawalRef, {
      status: 'approved',
      processedBy: adminUid,
      processedAt: FieldValue.serverTimestamp()
    });

    const txsQuery = db.collection('transactions')
      .where('referenceId', '==', withdrawalId)
      .where('type', '==', 'withdrawal')
      .limit(1);
    const txsSnap = await transaction.get(txsQuery);
    if (!txsSnap.empty) {
      transaction.update(txsSnap.docs[0].ref, {
        status: 'success'
      });
    }

    return { success: true };
  });
};

const adminRejectWithdrawal = async (data, context) => {
  const adminUid = context.auth.uid;
  const { withdrawalId, reason } = data;

  const adminUserSnap = await db.collection('users').doc(adminUid).get();
  if (!adminUserSnap.exists || adminUserSnap.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only system admins can reject withdrawals.');
  }

  const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
  return db.runTransaction(async (transaction) => {
    const withdrawalSnap = await transaction.get(withdrawalRef);
    if (!withdrawalSnap.exists) {
      throw new HttpsError('not-found', 'Withdrawal not found.');
    }
    const withdrawal = withdrawalSnap.data();

    if (withdrawal.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Withdrawal is already processed.');
    }

    const walletRef = db.collection('wallets').doc(withdrawal.uid);
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) {
      throw new HttpsError('not-found', 'Wallet not found.');
    }

    transaction.update(walletRef, {
      balance: walletSnap.data().balance + withdrawal.amount,
      updatedAt: FieldValue.serverTimestamp()
    });

    transaction.update(withdrawalRef, {
      status: 'rejected',
      rejectReason: reason || '',
      processedBy: adminUid,
      processedAt: FieldValue.serverTimestamp()
    });

    const txsQuery = db.collection('transactions')
      .where('referenceId', '==', withdrawalId)
      .where('type', '==', 'withdrawal')
      .limit(1);
    const txsSnap = await transaction.get(txsQuery);
    if (!txsSnap.empty) {
      transaction.update(txsSnap.docs[0].ref, {
        status: 'failed',
        description: `Withdrawal rejected${reason ? ': ' + reason : ''} (Refunded ₹${withdrawal.amount})`
      });
    }

    return { success: true };
  });
};

const getAdminDashboardStats = async (data, context) => {
  const adminUid = context.auth.uid;

  const adminUserSnap = await db.collection('users').doc(adminUid).get();
  if (!adminUserSnap.exists || adminUserSnap.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only system admins can view stats.');
  }

  const usersSnap = await db.collection('users').get();
  const betsSnap = await db.collection('bets').get();
  const depositsSnap = await db.collection('deposits').get();
  const withdrawalsSnap = await db.collection('withdrawals').get();

  let totalBetsAmount = 0;
  let totalBetsPayout = 0;
  betsSnap.forEach(doc => {
    const b = doc.data();
    totalBetsAmount += b.amount || 0;
    totalBetsPayout += b.payout || 0;
  });

  let totalDeposits = 0;
  let pendingDeposits = 0;
  depositsSnap.forEach(doc => {
    const d = doc.data();
    if (d.status === 'approved') totalDeposits += d.amount || 0;
    if (d.status === 'pending') pendingDeposits++;
  });

  let totalWithdrawals = 0;
  let pendingWithdrawals = 0;
  withdrawalsSnap.forEach(doc => {
    const w = doc.data();
    if (w.status === 'approved') totalWithdrawals += w.amount || 0;
    if (w.status === 'pending') pendingWithdrawals++;
  });

  return {
    totalUsers: usersSnap.size,
    totalBetsCount: betsSnap.size,
    totalBetsVolume: totalBetsAmount,
    totalBetsPayout: totalBetsPayout,
    houseRevenue: totalBetsAmount - totalBetsPayout,
    totalDeposits,
    totalWithdrawals,
    pendingDeposits,
    pendingWithdrawals
  };
};

const applyReferralCode = async (data, context) => {
  const uid = context.auth.uid;
  const { referralCode } = data;

  if (!referralCode || typeof referralCode !== 'string') {
    throw new HttpsError('invalid-argument', 'Missing or invalid referral code.');
  }

  const cleanCode = referralCode.trim().toUpperCase();
  const userRef = db.collection('users').doc(uid);

  return db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User profile not found.');
    }
    const userData = userSnap.data();

    if (userData.referredBy) {
      throw new HttpsError('already-exists', 'You have already applied a referral code.');
    }

    if (userData.referralCode === cleanCode) {
      throw new HttpsError('invalid-argument', 'You cannot use your own referral code.');
    }

    const referrersQuery = db.collection('users').where('referralCode', '==', cleanCode).limit(1);
    const referrersSnap = await transaction.get(referrersQuery);

    if (referrersSnap.empty) {
      throw new HttpsError('not-found', 'Referral code not found.');
    }

    const referrerDoc = referrersSnap.docs[0];
    const referrerData = referrerDoc.data();

    transaction.update(userRef, {
      referredBy: cleanCode,
      referralStatus: 'pending'
    });

    return { success: true, referrerName: referrerData.displayName };
  });
};

// 4. Map API Endpoints

app.post('/api/onUserCreated', decodeToken, requireAuth, handleRequest(onUserCreated));
app.post('/api/placeBet', decodeToken, requireAuth, handleRequest(placeBet));
app.post('/api/settleRoundAndStartNew', decodeToken, handleRequest(settleRoundAndStartNew));
app.post('/api/submitDepositRequest', decodeToken, requireAuth, handleRequest(submitDepositRequest));
app.post('/api/submitWithdrawalRequest', decodeToken, requireAuth, handleRequest(submitWithdrawalRequest));
app.post('/api/adminApproveDeposit', decodeToken, requireAuth, handleRequest(adminApproveDeposit));
app.post('/api/adminRejectDeposit', decodeToken, requireAuth, handleRequest(adminRejectDeposit));
app.post('/api/adminApproveWithdrawal', decodeToken, requireAuth, handleRequest(adminApproveWithdrawal));
app.post('/api/adminRejectWithdrawal', decodeToken, requireAuth, handleRequest(adminRejectWithdrawal));
app.post('/api/getAdminDashboardStats', decodeToken, requireAuth, handleRequest(getAdminDashboardStats));
app.post('/api/applyReferralCode', decodeToken, requireAuth, handleRequest(applyReferralCode));

// Fallback Route
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start Server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`DiceKing Express Backend running on port ${PORT}`);
});
