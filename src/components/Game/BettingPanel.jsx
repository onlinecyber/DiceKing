import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import GlassCard from '../Common/GlassCard';

const BettingPanel = () => {
  const { activeRound, countdown, placeBet, recentBets, wallet } = useGame();
  
  // Local state
  const [modalState, setModalState] = useState({ isOpen: false, type: null, exactValue: null });
  const [baseAmount, setBaseAmount] = useState(10);
  const [quantity, setQuantity] = useState(1);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

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

  const handleBetClick = (type, exactValue = null) => {
    if (isLocked) return;
    setModalState({ isOpen: true, type, exactValue });
    setQuantity(1);
  };

  const handleConfirmBet = async () => {
    if (isLocked || loading) return;
    if (!agreed) {
      alert("Please agree to the rules");
      return;
    }
    const total = baseAmount * quantity;
    if (!wallet || wallet.balance < total) {
      alert("Insufficient balance!");
      return;
    }
    setLoading(true);
    try {
      await placeBet(modalState.type, modalState.exactValue, total);
      setModalState({ isOpen: false, type: null, exactValue: null });
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
      
      {/* 2. Main Betting Options Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Exact Sum Multipliers (Organized into 2 clean rows of Tiranga-style 3D Number Balls) */}
        <div style={{ background: 'rgba(23, 27, 54, 0.7)', borderRadius: '20px', padding: '16px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center', letterSpacing: '1px' }}>
            SELECT EXACT SUM (NUMBER BALLS)
          </div>

          {/* Row 1: Numbers 2 to 7 (6 Balls) */}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '12px' }}>
            {[2, 3, 4, 5, 6, 7].map(num => {
              const bgGradient = num <= 6
                ? 'radial-gradient(circle at 35% 35%, #ff7b7b, #ef4444 60%, #991b1b)'
                : 'radial-gradient(circle at 35% 35%, #ffe875, #eab308 60%, #854d0e)';
              const shadowColor = num <= 6 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(234, 179, 8, 0.4)';

              return (
                <button
                  key={num}
                  disabled={isLocked || loading}
                  onClick={() => handleBetClick('exact', num)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: bgGradient,
                    boxShadow: `0 4px 12px ${shadowColor}, inset -2px -2px 4px rgba(0,0,0,0.4), inset 2px 2px 4px rgba(255,255,255,0.6)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '900',
                    fontSize: '1.2rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.6)'
                  }}>
                    {num}
                  </div>
                  <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#ffd700' }}>
                    {exactMultipliers[num]}x
                  </span>

                  {/* Active Bet Badge */}
                  {getBetAmountOnType('exact', num) > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px', right: '-4px',
                      background: 'var(--accent-gold)', color: '#000',
                      fontSize: '0.55rem', fontWeight: '900',
                      padding: '1px 5px', borderRadius: '8px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                    }}>
                      ₹{getBetAmountOnType('exact', num)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Row 2: Numbers 8 to 12 (5 Balls) */}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            {[8, 9, 10, 11, 12].map(num => {
              const bgGradient = 'radial-gradient(circle at 35% 35%, #6ee7b7, #10b981 60%, #065f46)';
              const shadowColor = 'rgba(16, 185, 129, 0.4)';

              return (
                <button
                  key={num}
                  disabled={isLocked || loading}
                  onClick={() => handleBetClick('exact', num)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: bgGradient,
                    boxShadow: `0 4px 12px ${shadowColor}, inset -2px -2px 4px rgba(0,0,0,0.4), inset 2px 2px 4px rgba(255,255,255,0.6)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '900',
                    fontSize: '1.2rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.6)'
                  }}>
                    {num}
                  </div>
                  <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#ffd700' }}>
                    {exactMultipliers[num]}x
                  </span>

                  {/* Active Bet Badge */}
                  {getBetAmountOnType('exact', num) > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px', right: '-4px',
                      background: 'var(--accent-gold)', color: '#000',
                      fontSize: '0.55rem', fontWeight: '900',
                      padding: '1px 5px', borderRadius: '8px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                    }}>
                      ₹{getBetAmountOnType('exact', num)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* UP and DOWN Large Side-by-Side Pill Buttons (Matching Big/Small in Tiranga) */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* UP BUTTON (Gold/Orange Pill) */}
          <button
            disabled={isLocked || loading}
            onClick={() => handleBetClick('up')}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              borderRadius: '24px',
              padding: '14px 10px',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              color: '#fff',
              boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
              transition: 'all 0.2s ease',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontSize: '1.3rem', fontWeight: '900', letterSpacing: '1px' }}>UP</div>
            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>SUM 8-12 (2x Payout)</div>

            {getBetAmountOnType('up') > 0 && (
              <div style={{
                position: 'absolute', top: '6px', right: '10px',
                background: '#000', color: '#ffd700',
                fontSize: '0.6rem', fontWeight: '900',
                padding: '2px 6px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', gap: '2px'
              }}>
                <Coins size={10} /> ₹{getBetAmountOnType('up')}
              </div>
            )}
          </button>

          {/* DOWN BUTTON (Blue Pill) */}
          <button
            disabled={isLocked || loading}
            onClick={() => handleBetClick('down')}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '24px',
              padding: '14px 10px',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              color: '#fff',
              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.2s ease',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontSize: '1.3rem', fontWeight: '900', letterSpacing: '1px' }}>DOWN</div>
            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>SUM 2-6 (2x Payout)</div>

            {getBetAmountOnType('down') > 0 && (
              <div style={{
                position: 'absolute', top: '6px', right: '10px',
                background: '#000', color: '#ffd700',
                fontSize: '0.6rem', fontWeight: '900',
                padding: '2px 6px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', gap: '2px'
              }}>
                <Coins size={10} /> ₹{getBetAmountOnType('down')}
              </div>
            )}
          </button>
        </div>

      </div>

      {/* Bet Modal */}
      {modalState.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }} onClick={() => setModalState({ isOpen: false, type: null, exactValue: null })}>
          <div style={{
            background: '#1f1b35', width: '100%', maxWidth: '450px',
            borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{
              background: modalState.type === 'up' ? '#10b981' : 
                          modalState.type === 'down' ? '#ef4444' : 
                          modalState.type === 'odd' ? '#8b5cf6' :
                          modalState.type === 'even' ? '#3b82f6' : '#4f46e5',
              padding: '12px', borderRadius: '12px', textAlign: 'center',
              color: '#fff', fontWeight: '800', fontSize: '1.2rem', textTransform: 'capitalize',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
              Select {modalState.type === 'exact' ? `Exact ${modalState.exactValue} (${exactMultipliers[modalState.exactValue]}x Payout)` : modalState.type}
            </div>

            {/* Base Amount Selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '600' }}>Balance</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[10, 100, 500, 1000].map(amt => (
                  <button key={amt} onClick={() => setBaseAmount(amt)}
                    style={{
                      background: baseAmount === amt ? '#4f46e5' : '#2b2640',
                      color: baseAmount === amt ? '#fff' : '#a7a3b9',
                      border: 'none', padding: '8px 14px', borderRadius: '6px',
                      fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                    }}>
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '600' }}>Quantity</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ background: '#4f46e5', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '6px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ background: '#2b2640', border: 'none', color: '#fff', width: '60px', height: '32px', textAlign: 'center', borderRadius: '6px', fontWeight: '800', fontSize: '1rem' }} />
                <button onClick={() => setQuantity(quantity + 1)}
                  style={{ background: '#4f46e5', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '6px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>

            {/* Multipliers */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              {[1, 5, 10, 20, 50, 100].map(x => (
                <button key={x} onClick={() => setQuantity(x)}
                  style={{
                    background: quantity === x ? '#4f46e5' : '#2b2640',
                    color: quantity === x ? '#fff' : '#a7a3b9',
                    border: 'none', padding: '6px 10px', borderRadius: '4px',
                    fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer'
                  }}>
                  X{x}
                </button>
              ))}
            </div>

            {/* Terms */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              <div 
                onClick={() => setAgreed(!agreed)}
                style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: agreed ? '#4f46e5' : 'transparent',
                  border: agreed ? 'none' : '2px solid #6b7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {agreed && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
              </div>
              <span style={{ fontSize: '0.85rem', color: '#fff' }}>
                I agree <span style={{ color: '#ef4444', cursor: 'pointer' }}>《Pre-sale rules》</span>
              </span>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '0', marginTop: '15px', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setModalState({ isOpen: false, type: null, exactValue: null })}
                style={{ flex: 1, padding: '14px', background: '#2b2640', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' }}>
                Cancel
              </button>
              <button onClick={handleConfirmBet} disabled={loading || !agreed}
                style={{ flex: 2, padding: '14px', background: '#4f46e5', border: 'none', color: '#fff', fontWeight: '800', opacity: (!agreed || loading) ? 0.5 : 1, cursor: (!agreed || loading) ? 'not-allowed' : 'pointer', fontSize: '0.95rem' }}>
                Total amount ₹{(baseAmount * quantity).toFixed(2)}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default BettingPanel;
