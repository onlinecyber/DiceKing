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
      


      {/* Summary table for detailed analytics */}
      <GlassCard style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '1px' }}>
          📈 GAME HISTORY
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <th style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', paddingBottom: '8px' }}>ROUND</th>
              <th style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', paddingBottom: '8px' }}>DICE</th>
              <th style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', paddingBottom: '8px', textAlign: 'center' }}>SUM</th>
              <th style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', paddingBottom: '8px', textAlign: 'right' }}>OUTCOME</th>
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
                  <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>
                    {(() => {
                      let date = new Date();
                      if (r.createdAt) {
                        if (typeof r.createdAt.toMillis === 'function') {
                          date = new Date(r.createdAt.toMillis());
                        } else if (r.createdAt.seconds) {
                          date = new Date(r.createdAt.seconds * 1000);
                        } else {
                          date = new Date(r.createdAt);
                        }
                      }
                      const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
                      const dateStr = formatter.format(date).replace(/-/g, '');
                      return `${dateStr}000${r.roundNumber}`;
                    })()}
                  </td>
                  <td style={{ padding: '10px 0', letterSpacing: '1px' }}>🎲{r.dice1} 🎲{r.dice2}</td>
                  <td style={{ padding: '10px 0', fontWeight: '800', textAlign: 'center' }}>
                    <span style={{ 
                      background: styles.bg, color: styles.text, border: `1px solid ${styles.border.split('solid ')[1] || styles.border}`, 
                      padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' 
                    }}>
                      {r.total}
                    </span>
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>
                    <span style={{
                      color: r.resultType?.upDown === 'up' ? 'var(--success-emerald)' : 'var(--danger-red)',
                      fontWeight: '800', textTransform: 'uppercase', fontSize: '0.75rem'
                    }}>
                      {r.resultType?.upDown}
                    </span>
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
