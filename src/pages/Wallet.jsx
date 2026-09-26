import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coins, 
  ArrowDownLeft, 
  ArrowUpRight, 
  BookOpen, 
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';
import { WithdrawalHistoryCard, DepositHistoryCard, formatHistoryDateTime } from '../components/Common/HistoryCards';

const Wallet = () => {
  const { currentUser } = useAuth();
  const { wallet } = useGame();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('withdrawals'); // 'withdrawals', 'deposits', 'passbook'
  const [withdrawals, setWithdrawals] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [txHistory, setTxHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Real-time listener for user's withdrawals
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'withdrawals'),
      where('uid', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const sorted = docs.sort((a, b) => {
          const tA = a.createdAt?.seconds || (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : 0);
          const tB = b.createdAt?.seconds || (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : 0);
          return tB - tA;
        });
        setWithdrawals(sorted);
        setLoading(false);
      },
      (err) => {
        console.error('Withdrawals load error', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [currentUser]);

  // 2. Real-time listener for user's deposits
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'deposits'),
      where('uid', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const sorted = docs.sort((a, b) => {
          const tA = a.createdAt?.seconds || (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : 0);
          const tB = b.createdAt?.seconds || (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : 0);
          return tB - tA;
        });
        setDeposits(sorted);
      },
      (err) => console.error('Deposits load error', err)
    );
    return () => unsub();
  }, [currentUser]);

  // 3. Real-time listener for general ledger transactions (excluding bets)
  useEffect(() => {
    if (!currentUser) return;
    const txQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      txQuery,
      (snap) => {
        const allTxs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const walletOnly = allTxs.filter(
          (tx) => tx.type !== 'bet_place' && tx.type !== 'bet_win' && !tx.type?.startsWith('bet_')
        );
        const sorted = walletOnly.sort((a, b) => {
          const tA = a.createdAt?.seconds || (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : 0);
          const tB = b.createdAt?.seconds || (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : 0);
          return tB - tA;
        });
        setTxHistory(sorted.slice(0, 30));
      },
      (err) => console.error('Tx load error', err)
    );
    return () => unsub();
  }, [currentUser]);

  return (
    <div className="app-container">
      <Navbar />

      <div className="content-container" style={{ gap: '14px' }}>
        
        {/* Balance Card */}
        <GlassCard style={{
          padding: '24px 20px',
          background: 'linear-gradient(135deg, rgba(31,27,53,0.7) 0%, rgba(11,9,20,0.9) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          border: '1px solid rgba(255, 215, 0, 0.15)'
        }}>
          <Coins size={36} color="var(--accent-gold)" style={{ filter: 'drop-shadow(0 0 10px var(--accent-gold))' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '1.5px' }}>
            WALLET BALANCE
          </span>
          <span style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
            ₹{wallet ? wallet.balance.toFixed(2) : '0.00'}
          </span>
        </GlassCard>

        {/* Action Buttons */}
        <GlassCard style={{ padding: '14px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/deposit')}
            className="btn-gold"
            style={{ flex: 1, padding: '11px', fontSize: '0.9rem', fontWeight: '800' }}
          >
            + Add Money
          </button>
          <button
            onClick={() => navigate('/withdraw')}
            className="btn-outline"
            style={{ flex: 1, padding: '11px', fontSize: '0.9rem', fontWeight: '800', color: 'var(--danger-red)' }}
          >
            Withdraw
          </button>
        </GlassCard>

        {/* History Section Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>
            TRANSACTION HISTORY
          </span>
          <button
            onClick={() => navigate(`/history?tab=${activeTab}`)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-gold)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View All <ExternalLink size={12} />
          </button>
        </div>

        {/* Tabs: Withdrawals, Deposits, Passbook */}
        <GlassCard style={{ display: 'flex', overflow: 'hidden', borderRadius: '12px', padding: '2px' }}>
          {/* Withdrawal History Tab */}
          <button
            onClick={() => setActiveTab('withdrawals')}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: activeTab === 'withdrawals' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'withdrawals' ? '2px solid #ef4444' : '2px solid transparent',
              color: activeTab === 'withdrawals' ? '#ef4444' : 'var(--text-secondary)',
              fontWeight: activeTab === 'withdrawals' ? '800' : '500',
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowUpRight size={14} />
            <span>Withdrawals ({withdrawals.length})</span>
          </button>

          {/* Deposit History Tab */}
          <button
            onClick={() => setActiveTab('deposits')}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: activeTab === 'deposits' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'deposits' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'deposits' ? '#10b981' : 'var(--text-secondary)',
              fontWeight: activeTab === 'deposits' ? '800' : '500',
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowDownLeft size={14} />
            <span>Deposits ({deposits.length})</span>
          </button>

          {/* Passbook Tab */}
          <button
            onClick={() => setActiveTab('passbook')}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: activeTab === 'passbook' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'passbook' ? '2px solid var(--accent-gold)' : '2px solid transparent',
              color: activeTab === 'passbook' ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'passbook' ? '800' : '500',
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <BookOpen size={14} />
            <span>Passbook</span>
          </button>
        </GlassCard>

        {/* Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2].map((i) => (
                <GlassCard key={i} style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
                  <div className="dice-cube" style={{ width: '20px', height: '20px', animation: 'dice-spin 1s linear infinite' }} />
                </GlassCard>
              ))}
            </div>
          ) : activeTab === 'withdrawals' ? (
            /* WITHDRAWAL HISTORY TAB */
            withdrawals.length === 0 ? (
              <GlassCard style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>💸</div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>No withdrawal requests yet</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Your payout requests will appear here with live tracking.
                </p>
              </GlassCard>
            ) : (
              withdrawals.map((item) => (
                <WithdrawalHistoryCard key={item.id} item={item} />
              ))
            )
          ) : activeTab === 'deposits' ? (
            /* DEPOSIT HISTORY TAB */
            deposits.length === 0 ? (
              <GlassCard style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>💳</div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>No deposit recharges yet</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Your recharge records will appear here with order numbers and status.
                </p>
              </GlassCard>
            ) : (
              deposits.map((item) => (
                <DepositHistoryCard key={item.id} item={item} />
              ))
            )
          ) : (
            /* PASSBOOK TAB */
            txHistory.length === 0 ? (
              <GlassCard style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>📜</div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>No passbook records yet</span>
              </GlassCard>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {txHistory.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <GlassCard 
                      key={tx.id} 
                      style={{ 
                        padding: '12px 14px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${isPositive ? 'var(--success-emerald)' : 'var(--danger-red)'}`,
                          borderRadius: '8px',
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {isPositive ? <ArrowDownLeft size={14} color="var(--success-emerald)" /> : <ArrowUpRight size={14} color="var(--danger-red)" />}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fff' }}>{tx.description}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {formatHistoryDateTime(tx.createdAt)} • {tx.type}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: '800', color: isPositive ? 'var(--success-emerald)' : 'var(--danger-red)' }}>
                          {isPositive ? '+' : ''}₹{Math.abs(Number(tx.amount || 0)).toFixed(2)}
                        </div>
                        <div style={{
                          fontSize: '0.6rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          color: tx.status === 'success' ? 'var(--success-emerald)' : tx.status === 'pending' ? 'var(--accent-gold)' : 'var(--danger-red)'
                        }}>
                          {tx.status}
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )
          )}
        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default Wallet;
