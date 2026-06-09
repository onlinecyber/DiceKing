import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, Crown, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/Common/GlassCard';

const Register = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Local state
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !displayName || !password || !confirmPassword) {
      return setError('Please fill in all fields.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setError('');
    setLoading(true);
    try {
      await signup(email, password, displayName);
      
      // Apply referral code if entered
      if (referralCode.trim()) {
        try {
          const { callApi } = await import('../firebase/api');
          await callApi('applyReferralCode', { referralCode: referralCode.trim() });
        } catch (refErr) {
          console.error("Failed to apply referral code during registration:", refErr);
        }
      }

      // Wait for Auth listener to load profile
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create account. Please try again.');
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
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Start your journey with ₹10 welcome bonus
          </span>
        </div>

        {/* Register panel */}
        <GlassCard style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
            Register New Account
          </h2>

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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Display Name Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                DISPLAY NAME
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="LuckyPlayer"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
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

            {/* Email Field */}
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

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Confirm Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                CONFIRM PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            {/* Referral Code Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                REFERRAL CODE (OPTIONAL)
              </label>
              <div style={{ position: 'relative' }}>
                <Gift size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="DKXXXXXX"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold"
              style={{ marginTop: '10px' }}
            >
              <UserPlus size={18} />
              {loading ? 'Creating Account...' : 'Register'}
            </button>

          </form>

          {/* Login Redirect */}
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-gold)', fontWeight: '700', textDecoration: 'none' }}>
              Sign In Here
            </Link>
          </div>

        </GlassCard>

      </div>
    </div>
  );
};

export default Register;
