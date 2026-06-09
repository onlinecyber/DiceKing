import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Shield, Coins, Award, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';

const Profile = () => {
  const { profile, logout } = useAuth();
  const { wallet, recentBets } = useGame();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Compile statistics from user's bets
  const totalBets = recentBets.length;
  const wonBets = recentBets.filter(b => b.status === 'won');
  const winRate = totalBets > 0 ? ((wonBets.length / totalBets) * 100).toFixed(1) : '0.0';
  
  const totalWinnings = wonBets.reduce((sum, b) => sum + b.payout, 0);
  const totalBetAmount = recentBets.reduce((sum, b) => sum + b.amount, 0);
  const netEarnings = totalWinnings - totalBetAmount;

  return (
    <div className="app-container">
      <Navbar />
      
      <div className="content-container">
        
        {/* User Card */}
        <GlassCard style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            border: '2px solid rgba(255,215,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: profile?.role === 'admin' ? 'var(--accent-gold)' : 'var(--text-primary)',
            boxShadow: profile?.role === 'admin' ? '0 0 15px rgba(255,215,0,0.15)' : 'none'
          }}>
            <User size={32} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
              {profile?.displayName || 'Player'}
            </h2>
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: '700', 
              color: profile?.role === 'admin' ? 'var(--danger-red)' : 'var(--text-secondary)',
              textTransform: 'uppercase',
              background: 'rgba(255,255,255,0.03)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid var(--card-border)'
            }}>
              {profile?.role || 'user'}
            </span>
          </div>

          <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Mail size={14} color="var(--text-muted)" />
              <span>{profile?.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Shield size={14} color="var(--text-muted)" />
              <span>Account Protected by Google Firebase</span>
            </div>
          </div>
        </GlassCard>

        {/* Live Wallet Quickview */}
        <GlassCard style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Coins size={22} color="var(--accent-gold)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>AVAILABLE BALANCE</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
                ₹{wallet ? wallet.balance.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/wallet')}
            className="btn-outline" 
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            Manage Wallet
          </button>
        </GlassCard>

        {/* Gameplay statistics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
            GAME STATISTICS
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {/* Total Bets */}
            <GlassCard style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>TOTAL BETS</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800' }}>{totalBets}</div>
            </GlassCard>

            {/* Win Rate */}
            <GlassCard style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>WIN RATE</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--success-emerald)' }}>{winRate}%</div>
            </GlassCard>

            {/* Total Volume */}
            <GlassCard style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>TOTAL BET AMOUNT</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800' }}>₹{totalBetAmount.toFixed(2)}</div>
            </GlassCard>

            {/* Net Payout */}
            <GlassCard style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>NET EARNINGS</div>
              <div style={{ 
                fontSize: '1.15rem', 
                fontWeight: '800', 
                color: netEarnings >= 0 ? 'var(--success-emerald)' : 'var(--danger-red)' 
              }}>
                {netEarnings >= 0 ? '+' : ''}₹{netEarnings.toFixed(2)}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Referral Code Card */}
        <GlassCard style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🎁</span> Invite Friends & Earn
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              fontWeight: '700',
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {profile?.referralCode || 'DKXXXX'}
            </div>
            <button
              onClick={() => {
                const text = `Join Dice King! Use code: ${profile?.referralCode || 'DKXXXX'} to register.`;
                if (navigator.share) {
                  navigator.share({ text });
                } else {
                  navigator.clipboard.writeText(text);
                  alert('Referral text copied to clipboard!');
                }
              }}
              className="btn-gold"
              style={{ padding: '8px 16px', fontSize: '0.75rem', flexShrink: 0 }}
            >
              Share Code
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>Referral Earnings:</span>
            <span style={{ color: 'var(--success-emerald)', fontWeight: '800' }}>₹{(profile?.referralEarnings || 0).toFixed(2)}</span>
          </div>
        </GlassCard>

        {/* History Logs Link Card */}
        <GlassCard 
          onClick={() => navigate('/history')}
          interactive={true} 
          style={{ 
            padding: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            border: '1px solid var(--card-border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📜</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>Transaction & Game Logs</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>View your game bets, recharges, and passbook logs</span>
            </div>
          </div>
          <span style={{ fontSize: '1.15rem', color: 'var(--accent-gold)', fontWeight: '800' }}>→</span>
        </GlassCard>

        {/* Help & Support Card */}
        <GlassCard 
          onClick={() => navigate('/support')}
          interactive={true} 
          style={{ 
            padding: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            border: '1px solid rgba(255, 215, 0, 0.15)',
            marginTop: '5px',
            marginBottom: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📩</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>Help & Customer Support</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Get 24/7 assistance on deposits & withdrawals</span>
            </div>
          </div>
          <span style={{ fontSize: '1.15rem', color: 'var(--accent-gold)', fontWeight: '800' }}>→</span>
        </GlassCard>

        {/* Action button */}
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            color: 'var(--danger-red)',
            padding: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
        >
          <LogOut size={16} />
          Sign Out of Account
        </button>

      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
