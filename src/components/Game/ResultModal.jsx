import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Trophy, Frown, X, ArrowRight, Sparkles } from 'lucide-react';

const ResultModal = () => {
  const { roundResultModal, closeResultModal } = useGame();

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!roundResultModal) return;
    const timer = setTimeout(() => {
      closeResultModal();
    }, 6000);
    return () => clearTimeout(timer);
  }, [roundResultModal, closeResultModal]);

  if (!roundResultModal) return null;

  const {
    type,
    period,
    dice1,
    dice2,
    total,
    resultType,
    wonAmount,
    totalBetAmount,
    bets = []
  } = roundResultModal;

  const isWin = type === 'win';

  // Determine badge for outcome
  const getOutcomeBadge = () => {
    if (total === 7) {
      return { text: 'LUCKY 7', bg: 'rgba(234, 179, 8, 0.2)', border: '#eab308', color: '#ffd700' };
    }
    if (total <= 6) {
      return { text: 'DOWN (2-6)', bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', color: '#ff7b7b' };
    }
    return { text: 'UP (8-12)', bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', color: '#6ee7b7' };
  };

  const outcomeBadge = getOutcomeBadge();

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={closeResultModal}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '320px',
          background: '#1a162b',
          borderRadius: '24px',
          overflow: 'hidden',
          border: isWin ? '1px solid rgba(255, 215, 0, 0.35)' : '1px solid rgba(239, 68, 68, 0.25)',
          boxShadow: isWin ? '0 12px 40px rgba(255, 215, 0, 0.25)' : '0 12px 40px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeResultModal}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.3)',
            border: 'none',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <X size={15} />
        </button>

        {/* Top Header Banner */}
        <div style={{
          background: isWin 
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 60%, #b45309 100%)' 
            : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
          padding: '20px 16px 16px',
          textAlign: 'center',
          color: '#fff',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          {isWin ? (
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
              <Trophy size={26} color="#fff" />
            </div>
          ) : (
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px'
            }}>
              <Frown size={26} color="#f87171" />
            </div>
          )}

          <div style={{ fontSize: '1.15rem', fontWeight: '900', letterSpacing: '0.5px' }}>
            {isWin ? '🎉 Congratulations!' : 'Better Luck Next Time!'}
          </div>
          <div style={{ fontSize: '0.68rem', color: isWin ? 'rgba(255,255,255,0.9)' : '#9ca3af' }}>
            {isWin ? 'You won in this round' : 'Fortune favors the persistent!'}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Main Amount Callout */}
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '2px' }}>
              {isWin ? 'TOTAL WINNING' : 'TOTAL LOSS'}
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '900',
              color: isWin ? '#10b981' : '#f87171',
              textShadow: isWin ? '0 0 16px rgba(16, 185, 129, 0.35)' : 'none'
            }}>
              {isWin ? `+₹${wonAmount.toFixed(2)}` : `-₹${totalBetAmount.toFixed(2)}`}
            </div>
          </div>

          {/* Round & Outcome Info Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.75rem'
          }}>
            {/* Period */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Period:</span>
              <span style={{ color: '#fff', fontWeight: '800', fontFamily: 'monospace' }}>
                {period || `Round #${roundResultModal.roundNumber}`}
              </span>
            </div>

            {/* Rolled Result */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Result:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#fff', fontWeight: '800' }}>
                  🎲 {dice1} + 🎲 {dice2} = {total}
                </span>
                <span style={{
                  background: outcomeBadge.bg,
                  border: `1px solid ${outcomeBadge.border}`,
                  color: outcomeBadge.color,
                  fontSize: '0.6rem',
                  fontWeight: '800',
                  padding: '1px 6px',
                  borderRadius: '6px'
                }}>
                  {outcomeBadge.text}
                </span>
              </div>
            </div>

            {/* Bets summary */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', display: 'block', marginBottom: '4px' }}>
                Your Bets:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {bets.map((b, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                    <span style={{ color: '#fff', fontWeight: '700' }}>
                      {b.type === 'exact' ? `Exact ${b.exactValue}` : b.type?.toUpperCase()} (₹{b.amount})
                    </span>
                    <span style={{ color: b.status === 'won' ? '#10b981' : '#f87171', fontWeight: '800' }}>
                      {b.status === 'won' ? `Won ₹${b.payout}` : 'Lost'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={closeResultModal}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '14px',
              border: 'none',
              background: isWin 
                ? 'linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)' 
                : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              color: isWin ? '#000' : '#fff',
              fontWeight: '900',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: isWin 
                ? '0 4px 15px rgba(255, 215, 0, 0.35)' 
                : '0 4px 15px rgba(124, 58, 237, 0.35)',
              transition: 'all 0.2s ease',
              marginTop: '4px'
            }}
          >
            <span>{isWin ? 'Collect & Continue' : 'Play Next Round'}</span>
            <ArrowRight size={15} />
          </button>

        </div>
      </div>
    </div>
  );
};

export default ResultModal;
