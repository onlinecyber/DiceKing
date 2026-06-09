import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import Timer from '../components/Game/Timer';
import DiceBoard from '../components/Game/DiceBoard';
import BettingPanel from '../components/Game/BettingPanel';
import HistoryList from '../components/Game/HistoryList';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';
import GlassCard from '../components/Common/GlassCard';

const Home = () => {
  const navigate = useNavigate();
  const { toast, wallet, leaderboard } = useGame();
  const { profile } = useAuth();

  const [showRules, setShowRules] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Today's fake winners ticker state
  const [winners, setWinners] = useState([
    { name: 'Rahul K.', amount: 50000 },
    { name: 'Priya S.', amount: 150000 },
    { name: 'Imtiyaz A.', amount: 500000 },
    { name: 'Arman S.', amount: 20000 },
    { name: 'Farhan K.', amount: 80000 },
    { name: 'Zoya P.', amount: 30000 },
    { name: 'Sneha R.', amount: 120000 }
  ]);
  const [currentWinnerIdx, setCurrentWinnerIdx] = useState(0);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWinnerIdx(prev => (prev + 1) % winners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [winners.length]);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Navbar />

      {/* Main Container */}
      <div className="content-container">
        
        {/* Install Banner */}
        {showInstallBanner && (
          <div style={{
            position: 'relative',
            background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>📱</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fff' }}>Install Dice King</span>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.8)' }}>Get the best mobile gameplay experience</span>
              </div>
            </div>
            <button 
              onClick={handleInstallClick}
              className="btn-gold"
              style={{ padding: '6px 12px', fontSize: '0.7rem' }}
            >
              Install
            </button>
            <button 
              onClick={() => setShowInstallBanner(false)}
              style={{ position: 'absolute', top: '2px', right: '6px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              ×
            </button>
          </div>
        )}



        {/* Wallet Balance widget card */}
        <GlassCard style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '4px', marginBottom: '8px', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '600' }}>YOUR BALANCE</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
              ₹{wallet ? wallet.balance.toFixed(2) : '0.00'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => navigate('/wallet')} 
              className="btn-outline" 
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
            >
              Withdraw
            </button>
            <button 
              onClick={() => navigate('/wallet')} 
              className="btn-gold" 
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
            >
              Deposit
            </button>
          </div>
        </GlassCard>



        {/* Today's Winners ticker */}
        <GlassCard style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', overflow: 'hidden' }}>
          <span style={{ fontSize: '0.75rem' }}>🔥</span>
          <div style={{ flex: 1, height: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              width: '100%',
              fontSize: '0.75rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ color: '#fff' }}>{winners[currentWinnerIdx].name}</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>won</span>
              <span style={{ color: 'var(--success-emerald)' }}>₹{winners[currentWinnerIdx].amount.toLocaleString('en-IN')}</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>on Dice King!</span>
            </div>
          </div>
        </GlassCard>

        {/* 1. Timer / Betting Status Bar */}
        <Timer />

        {/* 2. Visual Dice Display */}
        <DiceBoard />

        {/* 3. Betting Choices Board */}
        <BettingPanel />

        {/* 4. Swipable Recent Roll History */}
        <HistoryList />

        {/* 5. Leaderboard Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '4px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
              🏆 TOP WINNERS
            </h3>
            <button 
              onClick={() => navigate('/leaderboard')}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
            >
              View All
            </button>
          </div>

          <GlassCard style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard && leaderboard.slice(0, 3).length > 0 ? (
              leaderboard.slice(0, 3).map((w, i) => (
                <div key={w.uid || i} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: i < 2 ? '8px' : '0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: i === 0 ? 'rgba(255,215,0,0.15)' : i === 1 ? 'rgba(255,255,255,0.1)' : 'rgba(205,127,50,0.15)',
                    border: `1px solid ${i === 0 ? 'var(--accent-gold)' : i === 1 ? '#e2e8f0' : '#b45309'}`,
                    color: i === 0 ? 'var(--accent-gold)' : i === 1 ? '#e2e8f0' : '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: '900'
                  }}>
                    #{i + 1}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', flex: 1 }}>{w.displayName}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--success-emerald)' }}>₹{w.totalWinnings.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>Loading rankings...</span>
            )}
          </GlassCard>
        </div>

      </div>

      {/* 6. Rules Overlay Modal */}
      {showRules && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }} onClick={() => setShowRules(false)}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--card-border)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent-gold)' }}>🎯 Dice King Rules</h3>
              <button onClick={() => setShowRules(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
              <div>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>1. Place Your Bets</strong>
                <span>Select a chip size and place your bet on any options on the betting panel before the timer hits 0. You can choose Up (8-12), Down (2-6), Odd, Even, or exact sum.</span>
              </div>
              <div>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>2. Winning Multipliers</strong>
                <ul style={{ paddingLeft: '14px', margin: '4px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <li><strong>Up / Down:</strong> pays 2.0x standard return</li>
                  <li><strong>Odd / Even:</strong> pays 1.9x standard return</li>
                  <li><strong>Exact sum:</strong> pays up to 30x (2 & 12: 30x | 3 & 11: 15x | 4 & 10: 10x | 5 & 9: 8x | 6 & 8: 6x | 7: 5x)</li>
                </ul>
              </div>
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px dashed rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '0.7rem'
              }}>
                <strong style={{ color: 'var(--danger-red)', display: 'block', marginBottom: '2px' }}>⚠️ Play-Time GST Deduction (5%)</strong>
                <span>Government norms apply. A flat **5% GST deduction** is taken from all winning payouts automatically at settlement (e.g. ₹30 bet on Up/Down yields ₹57 net payout instead of ₹60).</span>
              </div>
              <div>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>3. Direct Withdrawals</strong>
                <span>All withdrawals are direct and free of charges. Your withdrawals are reviewed by system cashier admins and approved directly.</span>
              </div>
            </div>

            <button onClick={() => setShowRules(false)} className="btn-gold" style={{ width: '100%', padding: '10px' }}>
              I Understand / Samajh Gaya
            </button>
          </div>
        </div>
      )}

      {/* Floating System Toast Alerts */}
      {toast && (
        <div 
          className="toast-message"
          style={{
            position: 'fixed',
            bottom: '88px', // Positioned right above bottom navigation bar
            left: '16px',
            right: '16px',
            maxWidth: '448px',
            margin: '0 auto',
            zIndex: 999,
            background: toast.type === 'success' 
              ? 'rgba(16, 185, 129, 0.95)' 
              : toast.type === 'error' 
                ? 'rgba(239, 68, 68, 0.95)' 
                : 'rgba(31, 27, 53, 0.95)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${
              toast.type === 'success' 
                ? 'rgba(16, 185, 129, 0.2)' 
                : toast.type === 'error' 
                  ? 'rgba(239, 68, 68, 0.2)' 
                  : 'rgba(255, 255, 255, 0.1)'
            }`,
            color: toast.type === 'success' || toast.type === 'error' ? '#000' : '#fff',
            padding: '12px 16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            fontWeight: '700',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Bottom Sticky Navigation */}
      <BottomNav />
    </div>
  );
};

export default Home;
