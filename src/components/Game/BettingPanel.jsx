import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import GlassCard from '../Common/GlassCard';

const BettingPanel = () => {
  const { activeRound, countdown, placeBet, recentBets, wallet } = useGame();
  
  // Local state
  const [selectedChip, setSelectedChip] = useState(50); // Default chip value
  const [loading, setLoading] = useState(false);
  const [showExactGrid, setShowExactGrid] = useState(false);

  const chips = [10, 50, 100, 500, 1000];

  // Betting state checks
  const isLocked = countdown <= 2 || !activeRound;

  // Filter user's active bets for the current round to show badges
  const currentRoundBets = activeRound 
    ? recentBets.filter(b => b.roundId === activeRound.id) 
    : [];

  const getBetAmountOnType = (type, exactValue = null) => {
    return currentRoundBets
      .filter(b => b.type === type && (exactValue === null || b.exactValue === exactValue))
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const handleBetClick = async (type, exactValue = null) => {
    if (isLocked) return;
    if (loading) return;

    if (!wallet || wallet.balance < selectedChip) {
      alert("Insufficient balance!");
      return;
    }

    setLoading(true);
    try {
      await placeBet(type, exactValue, selectedChip);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exactMultipliers = {
    2: 30, 3: 15, 4: 10, 5: 8, 6: 6, 7: 5,
    8: 6, 9: 8, 10: 10, 11: 15, 12: 30
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. Chips Selector */}
      <GlassCard style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px' }}>
          SELECT CHIP AMOUNT
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          {chips.map(val => {
            const isSelected = selectedChip === val;
            const chipColors = {
              10: { bg: '#3b82f6', border: '#60a5fa' },     // Blue
              50: { bg: '#10b981', border: '#34d399' },    // Green
              100: { bg: '#ef4444', border: '#f87171' },   // Red
              500: { bg: '#8b5cf6', border: '#a78bfa' },   // Purple
              1000: { bg: '#ffd700', border: '#fef08a' }   // Gold
            };
            const currentChip = chipColors[val];
            return (
              <button
                key={val}
                disabled={isLocked}
                onClick={() => setSelectedChip(val)}
                style={{
                  flex: 1,
                  aspectRatio: '1',
                  borderRadius: '50%',
                  background: isSelected 
                    ? `radial-gradient(circle, ${currentChip.bg} 40%, #000 100%)` 
                    : 'rgba(31, 27, 53, 0.3)',
                  border: isSelected 
                    ? `3px dashed ${currentChip.border}` 
                    : `2px dashed rgba(255, 255, 255, 0.2)`,
                  color: isSelected ? '#000' : 'var(--text-primary)',
                  fontWeight: '800',
                  fontSize: '0.8rem',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSelected ? `0 0 15px ${currentChip.bg}` : 'none',
                  transform: isSelected ? 'scale(1.08)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
                }}
              >
                ₹{val}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* 2. Main Betting Options Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Row 1: Up and Down */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* DOWN CARD */}
          <button
            disabled={isLocked || loading}
            onClick={() => handleBetClick('down')}
            style={{
              flex: 1,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '16px',
              padding: '20px 12px',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--danger-red)' }}>DOWN</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUM 2 - 6 (2x Payout)</div>
            
            {/* Active Bet Badge */}
            {getBetAmountOnType('down') > 0 && (
              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                background: 'var(--accent-gold)',
                color: '#000',
                fontSize: '0.65rem',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <Coins size={10} /> ₹{getBetAmountOnType('down')}
              </div>
            )}
          </button>

          {/* UP CARD */}
          <button
            disabled={isLocked || loading}
            onClick={() => handleBetClick('up')}
            style={{
              flex: 1,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '16px',
              padding: '20px 12px',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--success-emerald)' }}>UP</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUM 8 - 12 (2x Payout)</div>
            
            {/* Active Bet Badge */}
            {getBetAmountOnType('up') > 0 && (
              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                background: 'var(--accent-gold)',
                color: '#000',
                fontSize: '0.65rem',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <Coins size={10} /> ₹{getBetAmountOnType('up')}
              </div>
            )}
          </button>
        </div>

        {/* Row 2: Odd and Even */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* ODD CARD */}
          <button
            disabled={isLocked || loading}
            onClick={() => handleBetClick('odd')}
            style={{
              flex: 1,
              background: 'rgba(31, 27, 53, 0.45)',
              border: '1px solid var(--card-border)',
              borderRadius: '16px',
              padding: '16px 12px',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <div style={{ fontSize: '1rem', fontWeight: '700' }}>ODD</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>1.9x Payout</div>
            
            {/* Active Bet Badge */}
            {getBetAmountOnType('odd') > 0 && (
              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                background: 'var(--accent-gold)',
                color: '#000',
                fontSize: '0.65rem',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <Coins size={10} /> ₹{getBetAmountOnType('odd')}
              </div>
            )}
          </button>

          {/* EVEN CARD */}
          <button
            disabled={isLocked || loading}
            onClick={() => handleBetClick('even')}
            style={{
              flex: 1,
              background: 'rgba(31, 27, 53, 0.45)',
              border: '1px solid var(--card-border)',
              borderRadius: '16px',
              padding: '16px 12px',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <div style={{ fontSize: '1rem', fontWeight: '700' }}>EVEN</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>1.9x Payout</div>
            
            {/* Active Bet Badge */}
            {getBetAmountOnType('even') > 0 && (
              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                background: 'var(--accent-gold)',
                color: '#000',
                fontSize: '0.65rem',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <Coins size={10} /> ₹{getBetAmountOnType('even')}
              </div>
            )}
          </button>
        </div>

        {/* Row 3: Exact Number Bet Grid Toggle */}
        <button
          onClick={() => setShowExactGrid(!showExactGrid)}
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(31,27,53,0.45) 100%)',
            border: showExactGrid ? '1px solid rgba(255,215,0,0.3)' : '1px solid var(--card-border)',
            borderRadius: '16px',
            padding: '14px',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {showExactGrid ? 'Hide Exact Value Bets' : 'Show Exact Value Bets (Up to 30x Payout)'}
        </button>

        {/* Exact Values Grid */}
        {showExactGrid && (
          <GlassCard style={{ padding: '12px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '8px', 
              maxHeight: '200px', 
              overflowY: 'auto',
              padding: '4px'
            }}>
              {Object.entries(exactMultipliers).map(([num, mult]) => {
                const n = Number(num);
                const activeBetAmount = getBetAmountOnType('exact', n);
                return (
                  <button
                    key={num}
                    disabled={isLocked || loading}
                    onClick={() => handleBetClick('exact', n)}
                    style={{
                      background: activeBetAmount > 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(19, 15, 36, 0.5)',
                      border: activeBetAmount > 0 
                        ? '1px solid var(--accent-gold)' 
                        : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      padding: '8px 4px',
                      color: 'var(--text-primary)',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative'
                    }}
                  >
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: activeBetAmount > 0 ? 'var(--accent-gold)' : 'inherit' }}>
                      {num}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                      {mult}x
                    </span>

                    {/* Badge */}
                    {activeBetAmount > 0 && (
                      <span style={{
                        position: 'absolute',
                        bottom: '-4px',
                        background: 'var(--accent-gold)',
                        color: '#000',
                        fontSize: '0.5rem',
                        fontWeight: '800',
                        padding: '1px 3px',
                        borderRadius: '4px'
                      }}>
                        ₹{activeBetAmount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </GlassCard>
        )}

      </div>
    </div>
  );
};

export default BettingPanel;
