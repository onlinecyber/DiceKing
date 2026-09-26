import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2, Trophy, HeadphonesIcon,
  Copy, Check, Gift, Sparkles, Clock, Flame, Layers, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';
import GlassCard from '../components/Common/GlassCard';
import FirstDepositModal from '../components/Common/FirstDepositModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { wallet, activeRound, countdown, activeRound1m, countdown1m, activeRoundPatti, countdownPatti, appSettings } = useGame();
  const [copied, setCopied] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const hasDeposited = (wallet?.totalDeposits && wallet.totalDeposits > 0) || profile?.firstDepositClaimed === true;

  useEffect(() => {
    // If user has already made a deposit, do NOT show the popup offer
    if (hasDeposited) {
      setShowBonusModal(false);
      return;
    }

    // Check if user has opted out of reminders today
    const hideDate = localStorage.getItem('hideFirstDepositModalDate');
    const today = new Date().toDateString();
    
    if (hideDate !== today && appSettings?.firstDepositBonusEnabled !== false) {
      // Auto open modal on dashboard load if user hasn't deposited yet
      setShowBonusModal(true);
    }
  }, [appSettings, wallet, profile, hasDeposited]);

  const handleCopyReferral = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quickActions = [
    {
      id: 'domain_store',
      icon: Globe,
      label: 'Domain Pricing',
      sublabel: '.IN at ₹865/yr • Instant Setup',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      glow: 'rgba(16, 185, 129, 0.35)',
      path: '/domain',
      badge: '🌐 DOMAINS'
    },
    {
      id: 'play_30s',
      icon: Gamepad2,
      label: 'Dice 30s',
      sublabel: activeRound ? `Round #${activeRound.roundNumber} • ${countdown}s left` : '30s Fast Rounds',
      gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      glow: 'rgba(124, 58, 237, 0.3)',
      path: '/game?mode=30s',
      badge: '⚡ 30 SEC'
    },
    {
      id: 'play_1m',
      icon: Clock,
      label: 'Dice 1 Min',
      sublabel: activeRound1m ? `Round #${activeRound1m.roundNumber} • ${countdown1m}s left` : '1-Min Strategy',
      gradient: 'linear-gradient(135deg, #0284c7, #06b6d4)',
      glow: 'rgba(6, 182, 212, 0.35)',
      path: '/game?mode=1m',
      badge: '⏱️ 1 MIN'
    },
    {
      id: 'support',
      icon: HeadphonesIcon,
      label: 'Support',
      sublabel: '24/7 help available',
      gradient: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)',
      glow: 'rgba(29, 78, 216, 0.3)',
      path: '/support',
      badge: null
    }
  ];

  return (
    <div className="app-container">
      <Navbar />

      <div className="content-container" style={{ gap: '16px' }}>

        {/* Quick Actions Section */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px' }}>
            QUICK ACTIONS & LIVE GAMES
          </div>

          {/* Featured Double Patti Action Card */}
          <div
            onClick={() => navigate('/patti')}
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(139, 92, 246, 0.22) 50%, rgba(11, 9, 20, 0.98) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '18px',
              padding: '16px 18px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.7)';
              e.currentTarget.style.boxShadow = '0 10px 32px rgba(245, 158, 11, 0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.45)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(245, 158, 11, 0.2)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
                flexShrink: 0
              }}>
                <Flame size={24} color="#000" />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#000',
                    padding: '2px 7px',
                    borderRadius: '5px'
                  }}>
                    DOUBLE PATTI
                  </span>
                  <span style={{ fontSize: '0.62rem', color: '#fbbf24', fontWeight: '800' }}>
                    🔥 9X JACKPOT
                  </span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#fff' }}>
                  1-Min Live Fast Round
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {activeRoundPatti ? `Round #${activeRoundPatti.roundNumber} • Match 2 cards to win` : 'Pick 2 numbers (0-9) • Every 60s'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
              <div style={{
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '8px',
                padding: '3px 8px',
                fontSize: '0.8rem',
                fontWeight: '900',
                color: '#fbbf24',
                fontFamily: 'monospace'
              }}>
                ⏱️ {countdownPatti ?? 60}s
              </div>
              <div style={{
                background: 'linear-gradient(135deg, var(--accent-gold), #d97706)',
                color: '#000',
                fontWeight: '900',
                fontSize: '0.68rem',
                padding: '4px 10px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)'
              }}>
                PLAY →
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  style={{
                    background: 'var(--card-bg)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '16px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'rgba(255,215,0,0.2)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${action.glow}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--card-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: action.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '10px',
                    boxShadow: `0 4px 12px ${action.glow}`
                  }}>
                    <Icon size={20} color="#fff" />
                  </div>

                  {/* Badge */}
                  {action.badge && (
                    <span style={{
                      position: 'absolute', top: '10px', right: '10px',
                      fontSize: '0.5rem', fontWeight: '800', letterSpacing: '0.5px',
                      background: 'rgba(255,215,0,0.15)', color: 'var(--accent-gold)',
                      border: '1px solid rgba(255,215,0,0.3)',
                      padding: '2px 6px', borderRadius: '6px'
                    }}>
                      {action.badge}
                    </span>
                  )}

                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>
                    {action.label}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                    {action.sublabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referral Card */}
        {profile?.referralCode && (
          <GlassCard style={{
            padding: '16px 18px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Gift size={16} color="var(--success-emerald)" />
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--success-emerald)', letterSpacing: '0.5px' }}>
                REFER & EARN ₹50
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
              Share your code — earn ₹50 when your friend makes their first deposit!
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px 12px'
            }}>
              <span style={{ flex: 1, fontWeight: '800', fontSize: '1rem', letterSpacing: '2px', color: '#fff', fontFamily: 'monospace' }}>
                {profile.referralCode}
              </span>
              <button
                onClick={handleCopyReferral}
                style={{
                  background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,215,0,0.1)',
                  border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,215,0,0.3)'}`,
                  borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  color: copied ? 'var(--success-emerald)' : 'var(--accent-gold)',
                  fontSize: '0.7rem', fontWeight: '700',
                  transition: 'all 0.2s ease'
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {profile.referralEarnings > 0 && (
              <div style={{ marginTop: '10px', fontSize: '0.7rem', color: 'var(--success-emerald)', fontWeight: '600' }}>
                🎉 Total Referral Earnings: ₹{profile.referralEarnings.toFixed(2)}
              </div>
            )}
          </GlassCard>
        )}

        {/* First Deposit Bonus Banner (Only shown if user has not completed first deposit) */}
        {!hasDeposited && (
          <div
            onClick={() => setShowBonusModal(true)}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '16px',
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(255, 215, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Sparkles size={18} color="#000" />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ffd700' }}>
                  🎁 Extra First Deposit Bonus
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Claim up to ₹800 bonus on your 1st deposit!
                </div>
              </div>
            </div>

            <div style={{
              background: '#ffd700', color: '#000',
              fontSize: '0.7rem', fontWeight: '900',
              padding: '6px 12px', borderRadius: '8px'
            }}>
              View Tiers
            </div>
          </div>
        )}

      </div>

      {/* First Deposit Bonus Popup Modal */}
      <FirstDepositModal
        isOpen={showBonusModal}
        onClose={() => setShowBonusModal(false)}
      />

      <BottomNav />
    </div>
  );
};

export default Dashboard;
