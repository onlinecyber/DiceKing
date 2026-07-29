const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const { Timestamp, FieldValue } = require('firebase-admin/firestore');

/**
 * Trigger: onCreate User
 * Triggers when a user signs up. Creates user profile document and wallet.
 * Credits new wallets with $1000 starter bonus.
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  const userRef = db.collection('users').doc(uid);
  const walletRef = db.collection('wallets').doc(uid);

  // Check if this is the first user in the system. Make them admin, others role 'user'.
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
      balance: 10.0, // Starter bonus balance changed to ₹10
      wageringRequired: 0.0,
      totalDeposits: 0.0,
      totalBets: 0.0,
      updatedAt: FieldValue.serverTimestamp()
    });
  });
});

/**
 * Callable: placeBet
 * Places a bet on an active round. Deducts wallet balance and records transaction.
 */
exports.placeBet = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to place a bet.');
  }
  const uid = context.auth.uid;
  const { roundId, type, exactValue, amount } = data;

  if (!roundId || !type || typeof amount !== 'number' || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid bet parameters.');
  }

  // Max bet limit of ₹2,000 per bet
  if (amount > 2000) {
    throw new functions.https.HttpsError('failed-precondition', 'Maximum bet limit per round is ₹2,000.');
  }

  const validTypes = ['up', 'down', 'odd', 'even', 'exact'];
  if (!validTypes.includes(type)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid bet type.');
  }

  if (type === 'exact' && (typeof exactValue !== 'number' || exactValue < 2 || exactValue > 12)) {
    throw new functions.https.HttpsError('invalid-argument', 'Exact number betting requires a value from 2 to 12.');
  }

  const roundRef = db.collection('gameRounds').doc(roundId);
  const walletRef = db.collection('wallets').doc(uid);
  const betRef = db.collection('bets').doc();
  const txRef = db.collection('transactions').doc();

  return db.runTransaction(async (transaction) => {
    // 1. Verify round status
    const roundSnap = await transaction.get(roundRef);
    if (!roundSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Game round not found.');
    }
    const round = roundSnap.data();
    if (round.status !== 'active') {
      throw new functions.https.HttpsError('failed-precondition', 'Betting is closed for this round.');
    }

    const now = Date.now();
    const endTime = round.endTime.toMillis();
    // Prevent late bets (close betting 2 seconds before end)
    if (now >= endTime - 2000) {
      throw new functions.https.HttpsError('failed-precondition', 'Betting is closed for this round.');
    }

    // 2. Verify wallet balance
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User wallet not found.');
    }
    const wallet = walletSnap.data();
    if (wallet.balance < amount) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance to place bet.');
    }

    // 3. Get user details
    const userSnap = await transaction.get(db.collection('users').doc(uid));
    const displayName = userSnap.exists ? userSnap.data().displayName : 'Player';

    // 4. Perform debit
    const newBalance = wallet.balance - amount;
    const newWageringRequired = Math.max(0, (wallet.wageringRequired || 0) - amount);
    const newTotalBets = (wallet.totalBets || 0) + amount;

    transaction.update(walletRef, {
      balance: newBalance,
      wageringRequired: newWageringRequired,
      totalBets: newTotalBets,
      updatedAt: FieldValue.serverTimestamp()
    });

    // 5. Write bet doc
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

    // 6. Log transaction
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
});

/**
 * Callable: settleRoundAndStartNew
 * Transactional serverless loop. Settles bets of the expired active round, rolls dice, 
 * adjusts wallets, updates leaderboard, and creates the next active round.
 */
