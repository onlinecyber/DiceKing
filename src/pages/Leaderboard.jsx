import React from 'react';
import { Trophy, Medal, Award, User } from 'lucide-react';
import { useGame } from '../context/GameContext';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';

const Leaderboard = () => {
  const { leaderboard } = useGame();

  const getRankBadge = (rank) => {
    if (rank === 0) return <Medal size={24} color="#ffd700" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.4))' }} />; // Gold
    if (rank === 1) return <Medal size={22} color="#c0c0c0" style={{ filter: 'drop-shadow(0 0 6px rgba(192,192,192,0.4))' }} />; // Silver
    if (rank === 2) return <Medal size={20} color="#cd7f32" style={{ filter: 'drop-shadow(0 0 4px rgba(205,127,50,0.4))' }} />; // Bronze
    return <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', width: '24px', textAlign: 'center' }}>{rank + 1}</span>;
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="content-container">
        
        {/* Page title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Trophy size={20} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Global Ranks</h2>
        </div>

        {/* Top 3 Podium Cards */}
        {leaderboard.length >= 3 && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'end', minHeight: '140px', marginTop: '10px' }}>
            
            {/* Rank 2 (Left) */}
            <GlassCard style={{
              flex: 1,
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              height: '110px',
              justifyContent: 'center',
              borderTop: '3px solid #c0c0c0'
            }}>
              <Medal size={18} color="#c0c0c0" />
              <div style={{ fontSize: '0.8rem', fontWeight: '700', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {leaderboard[1].displayName}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
                ₹{leaderboard[1].totalWinnings.toFixed(0)}
              </div>
            </GlassCard>

            {/* Rank 1 (Center - Elevated) */}
            <GlassCard style={{
              flex: 1.1,
              padding: '14px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              height: '130px',
              justifyContent: 'center',
              borderTop: '4px solid #ffd700',
              boxShadow: '0 0 20px rgba(255,215,0,0.08)'
            }}>
              <Trophy size={24} color="#ffd700" style={{ filter: 'drop-shadow(0 0 6px var(--accent-gold))' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: '800', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', color: 'var(--accent-gold)' }}>
                {leaderboard[0].displayName}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#fff' }}>
                ₹{leaderboard[0].totalWinnings.toFixed(0)}
              </div>
            </GlassCard>

            {/* Rank 3 (Right) */}
            <GlassCard style={{
              flex: 1,
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              height: '95px',
              justifyContent: 'center',
              borderTop: '3px solid #cd7f32'
            }}>
              <Medal size={16} color="#cd7f32" />
              <div style={{ fontSize: '0.8rem', fontWeight: '700', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {leaderboard[2].displayName}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
                ₹{leaderboard[2].totalWinnings.toFixed(0)}
              </div>
            </GlassCard>

          </div>
        )}

        {/* Main List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {leaderboard.length === 0 ? (
            <GlassCard style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No ranks available yet. Be the first to win!
            </GlassCard>
          ) : (
            <GlassCard style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {leaderboard.map((player, idx) => {
                // Skip rendering podium in main list if it's top 3
                return (
                  <div 
                    key={player.uid} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: idx < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {getRankBadge(idx)}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                          {player.displayName}
                        </span>
                      </div>
                    </div>
                    
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
                      ₹{player.totalWinnings.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </GlassCard>
          )}
        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
