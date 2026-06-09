import React, { useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';

// Play dice rolling rattle using Web Audio API
const playDiceRattle = (audioCtxRef) => {
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    // Play 5 rapid clicks to simulate dice rattling
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      const freq = 120 + Math.random() * 80;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.08);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.08);
    }
  } catch (e) {}
};

// Play a satisfying "thud" reveal sound when dice land
const playDiceThud = (audioCtxRef) => {
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
};

// Helper component to render dots for each individual face
const FaceDots = ({ value }) => {
  const dotCoords = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
  };

  const coords = dotCoords[value] || dotCoords[1];

  return (
    <svg width="60" height="60" viewBox="0 0 100 100">
      <defs>
        {/* Shiny gold dot gradient */}
        <linearGradient id="goldDotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe875" />
          <stop offset="50%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#c59b00" />
        </linearGradient>
      </defs>
      {coords.map(([cx, cy], idx) => (
        <circle 
          key={idx} 
          cx={cx} 
          cy={cy} 
          r="8.5" 
          fill="url(#goldDotGrad)" 
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
        />
      ))}
    </svg>
  );
};

// 3D Cube Die Component
const DiceCube = ({ value, rolling }) => {
  // Returns rotation degrees to show the winning face in the front
  const getRotationStyle = (val) => {
    if (rolling) return {}; // Rotation controlled by keyframe spin-3d in CSS
    switch (val) {
      case 1: return { transform: 'rotateX(0deg) rotateY(0deg)' };
      case 2: return { transform: 'rotateX(0deg) rotateY(180deg)' };
      case 3: return { transform: 'rotateX(0deg) rotateY(-90deg)' };
      case 4: return { transform: 'rotateX(0deg) rotateY(90deg)' };
      case 5: return { transform: 'rotateX(-90deg) rotateY(0deg)' };
      case 6: return { transform: 'rotateX(90deg) rotateY(0deg)' };
      default: return { transform: 'rotateX(0deg) rotateY(0deg)' };
    }
  };

  return (
    <div className="dice-scene">
      <div 
        className={`cube ${rolling ? 'cube-rolling' : ''}`} 
        style={getRotationStyle(value)}
      >
        <div className="cube-face face-1"><FaceDots value={1} /></div>
        <div className="cube-face face-2"><FaceDots value={2} /></div>
        <div className="cube-face face-3"><FaceDots value={3} /></div>
        <div className="cube-face face-4"><FaceDots value={4} /></div>
        <div className="cube-face face-5"><FaceDots value={5} /></div>
        <div className="cube-face face-6"><FaceDots value={6} /></div>
      </div>
    </div>
  );
};

const DiceBoard = () => {
  const { rolling, rolledDice, settling, activeRound } = useGame();
  const audioCtxRef = useRef(null);
  const prevRollingRef = useRef(false);

  useEffect(() => {
    if (rolling && !prevRollingRef.current) {
      // Dice just started rolling — play rattle
      playDiceRattle(audioCtxRef);
    }
    if (!rolling && prevRollingRef.current) {
      // Dice just stopped — play thud
      playDiceThud(audioCtxRef);
    }
    prevRollingRef.current = rolling;
  }, [rolling]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      padding: '24px 16px',
      background: 'rgba(19, 15, 36, 0.65)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '24px',
      boxShadow: 'inset 0 0 25px rgba(0,0,0,0.6)'
    }}>
      {/* 3D Dice Display Scene */}
      <div style={{ 
        display: 'flex', 
        gap: '28px', 
        height: '110px', 
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <DiceCube value={rolledDice.dice1} rolling={rolling} />
        <DiceCube value={rolledDice.dice2} rolling={rolling} />
      </div>

      {/* Outcome/Status Banner */}
      <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {rolling ? (
          <span style={{ 
            color: 'var(--accent-gold)', 
            fontWeight: '800', 
            fontSize: '0.95rem',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            animation: 'pulse-gold 1.5s infinite'
          }}>
            ROLLING 3D DICE...
          </span>
        ) : settling ? (
          <span style={{ 
            color: 'var(--text-secondary)', 
            fontWeight: '600', 
            fontSize: '0.95rem'
          }}>
            Settling Bets...
          </span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ 
              color: 'var(--text-primary)', 
              fontWeight: '800', 
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              Round Result: <span style={{ color: 'var(--accent-gold)' }}>{rolledDice.total}</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Round #{activeRound ? activeRound.roundNumber - 1 : '--'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceBoard;
