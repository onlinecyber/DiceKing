import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ShieldAlert, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Layers, 
  RefreshCw,
  Settings,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { db } from '../firebase/config';
import { useGame } from '../context/GameContext';
import { callApi } from '../firebase/api';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';
import StatsCard from '../components/Admin/StatsCard';
import TransactionRow from '../components/Admin/TransactionRow';

const Admin = () => {
  // Page Tabs: 'overview' | 'deposits' | 'withdrawals' | 'users'
  const [activeTab, setActiveTab] = useState('overview');
  
  // Real-time Lists
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Support & Settings states
  const { appSettings, saveAppSettings } = useGame();
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [adminSettings, setAdminSettings] = useState({
    upiId: '',
    qrUrl: '',
    minDeposit: 100,
    minWithdrawal: 100,
    supportPhone: '',
    supportTelegram: ''
  });

  // Dashboard Stats State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Standalone Backend API Calls Bindings
  const getAdminDashboardStatsFn = (data) => callApi('getAdminDashboardStats', data);
  const adminApproveDepositFn = (data) => callApi('adminApproveDeposit', data);
  const adminRejectDepositFn = (data) => callApi('adminRejectDeposit', data);
  const adminApproveWithdrawalFn = (data) => callApi('adminApproveWithdrawal', data);
  const adminRejectWithdrawalFn = (data) => callApi('adminRejectWithdrawal', data);

  // Load dashboard statistics
  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const result = await getAdminDashboardStatsFn();
      setStats(result.data);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Subscribe to Pending Deposits
  useEffect(() => {
    const depQuery = query(
      collection(db, 'deposits'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(depQuery, (snapshot) => {
      setPendingDeposits(snapshot.docs.map(doc => doc.data()));
    }, (error) => console.error("Deposits snapshot error:", error));

    return () => unsubscribe();
  }, []);

  // Subscribe to Pending Withdrawals
  useEffect(() => {
    const witQuery = query(
      collection(db, 'withdrawals'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(witQuery, (snapshot) => {
      setPendingWithdrawals(snapshot.docs.map(doc => doc.data()));
    }, (error) => console.error("Withdrawals snapshot error:", error));

    return () => unsubscribe();
  }, []);

  // Subscribe to Users List
  useEffect(() => {
    const userQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(userQuery, (snapshot) => {
      setUsersList(snapshot.docs.map(doc => doc.data()));
    }, (error) => console.error("Users list snapshot error:", error));

    return () => unsubscribe();
  }, []);

  // Sync settings configuration from game context
  useEffect(() => {
    if (appSettings) {
      setAdminSettings({
        upiId: appSettings.upiId || '',
        qrUrl: appSettings.qrUrl || '',
        minDeposit: appSettings.minDeposit || 100,
        minWithdrawal: appSettings.minWithdrawal || 100,
        supportPhone: appSettings.supportPhone || '',
        supportTelegram: appSettings.supportTelegram || ''
      });
    }
  }, [appSettings]);

  // Subscribe to all customer support tickets
  useEffect(() => {
    const supportQuery = query(
      collection(db, 'supportTickets'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(supportQuery, (snapshot) => {
      setSupportTickets(snapshot.docs.map(doc => doc.data()));
    }, (error) => console.error("Support tickets snapshot error:", error));
    
    return () => unsubscribe();
  }, []);

  // Approval/Rejection Actions
  const handleApproveDeposit = async (depositId) => {
    await adminApproveDepositFn({ depositId });
    fetchDashboardStats(); // Refresh counters
  };

  const handleRejectDeposit = async (depositId) => {
    await adminRejectDepositFn({ depositId });
    fetchDashboardStats();
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    await adminApproveWithdrawalFn({ withdrawalId });
    fetchDashboardStats();
  };

  const handleRejectWithdrawal = async (withdrawalId, reason) => {
    await adminRejectWithdrawalFn({ withdrawalId, reason });
    fetchDashboardStats();
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveAppSettings(adminSettings);
      alert("Settings saved successfully!");
    } catch (error) {
      alert("Failed to save settings: " + error.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        status: 'resolved',
        reply: replyText,
        resolvedAt: serverTimestamp()
      });
      alert("Reply sent and ticket resolved!");
      setSelectedTicket(null);
      setReplyText('');
    } catch (error) {
      alert("Failed to send reply: " + error.message);
    }
  };

  const renderTabButton = (tabName, label) => {
    const isSelected = activeTab === tabName;
    return (
      <button
        onClick={() => setActiveTab(tabName)}
        style={{
          padding: '6px 12px',
          background: isSelected ? 'var(--accent-gold)' : 'transparent',
          border: '1px solid',
          borderColor: isSelected ? 'var(--accent-gold)' : 'var(--card-border)',
          borderRadius: '8px',
          color: isSelected ? '#000' : 'var(--text-primary)',
          fontSize: '0.75rem',
          fontWeight: isSelected ? '700' : '500',
          cursor: 'pointer'
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="content-container">
        
        {/* Title Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--danger-red)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Admin Dashboard</h2>
          </div>
          
          <button 
            disabled={statsLoading}
            onClick={fetchDashboardStats}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: statsLoading ? 'dice-spin 1s linear infinite' : 'none'
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {renderTabButton('overview', 'Overview')}
          {renderTabButton('deposits', `Deposits (${pendingDeposits.length})`)}
          {renderTabButton('withdrawals', `Withdrawals (${pendingWithdrawals.length})`)}
          {renderTabButton('users', `Users (${usersList.length})`)}
          {renderTabButton('support', `Support (${supportTickets.filter(t => t.status === 'pending').length})`)}
          {renderTabButton('settings', 'Settings')}
        </div>

        {/* Tab Content Panels */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <StatsCard title="Total Players" value={stats.totalUsers} icon={Users} color="#60a5fa" />
                  <StatsCard 
                    title="House Revenue" 
                    value={`₹${stats.houseRevenue.toFixed(2)}`} 
                    icon={TrendingUp} 
                    color={stats.houseRevenue >= 0 ? 'var(--success-emerald)' : 'var(--danger-red)'} 
                  />
                  <StatsCard title="Total Bets Volume" value={`₹${stats.totalBetsVolume.toFixed(2)}`} icon={DollarSign} color="var(--accent-gold)" />
                  <StatsCard title="PBP Payouts" value={`₹${stats.totalBetsPayout.toFixed(2)}`} icon={Layers} color="#8b5cf6" />
                  <StatsCard title="Total Deposits" value={`₹${stats.totalDeposits.toFixed(2)}`} icon={ArrowDownLeft} color="var(--success-emerald)" />
                  <StatsCard title="Total Withdrawals" value={`₹${stats.totalWithdrawals.toFixed(2)}`} icon={ArrowUpRight} color="var(--danger-red)" />
                </div>
                
                <GlassCard style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    PENDING CASHIER TICKETS
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Pending Deposit Tickets:</span>
                    <span style={{ fontWeight: '800', color: stats.pendingDeposits > 0 ? 'var(--accent-gold)' : 'inherit' }}>
                      {stats.pendingDeposits}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Pending Payout Tickets:</span>
                    <span style={{ fontWeight: '800', color: stats.pendingWithdrawals > 0 ? 'var(--danger-red)' : 'inherit' }}>
                      {stats.pendingWithdrawals}
                    </span>
                  </div>
                </GlassCard>
              </>
            ) : (
              <GlassCard style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {statsLoading ? 'Loading statistics...' : 'Stats unavailable. Try reloading.'}
              </GlassCard>
            )}
          </div>
        )}

        {activeTab === 'deposits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1.2px' }}>
              PENDING DEPOSIT APPROVALS
            </h3>
            {pendingDeposits.length === 0 ? (
              <GlassCard style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No pending deposit tickets.
              </GlassCard>
            ) : (
              pendingDeposits.map(d => (
                <TransactionRow 
                  key={d.id} 
                  tx={d} 
                  type="deposit" 
                  onApprove={handleApproveDeposit} 
                  onReject={handleRejectDeposit} 
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1.2px' }}>
              PENDING WITHDRAWAL APPROVALS
            </h3>
            {pendingWithdrawals.length === 0 ? (
              <GlassCard style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No pending withdrawal tickets.
              </GlassCard>
            ) : (
              pendingWithdrawals.map(w => (
                <TransactionRow 
                  key={w.id} 
                  tx={w} 
                  type="withdrawal" 
                  onApprove={handleApproveWithdrawal} 
                  onReject={handleRejectWithdrawal} 
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1.2px' }}>
              REGISTERED USERS ({usersList.length})
            </h3>
            <GlassCard style={{ padding: '10px 16px', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {usersList.map((usr, index) => (
                  <div 
                    key={usr.uid} 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      padding: '6px 0',
                      borderBottom: index < usersList.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                        {usr.displayName}
                      </span>
                      <span style={{ 
                        fontSize: '0.6rem', 
                        fontWeight: '700', 
                        color: usr.role === 'admin' ? 'var(--danger-red)' : 'var(--text-muted)',
                        textTransform: 'uppercase'
                      }}>
                        {usr.role}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Email: {usr.email}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                      UID: {usr.uid}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Support Tickets Panel */}
        {activeTab === 'support' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1.2px' }}>
              CUSTOMER SUPPORT TICKETS
            </h3>

            {selectedTicket ? (
              <GlassCard style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <button 
                    onClick={() => { setSelectedTicket(null); setReplyText(''); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700' }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Ticket ID: {selectedTicket.id?.slice(-8).toUpperCase()}</span>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>USER: {selectedTicket.userName} ({selectedTicket.userEmail})</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', display: 'block', margin: '4px 0' }}>{selectedTicket.subject}</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{selectedTicket.message}</p>
                </div>

                <form onSubmit={handleReplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>WRITE REPLY</label>
                    <textarea
                      required
                      placeholder="Write your response to the user..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      style={{
                        background: 'rgba(19, 15, 36, 0.5)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        minHeight: '80px',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <button type="submit" className="btn-gold" style={{ padding: '8px' }}>
                    Send Reply & Resolve Ticket
                  </button>
                </form>
              </GlassCard>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {supportTickets.length === 0 ? (
                  <GlassCard style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No support tickets found.
                  </GlassCard>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                    {supportTickets.map((t, idx) => (
                      <GlassCard 
                        key={t.id || idx} 
                        onClick={() => t.status === 'pending' && setSelectedTicket(t)}
                        style={{ 
                          padding: '12px 14px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '6px',
                          cursor: t.status === 'pending' ? 'pointer' : 'default',
                          border: t.status === 'pending' ? '1px solid rgba(255, 215, 0, 0.15)' : '1px solid var(--card-border)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>{t.subject}</span>
                          <span style={{
                            fontSize: '0.6rem',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            background: t.status === 'resolved' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                            color: t.status === 'resolved' ? 'var(--success-emerald)' : 'var(--accent-gold)'
                          }}>
                            {t.status}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          User: {t.userName} ({t.userEmail})
                        </span>

                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.message}
                        </p>

                        {t.reply && (
                          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '4px', marginTop: '2px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>REPLY:</span> {t.reply}
                          </div>
                        )}
                      </GlassCard>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Platform Settings Panel */}
        {activeTab === 'settings' && (
          <GlassCard style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Settings size={18} color="var(--accent-gold)" /> Platform Settings
            </h3>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>UPI ID FOR DEPOSITS</label>
                  <input
                    type="text"
                    required
                    value={adminSettings.upiId}
                    onChange={e => setAdminSettings({...adminSettings, upiId: e.target.value})}
                    style={{
                      background: 'rgba(19, 15, 36, 0.5)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>MIN DEPOSIT (₹)</label>
                  <input
                    type="number"
                    required
                    value={adminSettings.minDeposit}
                    onChange={e => setAdminSettings({...adminSettings, minDeposit: Number(e.target.value)})}
                    style={{
                      background: 'rgba(19, 15, 36, 0.5)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>MIN WITHDRAWAL (₹)</label>
                  <input
                    type="number"
                    required
                    value={adminSettings.minWithdrawal}
                    onChange={e => setAdminSettings({...adminSettings, minWithdrawal: Number(e.target.value)})}
                    style={{
                      background: 'rgba(19, 15, 36, 0.5)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>SUPPORT WHATSAPP (NO COUNTRY CODE)</label>
                  <input
                    type="text"
                    required
                    value={adminSettings.supportPhone}
                    onChange={e => setAdminSettings({...adminSettings, supportPhone: e.target.value})}
                    style={{
                      background: 'rgba(19, 15, 36, 0.5)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>SUPPORT TELEGRAM LINK</label>
                  <input
                    type="text"
                    required
                    value={adminSettings.supportTelegram}
                    onChange={e => setAdminSettings({...adminSettings, supportTelegram: e.target.value})}
                    style={{
                      background: 'rgba(19, 15, 36, 0.5)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>QR CODE DATA / PAYMENT URL</label>
                  <textarea
                    required
                    value={adminSettings.qrUrl}
                    onChange={e => setAdminSettings({...adminSettings, qrUrl: e.target.value})}
                    style={{
                      background: 'rgba(19, 15, 36, 0.5)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      minHeight: '60px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="btn-gold"
                style={{ padding: '10px' }}
              >
                {savingSettings ? 'Saving Settings...' : 'Save Settings'}
              </button>
            </form>
          </GlassCard>
        )}

      </div>

      <BottomNav />
    </div>
  );
};

export default Admin;
