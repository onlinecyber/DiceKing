import React from 'react';
import { Hourglass } from 'lucide-react';
import { useGame } from '../../context/GameContext';

const Timer = () => {
  const { countdown, settling } = useGame();
  
  const totalDuration = 30; // 30 second rounds
  const radius = 28;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (countdown / totalDuration) * circumference;

  // Determine timer status color
  const getTimerColor = () => {
    if (settling) return 'var(--text-muted)';
    if (countdown <= 5) return 'var(--danger-red)';
    if (countdown <= 10) return '#f59e0b'; // amber
    return 'var(--accent-gold)';
  };

  const timerColor = getTimerColor();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
      background: 'rgba(31, 27, 53, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      width: '100%'
    }}>
      {/* Label section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Hourglass 
          size={18} 
          color={timerColor}
          style={{
            animation: countdown <= 5 && !settling ? 'dice-spin 1.5s linear infinite' : 'none'
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ROUND TIMER</span>
          <span style={{ 
            fontSize: '0.9rem', 
            fontWeight: '700',
            color: countdown <= 2 ? 'var(--danger-red)' : 'var(--text-primary)'
          }}>
            {settling ? 'Settling...' : countdown <= 2 ? 'Betting Locked' : 'Place Your Bets'}
          </span>
        </div>
      </div>

      {/* Circle countdown visualizer */}
      <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
        <svg
          height="56"
          width="56"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        >
          {/* Background circle */}
          <circle
            stroke="rgba(255, 255, 255, 0.05)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="28"
            cy="28"
          />
          {/* Active progress ring */}
          <circle
            stroke={timerColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ 
              strokeDashoffset,
              transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
              filter: countdown <= 10 && !settling ? `drop-shadow(0 0 4px ${timerColor})` : 'none'
            }}
            r={normalizedRadius}
            cx="28"
            cy="28"
          />
        </svg>

        {/* Text centered inside progress ring */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
          fontWeight: '800',
          color: timerColor,
          fontVariantNumeric: 'tabular-nums',
          animation: countdown <= 5 && !settling ? 'pulse-gold 1s infinite' : 'none'
        }}>
          {settling ? '0s' : `${countdown}s`}
        </div>
      </div>
    </div>
  );
};

export default Timer;
