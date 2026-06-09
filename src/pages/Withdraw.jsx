import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Banknote, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

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

const quickAmounts = [100, 500, 1000, 2000];

const Withdraw = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { requestWithdrawal, showToast, appSettings, wallet } = useGame();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI Payout');
  const [address, setAddress] = useState(''); // for UPI ID
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [existingBanks, setExistingBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bankSaved, setBankSaved] = useState(false); // track if bank details saved

  // Fetch existing bank accounts to prevent duplicates
  useEffect(() => {
    if (!currentUser) return;
    const fetchBanks = async () => {
      try {
        const q = query(
          collection(db, 'bankAccounts'),
          where('uid', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const banks = snap.docs.map((d) => d.data());
        setExistingBanks(banks);
      } catch (e) {
        console.error('Failed to load bank accounts', e);
      }
    };
    fetchBanks();
  }, [currentUser]);

  // Save bank details without withdrawal
  const handleSaveBank = async () => {
    if (!bankAcc.trim() || !bankIfsc.trim() || !bankName.trim()) {
      const msg = 'Please fill all bank details (Account No, IFSC, Bank Name).';
      showToast ? showToast(msg, 'error') : alert(msg);
      return;
    }
    const duplicate = existingBanks.some(
      (b) => b.accountNumber === bankAcc.trim() && b.ifsc === bankIfsc.trim()
    );
    if (duplicate) {
      const msg = 'This bank account is already added to your profile.';
      showToast ? showToast(msg, 'error') : alert(msg);
      return;
    }
    try {
      await addDoc(collection(db, 'bankAccounts'), {
        uid: currentUser.uid,
        accountNumber: bankAcc.trim(),
        ifsc: bankIfsc.trim(),
        bankName: bankName.trim(),
        createdAt: serverTimestamp(),
      });
      setBankSaved(true);
      showToast ? showToast('Bank details saved!', 'success') : alert('Bank details saved!');
    } catch (e) {
      console.error('Failed to save bank account', e);
      showToast ? showToast('Failed to save bank details.', 'error') : alert('Failed to save bank details.');
    }
  };

  const minWithdrawal = appSettings?.minWithdrawal || 100;
  const numAmount = Number(amount);
  const balance = wallet?.balance || 0;
  const wageringRequired = wallet?.wageringRequired || 0;

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();

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
    if (!address.trim() && method === 'UPI Payout') {
      showToast ? showToast('Please enter your UPI ID.', 'error') : alert('Please enter your UPI ID.');
      return;
    }
    if (method === 'Bank Account Transfer') {
      if (!bankAcc.trim() || !bankIfsc.trim() || !bankName.trim()) {
        const msg = 'Please fill all bank details (Account No, IFSC, Bank Name).';
        showToast ? showToast(msg, 'error') : alert(msg);
        return;
      }
      // Prevent duplicate bank
      const duplicate = existingBanks.some(
        (b) => b.accountNumber === bankAcc.trim() && b.ifsc === bankIfsc.trim()
      );
      if (duplicate) {
        const msg = 'This bank account is already added to your profile.';
        showToast ? showToast(msg, 'error') : alert(msg);
        return;
      }
    }

    setLoading(true);
    try {
            const payoutInfo = method === 'UPI Payout' ? address.trim() : JSON.stringify({ accountNumber: bankAcc.trim(), ifsc: bankIfsc.trim(), bankName: bankName.trim() });
      await requestWithdrawal(numAmount, method, payoutInfo);
      // Save bank details for future reference (avoid duplicates already checked)
      if (method === 'Bank Account Transfer') {
        try {
          await addDoc(collection(db, 'bankAccounts'), {
            uid: currentUser.uid,
            accountNumber: bankAcc.trim(),
            ifsc: bankIfsc.trim(),
            bankName: bankName.trim(),
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.error('Failed to save bank account', e);
        }
      }
      navigate('/wallet');
    } catch (err) {
      console.error('Withdrawal error:', err);
    } finally {
      setLoading(false);
    }
  };

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
            <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ef4444' }}>Withdraw</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Request a payout to your account</p>
          </div>
        </div>

        {/* Balance Card */}
        <GlassCard style={{
          padding: '22px 20px',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(11,9,20,0.9) 100%)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}>
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

        {/* Wagering Warning */}
        {wageringRequired > 0 && (
          <div style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}>
            <Info size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f59e0b', marginBottom: '2px' }}>
                Wagering Requirement Active
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Play <strong style={{ color: '#f59e0b' }}>₹{wageringRequired.toFixed(2)}</strong> more before you can withdraw.
              </p>
            </div>
          </div>
        )}

        {/* Info Note */}
        <div style={{
          background: 'rgba(239,68,68,0.04)',
          border: '1px dashed rgba(239,68,68,0.25)',
          borderRadius: '10px',
          padding: '12px 14px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
        }}>
          <Info size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Min withdrawal <strong style={{ color: '#ef4444' }}>₹{minWithdrawal}</strong>. Amount deducted instantly, refunded if rejected.
          </span>
        </div>

        {/* Quick Amount Chips */}
        <GlassCard style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px', display: 'block' }}>
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

        {/* Withdrawal Form */}
        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Banknote size={18} color="#ef4444" />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              PAYOUT DETAILS
            </span>
          </div>

          <form onSubmit={handleWithdrawalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Amount */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                WITHDRAWAL AMOUNT (₹)
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder={`Min ₹${minWithdrawal}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Payout Method */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                PAYOUT METHOD
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={inputStyle}
              >
                <option value="UPI Payout">UPI ID Payout</option>
                <option value="Bank Account Transfer">IMPS Bank Transfer</option>
              </select>
            </div>

            {/* Conditional Fields based on payout method */}
            {method === 'UPI Payout' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                  UPI ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. name@upi"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={inputStyle}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                  Bank Account Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="Account Number"
                  value={bankAcc}
                  onChange={(e) => setBankAcc(e.target.value)}
                  style={inputStyle}
                />
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                  IFSC Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="IFSC"
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value)}
                  style={inputStyle}
                />
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  style={inputStyle}
                />
                {/* Save Bank Details Button */}
                <button
                  type="button"
                  onClick={handleSaveBank}
                  disabled={loading || bankSaved}
                  className="btn-outline"
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    padding: '10px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                  }}
                >
                  {bankSaved ? 'Saved' : 'Save Bank Details'}
                </button>
              </div>
            )}

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
                marginTop: '4px',
              }}
            >
              {loading ? 'Processing...' : '💸 Request Payout'}
            </button>
          </form>
        </GlassCard>

      </div>

      <BottomNav />
    </div>
  );
};

export default Withdraw;