exports.settleRoundAndStartNew = functions.https.onCall(async (data, context) => {
  console.log("settleRoundAndStartNew called.");
  const activeRoundsQuery = db.collection('gameRounds').where('status', '==', 'active').limit(1);

  return db.runTransaction(async (transaction) => {
    const activeRoundsSnap = await transaction.get(activeRoundsQuery);
    const now = Timestamp.now();

    if (activeRoundsSnap.empty) {
      console.log("No active round found. Bootstrapping initial round.");
      // Create initial round if none exists (bootstrapping)
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

    // Check if the current round timer has expired (with 2s grace period for client-server clock drift)
    if (now.toMillis() + 2000 < activeRound.endTime.toMillis()) {
      console.log(`Round #${activeRound.roundNumber} is still active. Remaining time: ${activeRound.endTime.toMillis() - now.toMillis()}ms`);
      return { success: false, message: 'Current round is still active.', activeRound };
    }

    // 1. Fetch pending bets for this round first to calculate payout minimization
    const betsQuery = db.collection('bets')
      .where('roundId', '==', activeRound.id)
      .where('status', '==', 'pending');
    const betsSnap = await transaction.get(betsQuery);

    // 2. Generate outcome that minimizes house payout
    const DICE_PAIRS_BY_SUM = {
      2: [[1, 1]],
      3: [[1, 2], [2, 1]],
      4: [[1, 3], [2, 2], [3, 1]],
      5: [[1, 4], [2, 3], [3, 2], [4, 1]],
      6: [[1, 5], [2, 4], [3, 3], [4, 2], [5, 1]],
      7: [[1, 6], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1]],
      8: [[2, 6], [3, 5], [4, 4], [5, 3], [6, 2]],
      9: [[3, 6], [4, 5], [5, 4], [6, 3]],
      10: [[4, 6], [5, 5], [6, 4]],
      11: [[5, 6], [6, 5]],
      12: [[6, 6]]
    };

    const getExactMultiplier = (num) => {
      switch (num) {
        case 2: case 12: return 30.0;
        case 3: case 11: return 15.0;
        case 4: case 10: return 10.0;
        case 5: case 9: return 8.0;
        case 6: case 8: return 6.0;
        case 7: return 5.0;
        default: return 0.0;
      }
    };

    const candidateSums = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
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

    // Find the minimum simulated payout
    let minPayout = Infinity;
    candidateSums.forEach(S => {
      if (payoutsBySum[S] < minPayout) {
        minPayout = payoutsBySum[S];
      }
    });

    // Filter sums with the minimum payout (handles ties)
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

    // Payout multiplier logic
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
        // Accumulate wallet changes
        if (!walletsToUpdate[bet.uid]) {
          walletsToUpdate[bet.uid] = 0;
        }
        walletsToUpdate[bet.uid] += payout;

        // Accumulate leaderboard updates
        if (!leaderboardToUpdate[bet.uid]) {
          leaderboardToUpdate[bet.uid] = { displayName: bet.displayName, winnings: 0 };
        }
        leaderboardToUpdate[bet.uid].winnings += payout;
      }
    }

    // Commit Bet Resolutions
    for (const update of betsToUpdate) {
      transaction.update(update.ref, {
        status: update.status,
        payout: update.payout
      });
    }

    // Commit Wallet Payouts
    for (const [uid, payout] of Object.entries(walletsToUpdate)) {
      const walletRef = db.collection('wallets').doc(uid);
      const walletSnap = await transaction.get(walletRef);
      if (walletSnap.exists) {
        transaction.update(walletRef, {
          balance: walletSnap.data().balance + payout,
          updatedAt: now
        });
      }

      // Log transaction
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

    // Commit Leaderboard Winnings
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

    // 3. Update current round to completed
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

    // 4. Spawn new active round
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
});

/**
 * Callable: submitDepositRequest
 * Creates a deposit ticket requiring admin validation.
 */
exports.submitDepositRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const uid = context.auth.uid;
  const { amount, paymentMethod, transactionReference } = data;

  if (typeof amount !== 'number' || amount <= 0 || !paymentMethod || !transactionReference) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid deposit parameters.');
  }

  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'User profile not found.');
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
});

/**
 * Callable: submitWithdrawalRequest
 * Locks required funds in user wallet and queues a withdrawal.
 */
