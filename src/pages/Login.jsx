import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/Common/GlassCard';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Local state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please enter email and password.');
    }
    
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
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
            Enter the arena of rolling fortunes
          </span>
        </div>

        {/* Login panel */}
        <GlassCard style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
            Sign In to Account
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  PASSWORD
                </label>
                <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', textDecoration: 'none' }}>
                  Forgot?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold"
              style={{ marginTop: '10px' }}
            >
              <LogIn size={18} />
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

          </form>

          {/* Registration Redirect */}
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-gold)', fontWeight: '700', textDecoration: 'none' }}>
              Register Here
            </Link>
          </div>

        </GlassCard>

      </div>
    </div>
  );
};

export default Login;
