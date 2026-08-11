import React from 'react';
import { Loader2 } from 'lucide-react';
import './LoadingOverlay.css'; // Let's use inline styles instead to be clean

export const LoadingOverlay: React.FC<{ isVisible: boolean; message?: string }> = ({ isVisible, message }) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      color: 'white',
      fontFamily: '"Inter", sans-serif'
    }}>
      <div style={{
        background: 'var(--bg-panel)',
        padding: '32px 48px',
        borderRadius: '16px',
        border: '1px solid var(--bg-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Animated loader */}
        <div style={{
          position: 'relative',
          width: '64px',
          height: '64px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '4px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <Loader2 size={24} color="var(--accent)" style={{ animation: 'pulse 2s infinite' }} />
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 600 }}>Engine Running</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {message || 'Assembling stiffness matrix and solving P-Delta iterations...'}
          </p>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
};
