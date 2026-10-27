import React from 'react';

export default function Modal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Yes, Submit', cancelText = 'Go Back' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {title && <h3 style={{ marginBottom: '12px' }}>{title}</h3>}
        <p style={{ fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button type="button" onClick={onConfirm} className="btn-primary">
            {confirmText}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