exports.submitWithdrawalRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const uid = context.auth.uid;
  const { amount, paymentMethod, walletAddress } = data;

  if (typeof amount !== 'number' || amount <= 0 || !paymentMethod || !walletAddress) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid withdrawal parameters.');
  }

  const walletRef = db.collection('wallets').doc(uid);
  const withdrawalRef = db.collection('withdrawals').doc();
  const txRef = db.collection('transactions').doc();

  return db.runTransaction(async (transaction) => {
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Wallet record not found.');
    }
    const wallet = walletSnap.data();

    // Verify wagering requirement
    if (wallet.wageringRequired && wallet.wageringRequired > 0) {
      throw new functions.https.HttpsError('failed-precondition', `Wagering requirement not met. Please place bets of at least ₹${wallet.wageringRequired.toFixed(2)} more before withdrawing.`);
    }

    if (wallet.balance < amount) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient wallet balance for withdrawal.');
    }

    const userSnap = await transaction.get(db.collection('users').doc(uid));
    const user = userSnap.data();

    // Deduct/Lock balance immediately
    transaction.update(walletRef, {
      balance: wallet.balance - amount,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Write withdrawal request
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

    // Log pending transaction record
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
});

/**
 * Callable: adminApproveDeposit
 * Approves a user deposit and credits their wallet.
 */
exports.adminApproveDeposit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const adminUid = context.auth.uid;
  const { depositId } = data;

  if (!depositId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing depositId.');
  }

  const adminUserSnap = await db.collection('users').doc(adminUid).get();
  if (!adminUserSnap.exists || adminUserSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only system admins can approve deposits.');
  }

  const depositRef = db.collection('deposits').doc(depositId);
  const txRef = db.collection('transactions').doc();

  return db.runTransaction(async (transaction) => {
    const depositSnap = await transaction.get(depositRef);
    if (!depositSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Deposit ticket not found.');
    }
    const deposit = depositSnap.data();

    if (deposit.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Deposit is already processed.');
    }

    const walletRef = db.collection('wallets').doc(deposit.uid);
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User wallet not found.');
    }

    const userRef = db.collection('users').doc(deposit.uid);
    const userSnap = await transaction.get(userRef);
    const user = userSnap.data();

    const wallet = walletSnap.data();
    const newBalance = wallet.balance + deposit.amount;
    const newWageringRequired = (wallet.wageringRequired || 0) + deposit.amount;
    const newTotalDeposits = (wallet.totalDeposits || 0) + deposit.amount;

    // Update balance, wageringRequired, totalDeposits
    transaction.update(walletRef, {
      balance: newBalance,
      wageringRequired: newWageringRequired,
      totalDeposits: newTotalDeposits,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Referral Crediting on first approved deposit
    if (user && user.referralStatus === 'pending' && user.referredBy) {
      // Find the referrer
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

          // Log transaction for referrer
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
      
      // Mark referral status as claimed
      transaction.update(userRef, {
        referralStatus: 'claimed'
      });
    }

    // Set approved status
    transaction.update(depositRef, {
      status: 'approved',
      processedBy: adminUid,
      processedAt: FieldValue.serverTimestamp()
    });

    // Write success transaction
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
});

/**
 * Callable: adminRejectDeposit
 * Rejects a deposit request.
 */
exports.adminRejectDeposit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const adminUid = context.auth.uid;
  const { depositId } = data;

  const adminUserSnap = await db.collection('users').doc(adminUid).get();
  if (!adminUserSnap.exists || adminUserSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only system admins can process deposits.');
  }

  const depositRef = db.collection('deposits').doc(depositId);
  await depositRef.update({
    status: 'rejected',
    processedBy: adminUid,
    processedAt: FieldValue.serverTimestamp()
  });

  return { success: true };
});

/**
 * Callable: adminApproveWithdrawal
 * Approves and finalizes a pending withdrawal.
 */
