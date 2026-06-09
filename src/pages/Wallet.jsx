import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Send, 
  RefreshCw, 
  Info 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { db } from '../firebase/config';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';

const Wallet = () => {
  const { currentUser } = useAuth();
  const { wallet, requestDeposit, requestWithdrawal, showToast, appSettings } = useGame();
  
  // Local page tabs: 'deposit' | 'withdraw' | 'history'
  const [activeTab, setActiveTab] = useState('deposit');

  const quickAmounts = [
    { amount: 100, label: 'STARTER' },
    { amount: 300, label: 'POPULAR' },
    { amount: 500, label: 'BEST VALUE', hot: true },
    { amount: 1000, label: 'PREMIUM' },
    { amount: 2000, label: 'VIP' },
    { amount: 5000, label: 'ULTIMATE' },
  ];
  const [txHistory, setTxHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states - Deposit
  const [depAmount, setDepAmount] = useState('');
  const [depMethod, setDepMethod] = useState('UPI');
  const [depRef, setDepRef] = useState('');

  // Form states - Withdrawal
  const [witAmount, setWitAmount] = useState('');
  const [witMethod, setWitMethod] = useState('UPI Payout');
  const [witAddress, setWitAddress] = useState('');

  // Subscribe to transactions history specifically for this user
  useEffect(() => {
    if (!currentUser) return;

    const txQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(txQuery, (snapshot) => {
      setTxHistory(snapshot.docs.map(doc => doc.data()));
    }, (error) => console.error("Transaction loading failed:", error));

    return () => unsubscribe();
  }, [currentUser]);

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(depAmount);
    if (!amount || amount <= 0) return alert("Please enter a positive amount.");
    if (amount < appSettings.minDeposit) {
      return alert(`Minimum deposit amount is ₹${appSettings.minDeposit}`);
    }
    if (!depRef) return alert("Please enter UTR reference details.");

    setLoading(true);
    try {
      await requestDeposit(amount, depMethod, depRef);
      setDepAmount('');
      setDepRef('');
      setActiveTab('history');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(witAmount);
    if (!amount || amount <= 0) return alert("Please enter a positive amount.");
    if (amount < appSettings.minWithdrawal) {
      return alert(`Minimum withdrawal amount is ₹${appSettings.minWithdrawal}`);
    }
    if (!witAddress) return alert("Please enter a target address or details.");
    if (!wallet || wallet.balance < amount) return alert("Insufficient wallet balance.");
    if (wallet && wallet.wageringRequired > 0) {
      return alert(`Wagering requirement not met. Please place bets of at least ₹${wallet.wageringRequired.toFixed(2)} more before withdrawing.`);
    }

    setLoading(true);
    try {
      await requestWithdrawal(amount, witMethod, witAddress);
      setWitAmount('');
      setWitAddress('');
      setActiveTab('history');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '---';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const renderTabHeaderButton = (tabName, label, Icon) => {
    const isSelected = activeTab === tabName;
    return (
      <button
        onClick={() => setActiveTab(tabName)}
        style={{
          flex: 1,
          padding: '10px 4px',
          background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
          border: 'none',
          borderBottom: isSelected ? '2px solid var(--accent-gold)' : '2px solid transparent',
          color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
          fontWeight: isSelected ? '700' : '500',
          fontSize: '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.15s ease'
        }}
      >
        <Icon size={14} />
        {label}
      </button>
    );
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="content-container">
        
        {/* Wallet Balance Info */}
        <GlassCard style={{
          padding: '24px 20px',
          background: 'linear-gradient(135deg, rgba(31,27,53,0.6) 0%, rgba(11,9,20,0.8) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Coins size={36} color="var(--accent-gold)" style={{ filter: 'drop-shadow(0 0 10px var(--accent-gold))' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px' }}>
            TOTAL BALANCE
          </span>
          <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
            ₹{wallet ? wallet.balance.toFixed(2) : '0.00'}
          </span>
        </GlassCard>

        {/* Tab Selector */}
        <GlassCard style={{ display: 'flex', overflow: 'hidden', borderRadius: '12px', padding: '2px' }}>
          {renderTabHeaderButton('deposit', 'Deposit', ArrowDownLeft)}
          {renderTabHeaderButton('withdraw', 'Withdraw', ArrowUpRight)}
          {renderTabHeaderButton('history', 'Tx Log', History)}
        </GlassCard>

        {/* Tab Contents */}
        {activeTab === 'deposit' && (
          <GlassCard style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px', textAlign: 'center' }}>
              Submit Deposit Request
            </h3>

            <div style={{
              background: 'rgba(255,215,0,0.04)',
              border: '1px dashed rgba(255,215,0,0.2)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              display: 'flex',
              gap: '8px',
              alignItems: 'start'
            }}>
              <Info size={16} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>Depositing creates a pending ticket. Send money to the admin UPI ID or scan the QR code and paste the transaction reference (UTR) below for approval. Min Deposit: ₹{appSettings.minDeposit}.</span>
            </div>

            {/* Dynamic UPI & QR Code Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '6px', 
                background: 'rgba(255,255,255,0.02)', 
                padding: '12px', 
                borderRadius: '12px', 
                border: '1px solid var(--card-border)' 
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  ADMIN UPI ID (Send Payment Here)
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
                    {appSettings.upiId}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(appSettings.upiId);
                      alert("UPI ID copied successfully!");
                    }}
                    style={{ 
                      background: 'rgba(255, 215, 0, 0.1)', 
                      border: '1px solid rgba(255, 215, 0, 0.3)', 
                      color: 'var(--accent-gold)', 
                      fontSize: '0.7rem', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontWeight: '700'
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {appSettings.qrUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                  <div style={{ 
                    background: '#fff', 
                    padding: '8px', 
                    borderRadius: '16px', 
                    width: '136px', 
                    height: '136px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appSettings.qrUrl)}`} 
                      alt="UPI QR Code" 
                      style={{ width: '120px', height: '120px', objectFit: 'contain' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px' }}>
                    Scan QR using GooglePay, PhonePe or Paytm
                  </span>
                </div>
              )}

              {/* Direct UPI App Redirect Launcher */}
              {depAmount && Number(depAmount) >= appSettings.minDeposit && (
                <button
                  type="button"
                  onClick={() => {
                    const upiId = appSettings.upiId || '8406884196@ptaxis';
                    const upiLink = `upi://pay?pa=${upiId}&pn=DiceKing&am=${depAmount}&cu=INR&tn=Recharge_Wallet`;
                    window.location.href = upiLink;
                  }}
                  className="btn-gold"
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    marginBottom: '10px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🚀</span> Pay ₹{depAmount} via Installed UPI App
                </button>
              )}
            </div>

            <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>DEPOSIT AMOUNT (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 100"
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(19, 15, 36, 0.5)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />

                {/* Quick Select Amounts Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    QUICK SELECT AMOUNT
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {quickAmounts.map((item) => {
                      const isSelected = Number(depAmount) === item.amount;
                      return (
                        <button
                          key={item.amount}
                          type="button"
                          onClick={() => setDepAmount(item.amount.toString())}
                          style={{
                            position: 'relative',
                            padding: '10px 4px',
                            background: isSelected ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--card-border)',
                            borderRadius: '10px',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {item.hot && (
                            <div style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-4px',
                              background: 'linear-gradient(to right, #f97316, #ef4444)',
                              color: '#fff',
                              fontSize: '0.55rem',
                              fontWeight: '900',
                              padding: '1px 5px',
                              borderRadius: '10px',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                              zIndex: 2
                            }}>
                              🔥 HOT
                            </div>
                          )}
                          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: isSelected ? 'var(--accent-gold)' : '#fff' }}>
                            ₹{item.amount}
                          </span>
                          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PAYMENT METHOD</label>
                <select
                  value={depMethod}
                  onChange={(e) => setDepMethod(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(19, 15, 36, 0.5)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="UPI">UPI (GPay/Paytm/PhonePe)</option>
                  <option value="IMPS / Bank Transfer">IMPS / Bank Transfer</option>
                  <option value="Paytm Wallet Direct">Paytm Wallet Direct</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TRANSACTION REFERENCE</label>
                <input
                  type="text"
                  required
                  placeholder="Enter 12-digit UTR No. / UPI Ref ID"
                  value={depRef}
                  onChange={(e) => setDepRef(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(19, 15, 36, 0.5)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold"
                style={{ marginTop: '6px' }}
              >
                {loading ? 'Submitting...' : 'Submit Deposit'}
              </button>
            </form>
          </GlassCard>
        )}

        {activeTab === 'withdraw' && (
          <GlassCard style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px', textAlign: 'center' }}>
              Request Withdrawal
            </h3>

            {wallet && wallet.wageringRequired > 0 && (
              <div style={{
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                color: 'var(--accent-gold)',
                marginBottom: '14px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <Info size={16} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
                <span><strong>Play Requirement:</strong> Aapko withdraw karne ke liye kam se kam ₹{wallet.wageringRequired.toFixed(2)} ki bets aur lagani padengi.</span>
              </div>
            )}

            <div style={{
              background: 'rgba(239,68,68,0.04)',
              border: '1px dashed rgba(239,68,68,0.2)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              display: 'flex',
              gap: '8px',
              alignItems: 'start'
            }}>
              <Info size={16} color="var(--danger-red)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>Requested amounts are locked and deducted from your active balance immediately. Refunded on reject. Min Withdrawal: ₹{appSettings.minWithdrawal}.</span>
            </div>

            <form onSubmit={handleWithdrawalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>WITHDRAWAL AMOUNT (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 500"
                  value={witAmount}
                  onChange={(e) => setWitAmount(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(19, 15, 36, 0.5)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PAYOUT METHOD</label>
                <select
                  value={witMethod}
                  onChange={(e) => setWitMethod(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(19, 15, 36, 0.5)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="UPI Payout">UPI ID Payout</option>
                  <option value="Bank Account Transfer">IMPS Bank Transfer</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>UPI ID / BANK ACCOUNT DETAILS</label>
                <input
                  type="text"
                  required
                  placeholder="Enter UPI ID (e.g. name@upi) or Bank A/C No + IFSC"
                  value={witAddress}
                  onChange={(e) => setWitAddress(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(19, 15, 36, 0.5)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold"
                style={{ marginTop: '6px', background: 'linear-gradient(135deg, var(--danger-red) 0%, #b91c1c 100%)', boxShadow: 'none', color: '#fff' }}
              >
                {loading ? 'Submitting...' : 'Request Payout'}
              </button>
            </form>
          </GlassCard>
        )}

        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
              TRANSACTION LOGS
            </h3>

            {txHistory.length === 0 ? (
              <GlassCard style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No transactions recorded yet.
              </GlassCard>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {txHistory.map(tx => {
                  const isPositive = tx.amount > 0;
                  return (
                    <GlassCard 
                      key={tx.id} 
                      style={{ 
                        padding: '12px 14px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${isPositive ? 'var(--success-emerald)' : 'var(--danger-red)'}`,
                          padding: '6px',
                          borderRadius: '8px',
                          color: isPositive ? 'var(--success-emerald)' : 'var(--danger-red)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isPositive ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                            {tx.description}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {formatDate(tx.createdAt)} • Type: <span style={{ textTransform: 'uppercase' }}>{tx.type}</span>
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: '800', 
                          color: isPositive ? 'var(--success-emerald)' : 'var(--danger-red)' 
                        }}>
                          {isPositive ? '+' : ''}₹{tx.amount.toFixed(2)}
                        </span>
                        <span style={{
                          fontSize: '0.6rem',
                          fontWeight: '700',
                          color: tx.status === 'success' ? 'var(--success-emerald)' : tx.status === 'pending' ? 'var(--accent-gold)' : 'var(--danger-red)',
                          textTransform: 'uppercase'
                        }}>
                          {tx.status}
                        </span>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  );
};

export default Wallet;
