import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Medal, Award, User, Flame, TrendingUp } from 'lucide-react';
import { useGame } from '../context/GameContext';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';

const defaultFakePlayers = [
  { uid: 'fp1', displayName: 'Aman K.', totalWinnings: 78450, vip: 'VIP 5', avatar: '👑' },
  { uid: 'fp2', displayName: 'Vikram S.', totalWinnings: 62300, vip: 'VIP 4', avatar: '💎' },
  { uid: 'fp3', displayName: 'Rajesh P.', totalWinnings: 49850, vip: 'VIP 4', avatar: '⭐' },
  { uid: 'fp4', displayName: 'Rahul M.', totalWinnings: 41200, vip: 'VIP 3', avatar: '🔥' },
  { uid: 'fp5', displayName: 'Suresh K.', totalWinnings: 34500, vip: 'VIP 3', avatar: '⚡' },
  { uid: 'fp6', displayName: 'Mohit R.', totalWinnings: 29800, vip: 'VIP 3', avatar: '🎯' },
  { uid: 'fp7', displayName: 'Deepak Y.', totalWinnings: 25400, vip: 'VIP 2', avatar: '🎲' },
  { uid: 'fp8', displayName: 'Rohit G.', totalWinnings: 21600, vip: 'VIP 2', avatar: '🏆' },
  { uid: 'fp9', displayName: 'Ankit B.', totalWinnings: 18250, vip: 'VIP 2', avatar: '🚀' },
  { uid: 'fp10', displayName: 'Karan J.', totalWinnings: 15400, vip: 'VIP 1', avatar: '🔥' },
  { uid: 'fp11', displayName: 'Zoya K.', totalWinnings: 13900, vip: 'VIP 1', avatar: '✨' },
  { uid: 'fp12', displayName: 'Pooja S.', totalWinnings: 11800, vip: 'VIP 1', avatar: '💫' },
  { uid: 'fp13', displayName: 'Imran A.', totalWinnings: 9750, vip: 'VIP 1', avatar: '🌟' },
  { uid: 'fp14', displayName: 'Sachin D.', totalWinnings: 8400, vip: 'VIP 1', avatar: '🍀' },
  { uid: 'fp15', displayName: 'Amit V.', totalWinnings: 7100, vip: 'VIP 1', avatar: '🎖️' }
];

const candidatePool = [
  'Farhan K.', 'Naveen R.', 'Pankaj J.', 'Gaurav S.', 'Harsh M.',
  'Kavita D.', 'Sunil T.', 'Sameer B.', 'Manish Q.', 'Alok N.',
  'Praveen S.', 'Rohan G.', 'Neha P.', 'Arjun D.'
];

