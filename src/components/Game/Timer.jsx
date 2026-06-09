import React, { useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import GlassCard from '../Common/GlassCard';

const Timer = () => {
  const { countdown, settling, history, activeRound } = useGame();
  const audioCtxRef = useRef(null);
  const lastBeepRef = useRef(null);
  
  const secs = countdown < 0 ? 0 : countdown;
  const timeString = `00:${secs.toString().padStart(2, '0')}`;
  
  const recentRounds = (history || []).slice(0, 5);

  // Beep sound using Web Audio API
  useEffect(() => {
    if (secs > 0 && secs <= 5 && secs !== lastBeepRef.current) {
      lastBeepRef.current = secs;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.25);
      } catch (e) {
        // AudioContext not available, silently ignore
      }
    }
  }, [secs]);
  
  const getRoundBadgeStyles = (total) => {
    if (total > 7) return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: 'var(--success-emerald)' };
    if (total < 7) return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: 'var(--danger-red)' };
    return { bg: 'rgba(255, 215, 0, 0.15)', border: 'rgba(255, 215, 0, 0.4)', text: 'var(--accent-gold)' };
  };

  return (
    <GlassCard style={{ padding: '14px', display: 'flex', justifyContent: 'space-between' }}>
      {/* Left Side: Recent Outcomes */}
      <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '0.9rem' }}>📜</span> How to play
        </div>
        <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '600', margin: '4px 0' }}>
          WinGo 30sec
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
          {recentRounds.map((r, idx) => {
            const styles = getRoundBadgeStyles(r.total);
            return (
              <div key={r.id || idx} style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: styles.bg, border: `1px solid ${styles.border}`, color: styles.text,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800'
              }}>
                {r.total}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Side: Timer & Round Number */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: '12px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Time remaining
        </div>
        
        {/* Timer Blocks */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '1.2rem', fontWeight: '800', color: countdown <= 5 ? 'var(--danger-red)' : '#fff' }}>
          <div style={{ background: '#2b2640', padding: '4px 8px', borderRadius: '6px' }}>0</div>
          <div style={{ background: '#2b2640', padding: '4px 8px', borderRadius: '6px' }}>0</div>
          <span style={{ margin: '0 2px' }}>:</span>
          <div style={{ background: '#2b2640', padding: '4px 8px', borderRadius: '6px' }}>{timeString[3]}</div>
          <div style={{ background: '#2b2640', padding: '4px 8px', borderRadius: '6px' }}>{timeString[4]}</div>
        </div>
        
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px', letterSpacing: '0.5px' }}>
          {activeRound ? (() => {
            let date = new Date();
            if (activeRound.createdAt) {
              if (typeof activeRound.createdAt.toMillis === 'function') {
                date = new Date(activeRound.createdAt.toMillis());
              } else if (activeRound.createdAt.seconds) {
                date = new Date(activeRound.createdAt.seconds * 1000);
              } else {
                date = new Date(activeRound.createdAt);
              }
            }
            const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
            const dateStr = formatter.format(date).replace(/-/g, '');
            return `${dateStr}000${activeRound.roundNumber}`;
          })() : 'Loading...'}
        </div>
      </div>
    </GlassCard>
  );
};

export default Timer;
