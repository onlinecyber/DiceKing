import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Coins, User, LogIn, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import GlassCard from './GlassCard';

const Navbar = () => {
  const { currentUser, profile } = useAuth();
  const { wallet } = useGame();
  const navigate = useNavigate();

  return (
    <GlassCard 
      className="navbar-card"
      style={{
        borderRadius: '0 0 16px 16px',
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        padding: '12px 16px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* App Title / Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <Crown size={24} color="var(--accent-gold)" style={{ filter: 'drop-shadow(0 0 8px var(--accent-gold))' }} />
          <span style={{ 
            fontSize: '1.25rem', 
            fontWeight: '800', 
            letterSpacing: '1px',
            background: 'linear-gradient(to right, var(--accent-gold), #fff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            DICE KING
          </span>
        </Link>

        {/* User Balance / Profile Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentUser ? (
            <>
              {/* Wallet Pill Link */}
              <div 
                onClick={() => navigate('/wallet')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  userSelect: 'none'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)';
                  e.currentTarget.style.borderColor = 'var(--accent-gold)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                }}
              >
                <Coins size={14} color="var(--accent-gold)" />
                <span style={{ 
                  color: 'var(--accent-gold)', 
                  fontWeight: '700', 
                  fontSize: '0.85rem'
                }}>
                  ₹{wallet ? wallet.balance.toFixed(2) : '0.00'}
                </span>
              </div>

              {/* Profile Shortcut */}
              <div 
                onClick={() => navigate('/profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--card-border)',
                  cursor: 'pointer',
                  color: profile?.role === 'admin' ? 'var(--accent-gold)' : 'var(--text-primary)'
                }}
              >
                <User size={16} />
              </div>
            </>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: '1px solid var(--card-border)',
                padding: '6px 12px',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <LogIn size={14} />
              Sign In
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default Navbar;
