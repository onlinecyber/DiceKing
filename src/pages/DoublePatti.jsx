import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Shuffle, 
  RotateCcw, 
  HelpCircle, 
  CheckCircle, 
  History as HistoryIcon, 
  User 
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Common/Navbar';
import GlassCard from '../components/Common/GlassCard';

const DoublePatti = () => {
  const navigate = useNavigate();
  const {
    activeRoundPatti,
    historyPatti,
    countdownPatti,
    settlingPatti,
    revealingPatti,
    revealedCardsPatti,
    recentBetsPatti,
    pattiResultModal,
    closePattiResultModal,
    placePattiBet,
    wallet,
    showToast
  } = useGame();

  const { currentUser } = useAuth();

  // Local betting states
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [betAmount, setBetAmount] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'mybets'
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Smooth local 1-second countdown ticker
  const [localSeconds, setLocalSeconds] = useState(countdownPatti);
  useEffect(() => {
    setLocalSeconds(countdownPatti);
  }, [countdownPatti]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const chips = [10, 20, 50, 100, 500, 1000];

  // Number selection handler (exactly 2 numbers from 0-9)
  const handleToggleNumber = (num) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length >= 2) {
        showToast("You can only choose 2 numbers. Deselect one first.", "info");
        return;
      }
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

  // Quick Random 2 pick
  const handleRandomPick = () => {
    const n1 = Math.floor(Math.random() * 10);
    let n2 = Math.floor(Math.random() * 10);
    while (n2 === n1) {
      n2 = Math.floor(Math.random() * 10);
    }
    setSelectedNumbers([n1, n2]);
  };

  const handleClear = () => {
    setSelectedNumbers([]);
  };

  // Current active round bets placed by user
  const currentRoundBets = recentBetsPatti.filter(b => 
    (b.roundId && activeRoundPatti?.id && b.roundId === activeRoundPatti.id) ||
    (b.roundNumber && activeRoundPatti?.roundNumber && String(b.roundNumber) === String(activeRoundPatti.roundNumber))
  );
  const hasPlacedBet = currentRoundBets.length > 0;

  // Betting submission
  const handlePlaceBet = async () => {
    if (hasPlacedBet) {
      showToast("You have already placed a bet for this round! Wait for next round.", "error");
      return;
    }
    if (selectedNumbers.length !== 2) {
      showToast("Please select exactly 2 numbers (0-9).", "error");
      return;
    }
    if (localSeconds <= 5) {
      showToast("Betting closed for this round! Picks lock at 00:05 seconds.", "error");
      return;
    }
    if (!wallet || wallet.balance < betAmount) {
      showToast("Insufficient balance. Please recharge your wallet.", "error");
      navigate('/deposit');
      return;
    }

    setIsSubmitting(true);
    try {
      await placePattiBet(selectedNumbers, betAmount);
      setSelectedNumbers([]);
    } catch (err) {
      // Toast is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto clear selection when new round starts
  useEffect(() => {
    setSelectedNumbers([]);
  }, [activeRoundPatti?.roundNumber]);

  // Active round display parameters
  const roundNumber = activeRoundPatti ? activeRoundPatti.roundNumber : '---';
  const isBettingLocked = localSeconds <= 5 || settlingPatti || revealingPatti;
  const isBlankPhase = localSeconds <= 5 && !revealingPatti;

  // Get last round result cards or blank state during lock phase
  const latestCompleted = historyPatti.length > 0 ? historyPatti[0] : null;
  const displayedCard1 = revealingPatti ? revealedCardsPatti.card1 : (isBlankPhase ? '?' : (latestCompleted?.card1 ?? '?'));
  const displayedCard2 = revealingPatti ? revealedCardsPatti.card2 : (isBlankPhase ? '?' : (latestCompleted?.card2 ?? '?'));

  return (
    <div className="app-container" style={{ paddingBottom: '90px' }}>
      <Navbar />

      <div className="content-container" style={{ gap: '12px', maxWidth: '460px', margin: '0 auto', width: '100%' }}>
        
        {/* Sleek Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', letterSpacing: '0.5px' }}>
                  DOUBLE PATTI
                </span>
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000'
                }}>
                  1-MIN
                </span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                Round #{roundNumber}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowRulesModal(true)}
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '10px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--accent-gold)',
              fontSize: '0.72rem',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={14} />
            Rules
          </button>
        </div>

        {/* Clean Unified Cards & Live Countdown Stage */}
        <GlassCard style={{
          padding: '16px',
          borderRadius: '20px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(circle at center, rgba(30, 27, 75, 0.75) 0%, rgba(11, 9, 20, 0.98) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)'
        }}>
          
          {/* Status & Timer Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} color={isBettingLocked ? '#ef4444' : '#f59e0b'} />
              <span style={{
                fontSize: '0.72rem',
                fontWeight: '800',
                color: isBettingLocked ? '#ef4444' : '#f59e0b',
                letterSpacing: '0.5px'
              }}>
                {isBlankPhase ? '🔒 CARDS BLANK' : isBettingLocked ? 'BETTING CLOSED' : 'LIVE ROUND'}
              </span>
            </div>

            {/* Countdown Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '60px',
              padding: '4px 10px',
              borderRadius: '10px',
              background: isBettingLocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: isBettingLocked ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)'
            }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '1.2rem',
                fontWeight: '900',
                color: isBettingLocked ? '#ef4444' : '#fbbf24',
                letterSpacing: '1px'
              }}>
                {String(Math.floor(localSeconds / 60)).padStart(2, '0')}:{String(localSeconds % 60).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Cards Stage */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            
            {/* Card 1 (Patti 1) */}
            <div style={{
              width: '92px',
              height: '128px',
              borderRadius: '14px',
              background: isBlankPhase 
                ? 'linear-gradient(145deg, #1f1d2b, #0d0c14)' 
                : 'linear-gradient(145deg, #1e1b4b, #0f172a)',
              border: isBlankPhase 
                ? '2px dashed rgba(239, 68, 68, 0.5)' 
                : '2px solid rgba(245, 158, 11, 0.6)',
              boxShadow: isBlankPhase 
                ? '0 0 16px rgba(239, 68, 68, 0.15)' 
                : '0 6px 20px rgba(245, 158, 11, 0.25), inset 0 0 12px rgba(245, 158, 11, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 6px',
              transform: revealingPatti ? 'rotateY(180deg) scale(1.05)' : 'scale(1)',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}>
              <div style={{ fontSize: '0.6rem', fontWeight: '800', color: isBlankPhase ? '#ef4444' : 'var(--accent-gold)', alignSelf: 'flex-start' }}>
                PATTI 1
              </div>
              <div style={{
                fontSize: '2.6rem',
                fontWeight: '900',
                color: isBlankPhase ? 'rgba(255, 255, 255, 0.2)' : '#fff',
                fontFamily: 'outfit, sans-serif',
                textShadow: isBlankPhase ? 'none' : '0 0 12px rgba(245, 158, 11, 0.8)'
              }}>
                {displayedCard1}
              </div>
              <div style={{ fontSize: '0.58rem', fontWeight: '800', color: isBlankPhase ? '#ef4444' : 'var(--accent-gold)', alignSelf: 'flex-end' }}>
                {isBlankPhase ? 'HIDDEN' : '♠️ 0-9'}
              </div>
            </div>

            {/* Separator */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: '900',
              color: 'var(--accent-gold)'
            }}>
              &
            </div>

            {/* Card 2 (Patti 2) */}
            <div style={{
              width: '92px',
              height: '128px',
              borderRadius: '14px',
              background: isBlankPhase 
                ? 'linear-gradient(145deg, #1f1d2b, #0d0c14)' 
                : 'linear-gradient(145deg, #1e1b4b, #0f172a)',
              border: isBlankPhase 
                ? '2px dashed rgba(239, 68, 68, 0.5)' 
                : '2px solid rgba(217, 70, 239, 0.6)',
              boxShadow: isBlankPhase 
                ? '0 0 16px rgba(239, 68, 68, 0.15)' 
                : '0 6px 20px rgba(217, 70, 239, 0.25), inset 0 0 12px rgba(217, 70, 239, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 6px',
              transform: revealingPatti ? 'rotateY(180deg) scale(1.05)' : 'scale(1)',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}>
              <div style={{ fontSize: '0.6rem', fontWeight: '800', color: isBlankPhase ? '#ef4444' : '#f472b6', alignSelf: 'flex-start' }}>
                PATTI 2
              </div>
              <div style={{
                fontSize: '2.6rem',
                fontWeight: '900',
                color: isBlankPhase ? 'rgba(255, 255, 255, 0.2)' : '#fff',
                fontFamily: 'outfit, sans-serif',
                textShadow: isBlankPhase ? 'none' : '0 0 12px rgba(217, 70, 239, 0.8)'
              }}>
                {displayedCard2}
              </div>
              <div style={{ fontSize: '0.58rem', fontWeight: '800', color: isBlankPhase ? '#ef4444' : '#f472b6', alignSelf: 'flex-end' }}>
                {isBlankPhase ? 'HIDDEN' : '♥️ 0-9'}
              </div>
            </div>
          </div>

          {/* Compact Multiplier Bar */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '0.68rem',
            fontWeight: '800'
          }}>
            <span style={{ color: 'var(--accent-gold)' }}>🎯 Both Match: 9X</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
            <span style={{ color: '#38bdf8' }}>🛡️ 1 Match: 1.5X</span>
          </div>

        </GlassCard>

        {/* Unified Betting Control Board */}
        <GlassCard style={{ padding: '14px', borderRadius: '18px' }}>
          
          {/* Header Row: Selection Display & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                Picked:
              </span>
              {selectedNumbers.length === 0 ? (
                <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontStyle: 'italic' }}>
                  Select 2 digits
                </span>
              ) : (
                selectedNumbers.map((num, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: idx === 0 
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                        : 'linear-gradient(135deg, #d946ef, #a855f7)',
                      color: '#fff',
                      fontWeight: '900',
                      fontSize: '0.72rem',
                      padding: '2px 7px',
                      borderRadius: '6px'
                    }}
                  >
                    {idx === 0 ? `P1: ${num}` : `P2: ${num}`}
                  </span>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleRandomPick}
                disabled={isBettingLocked || hasPlacedBet}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  fontSize: '0.62rem',
                  fontWeight: '700',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: (isBettingLocked || hasPlacedBet) ? 'not-allowed' : 'pointer'
                }}
              >
                <Shuffle size={12} color="var(--accent-gold)" />
                Random
              </button>
              {selectedNumbers.length > 0 && (
                <button
                  onClick={handleClear}
                  disabled={isBettingLocked || hasPlacedBet}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '0.62rem',
                    fontWeight: '700',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: (isBettingLocked || hasPlacedBet) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RotateCcw size={12} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* 0 to 9 Grid (5x2) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '12px' }}>
            {Array.from({ length: 10 }, (_, i) => i).map((num) => {
              const isSelected = selectedNumbers.includes(num);
              const orderIdx = selectedNumbers.indexOf(num);
              return (
                <button
                  key={num}
                  onClick={() => handleToggleNumber(num)}
                  disabled={isBettingLocked || hasPlacedBet}
                  style={{
                    height: '44px',
                    borderRadius: '12px',
                    border: isSelected
                      ? orderIdx === 0 ? '2px solid var(--accent-gold)' : '2px solid #d946ef'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isSelected
                      ? orderIdx === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #d946ef, #a855f7)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    fontSize: '1.2rem',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected ? (orderIdx === 0 ? '0 0 12px rgba(245, 158, 11, 0.4)' : '0 0 12px rgba(217, 70, 239, 0.4)') : 'none',
                    cursor: (isBettingLocked || hasPlacedBet) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  {num}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      fontSize: '0.52rem',
                      fontWeight: '900',
                      background: 'rgba(0, 0, 0, 0.6)',
                      color: '#fff',
                      padding: '1px 3px',
                      borderRadius: '4px'
                    }}>
                      P{orderIdx + 1}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Chips Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '5px', marginBottom: '12px' }}>
            {chips.map((amt) => {
              const isSelected = betAmount === amt;
              return (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  disabled={isBettingLocked || hasPlacedBet}
                  style={{
                    padding: '6px 2px',
                    borderRadius: '8px',
                    border: isSelected
                      ? '1px solid var(--accent-gold)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? '800' : '600',
                    fontSize: '0.72rem',
                    cursor: (isBettingLocked || hasPlacedBet) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ₹{amt}
                </button>
              );
            })}
          </div>

          {/* Main Action Button */}
          <button
            onClick={handlePlaceBet}
            disabled={selectedNumbers.length !== 2 || isBettingLocked || isSubmitting || hasPlacedBet}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: (selectedNumbers.length === 2 && !isBettingLocked && !hasPlacedBet)
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: (selectedNumbers.length === 2 && !isBettingLocked && !hasPlacedBet) ? '#000' : 'rgba(255, 255, 255, 0.3)',
              fontSize: '0.9rem',
              fontWeight: '900',
              cursor: (selectedNumbers.length === 2 && !isBettingLocked && !isSubmitting && !hasPlacedBet) ? 'pointer' : 'not-allowed',
              boxShadow: (selectedNumbers.length === 2 && !isBettingLocked && !hasPlacedBet) ? '0 4px 16px rgba(245, 158, 11, 0.35)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            {isSubmitting ? (
              <span>Placing Bet...</span>
            ) : hasPlacedBet ? (
              <span>BET PLACED (NEXT ROUND IN {localSeconds}S)</span>
            ) : isBettingLocked ? (
              <span>BETTING CLOSED (REVEALING...)</span>
            ) : selectedNumbers.length !== 2 ? (
              <span>PICK 2 NUMBERS TO BET</span>
            ) : (
              <span>PLACE BET (₹{betAmount})</span>
            )}
          </button>
        </GlassCard>

        {/* Tab Navigation: Recent Draws / My Bets */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '3px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {[
            { id: 'history', label: 'Recent Draws', icon: HistoryIcon },
            { id: 'mybets', label: 'My Bets', icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: '10px',
                  background: isActive ? 'linear-gradient(135deg, var(--accent-gold), #d97706)' : 'transparent',
                  border: 'none',
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  fontWeight: isActive ? '800' : '600',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content 1: History */}
        {activeTab === 'history' && (
          <GlassCard style={{ padding: '14px', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>
              Patti Round History
            </div>

            {historyPatti.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px' }}>
                No completed rounds yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {historyPatti.slice(0, 15).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fff' }}>
                        Round #{r.roundNumber}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#000',
                        fontWeight: '900',
                        fontSize: '0.75rem',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {r.card1 ?? '?'}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>&</span>
                      <span style={{
                        background: 'linear-gradient(135deg, #d946ef, #a855f7)',
                        color: '#fff',
                        fontWeight: '900',
                        fontSize: '0.75rem',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {r.card2 ?? '?'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {/* Tab Content 2: My Bets */}
        {activeTab === 'mybets' && (
          <GlassCard style={{ padding: '14px', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>
              My Recent Patti Bets
            </div>

            {recentBetsPatti.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px' }}>
                You haven't placed any Patti bets yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recentBetsPatti.map((b) => {
                  const isWon = b.status === 'won';
                  const isPending = b.status === 'pending';
                  return (
                    <div
                      key={b.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: isWon ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: isWon ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fff' }}>
                            Round #{b.roundNumber}
                          </span>
                          <span style={{
                            fontSize: '0.6rem',
                            fontWeight: '800',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: isWon ? 'rgba(34, 197, 94, 0.2)' : isPending ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: isWon ? '#4ade80' : isPending ? '#fbbf24' : '#f87171'
                          }}>
                            {isWon ? (b.matchCount === 2 ? 'JACKPOT WON' : 'WON') : isPending ? 'PENDING' : 'LOST'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Picks: [{b.numbers ? b.numbers.join(', ') : '---'}] • Bet: ₹{b.amount}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: '900',
                          color: isWon ? '#4ade80' : isPending ? '#fbbf24' : '#ef4444'
                        }}>
                          {isWon ? `+₹${b.payout}` : isPending ? `₹${b.amount}` : `-₹${b.amount}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}

      </div>

      {/* Result Modal Celebration */}
      {pattiResultModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <GlassCard style={{
            maxWidth: '360px',
            width: '100%',
            padding: '24px 20px',
            borderRadius: '24px',
            textAlign: 'center',
            border: pattiResultModal.type === 'win' ? '2px solid var(--accent-gold)' : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: pattiResultModal.type === 'win' ? '0 0 40px rgba(245, 158, 11, 0.4)' : 'none'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
              {pattiResultModal.type === 'win' ? '🎉' : '🎲'}
            </div>

            <div style={{
              fontSize: '1.25rem',
              fontWeight: '900',
              color: pattiResultModal.type === 'win' ? 'var(--accent-gold)' : '#fff',
              marginBottom: '6px'
            }}>
              {pattiResultModal.type === 'win' ? 'YOU WON!' : 'ROUND RESULT'}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Round #{pattiResultModal.roundNumber} Result Cards
            </div>

            {/* Revealed Cards */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{
                width: '60px',
                height: '80px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000',
                fontSize: '2rem',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {pattiResultModal.card1}
              </div>
              <div style={{
                width: '60px',
                height: '80px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #d946ef, #a855f7)',
                color: '#fff',
                fontSize: '2rem',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {pattiResultModal.card2}
              </div>
            </div>

            {pattiResultModal.type === 'win' ? (
              <div style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '14px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: '700' }}>
                  TOTAL WINNINGS
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4ade80' }}>
                  ₹{pattiResultModal.wonAmount?.toFixed(2)}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Better luck in the next round! Try a different combination.
              </div>
            )}

            <button
              onClick={closePattiResultModal}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent-gold), #d97706)',
                border: 'none',
                color: '#000',
                fontWeight: '800',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Continue Playing
            </button>
          </GlassCard>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <GlassCard style={{
            maxWidth: '400px',
            width: '100%',
            padding: '20px',
            borderRadius: '20px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '1rem', fontWeight: '900', color: '#fff' }}>
                Double Patti Rules
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '8px' }}>
                1. <strong>Select 2 numbers in exact order:</strong> 1st pick is for Patti 1 (Card 1), 2nd pick is for Patti 2 (Card 2).
              </p>
              <p style={{ marginBottom: '8px' }}>
                2. Every 60 seconds, <strong>2 winning cards (Patti 1 & Patti 2)</strong> are drawn automatically.
              </p>
              <p style={{ marginBottom: '8px' }}>
                3. <strong>Jackpot (Exact Order Both Match - 9X):</strong> Patti 1 matches your 1st pick AND Patti 2 matches your 2nd pick!
              </p>
              <p style={{ marginBottom: '8px' }}>
                4. <strong>Single Match (1 Position Match - 1.5X):</strong> Either Patti 1 matches your 1st pick OR Patti 2 matches your 2nd pick.
              </p>
              <p style={{ marginBottom: '8px' }}>
                5. <em>Note:</em> Reverse order does NOT match (e.g. Bet 5,7 vs Result 7,5 is 0 match).
              </p>
              <p style={{ marginBottom: '12px' }}>
                6. A 5% platform fee / GST is deducted from winning amounts.
              </p>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--accent-gold), #d97706)',
                border: 'none',
                color: '#000',
                fontWeight: '800',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Got It!
            </button>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default DoublePatti;
