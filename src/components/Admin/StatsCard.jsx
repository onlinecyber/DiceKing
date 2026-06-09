import React from 'react';
import GlassCard from '../Common/GlassCard';

const StatsCard = ({ title, value, icon: Icon, color = 'var(--accent-gold)' }) => {
  return (
    <GlassCard style={{
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flex: '1 1 140px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {title}
        </span>
        <span style={{ fontSize: '1.25rem', fontWeight: '800', color: color }}>
          {value}
        </span>
      </div>
      
      {Icon && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '8px',
          borderRadius: '12px',
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={20} />
        </div>
      )}
    </GlassCard>
  );
};

export default StatsCard;
