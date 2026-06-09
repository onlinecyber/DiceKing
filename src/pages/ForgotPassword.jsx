import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/Common/GlassCard';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  
  // Local state
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return setError('Please enter your email address.');
    }

    setError('');
    setMessage('');
    setLoading(true);
    try {
      await resetPassword(email);
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <div className="content-container" style={{ width: '100%', maxWidth: '400px' }}>
        
        {/* Branding header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Crown size={48} color="var(--accent-gold)" style={{ filter: 'drop-shadow(0 0 12px var(--accent-gold))' }} />
          <h1 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '900', 
            letterSpacing: '2px',
            background: 'linear-gradient(to right, var(--accent-gold), #fff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            DICE KING
          </h1>
        </div>

        {/* Form card */}
        <GlassCard style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>
            Password Reset
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px' }}>
            Enter your email and we'll send a link to securely recover your account
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid var(--danger-red)',
              borderRadius: '8px',
              color: 'var(--danger-red)',
              fontSize: '0.8rem',
              padding: '10px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid var(--success-emerald)',
              borderRadius: '8px',
              color: 'var(--success-emerald)',
              fontSize: '0.8rem',
              padding: '10px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Email Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(19, 15, 36, 0.5)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '10px 10px 10px 38px',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            {/* Send Link Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold"
              style={{ marginTop: '10px' }}
            >
              <Send size={16} />
              {loading ? 'Sending Instructions...' : 'Send Recovery Link'}
            </button>

          </form>

          {/* Go Back Link */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/login" style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '0.8rem', 
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>

        </GlassCard>

      </div>
    </div>
  );
};

export default ForgotPassword;
