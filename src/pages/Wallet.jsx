import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, ArrowDownLeft, ArrowUpRight, Info, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';

const Wallet = () => {
  const { currentUser } = useAuth();
  const { wallet, showToast, appSettings } = useGame();
  const navigate = useNavigate();
  const [txHistory, setTxHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load recent transactions (last 20)
  useEffect(() => {
    if (!currentUser) return;
    const txQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(
      txQuery,
      (snap) => setTxHistory(snap.docs.map((d) => d.data())),
      (err) => console.error('Tx load error', err)
    );
    return () => unsub();
  }, [currentUser]);

  const formatDate = (ts) => {
    if (!ts) return '--';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString();
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container" style={{ gap: '16px' }}>
        {/* Balance Card */}
        <GlassCard style={{ padding: '24px 20px', background: 'linear-gradient(135deg, rgba(31,27,53,0.6) 0%, rgba(11,9,20,0.8) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Coins size={36} color="var(--accent-gold)" style={{ filter: 'drop-shadow(0 0 10px var(--accent-gold))' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px' }}>WALLET BALANCE</span>
          <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent-gold)' }}>₹{wallet ? wallet.balance.toFixed(2) : '0.00'}</span>
        </GlassCard>
        {/* Action Buttons */}
        <GlassCard style={{ padding: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/deposit')}
            className="btn-gold"
            style={{ flex: 1, padding: '10px', fontSize: '0.9rem', fontWeight: '700' }}
          >Add Money</button>
          <button
            onClick={() => navigate('/withdraw')}
            className="btn-outline"
            style={{ flex: 1, padding: '10px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--danger-red)' }}
          >Withdraw</button>
        </GlassCard>
        {/* Transaction History */}
        <GlassCard style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>RECENT TRANSACTIONS</h3>
          {txHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>No transactions yet. Make your first deposit!</div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {txHistory.map((tx, idx) => {
                const isPositive = tx.amount > 0;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isPositive ? 'var(--success-emerald)' : 'var(--danger-red)'}`, borderRadius: '8px', padding: '4px' }}>
                        {isPositive ? <ArrowDownLeft size={14} color="var(--success-emerald)" /> : <ArrowUpRight size={14} color="var(--danger-red)" />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>{tx.description}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatDate(tx.createdAt)} • {tx.type}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: isPositive ? 'var(--success-emerald)' : 'var(--danger-red)' }}>{isPositive ? '+' : ''}₹{tx.amount.toFixed(2)}</div>
                      <div style={{ fontSize: '0.65rem', color: tx.status === 'success' ? 'var(--success-emerald)' : tx.status === 'pending' ? 'var(--accent-gold)' : 'var(--danger-red)' }}>{tx.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
      <BottomNav />
    </div>
  );
};

export default Wallet;
