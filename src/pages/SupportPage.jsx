import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  ArrowLeft, 
  HelpCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { db } from '../firebase/config';
import GlassCard from '../components/Common/GlassCard';
import Navbar from '../components/Common/Navbar';
import BottomNav from '../components/Common/BottomNav';

const SupportPage = () => {
  const navigate = useNavigate();
  const { currentUser, profile } = useAuth();
  const { appSettings, submitSupportTicket, showToast } = useGame();

  // Form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const subjects = [
    'Deposit Issue / Paise add nahi hue',
    'Withdrawal Issue / Paisa nikal nahi rha',
    'Game / Bet Play Query',
    'Other Support Query'
  ];

  // Subscribe to user's support tickets
  useEffect(() => {
    if (!currentUser) return;

    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      setTickets(snapshot.docs.map(doc => doc.data()));
      setLoadingTickets(false);
    }, (error) => {
      console.error("Support tickets loading error:", error);
      setLoadingTickets(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject) return alert("Please select a subject.");
    if (!message.trim()) return alert("Please enter your message.");

    setLoading(true);
    try {
      await submitSupportTicket(subject, message);
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    const text = encodeURIComponent(`Hello support, I need help with my Dice King account (Email: ${currentUser?.email || 'N/A'}).`);
    window.open(`https://wa.me/91${appSettings.supportPhone}?text=${text}`, '_blank');
  };

  const handleTelegramClick = () => {
    window.open(appSettings.supportTelegram, '_blank');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just Now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="content-container">
        
        {/* Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <HelpCircle size={20} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Customer Support</h2>
        </div>

        {/* 1. Quick Chat Social Channels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {/* WhatsApp Card */}
          <GlassCard 
            onClick={handleWhatsAppClick}
            interactive={true} 
            style={{ 
              padding: '16px 12px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              background: 'rgba(16, 185, 129, 0.04)'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>💬</span>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--success-emerald)' }}>WhatsApp</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Click to Chat</span>
          </GlassCard>

          {/* Telegram Card */}
          <GlassCard 
            onClick={handleTelegramClick}
            interactive={true} 
            style={{ 
              padding: '16px 12px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              background: 'rgba(56, 189, 248, 0.04)'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>✈️</span>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#38bdf8' }}>Telegram</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Join Channel</span>
          </GlassCard>
        </div>

        {/* 2. Raise Ticket Form */}
        <GlassCard style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={16} color="var(--accent-gold)" /> Raise a Ticket
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>SUBJECT</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(19, 15, 36, 0.5)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
                required
              >
                <option value="" disabled>Select issue category</option>
                {subjects.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>DESCRIPTION</label>
              <textarea
                placeholder="Write your issue details here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(19, 15, 36, 0.5)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  minHeight: '80px',
                  fontFamily: 'inherit'
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold"
              style={{ marginTop: '4px', padding: '10px' }}
            >
              <Send size={14} /> {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </GlassCard>

        {/* 3. Ticket History List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
            YOUR TICKET HISTORY
          </h3>

          {loadingTickets ? (
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '12px' }}>
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <GlassCard style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No past tickets raised yet.
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {tickets.map(t => (
                <GlassCard key={t.id} style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{t.subject}</span>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      textTransform: 'uppercase',
                      background: t.status === 'resolved' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: t.status === 'resolved' ? 'var(--success-emerald)' : 'var(--accent-gold)',
                      border: `1px solid ${t.status === 'resolved' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
                    }}>
                      {t.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {t.message}
                  </p>

                  {t.reply && (
                    <div style={{ 
                      background: 'rgba(255,255,255,0.02)', 
                      borderLeft: '2px solid var(--accent-gold)', 
                      padding: '6px 10px', 
                      borderRadius: '4px',
                      marginTop: '2px'
                    }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', fontWeight: '700', display: 'block' }}>ADMIN REPLY:</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{t.reply}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '4px', marginTop: '2px' }}>
                    <span>ID: {t.id?.slice(-8).toUpperCase()}</span>
                    <span>{formatDate(t.createdAt)}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default SupportPage;
