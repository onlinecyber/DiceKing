import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Info, Banknote, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { WithdrawalHistoryCard } from '../components/Common/HistoryCards';

const inputStyle = {
  background: 'rgba(19, 15, 36, 0.6)',
  border: '1px solid var(--card-border)',
  borderRadius: '10px',
  padding: '11px 13px',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  width: '100%',
  fontFamily: 'inherit',
  outline: 'none',
};

const quickAmounts = [100, 500, 1000, 2000];

const Withdraw = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'history' ? 'history' : 'withdraw';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { currentUser, profile } = useAuth();
  const { requestWithdrawal, bindPayoutAccount, showToast, appSettings, wallet } = useGame();

  // Withdraw amount state
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Binding Form states (for users who haven't bound yet)
  const [bindMethod, setBindMethod] = useState('upi'); // 'upi' or 'bank'
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [holderName, setHolderName] = useState('');
  const [bindingLoading, setBindingLoading] = useState(false);

  // Withdrawal History state
  const [withdrawals, setWithdrawals] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Check if user has permanently bound payout details
  const boundPayout = profile?.boundPayout || null;

  // Real-time listener for user's withdrawal history
  useEffect(() => {
    if (!currentUser) return;
    setHistoryLoading(true);

    const q = query(
      collection(db, 'withdrawals'),
      where('uid', '==', currentUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort descending by creation time in memory
        const sorted = docs.sort((a, b) => {
          const tA = a.createdAt?.seconds || (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : 0);
          const tB = b.createdAt?.seconds || (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : 0);
          return tB - tA;
        });
        setWithdrawals(sorted);
        setHistoryLoading(false);
      },
      (err) => {
        console.error('Failed to load withdrawals', err);
        setHistoryLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  const minWithdrawal = appSettings?.minWithdrawal || 100;
  const numAmount = Number(amount);
  const balance = wallet?.balance || 0;
  const wageringRequired = wallet?.wageringRequired || 0;

  // Handle Permanent Binding Submission (First-time binding with duplicate validation)
  const handleBindSubmit = async (e) => {
    e.preventDefault();
    if (bindMethod === 'upi') {
      if (!upiId.trim() || !upiName.trim()) {
        showToast ? showToast('Please enter both UPI ID and Account Name.', 'error') : alert('Please enter both UPI ID and Account Name.');
        return;
      }
    } else {
      if (!bankAcc.trim() || !bankIfsc.trim() || !bankName.trim() || !holderName.trim()) {
        showToast ? showToast('Please fill all Bank details.', 'error') : alert('Please fill all Bank details.');
        return;
      }
    }

    setBindingLoading(true);
    try {
      if (bindMethod === 'upi') {
        await bindPayoutAccount({
          method: 'upi',
          upiId: upiId.trim(),
          upiName: upiName.trim(),
        });
      } else {
        await bindPayoutAccount({
          method: 'bank',
          accountNumber: bankAcc.trim(),
          ifsc: bankIfsc.trim(),
          bankName: bankName.trim(),
          holderName: holderName.trim(),
        });
      }
    } catch (err) {
      console.error('Binding error:', err);
    } finally {
      setBindingLoading(false);
    }
  };

  // Handle Withdrawal Request using the permanently bound account
  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();

    if (!boundPayout) {
      showToast ? showToast('Please bind your payout details first.', 'error') : alert('Please bind your payout details first.');
      return;
    }

    if (!numAmount || numAmount <= 0) {
      showToast ? showToast('Please enter a valid amount.', 'error') : alert('Please enter a valid amount.');
      return;
    }
    if (numAmount < minWithdrawal) {
      const msg = `Minimum withdrawal is ₹${minWithdrawal}`;
      showToast ? showToast(msg, 'error') : alert(msg);
      return;
    }
    if (balance < numAmount) {
      const msg = 'Insufficient wallet balance.';
      showToast ? showToast(msg, 'error') : alert(msg);
      return;
    }
    if (wageringRequired > 0) {
      const msg = `Play ₹${wageringRequired.toFixed(2)} more before withdrawing.`;
      showToast ? showToast(msg, 'error') : alert(msg);
      return;
    }

    setLoading(true);
    try {
      const payoutMethod = boundPayout.method === 'upi' ? 'UPI Payout' : 'Bank Account Transfer';
      const payoutInfo = JSON.stringify(boundPayout);
      await requestWithdrawal(numAmount, payoutMethod, payoutInfo);
      setAmount('');
      // Switch view to history so user immediately sees their submitted order
      setActiveTab('history');
      setSearchParams({ tab: 'history' });
    } catch (err) {
      console.error('Withdrawal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeTab === 'history') {
      setActiveTab('withdraw');
      setSearchParams({});
    } else {
      navigate('/wallet');
    }
  };

  const toggleTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'history' ? { tab: 'history' } : {});
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="content-container">

        {/* Top Header matching Screenshot 1 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 0',
        }}>
          {/* Back button + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleBack}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--card-border)',
                borderRadius: '10px',
                padding: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <h1 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', margin: 0 }}>
              {activeTab === 'history' ? 'Withdrawal history' : 'Withdraw'}
            </h1>
          </div>

          {/* Top Right Tab Switcher */}
          <button
            onClick={() => toggleTab(activeTab === 'history' ? 'withdraw' : 'history')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'history' ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 8px',
            }}
          >
            {activeTab === 'history' ? (
              <>💸 Withdraw</>
            ) : (
              <>Withdrawal history</>
            )}
          </button>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: WITHDRAWAL HISTORY (Screenshot 1 Match)               */}
        {/* ============================================================== */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Title with Document Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', marginBottom: '2px' }}>
              <FileText size={18} color="#38bdf8" />
              <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>
                Withdrawal history
              </span>
            </div>

            {/* List of Withdrawal Cards */}
            {historyLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map((i) => (
                  <GlassCard key={i} style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
                    <div className="dice-cube" style={{ width: '20px', height: '20px', animation: 'dice-spin 1s linear infinite' }} />
                  </GlassCard>
                ))}
              </div>
            ) : withdrawals.length === 0 ? (
              <GlassCard style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📄</div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  No withdrawal records found
                </span>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Your payout requests will appear here with live tracking.
                </p>
              </GlassCard>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
                {withdrawals.map((item) => (
                  <WithdrawalHistoryCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: WITHDRAWAL FORM (Permanent Binding Mode)               */}
        {/* ============================================================== */}
        {activeTab === 'withdraw' && (
          <>
            {/* Available Balance Card */}
            <GlassCard
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(11,9,20,0.9) 100%)',
                border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: '700', letterSpacing: '1.5px' }}>
                AVAILABLE BALANCE
              </span>
              <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
                ₹{balance.toFixed(2)}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {currentUser?.email || ''}
              </span>
            </GlassCard>

            {/* Wagering Requirement Warning */}
            {wageringRequired > 0 && (
              <div
                style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                <Info size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f59e0b', marginBottom: '2px' }}>
                    Wagering Requirement Active
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Play <strong style={{ color: '#f59e0b' }}>₹{wageringRequired.toFixed(2)}</strong> more before you can withdraw.
                  </p>
                </div>
              </div>
            )}

            {/* Info Note */}
            <div
              style={{
                background: 'rgba(239,68,68,0.04)',
                border: '1px dashed rgba(239,68,68,0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <Info size={15} color="#ef4444" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                Min withdrawal <strong style={{ color: '#ef4444' }}>₹{minWithdrawal}</strong>. Processed directly to your bound account.
              </span>
            </div>

            {/* Quick Amount Chips */}
            <GlassCard style={{ padding: '16px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-secondary)',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  marginBottom: '10px',
                  display: 'block',
                }}
              >
                QUICK AMOUNT
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {quickAmounts.map((val) => {
                  const isSelected = numAmount === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val.toString())}
                      style={{
                        padding: '10px 4px',
                        background: isSelected ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid #ef4444' : '1px solid var(--card-border)',
                        borderRadius: '10px',
                        color: isSelected ? '#ef4444' : '#fff',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '0.82rem',
                        transition: 'all 0.18s ease',
                        boxShadow: isSelected ? '0 0 10px rgba(239,68,68,0.2)' : 'none',
                        fontFamily: 'inherit',
                      }}
                    >
                      ₹{val}
                    </button>
                  );
                })}
              </div>
            </GlassCard>

            {/* ============================================================== */}
            {/* SUB-SECTION A: USER HAS BOUND ACCOUNT (PERMANENT LOCKED VIEW)  */}
            {/* ============================================================== */}
            {boundPayout ? (
              <GlassCard style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Bound Account Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color="#10b981" />
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fff' }}>
                      BOUND PAYOUT ACCOUNT
                    </span>
                  </div>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Lock size={10} /> PERMANENTLY BOUND
                  </span>
                </div>

                {/* Account Details Box */}
                <div
                  style={{
                    background: '#131b2e',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {boundPayout.method === 'upi' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Payout Method</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#38bdf8' }}>UPI ID</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>UPI ID</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>
                          {boundPayout.upiId}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Account Name</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1' }}>
                          {boundPayout.upiName}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Payout Method</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#38bdf8' }}>IMPS Bank Card</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Bank Name</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fff' }}>
                          {boundPayout.bankName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Account Number</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fbbf24', letterSpacing: '1px' }}>
                          •••• •••• {String(boundPayout.accountNumber || '').slice(-4)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>IFSC Code</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1' }}>
                          {boundPayout.ifsc}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Holder Name</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1' }}>
                          {boundPayout.holderName}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
                  🔒 Payout will be sent directly to this account. To change payout details, please contact Support.
                </p>

                {/* Amount Input & Request Payout Button */}
                <form onSubmit={handleWithdrawalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                      WITHDRAWAL AMOUNT (₹)
                    </label>
                    <input
                      type="number"
                      min={minWithdrawal}
                      required
                      placeholder={`Enter amount (Min ₹${minWithdrawal})`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
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
                        : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
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
                        boxShadow: loading ? 'none' : '0 4px 18px rgba(239,68,68,0.3)',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease',
                        marginTop: '2px',
                    }}
                  >
                    {loading ? 'Processing Payout...' : '💸 Request Payout'}
                  </button>
                </form>
              </GlassCard>
            ) : (
              /* ============================================================== */
              /* SUB-SECTION B: FIRST-TIME PERMANENT BINDING SETUP             */
              /* ============================================================== */
              <GlassCard style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Banknote size={18} color="#ef4444" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    BIND PAYOUT ACCOUNT
                  </span>
                </div>

                {/* Important Binding Notice */}
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.06)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '16px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                  }}
                >
                  <Lock size={15} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.72rem', color: '#e0f2fe', lineHeight: 1.4 }}>
                    <strong>Permanent Binding Notice:</strong> You only need to fill your payout details once. It will be permanently locked to your account for future 1-click withdrawals. Each UPI or Bank can only be linked to one account.
                  </span>
                </div>

                <form onSubmit={handleBindSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Select Method */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                      SELECT PAYOUT METHOD
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setBindMethod('upi')}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          border: bindMethod === 'upi' ? '1px solid #38bdf8' : '1px solid var(--card-border)',
                          background: bindMethod === 'upi' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.02)',
                          color: bindMethod === 'upi' ? '#38bdf8' : '#cbd5e1',
                          fontWeight: '700',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        UPI ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setBindMethod('bank')}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          border: bindMethod === 'bank' ? '1px solid #38bdf8' : '1px solid var(--card-border)',
                          background: bindMethod === 'bank' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.02)',
                          color: bindMethod === 'bank' ? '#38bdf8' : '#cbd5e1',
                          fontWeight: '700',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        Bank Account
                      </button>
                    </div>
                  </div>

                  {bindMethod === 'upi' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                          UPI ID
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. yourname@okaxis"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          value={upiName}
                          onChange={(e) => setUpiName(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                          Bank Account Number
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter account number"
                          value={bankAcc}
                          onChange={(e) => setBankAcc(e.target.value)}
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. SBIN0001234"
                          value={bankIfsc}
                          onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                          Bank Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. State Bank of India"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Full name as in bank account"
                          value={holderName}
                          onChange={(e) => setHolderName(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={bindingLoading}
                    style={{
                      width: '100%',
                      padding: '13px',
                      background: bindingLoading
                        ? 'var(--bg-tertiary)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: bindingLoading ? 'var(--text-muted)' : '#fff',
                      fontWeight: '800',
                      fontSize: '0.95rem',
                      cursor: bindingLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: bindingLoading ? 'none' : '0 4px 18px rgba(16,185,129,0.3)',
                      fontFamily: 'inherit',
                      marginTop: '6px',
                    }}
                  >
                    {bindingLoading ? 'Verifying & Binding...' : '🔒 Bind Payout Details Permanently'}
                  </button>
                </form>
              </GlassCard>
            )}
          </>
        )}

      </div>

      <BottomNav />
    </div>
  );
};

export default Withdraw;
