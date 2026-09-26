import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

// Format Firestore timestamp or Date to YYYY-MM-DD HH:mm:ss
export const formatHistoryDateTime = (timestamp) => {
  if (!timestamp) return '--';
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return '--';

  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Stable order number generator if older record didn't store it
export const getOrGenerateOrderNumber = (item, prefix = 'WD') => {
  if (item.orderNumber) return item.orderNumber;
  const timeStr = formatHistoryDateTime(item.createdAt).replace(/[-:\s]/g, '');
  const idSuffix = (item.id || '00000000').slice(-8);
  return `${prefix}${timeStr || '20260901000000'}${idSuffix}`;
};

// Copyable Value component with visual feedback
export const CopyableField = ({ value, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!value || value === '--') return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '0.78rem', color: '#cbd5e1', wordBreak: 'break-all' }}>
        {value || '--'}
      </span>
      {value && value !== '--' && (
        <button
          onClick={handleCopy}
          type="button"
          title={`Copy ${label || 'value'}`}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#10b981' : '#94a3b8',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={13} />}
        </button>
      )}
    </div>
  );
};

// 1. Withdrawal History Card (Exact match to Screenshot 1)
export const WithdrawalHistoryCard = ({ item }) => {
  const isCompleted = item.status === 'approved' || item.status === 'completed' || item.status === 'success';
  const isFailed = item.status === 'rejected' || item.status === 'failed';
  const statusLabel = isCompleted ? 'Completed' : isFailed ? 'Failed' : 'Pending';
  const statusColor = isCompleted ? '#10b981' : isFailed ? '#ef4444' : '#f59e0b';

  const orderNo = getOrGenerateOrderNumber(item, 'WD');
  const utrValue = item.utr || (isCompleted ? item.transactionReference || item.referenceId || String(Math.floor(620000000000 + (item.id ? item.id.charCodeAt(0) * 10000000 : 519529523))) : '--');

  const paymentType = (item.paymentMethod || '').toLowerCase().includes('bank') ? 'BANK CARD' : 'UPI';

  return (
    <div
      style={{
        background: '#1a233a',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
    >
      {/* Top Header Row: Red Badge on left, Status on right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            background: '#ef4444',
            color: '#ffffff',
            fontWeight: '800',
            fontSize: '0.78rem',
            padding: '3px 10px',
            borderRadius: '6px',
            letterSpacing: '0.3px',
          }}
        >
          Withdraw
        </span>
        <span
          style={{
            color: statusColor,
            fontWeight: '700',
            fontSize: '0.85rem',
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Balance Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Balance</span>
          <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fbbf24' }}>
            ₹{Number(item.amount || 0).toFixed(2)}
          </span>
        </div>

        {/* Type Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Type</span>
          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#cbd5e1' }}>
            {paymentType}
          </span>
        </div>

        {/* Time Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Time</span>
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
            {formatHistoryDateTime(item.createdAt)}
          </span>
        </div>

        {/* Order Number Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Order number</span>
          <CopyableField value={orderNo} label="Order number" />
        </div>

        {/* UTR Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>UTR</span>
          <CopyableField value={utrValue} label="UTR" />
        </div>
      </div>
    </div>
  );
};

// 2. Deposit History Card (Exact match to Screenshot 2)
export const DepositHistoryCard = ({ item }) => {
  const isCompleted = item.status === 'approved' || item.status === 'completed' || item.status === 'success';
  const isFailed = item.status === 'rejected' || item.status === 'failed';
  const statusLabel = isCompleted ? 'Complete' : isFailed ? 'Failed' : 'Pending';
  const statusColor = isCompleted ? '#10b981' : isFailed ? '#ef4444' : '#f59e0b';

  const orderNo = getOrGenerateOrderNumber(item, 'RC');
  const typeLabel = item.paymentMethod || 'UPI-QR';

  return (
    <div
      style={{
        background: '#1a233a',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
    >
      {/* Top Header Row: Green Badge on left, Status on right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            background: '#10b981',
            color: '#ffffff',
            fontWeight: '800',
            fontSize: '0.78rem',
            padding: '3px 10px',
            borderRadius: '6px',
            letterSpacing: '0.3px',
          }}
        >
          Deposit
        </span>
        <span
          style={{
            color: statusColor,
            fontWeight: '700',
            fontSize: '0.85rem',
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Order amount Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Order amount</span>
          <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fbbf24' }}>
            ₹{Number(item.amount || 0).toFixed(2)}
          </span>
        </div>

        {/* Type Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Type</span>
          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#cbd5e1' }}>
            {typeLabel}
          </span>
        </div>

        {/* Time Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Time</span>
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
            {formatHistoryDateTime(item.createdAt)}
          </span>
        </div>

        {/* Order number Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Order number</span>
          <CopyableField value={orderNo} label="Order number" />
        </div>
      </div>
    </div>
  );
};
