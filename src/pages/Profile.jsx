import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Wallet, History, HeadphonesIcon, ChevronRight, Copy, Check, Share2, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';

// VIP Level config
const getVipLevel = (totalWinnings) => {
  if (totalWinnings >= 100000) return { label: 'DIAMOND', emoji: '💎', color: '#60d0f0', bg: 'rgba(96,208,240,0.15)', border: 'rgba(96,208,240,0.35)', next: null };
  if (totalWinnings >= 50000)  return { label: 'GOLD',    emoji: '🥇', color: '#ffd700', bg: 'rgba(255,215,0,0.15)',  border: 'rgba(255,215,0,0.35)',  next: 100000 };
  if (totalWinnings >= 10000)  return { label: 'SILVER',  emoji: '🥈', color: '#c0c0c0', bg: 'rgba(192,192,192,0.15)',border: 'rgba(192,192,192,0.35)',next: 50000 };
  if (totalWinnings >= 2000)   return { label: 'BRONZE',  emoji: '🥉', color: '#cd7f32', bg: 'rgba(205,127,50,0.15)', border: 'rgba(205,127,50,0.35)', next: 10000 };
  return                               { label: 'BEGINNER',emoji: '⭐', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.25)',next: 2000 };
};

const Profile = () => {
  const { profile, logout } = useAuth();
  const { wallet, recentBets } = useGame();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch (e) { console.error(e); }
  };

  const wonBets = recentBets.filter(b => b.status === 'won');
  const totalWinnings = wonBets.reduce((s, b) => s + (b.payout || 0), 0);
  const totalBets = recentBets.length;
  const vip = getVipLevel(totalWinnings);
  const progressPct = vip.next
    ? Math.min(100, Math.round((totalWinnings / vip.next) * 100))
    : 100;

  const handleCopy = () => {
    navigator.clipboard.writeText(profile?.referralCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `🎲 Join DiceKing & Win Big! Use my code: ${profile?.referralCode} — Get bonus on first deposit!\nhttps://diceking-topaz.vercel.app`;
    if (navigator.share) navigator.share({ text });
    else { navigator.clipboard.writeText(text); }
  };

  const menuItems = [
    { icon: Wallet,          label: 'My Wallet',       sub: 'Deposit & Withdraw funds',    path: '/wallet',    color: '#10b981' },
    { icon: History,         label: 'Bet History',      sub: 'View all your game records',  path: '/history',   color: '#f59e0b' },
    { icon: HeadphonesIcon,  label: 'Help & Support',   sub: '24/7 assistance available',   path: '/support',   color: '#6366f1' },
  ];

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container" style={{ gap: '14px' }}>

        {/* ── Avatar + Name Card ── */}
        <GlassCard style={{ padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Glow bg */}
          <div style={{ position:'absolute', top:'-30px', left:'50%', transform:'translateX(-50%)', width:'160px', height:'160px', background:`radial-gradient(circle, ${vip.color}22 0%, transparent 70%)`, borderRadius:'50%', pointerEvents:'none' }} />

          {/* Avatar */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${vip.color}55, ${vip.color}22)`,
            border: `2px solid ${vip.color}`,
            boxShadow: `0 0 20px ${vip.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: '900', color: '#fff',
            margin: '0 auto 10px'
          }}>
            {(profile?.displayName || 'P')[0].toUpperCase()}
          </div>

          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>
            {profile?.displayName || 'Player'}
          </h2>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {profile?.email}
          </div>

          {/* VIP Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: vip.bg, border: `1px solid ${vip.border}`,
            borderRadius: '20px', padding: '5px 14px',
            fontSize: '0.72rem', fontWeight: '800', color: vip.color, letterSpacing: '0.5px'
          }}>
            {vip.emoji} {vip.label} MEMBER
          </div>

          {/* VIP Progress Bar */}
          {vip.next && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.6rem', color:'var(--text-secondary)', marginBottom:'5px' }}>
                <span>Progress to next level</span>
                <span style={{ color: vip.color }}>₹{totalWinnings.toFixed(0)} / ₹{vip.next.toLocaleString()}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${progressPct}%`, height: '100%',
                  background: `linear-gradient(90deg, ${vip.color}aa, ${vip.color})`,
                  borderRadius: '99px',
                  transition: 'width 0.6s ease',
                  boxShadow: `0 0 8px ${vip.color}88`
                }} />
              </div>
            </div>
          )}
          {!vip.next && (
            <div style={{ marginTop: '10px', fontSize: '0.7rem', color: vip.color, fontWeight: '700' }}>
              🎉 Max Level Reached! You're a Legend!
            </div>
          )}
        </GlassCard>

        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <GlassCard style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🎲</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#fff' }}>{totalBets}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '700' }}>GAMES PLAYED</div>
          </GlassCard>
          <GlassCard style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🏆</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--success-emerald)' }}>
              ₹{totalWinnings.toFixed(0)}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '700' }}>TOTAL WINNINGS</div>
          </GlassCard>
        </div>

        {/* ── Wallet Balance ── */}
        <GlassCard style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '1px', marginBottom: '3px' }}>WALLET BALANCE</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
              ₹{wallet ? wallet.balance.toFixed(2) : '0.00'}
            </div>
          </div>
          <button onClick={() => navigate('/wallet')} className="btn-gold" style={{ padding: '9px 18px', fontSize: '0.78rem', width: 'auto' }}>
            Add Money
          </button>
        </GlassCard>

        {/* ── Referral Card ── */}
        {profile?.referralCode && (
          <GlassCard style={{
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
            border: '1px solid rgba(16,185,129,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Star size={14} color="var(--success-emerald)" fill="var(--success-emerald)" />
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--success-emerald)', letterSpacing: '0.5px' }}>
                REFER & EARN ₹10
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Invite friends — earn ₹10 per successful referral!
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{
                flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
                padding: '9px 12px', fontFamily: 'monospace',
                fontSize: '1rem', fontWeight: '800', color: '#fff', letterSpacing: '2px'
              }}>
                {profile.referralCode}
              </div>
              <button onClick={handleCopy} style={{
                background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,215,0,0.1)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.5)' : 'rgba(255,215,0,0.3)'}`,
                borderRadius: '10px', padding: '9px 12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
                color: copied ? 'var(--success-emerald)' : 'var(--accent-gold)',
                fontSize: '0.7rem', fontWeight: '700', transition: 'all 0.2s'
              }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={handleShare} style={{
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
                borderRadius: '10px', padding: '9px 12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
                color: '#818cf8', fontSize: '0.7rem', fontWeight: '700'
              }}>
                <Share2 size={13} /> Share
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.68rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Referral Earnings</span>
              <span style={{ color: 'var(--success-emerald)', fontWeight: '800' }}>
                ₹{(profile?.referralEarnings || 0).toFixed(2)}
              </span>
            </div>
          </GlassCard>
        )}

        {/* ── Menu Items ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--card-bg)', backdropFilter: 'blur(16px)',
                  border: '1px solid var(--card-border)', borderRadius: '14px',
                  padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${item.color}44`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={18} color={item.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{item.label}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{item.sub}</div>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            );
          })}
        </div>

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '14px', color: 'var(--danger-red)', padding: '13px',
            fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', width: '100%', transition: 'all 0.2s', marginBottom: '6px'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
        >
          <LogOut size={16} /> Sign Out
        </button>

      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
