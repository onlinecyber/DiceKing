import React from 'react';

const GlassCard = ({ children, className = '', interactive = false, style = {} }) => {
  const panelClass = `glass-panel ${interactive ? 'glass-panel-interactive' : ''} ${className}`;
  
  return (
    <div className={panelClass} style={style}>
      {children}
    </div>
  );
};

export default GlassCard;
