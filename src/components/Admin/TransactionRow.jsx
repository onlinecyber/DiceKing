import React, { useState } from 'react';
import { Check, X, Calendar, User, CreditCard } from 'lucide-react';
import GlassCard from '../Common/GlassCard';

const TransactionRow = ({ tx, type, onApprove, onReject }) => {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (window.confirm(`Are you sure you want to APPROVE this ₹${tx.amount} ${type}?`)) {
      setLoading(true);
      try {
        await onApprove(tx.id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReject = async () => {
    let reason = '';
    if (type === 'withdrawal') {
      reason = window.prompt(`Are you sure you want to REJECT this withdrawal of ₹${tx.amount}? Please enter a rejection reason (e.g. Invalid Account, Self-Referral, Fraud):`);
      if (reason === null) return; // User pressed Cancel
    } else {
      if (!window.confirm(`Are you sure you want to REJECT this ₹${tx.amount} ${type}?`)) {
        return;
      }
    }

    setLoading(true);
    try {
      await onReject(tx.id, reason);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '---';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <GlassCard style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{
            background: type === 'deposit' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: type === 'deposit' ? 'var(--success-emerald)' : 'var(--danger-red)',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '0.65rem',
            fontWeight: '800',
            textTransform: 'uppercase'
          }}>
            {type}
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            ₹{tx.amount.toFixed(2)}
          </span>
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Calendar size={12} /> {formatDate(tx.createdAt)}
        </span>
      </div>

      {/* User and Method details */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <User size={12} /> {tx.displayName} ({tx.email})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CreditCard size={12} /> Method: {tx.paymentMethod}
        </span>
        {type === 'deposit' ? (
          <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.15)', padding: '2px 4px', borderRadius: '4px', alignSelf: 'start', fontSize: '0.7rem' }}>
            Ref: {tx.transactionReference}
          </span>
        ) : (
          <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.15)', padding: '2px 4px', borderRadius: '4px', alignSelf: 'start', fontSize: '0.7rem' }}>
            Address: {tx.walletAddress}
          </span>
        )}
      </div>

      {/* Pending status buttons */}
      {tx.status === 'pending' && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            disabled={loading}
            onClick={handleReject}
            style={{
              flex: 1,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger-red)',
              borderRadius: '8px',
              color: 'var(--danger-red)',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}
          >
            <X size={14} /> Reject
          </button>
          
          <button
            disabled={loading}
            onClick={handleApprove}
            style={{
              flex: 1,
              background: 'var(--success-emerald)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}
          >
            <Check size={14} /> Approve
          </button>
        </div>
      )}

      {/* Done status label */}
      {tx.status !== 'pending' && (
        <div style={{
          alignSelf: 'end',
          fontSize: '0.7rem',
          fontWeight: '700',
          color: tx.status === 'approved' ? 'var(--success-emerald)' : 'var(--text-muted)',
          textTransform: 'uppercase',
          marginTop: '4px'
        }}>
          {tx.status}
        </div>
      )}
    </GlassCard>
  );
};

export default TransactionRow;
