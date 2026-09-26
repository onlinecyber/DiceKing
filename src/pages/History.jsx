import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  ArrowLeft,
  LayoutGrid,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';
import { WithdrawalHistoryCard, DepositHistoryCard, formatHistoryDateTime } from '../components/Common/HistoryCards';

const depositChannels = ['All', 'ArUpi Pay', 'UPI x QR', 'WinPay', 'PhonePe'];

const History = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'games';

  const { currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  // Deposit filters (matching Screenshot 2)
  const [depositChannel, setDepositChannel] = useState('All');
  const [depositStatus, setDepositStatus] = useState('All');
  const [depositDate, setDepositDate] = useState('');

  const tabs = [
    { id: 'games', label: 'My History', icon: Gamepad2 },
    { id: 'deposits', label: 'Recharges', icon: ArrowDownLeft },
    { id: 'withdrawals', label: 'Withdraws', icon: ArrowUpRight },
    { id: 'ledger', label: 'Passbook', icon: BookOpen },
  ];

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

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
      let results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Exclude game history from ledger/passbook
      if (activeTab === 'ledger') {
        results = results.filter(
          item => !item.type?.startsWith('bet_') && item.type !== 'bet_place' && item.type !== 'bet_win'
        );
      }
      
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

  // Filter deposits based on channel, status, and date (Screenshot 2 functionality)
  const filteredDeposits = data.filter((item) => {
    if (activeTab !== 'deposits') return true;

    // Channel filter
    if (depositChannel !== 'All') {
      const ch = (item.paymentMethod || '').toLowerCase();
      if (!ch.includes(depositChannel.toLowerCase())) return false;
    }

    // Status filter
    if (depositStatus !== 'All') {
      const isApproved = item.status === 'approved' || item.status === 'completed' || item.status === 'success';
      const isPending = item.status === 'pending';
      const isFailed = item.status === 'rejected' || item.status === 'failed';

      if (depositStatus === 'Complete' && !isApproved) return false;
      if (depositStatus === 'Pending' && !isPending) return false;
      if (depositStatus === 'Failed' && !isFailed) return false;
    }

    // Date filter (YYYY-MM-DD)
    if (depositDate) {
      const itemDateStr = formatHistoryDateTime(item.createdAt).split(' ')[0];
      if (itemDateStr !== depositDate) return false;
    }

    return true;
  });

  return (
    <div className="app-container">
      <Navbar />

      <div className="content-container">
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HistoryIcon size={20} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
              {activeTab === 'deposits' ? 'Deposit history' : activeTab === 'withdrawals' ? 'Withdrawal history' : 'Transaction Logs'}
            </h2>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {/* Tab Switcher */}
        <GlassCard style={{ display: 'flex', overflow: 'hidden', borderRadius: '12px', padding: '2px' }}>
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: 'none',
                  borderBottom: isSelected ? '2px solid var(--accent-gold)' : '2px solid transparent',
                  color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? '700' : '500',
                  fontSize: '0.72rem',
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

        {/* ============================================================== */}
        {/* DEPOSIT HISTORY FILTERS (Screenshot 2 Match)                   */}
        {/* ============================================================== */}
        {activeTab === 'deposits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Scrollable Channel Chips */}
            <div style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '2px',
              scrollbarWidth: 'none',
            }}>
              {depositChannels.map((ch) => {
                const isSelected = depositChannel === ch;
                return (
                  <button
                    key={ch}
                    onClick={() => setDepositChannel(ch)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isSelected ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      fontWeight: isSelected ? '700' : '500',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {ch === 'All' && <LayoutGrid size={13} />}
                    {ch}
                  </button>
                );
              })}
            </div>

            {/* Dropdown Filters Row: Status + Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Status Dropdown */}
              <div style={{ position: 'relative' }}>
                <select
                  value={depositStatus}
                  onChange={(e) => setDepositStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#1a233a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="All">All Status</option>
                  <option value="Complete">Complete</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
                <ChevronDown size={14} color="#94a3b8" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>

              {/* Date Input / Filter */}
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: '#1a233a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: depositDate ? '#ffffff' : '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                />
                {depositDate && (
                  <button
                    onClick={() => setDepositDate('')}
                    style={{
                      position: 'absolute',
                      right: '26px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* List Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '2px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3].map(i => (
                <GlassCard key={i} style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
                  <div className="dice-cube" style={{ width: '20px', height: '20px', animation: 'dice-spin 1s linear infinite' }} />
                </GlassCard>
              ))}
            </div>
          ) : (activeTab === 'deposits' ? filteredDeposits : data).length === 0 ? (
            <GlassCard style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📜</div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                No records found in this category
              </span>
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '560px', overflowY: 'auto', paddingBottom: '16px' }}>
              {/* RENDER DEPOSITS (Screenshot 2 Match) */}
              {activeTab === 'deposits' && (
                filteredDeposits.map((item) => (
                  <DepositHistoryCard key={item.id} item={item} />
                ))
              )}

              {/* RENDER WITHDRAWALS (Screenshot 1 Match) */}
              {activeTab === 'withdrawals' && (
                data.map((item) => (
                  <WithdrawalHistoryCard key={item.id} item={item} />
                ))
              )}

              {/* RENDER GAMES (My History) & PASSBOOK (Ledger) */}
              {(activeTab === 'games' || activeTab === 'ledger') && data.map((item) => {
                let title = '';
                let subtitle = '';
                let badgeText = '';
                let badgeColor = '';
                let amountText = '';
                let amountColor = '';
                let detailText = '';

                if (activeTab === 'games') {
                  title = `Round #${item.roundNumber}`;
                  subtitle = `Bet: ${item.type === 'exact' ? `Exact ${item.exactValue}` : item.type?.toUpperCase()}`;
                  badgeText = item.status;
                  badgeColor = item.status === 'won' ? 'var(--success-emerald)' : item.status === 'pending' ? 'var(--accent-gold)' : 'var(--danger-red)';
                  amountText = item.status === 'won' ? `+₹${item.payout?.toFixed(2)}` : `-₹${item.amount?.toFixed(2)}`;
                  amountColor = item.status === 'won' ? 'var(--success-emerald)' : 'var(--danger-red)';
                  
                  if (item.status === 'lost') {
                    detailText = `Lost ₹${item.amount?.toFixed(2)}`;
                  } else if (item.status === 'won') {
                    detailText = `Won! Gross payout credited.`;
                  }
                } else if (activeTab === 'ledger') {
                  const isPositive = item.amount > 0;
                  title = item.description || 'Transaction Log';
                  subtitle = `Ref: ${(item.referenceId || item.id || '').slice(-8).toUpperCase()}`;
                  badgeText = item.status || 'success';
                  badgeColor = 'var(--success-emerald)';
                  amountText = `${isPositive ? '+' : ''}₹${Number(item.amount || 0).toFixed(2)}`;
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
                        {formatHistoryDateTime(item.createdAt)}
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