exports.adminApproveWithdrawal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const adminUid = context.auth.uid;
  const { withdrawalId } = data;

  const adminUserSnap = await db.collection('users').doc(adminUid).get();
  if (!adminUserSnap.exists || adminUserSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only system admins can approve withdrawals.');
  }

  const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
  return db.runTransaction(async (transaction) => {
    const withdrawalSnap = await transaction.get(withdrawalRef);
    if (!withdrawalSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Withdrawal record not found.');
    }
    const withdrawal = withdrawalSnap.data();

    if (withdrawal.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Withdrawal has already been processed.');
    }

    // Set approved status
    transaction.update(withdrawalRef, {
      status: 'approved',
      processedBy: adminUid,
      processedAt: FieldValue.serverTimestamp()
    });

    // Mark associated transaction log as success
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
});

/**
 * Callable: adminRejectWithdrawal
 * Rejects a withdrawal ticket and refunds the locked balance to the user.
 */
exports.adminRejectWithdrawal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const adminUid = context.auth.uid;
  const { withdrawalId, reason } = data;

  const adminUserSnap = await db.collection('users').doc(adminUid).get();
  if (!adminUserSnap.exists || adminUserSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only system admins can reject withdrawals.');
  }

  const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
  return db.runTransaction(async (transaction) => {
    const withdrawalSnap = await transaction.get(withdrawalRef);
    if (!withdrawalSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Withdrawal not found.');
    }
    const withdrawal = withdrawalSnap.data();

    if (withdrawal.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Withdrawal is already processed.');
    }

    const walletRef = db.collection('wallets').doc(withdrawal.uid);
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Wallet not found.');
    }

    // Refund wallet balance
    transaction.update(walletRef, {
      balance: walletSnap.data().balance + withdrawal.amount,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Set rejected status
    transaction.update(withdrawalRef, {
      status: 'rejected',
      rejectReason: reason || '',
      processedBy: adminUid,
      processedAt: FieldValue.serverTimestamp()
    });

    // Mark associated transaction log as failed/refunded
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
});

/**
 * Callable: getAdminDashboardStats
 * Compiles performance and accounting stats for the admin control panel.
 */
exports.getAdminDashboardStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const adminUid = context.auth.uid;

  const adminUserSnap = await db.collection('users').doc(adminUid).get();
  if (!adminUserSnap.exists || adminUserSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only system admins can view stats.');
  }

  // Fetch collections to process dashboard analytics
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
});

/**
 * Callable: applyReferralCode
 * Validates and applies a referral code, crediting ₹10 to the referrer.
 */
exports.applyReferralCode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const uid = context.auth.uid;
  const { referralCode } = data;

  if (!referralCode || typeof referralCode !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid referral code.');
  }

  const cleanCode = referralCode.trim().toUpperCase();
  const userRef = db.collection('users').doc(uid);

  return db.runTransaction(async (transaction) => {
    // 1. Get current user profile
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const userData = userSnap.data();

    // 2. Check if already referred
    if (userData.referredBy) {
      throw new functions.https.HttpsError('already-exists', 'You have already applied a referral code.');
    }

    // 3. Verify they aren't referring themselves
    if (userData.referralCode === cleanCode) {
      throw new functions.https.HttpsError('invalid-argument', 'You cannot use your own referral code.');
    }

    // 4. Find the referrer
    const referrersQuery = db.collection('users').where('referralCode', '==', cleanCode).limit(1);
    const referrersSnap = await transaction.get(referrersQuery);

    if (referrersSnap.empty) {
      throw new functions.https.HttpsError('not-found', 'Referral code not found.');
    }

    const referrerDoc = referrersSnap.docs[0];
    const referrerUid = referrerDoc.id;
    const referrerData = referrerDoc.data();

    // 5. Update current user to set referredBy and status
    transaction.update(userRef, {
      referredBy: cleanCode,
      referralStatus: 'pending'
    });

    return { success: true, referrerName: referrerData.displayName };
  });
});
