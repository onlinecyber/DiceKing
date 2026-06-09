import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import GlassCard from '../Common/GlassCard';

const HistoryList = () => {
  const { history } = useGame();
  const [selectedRound, setSelectedRound] = useState(null);

  if (history.length === 0) {
    return (
      <GlassCard style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No rounds recorded yet.
      </GlassCard>
    );
  }

  // Get color configurations based on outcomes
  const getRoundBadgeStyles = (total) => {
    if (total > 7) {
      return { bg: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', text: 'var(--success-emerald)' };
    } else if (total < 7) {
      return { bg: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', text: 'var(--danger-red)' };
    } else {
      return { bg: 'rgba(255, 215, 0, 0.15)', border: '1px solid rgba(255, 215, 0, 0.4)', text: 'var(--accent-gold)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Horizontal Recent Results Ticker */}
      <GlassCard style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px' }}>
          RECENT OUTCOMES
        </div>
        
        {/* Swipeable List */}
        <div style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {history.map((r, idx) => {
            const styles = getRoundBadgeStyles(r.total);
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRound(selectedRound?.id === r.id ? null : r)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: styles.bg,
                  border: styles.border,
                  color: styles.text,
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: selectedRound?.id === r.id ? `0 0 10px ${styles.text}` : 'none',
                  transform: selectedRound?.id === r.id ? 'scale(1.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {r.total}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Selected Round Detail Drawer */}
      {selectedRound && (
        <GlassCard style={{ 
          padding: '12px 16px', 
          borderLeft: `4px solid ${getRoundBadgeStyles(selectedRound.total).text}`,
          animation: 'slide-in 0.25s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>
                Round #{selectedRound.roundNumber} Detail
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Rolled: {selectedRound.dice1} + {selectedRound.dice2} = {selectedRound.total}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: '700',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase'
              }}>
                {selectedRound.resultType.upDown}
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: '700',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase'
              }}>
                {selectedRound.resultType.oddEven}
              </span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Summary table for detailed analytics */}
      <GlassCard style={{ padding: '16px', maxHeight: '250px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <th style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', paddingBottom: '6px' }}>ROUND</th>
              <th style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', paddingBottom: '6px' }}>DICE</th>
              <th style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', paddingBottom: '6px' }}>SUM</th>
              <th style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', paddingBottom: '6px', textAlign: 'right' }}>OUTCOME</th>
            </tr>
          </thead>
          <tbody>
            {history.map((r) => {
              const styles = getRoundBadgeStyles(r.total);
              return (
                <tr 
                  key={r.id} 
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                    fontSize: '0.8rem'
                  }}
                >
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>#{r.roundNumber}</td>
                  <td style={{ padding: '8px 0', letterSpacing: '2px' }}>🎲{r.dice1} 🎲{r.dice2}</td>
                  <td style={{ padding: '8px 0', fontWeight: '800' }}>{r.total}</td>
                  <td style={{ padding: '8px 0', color: styles.text, fontWeight: '700', textAlign: 'right', textTransform: 'uppercase' }}>
                    {r.resultType.upDown}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>

    </div>
  );
};

export default HistoryList;
