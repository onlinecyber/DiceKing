import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2, Wallet, Trophy, History, HeadphonesIcon,
  Copy, Check, ArrowRight, Gift, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';
import GlassCard from '../components/Common/GlassCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { wallet, activeRound, countdown } = useGame();
  const [copied, setCopied] = useState(false);

  const handleCopyReferral = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quickActions = [
    {
      id: 'play',
      icon: Gamepad2,
      label: 'Play Now',
      sublabel: activeRound ? `Round #${activeRound.roundNumber} • ${countdown}s left` : 'Game Active',
      gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      glow: 'rgba(124, 58, 237, 0.3)',
      path: '/game',
      badge: '🎲 LIVE'
    },
    {
      id: 'wallet',
      icon: Wallet,
      label: 'Wallet',
      sublabel: wallet ? `₹${wallet.balance.toFixed(2)} balance` : 'Deposit & Withdraw',
      gradient: 'linear-gradient(135deg, #059669, #10b981)',
      glow: 'rgba(16, 185, 129, 0.3)',
      path: '/wallet',
      badge: null
    },
    {
      id: 'history',
      icon: History,
      label: 'History',
      sublabel: 'View your bet history',
      gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
      glow: 'rgba(245, 158, 11, 0.3)',
      path: '/history',
      badge: null
    },
    {
      id: 'leaderboard',
      icon: Trophy,
      label: 'Leaderboard',
      sublabel: 'Top winners today',
      gradient: 'linear-gradient(135deg, #b45309, #d97706)',
      glow: 'rgba(180, 83, 9, 0.3)',
      path: '/leaderboard',
      badge: null
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
    },
    {
      id: 'profile',
      icon: Shield,
      label: 'My Profile',
      sublabel: profile?.role === 'admin' ? 'Admin Account' : 'View & Edit',
      gradient: 'linear-gradient(135deg, #6b21a8, #9333ea)',
      glow: 'rgba(147, 51, 234, 0.3)',
      path: '/profile',
      badge: profile?.role === 'admin' ? '⚡ ADMIN' : null
    }
  ];

  return (
    <div className="app-container">
      <Navbar />

      <div className="content-container" style={{ gap: '16px' }}>

        {/* Wallet Balance Card */}
        <GlassCard style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Wallet size={13} color="var(--accent-gold)" />
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '1px' }}>WALLET BALANCE</span>
          </div>

          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--accent-gold)', marginBottom: '10px', letterSpacing: '-0.5px', textAlign: 'center' }}>
            ₹{wallet ? wallet.balance.toFixed(2) : '0.00'}
          </div>

          {wallet?.wageringRequired > 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '8px', padding: '8px 12px', marginBottom: '12px',
              fontSize: '0.7rem', color: '#f59e0b'
            }}>
              ⚠️ Wagering requirement: ₹{wallet.wageringRequired.toFixed(2)} remaining before withdrawal
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/wallet')}
              className="btn-gold"
              style={{ flex: 1, padding: '8px', fontSize: '0.75rem' }}
            >
              Deposit
            </button>
            <button
              onClick={() => navigate('/wallet')}
              className="btn-outline"
              style={{ flex: 1, padding: '8px', fontSize: '0.75rem' }}
            >
              Withdraw
            </button>
          </div>
        </GlassCard>

        {/* Play CTA Banner */}
        <div
          onClick={() => navigate('/game')}
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #1d4ed8 100%)',
            borderRadius: '18px', padding: '16px 18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(124, 58, 237, 0.35)',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#fff', marginBottom: '3px' }}>
              🎲 Start Playing Now!
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.75)' }}>
              {activeRound
                ? `Round #${activeRound.roundNumber} — ${countdown}s remaining`
                : 'New round starting soon...'}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)',
            borderRadius: '12px', padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: '5px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-gold)' }}>Play</span>
            <ArrowRight size={14} color="var(--accent-gold)" />
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px' }}>
            QUICK ACTIONS
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
                REFER & EARN ₹10
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
              Share your code — earn ₹10 when your friend makes their first deposit!
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

      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
