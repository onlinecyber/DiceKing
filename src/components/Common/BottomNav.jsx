import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gamepad2, Wallet, Trophy, User, ShieldAlert, History, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GlassCard from './GlassCard';

const BottomNav = () => {
  const { currentUser, profile } = useAuth();

  if (!currentUser) return null; // Only show navigation for logged-in players

  const navItemStyle = ({ isActive }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.75rem',
    fontWeight: isActive ? '700' : '500',
    flex: 1,
    height: '100%',
    transition: 'color 0.2s ease',
    cursor: 'pointer'
  });

  return (
    <GlassCard
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        borderRadius: '16px 16px 0 0',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        padding: '0 8px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)'
      }}
    >
      {/* Dashboard Tab */}
      <NavLink to="/dashboard" style={navItemStyle}>
        <LayoutDashboard size={20} />
        <span>Home</span>
      </NavLink>

      {/* Game Board Tab */}
      <NavLink to="/" end style={navItemStyle}>
        <Gamepad2 size={20} />
        <span>Play</span>
      </NavLink>

      {/* Wallet Tab */}
      <NavLink to="/wallet" style={navItemStyle}>
        <Wallet size={20} />
        <span>Wallet</span>
      </NavLink>

      {/* History Tab */}
      <NavLink to="/history" style={navItemStyle}>
        <History size={20} />
        <span>History</span>
      </NavLink>

      {/* Leaderboard Tab */}
      <NavLink to="/leaderboard" style={navItemStyle}>
        <Trophy size={20} />
        <span>Ranks</span>
      </NavLink>

      {/* Profile Tab */}
      <NavLink to="/profile" style={navItemStyle}>
        <User size={20} />
        <span>Profile</span>
      </NavLink>

      {/* Admin Panel Tab (Conditional) */}
      {profile?.role === 'admin' && (
        <NavLink to="/admin" style={navItemStyle}>
          <ShieldAlert size={20} color="var(--danger-red)" />
          <span style={{ color: 'var(--danger-red)' }}>Admin</span>
        </NavLink>
      )}
    </GlassCard>
  );
};

export default BottomNav;
