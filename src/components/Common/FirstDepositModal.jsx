import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';

const FirstDepositModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { appSettings, wallet } = useGame();
  const [noRemindToday, setNoRemindToday] = useState(false);

  const hasDeposited = (wallet?.totalDeposits && wallet.totalDeposits > 0) || profile?.firstDepositClaimed === true;

  const defaultTiers = [
    { minDeposit: 100000, bonus: 800 },
    { minDeposit: 50000, bonus: 500 },
    { minDeposit: 10000, bonus: 200 },
    { minDeposit: 5000, bonus: 100 },
    { minDeposit: 1000, bonus: 50 },
    { minDeposit: 500, bonus: 20 }
  ];

  const tiers = (appSettings?.firstDepositTiers && appSettings.firstDepositTiers.length > 0)
    ? appSettings.firstDepositTiers
    : defaultTiers;

  const userDeposit = wallet?.totalDeposits || 0;

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setNoRemindToday(checked);
    if (checked) {
      const today = new Date().toDateString();
      localStorage.setItem('hideFirstDepositModalDate', today);
    } else {
      localStorage.removeItem('hideFirstDepositModalDate');
    }
  };

  const handleDepositClick = (amount) => {
    onClose();
    navigate('/deposit', { state: { prefilledAmount: amount } });
  };

  if (!isOpen || hasDeposited) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }} onClick={onClose}>
      
      {/* Modal Container */}
      <div 
        style={{
          background: 'linear-gradient(180deg, #27315c 0%, #171d3b 100%)',
          width: '100%',
          maxWidth: '380px',
          maxHeight: '82vh',
          borderRadius: '24px',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(79, 70, 229, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div style={{
          padding: '20px 20px 12px 20px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(79, 70, 229, 0.3) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '900',
            color: '#fff',
            marginBottom: '4px',
            letterSpacing: '0.5px'
          }}>
            Extra first deposit bonus
          </h2>
          <p style={{
            fontSize: '0.72rem',
            color: 'rgba(255, 255, 255, 0.65)',
            fontWeight: '500'
          }}>
            Each account can only receive rewards once
          </p>
        </div>

        {/* Bonus Tiers List */}
        <div style={{
          padding: '14px 16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flex: 1
        }}>
          {tiers.map((tier, idx) => {
            const progressRatio = Math.min(1, userDeposit / tier.minDeposit);
            const progressPercent = (progressRatio * 100).toFixed(0);

            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(23, 27, 54, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '14px 14px 12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                {/* Tier Header Line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff' }}>
                    First deposit <span style={{ color: '#ffd700' }}>{tier.minDeposit}</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#ffd700' }}>
                    + ₹{tier.bonus}.00
                  </div>
                </div>

                {/* Description */}
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.3' }}>
                  Deposit {tier.minDeposit} for the first time and you will receive {tier.bonus} bonus
                </div>

                {/* Progress Bar & Deposit Button Line */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
                  {/* Progress Pill */}
                  <div style={{
                    flex: 1,
                    height: '24px',
                    background: 'rgba(10, 14, 30, 0.7)',
                    borderRadius: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Fill */}
                    <div style={{
                      position: 'absolute',
                      left: 0, top: 0, bottom: 0,
                      width: `${progressPercent}%`,
                      background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
                      borderRadius: '12px',
                      transition: 'width 0.4s ease'
                    }} />
                    <span style={{
                      position: 'relative',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      color: '#fff',
                      zIndex: 2
                    }}>
                      {userDeposit}/{tier.minDeposit}
                    </span>
                  </div>

                  {/* Deposit Button */}
                  <button
                    onClick={() => handleDepositClick(tier.minDeposit)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #ffd700',
                      color: '#ffd700',
                      borderRadius: '10px',
                      padding: '6px 16px',
                      fontWeight: '800',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#ffd700';
                      e.currentTarget.style.color = '#000';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#ffd700';
                    }}
                  >
                    Deposit
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Controls */}
        <div style={{
          padding: '12px 18px',
          background: 'rgba(15, 19, 38, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* No reminders today checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={noRemindToday}
              onChange={handleCheckboxChange}
              style={{ accentColor: '#3b82f6', width: '14px', height: '14px', cursor: 'pointer' }}
            />
            No more reminders today
          </label>

          {/* Activity Button */}
          <button
            onClick={() => {
              onClose();
              navigate('/deposit');
            }}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: '20px',
              color: '#fff',
              fontWeight: '800',
              padding: '7px 20px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
            }}
          >
            Activity
          </button>
        </div>

      </div>

      {/* Circular Floating Close Button at Bottom Center */}
      <button
        onClick={onClose}
        style={{
          marginTop: '16px',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.15)',
          border: '1.5px solid rgba(255, 255, 255, 0.6)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <X size={20} />
      </button>

    </div>
  );
};

export default FirstDepositModal;
