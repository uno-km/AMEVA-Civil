import React from 'react';
import { Terminal, MousePointer2 } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';

export const StatusBar: React.FC = () => {
  const { results } = useProjectStore();
  const statusMessage = results?.status === 'success' ? 'Analysis Complete' : 'Ready';

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: '#0f172a', color: '#94a3b8',
      padding: '4px 16px', fontSize: '0.75rem',
      borderTop: '1px solid #1e293b', height: '32px', zIndex: 100
    }}>
      {/* Left side: Console Toggle and Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#e2e8f0'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
        >
          <Terminal size={14} /> Console
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: results?.status === 'success' ? '#10b981' : '#3b82f6' }} />
          {statusMessage}
        </div>
      </div>

      {/* Right side: Units and Coordinates */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ cursor: 'pointer' }}>UNIT: kN, m, °C</span>
          <span style={{ cursor: 'pointer' }}>G-Coord</span>
          <span style={{ cursor: 'pointer' }}>Snap: Node</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>
          <MousePointer2 size={12} />
          <span style={{ fontFamily: 'monospace', minWidth: '120px' }}>X: 0.000 Y: 0.000 Z: 0.000</span>
        </div>
      </div>
    </div>
  );
};
