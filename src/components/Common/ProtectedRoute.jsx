import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          border: '4px solid var(--bg-tertiary)',
          borderTop: '4px solid var(--accent-gold)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'dice-spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && (!profile || profile.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
