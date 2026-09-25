import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import GlassCard from '../Common/GlassCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

const HistoryList = () => {
  const { history } = useGame();
  const { currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('game'); // 'game' | 'my'
  const [myBets, setMyBets] = useState([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [expandedBetId, setExpandedBetId] = useState(null);

  // Helper to format date to YYYYMMDD000{roundNumber}
  const formatPeriod = (timestamp, roundNumber) => {
    let date = new Date();
    if (timestamp) {
      if (typeof timestamp.toMillis === 'function') {
        date = new Date(timestamp.toMillis());
      } else if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
    }
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const dateStr = formatter.format(date).replace(/-/g, '');
    return `${dateStr}000${roundNumber || ''}`;
  };

  // Helper to format readable datetime
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '--';
    let date = new Date();
    if (typeof timestamp.toDate === 'function') date = timestamp.toDate();
    else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
    else date = new Date(timestamp);
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'medium' });
  };

  // Listen to current user's bets in real-time
  useEffect(() => {
    if (!currentUser) {
      setMyBets([]);
      return;
    }

    setLoadingBets(true);
    const betsQuery = query(
      collection(db, 'bets'),
      where('uid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      betsQuery,
      (snapshot) => {
        const bets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // Sort descending by creation timestamp
        bets.sort((a, b) => {
          const timeA = a.createdAt?.seconds || (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : 0);
          const timeB = b.createdAt?.seconds || (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : 0);
          return timeB - timeA;
        });
        setMyBets(bets.slice(0, 30));
        setLoadingBets(false);
      },
      (error) => {
        console.error('Error listening to user bets:', error);
        setLoadingBets(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Color configurations based on game total
  const getRoundBadgeStyles = (total) => {
    if (total > 7) {
      return { bg: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', text: 'var(--success-emerald)' };
    } else if (total < 7) {
      return { bg: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', text: 'var(--danger-red)' };
    } else {
      return { bg: 'rgba(255, 215, 0, 0.15)', border: '1px solid rgba(255, 215, 0, 0.4)', text: 'var(--accent-gold)' };
    }
  };

  // Helper for bet selection badge
  const renderBetSelectionBadge = (bet) => {
    if (bet.type === 'exact' && bet.exactValue === 7) {
      return (
        <span style={{
          background: 'rgba(234, 179, 8, 0.15)',
          border: '1px solid #eab308',
          color: '#ffd700',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: '800'
        }}>
          LUCKY 7
        </span>
      );
    }
    if (bet.type === 'exact') {
      return (
        <span style={{
          background: 'rgba(168, 85, 247, 0.15)',
          border: '1px solid #a855f7',
          color: '#c084fc',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: '800'
        }}>
          NUM {bet.exactValue}
        </span>
      );
    }
    if (bet.type === 'down') {
      return (
        <span style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#ff7b7b',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: '800'
        }}>
          DOWN (2-6)
        </span>
      );
    }
    if (bet.type === 'up') {
      return (
        <span style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#6ee7b7',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: '800'
        }}>
          UP (8-12)
        </span>
      );
    }
    return (
      <span style={{
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.72rem',
        fontWeight: '800'
      }}>
        {bet.type?.toUpperCase()}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Tab Switcher: Game History vs My History */}
      <div style={{
        display: 'flex',
        background: 'rgba(26, 22, 43, 0.8)',
        padding: '3px',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        gap: '4px'
      }}>
        <button
          onClick={() => setActiveTab('game')}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: '11px',
            border: activeTab === 'game' ? '1px solid rgba(255, 215, 0, 0.5)' : '1px solid transparent',
            background: activeTab === 'game' 
              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 170, 0, 0.08) 100%)' 
              : 'transparent',
            color: activeTab === 'game' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'game' ? '800' : '600',
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <span>📈</span>
          <span>Game History</span>
        </button>

        <button
          onClick={() => setActiveTab('my')}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: '11px',
            border: activeTab === 'my' ? '1px solid rgba(255, 215, 0, 0.5)' : '1px solid transparent',
            background: activeTab === 'my' 
              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 170, 0, 0.08) 100%)' 
              : 'transparent',
            color: activeTab === 'my' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'my' ? '800' : '600',
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <span>📜</span>
          <span>My History</span>
        </button>
      </div>

      {/* Tab 1: Game History */}
      {activeTab === 'game' && (
        <GlassCard style={{ padding: '14px 16px', maxHeight: '420px', overflowY: 'auto' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No game rounds recorded yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                  <th style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', paddingBottom: '8px' }}>ROUND</th>
                  <th style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', paddingBottom: '8px' }}>DICE</th>
                  <th style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', paddingBottom: '8px', textAlign: 'center' }}>SUM</th>
                  <th style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', paddingBottom: '8px', textAlign: 'right' }}>OUTCOME</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => {
                  const styles = getRoundBadgeStyles(r.total);
                  return (
                    <tr 
                      key={r.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <td style={{ padding: '10px 0', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {formatPeriod(r.createdAt, r.roundNumber)}
                      </td>
                      <td style={{ padding: '10px 0', letterSpacing: '1px' }}>🎲{r.dice1} 🎲{r.dice2}</td>
                      <td style={{ padding: '10px 0', fontWeight: '800', textAlign: 'center' }}>
                        <span style={{ 
                          background: styles.bg, 
                          color: styles.text, 
                          border: styles.border, 
                          padding: '2px 7px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem' 
                        }}>
                          {r.total}
                        </span>
                      </td>
                      <td style={{ padding: '10px 0', textAlign: 'right' }}>
                        <span style={{
                          color: r.resultType?.upDown === 'up' 
                            ? 'var(--success-emerald)' 
                            : r.resultType?.upDown === 'lucky7' 
                              ? 'var(--accent-gold)' 
                              : 'var(--danger-red)',
                          fontWeight: '800', 
                          textTransform: 'uppercase', 
                          fontSize: '0.75rem'
                        }}>
                          {r.total === 7 ? 'LUCKY 7' : r.resultType?.upDown}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </GlassCard>
      )}

      {/* Tab 2: My History (User's personal bets with Win / Loss amounts) */}
      {activeTab === 'my' && (
        <GlassCard style={{ padding: '14px 16px', maxHeight: '420px', overflowY: 'auto' }}>
          {!currentUser ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Please log in to view your bet history.
            </div>
          ) : loadingBets ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading your history...
            </div>
          ) : myBets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No bets placed yet. Bet on Up, Down or 7 to start winning!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.1fr 1fr',
                paddingBottom: '6px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                fontWeight: '700'
              }}>
                <span>ROUND</span>
                <span>SELECT</span>
                <span style={{ textAlign: 'right' }}>RESULT</span>
              </div>

              {myBets.map((b) => {
                const isWon = b.status === 'won';
                const isLost = b.status === 'lost';
                const isPending = b.status === 'pending';
                const isExpanded = expandedBetId === b.id;

                return (
                  <div 
                    key={b.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      padding: '8px 0',
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedBetId(isExpanded ? null : b.id)}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 1.1fr 1fr',
                      alignItems: 'center',
                      fontSize: '0.78rem'
                    }}>
                      {/* Round Period */}
                      <div style={{
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace',
                        fontSize: '0.74rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {formatPeriod(b.createdAt, b.roundNumber)}
                      </div>

                      {/* Bet Choice */}
                      <div>
                        {renderBetSelectionBadge(b)}
                      </div>

                      {/* Result: Only Win or Loss Amount */}
                      <div style={{ textAlign: 'right' }}>
                        {isWon && (
                          <span style={{ color: 'var(--success-emerald)', fontWeight: '900', fontSize: '0.86rem' }}>
                            +₹{Number(b.payout || 0).toFixed(2)}
                          </span>
                        )}

                        {isLost && (
                          <span style={{ color: 'var(--danger-red)', fontWeight: '900', fontSize: '0.86rem' }}>
                            -₹{Number(b.amount || 0).toFixed(2)}
                          </span>
                        )}

                        {isPending && (
                          <span style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '0.78rem' }}>
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expandable Order Detail Accordion */}
                    {isExpanded && (
                      <div style={{
                        marginTop: '8px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '0.72rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        animation: 'fadeIn 0.2s ease-out'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Order ID:</span>
                          <span style={{ color: '#fff', fontFamily: 'monospace' }}>#{b.id?.slice(0, 14)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Period / Round:</span>
                          <span style={{ color: '#fff', fontWeight: '700' }}>
                            {formatPeriod(b.createdAt, b.roundNumber)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Bet Amount:</span>
                          <span style={{ color: '#fff', fontWeight: '700' }}>₹{b.amount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Profit / Loss:</span>
                          <span style={{
                            color: isWon ? '#10b981' : isLost ? '#ef4444' : '#ffd700',
                            fontWeight: '800'
                          }}>
                            {isWon ? `+₹${b.payout?.toFixed(2)}` : isLost ? `-₹${b.amount?.toFixed(2)}` : 'In Progress'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Placed At:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{formatDateTime(b.createdAt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

    </div>
  );
};

export default HistoryList;
