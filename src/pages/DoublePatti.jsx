import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Sparkles, Trophy, Shuffle, RotateCcw, AlertCircle, HelpCircle, CheckCircle, Flame, Coins, ShieldCheck, History as HistoryIcon, User } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';
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
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'mybets' | 'rules'
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

  // Betting submission
  const handlePlaceBet = async () => {
    if (selectedNumbers.length !== 2) {
      showToast("Please select exactly 2 numbers (0-9).", "error");
      return;
    }
    if (localSeconds <= 2) {
      showToast("Betting closed for this round! Wait for next round.", "error");
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
      // Keep selected or let player choose again
    } catch (err) {
      // Toast is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payout calculations
  const jackpotPayout = Math.round(betAmount * 9.0 * 0.95 * 100) / 100;
  const singleMatchPayout = Math.round(betAmount * 1.5 * 0.95 * 100) / 100;

  // Active round display
  const roundNumber = activeRoundPatti ? activeRoundPatti.roundNumber : '---';
  const isBettingLocked = localSeconds <= 2 || settlingPatti || revealingPatti;

  // Get last round result cards
  const latestCompleted = historyPatti.length > 0 ? historyPatti[0] : null;
  const displayedCard1 = revealingPatti ? revealedCardsPatti.card1 : (latestCompleted?.card1 ?? '?');
  const displayedCard2 = revealingPatti ? revealedCardsPatti.card2 : (latestCompleted?.card2 ?? '?');

  return (
    <div className="app-container" style={{ paddingBottom: '90px' }}>
      <Navbar />

      <div className="content-container" style={{ gap: '14px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                width: '38px',
                height: '38px',
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
                <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#fff', letterSpacing: '0.5px' }}>
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
                  1-MIN FAST
                </span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                Round #{roundNumber} • Match 2 for 9X Win
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowRulesModal(true)}
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '10px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--accent-gold)',
              fontSize: '0.7rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={14} />
            Rules
          </button>
        </div>

        {/* Live Timer & Round Status Bar */}
        <GlassCard style={{
          padding: '12px 16px',
          borderRadius: '16px',
          background: isBettingLocked
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(11, 9, 20, 0.95))'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(11, 9, 20, 0.95))',
          border: isBettingLocked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: isBettingLocked ? '0 0 20px rgba(239, 68, 68, 0.2)' : '0 0 20px rgba(245, 158, 11, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color={isBettingLocked ? '#ef4444' : '#f59e0b'} />
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isBettingLocked ? '#ef4444' : '#f59e0b' }}>
                  {isBettingLocked ? 'BETTING CLOSED' : 'LIVE ROUND IN PROGRESS'}
                </span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {isBettingLocked ? 'Cards are revealing shortly...' : 'Picks lock at 00:02 seconds'}
              </div>
            </div>

            {/* Countdown Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '60px',
              height: '42px',
              padding: '0 12px',
              borderRadius: '12px',
              background: isBettingLocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: isBettingLocked ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)'
            }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '1.3rem',
                fontWeight: '900',
                color: isBettingLocked ? '#ef4444' : '#fbbf24',
                letterSpacing: '1px'
              }}>
                {String(Math.floor(localSeconds / 60)).padStart(2, '0')}:{String(localSeconds % 60).padStart(2, '0')}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* 2-Card Reveal Stage */}
        <GlassCard style={{
          padding: '20px 16px',
          borderRadius: '20px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(circle at center, rgba(30, 27, 75, 0.7) 0%, rgba(11, 9, 20, 0.95) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)'
        }}>
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            fontWeight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '14px'
          }}>
            {revealingPatti ? '✨ REVEALING WINNING PATTI CARDS ✨' : (latestCompleted ? `LAST ROUND #${latestCompleted.roundNumber} RESULT` : 'WINNING CARDS')}
          </div>

          {/* Cards Stage Container */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '14px' }}>
            
            {/* Card 1 */}
            <div style={{
              width: '100px',
              height: '140px',
              borderRadius: '16px',
              background: 'linear-gradient(145deg, #1e1b4b, #0f172a)',
              border: '2px solid rgba(245, 158, 11, 0.6)',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25), inset 0 0 16px rgba(245, 158, 11, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 8px',
              transform: revealingPatti ? 'rotateY(180deg) scale(1.05)' : 'scale(1)',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--accent-gold)', alignSelf: 'flex-start' }}>
                PATTI 1
              </div>
              <div style={{
                fontSize: '2.8rem',
                fontWeight: '900',
                color: '#fff',
                fontFamily: 'outfit, sans-serif',
                textShadow: '0 0 12px rgba(245, 158, 11, 0.8)'
              }}>
                {displayedCard1}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--accent-gold)', alignSelf: 'flex-end' }}>
                ♠️ 0-9
              </div>
            </div>

            {/* PLUS / VS Badge */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '900',
              color: 'var(--accent-gold)'
            }}>
              &
            </div>

            {/* Card 2 */}
            <div style={{
              width: '100px',
              height: '140px',
              borderRadius: '16px',
              background: 'linear-gradient(145deg, #1e1b4b, #0f172a)',
              border: '2px solid rgba(217, 70, 239, 0.6)',
              boxShadow: '0 8px 24px rgba(217, 70, 239, 0.25), inset 0 0 16px rgba(217, 70, 239, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 8px',
              transform: revealingPatti ? 'rotateY(180deg) scale(1.05)' : 'scale(1)',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#f472b6', alignSelf: 'flex-start' }}>
                PATTI 2
              </div>
              <div style={{
                fontSize: '2.8rem',
                fontWeight: '900',
                color: '#fff',
                fontFamily: 'outfit, sans-serif',
                textShadow: '0 0 12px rgba(217, 70, 239, 0.8)'
              }}>
                {displayedCard2}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#f472b6', alignSelf: 'flex-end' }}>
                ♥️ 0-9
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Drawn cards: exactly 2 distinct numbers every 60s
          </div>
        </GlassCard>

        {/* 10-Number Selection Board */}
        <GlassCard style={{ padding: '16px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>
                Pick 2 Lucky Numbers
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                Select exactly 2 numbers from 0 to 9
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleRandomPick}
                disabled={isBettingLocked}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: isBettingLocked ? 'not-allowed' : 'pointer'
                }}
              >
                <Shuffle size={12} color="var(--accent-gold)" />
                Random
              </button>
              {selectedNumbers.length > 0 && (
                <button
                  onClick={handleClear}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={12} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* 0 to 9 Grid (5x2) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '14px' }}>
            {Array.from({ length: 10 }, (_, i) => i).map((num) => {
              const isSelected = selectedNumbers.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => handleToggleNumber(num)}
                  disabled={isBettingLocked}
                  style={{
                    aspectRatio: '1/1',
                    borderRadius: '14px',
                    border: isSelected
                      ? '2px solid var(--accent-gold)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isSelected
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#000' : '#fff',
                    fontSize: '1.25rem',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected ? '0 0 16px rgba(245, 158, 11, 0.4)' : 'none',
                    cursor: isBettingLocked ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  {num}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#000'
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Numbers Status Banner */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Your Selected Numbers:
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {selectedNumbers.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
                  None picked
                </span>
              ) : (
                selectedNumbers.map((num, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#000',
                      fontWeight: '900',
                      fontSize: '0.85rem',
                      padding: '2px 10px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    #{num}
                  </span>
                ))
              )}
            </div>
          </div>
        </GlassCard>

        {/* Bet Amount Selector */}
        <GlassCard style={{ padding: '16px', borderRadius: '20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>
            Select Bet Amount
          </div>

          {/* Quick Chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '14px' }}>
            {chips.map((amt) => {
              const isSelected = betAmount === amt;
              return (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  disabled={isBettingLocked}
                  style={{
                    padding: '8px 2px',
                    borderRadius: '10px',
                    border: isSelected
                      ? '1px solid var(--accent-gold)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? '800' : '600',
                    fontSize: '0.75rem',
                    cursor: isBettingLocked ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ₹{amt}
                </button>
              );
            })}
          </div>

          {/* Multipliers & Payout Potential Info Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.5), rgba(15, 23, 42, 0.5))',
            borderRadius: '12px',
            padding: '12px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '16px'
          }}>
            <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.08)', paddingRight: '8px' }}>
              <div style={{ fontSize: '0.65rem', color: '#a78bfa', fontWeight: '700' }}>
                🎯 BOTH MATCH (9X)
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--accent-gold)', marginTop: '2px' }}>
                ₹{jackpotPayout.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)' }}>
                Net after 5% GST/fee
              </div>
            </div>

            <div style={{ paddingLeft: '4px' }}>
              <div style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: '700' }}>
                🛡️ 1 MATCH (1.5X)
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#38bdf8', marginTop: '2px' }}>
                ₹{singleMatchPayout.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)' }}>
                Safety return payout
              </div>
            </div>
          </div>

          {/* Place Bet Button */}
          <button
            onClick={handlePlaceBet}
            disabled={selectedNumbers.length !== 2 || isBettingLocked || isSubmitting}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '14px',
              background: (selectedNumbers.length === 2 && !isBettingLocked)
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: (selectedNumbers.length === 2 && !isBettingLocked) ? '#000' : 'rgba(255, 255, 255, 0.3)',
              fontSize: '0.95rem',
              fontWeight: '900',
              cursor: (selectedNumbers.length === 2 && !isBettingLocked && !isSubmitting) ? 'pointer' : 'not-allowed',
              boxShadow: (selectedNumbers.length === 2 && !isBettingLocked) ? '0 4px 20px rgba(245, 158, 11, 0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {isSubmitting ? (
              <span>Placing Bet...</span>
            ) : isBettingLocked ? (
              <span>Betting Closed (Drawing Cards)</span>
            ) : selectedNumbers.length !== 2 ? (
              <span>Pick 2 Numbers to Place Bet</span>
            ) : (
              <span>PLACE ₹{betAmount} BET ON [{selectedNumbers.join(', ')}]</span>
            )}
          </button>
        </GlassCard>

        {/* Tab Navigation: History / My Bets / Rules */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '14px',
          padding: '4px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {[
            { id: 'history', label: 'Recent Draws', icon: HistoryIcon },
            { id: 'mybets', label: 'My Bets', icon: User },
            { id: 'rules', label: 'Rules & Payouts', icon: HelpCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isTabActive ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: isTabActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  fontWeight: isTabActive ? '800' : '600',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
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
          <GlassCard style={{ padding: '14px', borderRadius: '18px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>
              Previous 1-Min Results
            </div>
            {historyPatti.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                No completed rounds yet. The first round is underway!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {historyPatti.slice(0, 15).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fff' }}>
                        Round #{r.roundNumber}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                        {r.createdAt ? new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        Cards:
                      </span>
                      <span style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#000',
                        fontWeight: '900',
                        fontSize: '0.8rem',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        {r.card1}
                      </span>
                      <span style={{
                        background: 'linear-gradient(135deg, #d946ef, #a855f7)',
                        color: '#fff',
                        fontWeight: '900',
                        fontSize: '0.8rem',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        {r.card2}
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
          <GlassCard style={{ padding: '14px', borderRadius: '18px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>
              Your Double Patti Bets
            </div>
            {recentBetsPatti.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                You haven't placed any Patti bets yet. Pick 2 numbers above to play!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentBetsPatti.map((b) => {
                  const isWon = b.status === 'won';
                  const isPending = b.status === 'pending';
                  return (
                    <div
                      key={b.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
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

        {/* Tab Content 3: Rules & Paytable */}
        {activeTab === 'rules' && (
          <GlassCard style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
              Double Patti Game Rules
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>1. 1-Minute Live Fast Rounds:</strong> Every 60 seconds, a new round starts. You can place bets up until 2 seconds before the timer ends.
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>2. Pick 2 Numbers:</strong> Choose any 2 distinct numbers from 0 to 9 (e.g., 3 and 7).
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>3. Drawing:</strong> At 00:00, the system draws 2 unique winning Patti cards between 0 and 9.
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>4. Jackpot (Both Match):</strong> If both of your chosen numbers match the drawn cards, you win the <strong>9.0X Jackpot</strong>! (e.g. ₹100 bet pays ₹855 net).
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>5. Safety Return (1 Match):</strong> If exactly 1 of your chosen numbers matches either drawn card, you win a <strong>1.5X Safety Return</strong>! (e.g. ₹100 bet pays ₹142.50 net).
              </p>
              <p>
                <strong>6. Shared Wallet:</strong> Use your single balance for Double Patti, Dice 30s, and Dice 1 Min.
              </p>
            </div>
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
                1. <strong>Select 2 numbers</strong> between 0 and 9 (e.g. 2 & 8).
              </p>
              <p style={{ marginBottom: '8px' }}>
                2. Every 60 seconds, <strong>2 winning cards</strong> are drawn automatically.
              </p>
              <p style={{ marginBottom: '8px' }}>
                3. <strong>Jackpot (Both Match):</strong> If both numbers appear in the drawn cards, you win <strong>9X Payout</strong>!
              </p>
              <p style={{ marginBottom: '8px' }}>
                4. <strong>Safety Return (1 Match):</strong> If 1 number matches either card, you get a <strong>1.5X Payout</strong>!
              </p>
              <p style={{ marginBottom: '12px' }}>
                5. A 5% platform fee / GST is deducted from winning amounts.
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
              Got It
            </button>
          </GlassCard>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default DoublePatti;
