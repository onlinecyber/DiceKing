import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Zap, Info, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';

const inputStyle = {
  background: 'rgba(19,15,36,0.5)',
  border: '1px solid var(--card-border)',
  borderRadius: '10px',
  padding: '10px 12px',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  width: '100%',
  fontFamily: 'inherit',
};

const quickAmounts = [
  { amount: 100, label: 'STARTER' },
  { amount: 300, label: 'POPULAR' },
  { amount: 500, label: 'BEST VALUE', hot: true },
  { amount: 1000, label: 'PREMIUM' },
  { amount: 2000, label: 'VIP' },
  { amount: 5000, label: 'ULTIMATE' },
];

const Deposit = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { requestDeposit, showToast, appSettings, wallet } = useGame();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [ref, setRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUpi = () => {
    if (!appSettings?.upiId) return;
    navigator.clipboard.writeText(appSettings.upiId);
    setCopied(true);
    showToast && showToast('UPI ID copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickSelect = (val) => setAmount(val.toString());

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast ? showToast('Please enter a valid amount.', 'error') : alert('Please enter a valid amount.');
      return;
    }
    if (numAmount < (appSettings?.minDeposit || 100)) {
      const msg = `Minimum deposit is ₹${appSettings?.minDeposit || 100}`;
      showToast ? showToast(msg, 'error') : alert(msg);
      return;
    }
    if (!ref.trim()) {
      showToast ? showToast('Please enter the UTR reference number.', 'error') : alert('Please enter the UTR reference number.');
      return;
    }
    setLoading(true);
    try {
      await requestDeposit(numAmount, method, ref.trim());
      navigate('/wallet');
    } catch (err) {
      console.error('Deposit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const numAmount = Number(amount);
  const minDeposit = appSettings?.minDeposit || 100;
  const canPayUpi = numAmount >= minDeposit;

  const upiLink = appSettings?.upiId
    ? `upi://pay?pa=${appSettings.upiId}&pn=DiceKing&am=${amount}&cu=INR&tn=Recharge_Wallet`
    : null;

  return (
    <div className="app-container">
      <Navbar />

      <div className="content-container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/wallet')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
              padding: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>Add Money</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Instant deposit to your wallet</p>
          </div>
        </div>

        {/* Balance Card */}
        <GlassCard style={{
          padding: '18px 20px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(11,9,20,0.9) 100%)',
          border: '1px solid rgba(16,185,129,0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: '700', letterSpacing: '1.5px' }}>
            CURRENT BALANCE
          </span>
          <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
            ₹{wallet ? wallet.balance.toFixed(2) : '0.00'}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {currentUser?.email || ''}
          </span>
        </GlassCard>

        {/* Info Note */}
        <div style={{
          background: 'rgba(16,185,129,0.05)',
          border: '1px dashed rgba(16,185,129,0.3)',
          borderRadius: '10px',
          padding: '12px 14px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
        }}>
          <Info size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Min deposit <strong style={{ color: '#10b981' }}>₹{minDeposit}</strong>. Pay to UPI ID below, then enter UTR reference for approval.
          </span>
        </div>

        {/* Quick Amount Chips */}
        <GlassCard style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px', display: 'block' }}>
            QUICK SELECT AMOUNT
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {quickAmounts.map((item) => {
              const isSelected = numAmount === item.amount;
              return (
                <button
                  key={item.amount}
                  type="button"
                  onClick={() => handleQuickSelect(item.amount)}
                  style={{
                    position: 'relative',
                    padding: '12px 6px',
                    background: isSelected
                      ? 'rgba(16,185,129,0.12)'
                      : 'rgba(255,255,255,0.02)',
                    border: isSelected
                      ? '1px solid #10b981'
                      : '1px solid var(--card-border)',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(16,185,129,0.25)' : 'none',
                  }}
                >
                  {item.hot && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-4px',
                      background: 'linear-gradient(to right, #f97316, #ef4444)',
                      color: '#fff',
                      fontSize: '0.5rem',
                      fontWeight: '900',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                      zIndex: 2,
                    }}>🔥 HOT</div>
                  )}
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: '800',
                    color: isSelected ? '#10b981' : '#fff',
                  }}>₹{item.amount}</span>
                  <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* UPI ID Box */}
        <GlassCard style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px', display: 'block' }}>
            PAY TO UPI ID
          </span>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(16,185,129,0.05)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '10px',
            padding: '12px 14px',
          }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#10b981', fontFamily: 'monospace' }}>
              {appSettings?.upiId || 'Loading...'}
            </span>
            <button
              type="button"
              onClick={handleCopyUpi}
              style={{
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${copied ? '#10b981' : 'var(--card-border)'}`,
                color: copied ? '#10b981' : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* QR Code */}
          {appSettings?.qrUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
              <div style={{
                background: '#fff',
                padding: '10px',
                borderRadius: '16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
                display: 'inline-flex',
              }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appSettings.qrUrl)}`}
                  alt="UPI QR Code"
                  style={{ width: '130px', height: '130px', objectFit: 'contain', display: 'block' }}
                />
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px' }}>
                Scan with GPay · PhonePe · Paytm
              </span>
            </div>
          )}

          {/* Pay via UPI App button */}
          {canPayUpi && upiLink && (
            <button
              type="button"
              onClick={() => { window.location.href = upiLink; }}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '13px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: '800',
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(124,58,237,0.3)',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
            >
              <Zap size={16} />
              Pay ₹{amount} via UPI App
            </button>
          )}
        </GlassCard>

        {/* Deposit Form */}
        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <CreditCard size={18} color="#10b981" />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              SUBMIT DEPOSIT
            </span>
          </div>

          <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Amount */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                AMOUNT (₹)
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder={`Min ₹${minDeposit}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Payment Method */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                PAYMENT METHOD
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={inputStyle}
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="IMPS">IMPS Bank Transfer</option>
                <option value="Paytm">Paytm Wallet</option>
              </select>
            </div>

            {/* UTR Reference */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                UTR / TRANSACTION REFERENCE
              </label>
              <input
                type="text"
                required
                placeholder="Enter 12-digit UTR or UPI Ref ID"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading
                  ? 'var(--bg-tertiary)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                color: loading ? 'var(--text-muted)' : '#fff',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 18px rgba(16,185,129,0.35)',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                marginTop: '4px',
              }}
            >
              {loading ? 'Submitting...' : '✅ Submit Deposit Request'}
            </button>
          </form>
        </GlassCard>

      </div>

      <BottomNav />
    </div>
  );
};

export default Deposit;
