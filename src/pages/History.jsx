import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { 
  History as HistoryIcon,
  Gamepad2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';

const History = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('games');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  const tabs = [
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'deposits', label: 'Recharges', icon: ArrowDownLeft },
    { id: 'withdrawals', label: 'Withdraws', icon: ArrowUpRight },
    { id: 'ledger', label: 'Passbook', icon: BookOpen },
  ];

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [activeTab, currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      let collectionName = '';
      if (activeTab === 'games') {
        collectionName = 'bets';
      } else if (activeTab === 'deposits') {
        collectionName = 'deposits';
      } else if (activeTab === 'withdrawals') {
        collectionName = 'withdrawals';
      } else if (activeTab === 'ledger') {
        collectionName = 'transactions';
      }

      const q = query(
        collection(db, collectionName),
        where('uid', '==', currentUser.uid)
      );
      
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory to avoid missing index errors
      const sorted = results.sort((a, b) => {
        const timeA = a.createdAt?.seconds || (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : Date.now() / 1000);
        const timeB = b.createdAt?.seconds || (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : Date.now() / 1000);
        return timeB - timeA;
      });

      setData(sorted);
    } catch (error) {
      console.error("Failed to load history data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just Now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="content-container">
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <HistoryIcon size={20} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Transaction & Game Logs</h2>
        </div>

        {/* Tab Switcher */}
        <GlassCard style={{ display: 'flex', overflow: 'hidden', borderRadius: '12px', padding: '2px' }}>
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: 'none',
                  borderBottom: isSelected ? '2px solid var(--accent-gold)' : '2px solid transparent',
                  color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? '700' : '500',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconComponent size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </GlassCard>

        {/* List Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3].map(i => (
                <GlassCard key={i} style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
                  <div className="dice-cube" style={{ width: '20px', height: '20px', animation: 'dice-spin 1s linear infinite' }} />
                </GlassCard>
              ))}
            </div>
          ) : data.length === 0 ? (
            <GlassCard style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📜</div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                No records found in this category
              </span>
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '520px', overflowY: 'auto', paddingBottom: '16px' }}>
              {data.map((item) => {
                let title = '';
                let subtitle = '';
                let badgeText = '';
                let badgeColor = '';
                let amountText = '';
                let amountColor = '';
                let detailText = '';

                if (activeTab === 'games') {
                  title = `Round #${item.roundNumber}`;
                  subtitle = `Bet Type: ${item.type === 'exact' ? `Exact ${item.exactValue}` : item.type.toUpperCase()}`;
                  badgeText = item.status;
                  badgeColor = item.status === 'won' ? 'var(--success-emerald)' : item.status === 'pending' ? 'var(--accent-gold)' : 'var(--danger-red)';
                  amountText = item.status === 'won' ? `+₹${item.payout.toFixed(2)}` : `-₹${item.amount.toFixed(2)}`;
                  amountColor = item.status === 'won' ? 'var(--success-emerald)' : 'var(--text-primary)';
                  
                  if (item.status === 'lost') {
                    detailText = `Lost ₹${item.amount.toFixed(2)}`;
                  } else if (item.status === 'won') {
                    detailText = `Won! Gross return, 5% GST deducted.`;
                  }
                } else if (activeTab === 'deposits') {
                  title = `Deposit Recharge`;
                  subtitle = `Ref ID: ${item.transactionReference || 'N/A'}`;
                  badgeText = item.status;
                  badgeColor = item.status === 'approved' ? 'var(--success-emerald)' : item.status === 'pending' ? 'var(--accent-gold)' : 'var(--danger-red)';
                  amountText = `₹${item.amount.toFixed(2)}`;
                  amountColor = 'var(--text-primary)';
                  detailText = `Channel: ${item.paymentMethod || 'UPI'}`;
                } else if (activeTab === 'withdrawals') {
                  title = `Payout Request`;
                  subtitle = `Method: ${item.paymentMethod || 'UPI Payout'}`;
                  badgeText = item.status;
                  badgeColor = item.status === 'approved' ? 'var(--success-emerald)' : item.status === 'pending' ? 'var(--accent-gold)' : 'var(--danger-red)';
                  amountText = `₹${item.amount.toFixed(2)}`;
                  amountColor = 'var(--danger-red)';
                  detailText = `Payout Details: ${item.walletAddress || 'N/A'}`;
                  if (item.status === 'rejected' && item.rejectReason) {
                    detailText += ` | Reject Reason: ${item.rejectReason}`;
                  }
                } else if (activeTab === 'ledger') {
                  const isPositive = item.amount > 0;
                  title = item.description || 'Transaction Log';
                  subtitle = `Ref: ${item.referenceId?.slice(-8).toUpperCase() || 'N/A'}`;
                  badgeText = item.status || 'success';
                  badgeColor = 'var(--success-emerald)';
                  amountText = `${isPositive ? '+' : ''}₹${item.amount.toFixed(2)}`;
                  amountColor = isPositive ? 'var(--success-emerald)' : 'var(--danger-red)';
                  detailText = `Category: ${item.type || 'Other'}`;
                }

                return (
                  <GlassCard 
                    key={item.id} 
                    style={{ 
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '0', flex: 1 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {subtitle}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '900', color: amountColor }}>
                          {amountText}
                        </span>
                        <span style={{
                          fontSize: '0.55rem',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          background: `rgba(${badgeColor === 'var(--success-emerald)' ? '16,185,129' : badgeColor === 'var(--danger-red)' ? '239,68,68' : '245,158,11'}, 0.08)`,
                          color: badgeColor,
                          border: `1px solid ${badgeColor}40`
                        }}>
                          {badgeText === 'approved' ? 'successful' : badgeText}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '4px', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                        {detailText}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default History;