const Leaderboard = () => {
  const { leaderboard } = useGame();
  const [players, setPlayers] = useState(defaultFakePlayers);
  const [recentWinToast, setRecentWinToast] = useState(null);
  const [timeFilter, setTimeFilter] = useState('daily'); // 'daily' | 'weekly' | 'allTime'
  const [lastUpdatedPlayerId, setLastUpdatedPlayerId] = useState(null);

  // Periodic real-time update: every 10–14 seconds, a player wins a round and ranks adjust
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers(prev => {
        const copy = [...prev];
        const targetIdx = Math.floor(Math.random() * copy.length);
        const winAmount = Math.floor(Math.random() * 2200) + 400; // ₹400 to ₹2,600

        // Occasionally swap in a new contender from the pool to keep it dynamic
        if (Math.random() > 0.6 && targetIdx > 2) {
          const randomName = candidatePool[Math.floor(Math.random() * candidatePool.length)];
          copy[targetIdx] = {
            ...copy[targetIdx],
            displayName: randomName,
            totalWinnings: copy[targetIdx].totalWinnings + winAmount
          };
        } else {
          copy[targetIdx] = {
            ...copy[targetIdx],
            totalWinnings: copy[targetIdx].totalWinnings + winAmount
          };
        }

        setLastUpdatedPlayerId(copy[targetIdx].uid);
        setRecentWinToast({
          name: copy[targetIdx].displayName,
          amount: winAmount
        });

        // Re-sort descending by winnings
        copy.sort((a, b) => b.totalWinnings - a.totalWinnings);
        return copy;
      });

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setLastUpdatedPlayerId(null);
        setRecentWinToast(null);
      }, 3500);

    }, 11000);

    return () => clearInterval(interval);
  }, []);

  // Merge real players if available with fallback dynamic list
  const displayList = useMemo(() => {
    let baseList = players;
    if (leaderboard && leaderboard.length > 0) {
      const merged = [
        ...leaderboard,
        ...players.filter(p => !leaderboard.some(lb => lb.uid === p.uid))
      ];
      merged.sort((a, b) => (b.totalWinnings || 0) - (a.totalWinnings || 0));
      baseList = merged;
    }

    // Multipliers for time filters
    const multiplier = timeFilter === 'weekly' ? 3.4 : (timeFilter === 'allTime' ? 9.8 : 1);
    return baseList.map(p => ({
      ...p,
      displayWinnings: Math.round(p.totalWinnings * multiplier)
    }));
  }, [leaderboard, players, timeFilter]);

  const getRankBadge = (rank) => {
    if (rank === 0) return <Medal size={24} color="#ffd700" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))' }} />; // Gold
    if (rank === 1) return <Medal size={22} color="#c0c0c0" style={{ filter: 'drop-shadow(0 0 6px rgba(192,192,192,0.5))' }} />; // Silver
    if (rank === 2) return <Medal size={20} color="#cd7f32" style={{ filter: 'drop-shadow(0 0 4px rgba(205,127,50,0.5))' }} />; // Bronze
    return <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', width: '24px', textAlign: 'center' }}>{rank + 1}</span>;
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="content-container">
        
        {/* Page Title & Live Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Global Ranks</h2>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '4px 8px', borderRadius: '12px', fontSize: '0.65rem', color: 'var(--success-emerald)', fontWeight: '700'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-emerald)', animation: 'pulse 1.5s infinite' }} />
            LIVE RANKS
          </div>
        </div>

        {/* Live Real-Time Win Ticker */}
        {recentWinToast && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.25), rgba(16, 185, 129, 0.25))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={14} color="#f59e0b" />
              <span><strong>{recentWinToast.name}</strong> just won on Dice King!</span>
            </div>
            <span style={{ color: 'var(--success-emerald)', fontWeight: '800' }}>
              +₹{recentWinToast.amount.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Timeframe Filter Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(26, 22, 43, 0.85)',
          padding: '3px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          gap: '4px'
        }}>
          {[
            { id: 'daily', label: 'Today' },
            { id: 'weekly', label: 'This Week' },
            { id: 'allTime', label: 'All-Time' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id)}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: '9px',
                border: 'none',
                background: timeFilter === tab.id ? 'var(--accent-gold)' : 'transparent',
                color: timeFilter === tab.id ? '#000' : 'var(--text-secondary)',
                fontWeight: timeFilter === tab.id ? '800' : '600',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium Cards */}
        {displayList.length >= 3 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'end', minHeight: '140px', marginTop: '6px' }}>
            
            {/* Rank 2 (Left) */}
            <GlassCard style={{
              flex: 1,
              padding: '12px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              height: '115px',
              justifyContent: 'center',
              borderTop: '3px solid #c0c0c0',
              background: 'linear-gradient(180deg, rgba(192, 192, 192, 0.1) 0%, rgba(26, 22, 43, 0.8) 100%)'
            }}>
              <Medal size={20} color="#c0c0c0" />
              <div style={{ fontSize: '0.78rem', fontWeight: '800', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {displayList[1].displayName}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#c0c0c0' }}>
                ₹{displayList[1].displayWinnings.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '700' }}>Rank 2</span>
            </GlassCard>

            {/* Rank 1 (Center - Elevated) */}
            <GlassCard style={{
              flex: 1.15,
              padding: '14px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              height: '135px',
              justifyContent: 'center',
              borderTop: '4px solid #ffd700',
              boxShadow: '0 0 24px rgba(255,215,0,0.15)',
              background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.12) 0%, rgba(26, 22, 43, 0.9) 100%)'
            }}>
              <Trophy size={26} color="#ffd700" style={{ filter: 'drop-shadow(0 0 8px var(--accent-gold))' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: '900', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', color: 'var(--accent-gold)' }}>
                {displayList[0].displayName}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#fff' }}>
                ₹{displayList[0].displayWinnings.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', fontWeight: '800' }}>👑 Champion</span>
            </GlassCard>

            {/* Rank 3 (Right) */}
            <GlassCard style={{
              flex: 1,
              padding: '12px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              height: '105px',
              justifyContent: 'center',
              borderTop: '3px solid #cd7f32',
              background: 'linear-gradient(180deg, rgba(205, 127, 50, 0.1) 0%, rgba(26, 22, 43, 0.8) 100%)'
            }}>
              <Medal size={18} color="#cd7f32" />
              <div style={{ fontSize: '0.78rem', fontWeight: '800', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {displayList[2].displayName}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#cd7f32' }}>
                ₹{displayList[2].displayWinnings.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '700' }}>Rank 3</span>
            </GlassCard>

          </div>
        )}

        {/* Main List (Ranks 4 - 15) */}
        <GlassCard style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {displayList.slice(3).map((player, idx) => {
            const actualRank = idx + 3;
            const isUpdated = player.uid === lastUpdatedPlayerId;

            return (
              <div 
                key={player.uid || idx} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 0',
                  borderBottom: idx < displayList.length - 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: isUpdated ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  borderRadius: isUpdated ? '8px' : '0',
                  transition: 'background 0.4s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getRankBadge(actualRank)}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem'
                    }}>
                      {player.avatar || '🎲'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fff' }}>
                        {player.displayName}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                        {player.vip || 'VIP 1'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
                  ₹{player.displayWinnings.toLocaleString('en-IN')}
                </span>
              </div>
            );
          })}
        </GlassCard>

      </div>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
