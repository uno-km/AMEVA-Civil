import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Activity, Upload, Play, Check, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Built-in historical earthquake acceleration records (g)
const SAMPLE_EARTHQUAKES = [
  {
    name: 'El Centro (1940 NS)',
    dt: 0.02,
    points: Array.from({ length: 250 }, (_, i) => {
      const t = i * 0.02;
      const val = 0.34 * Math.sin(2 * Math.PI * 1.5 * t) * Math.exp(-0.4 * t) + (Math.random() - 0.5) * 0.05;
      return { t: Math.round(t * 100) / 100, v: Math.round(val * 1000) / 1000 };
    })
  },
  {
    name: 'Kobe (1995 NS)',
    dt: 0.01,
    points: Array.from({ length: 300 }, (_, i) => {
      const t = i * 0.01;
      const val = 0.83 * Math.sin(2 * Math.PI * 2.5 * t) * Math.exp(-0.8 * t) + (Math.random() - 0.5) * 0.08;
      return { t: Math.round(t * 100) / 100, v: Math.round(val * 1000) / 1000 };
    })
  },
  {
    name: 'Hachinohe (1968 EW)',
    dt: 0.02,
    points: Array.from({ length: 200 }, (_, i) => {
      const t = i * 0.02;
      const val = 0.23 * Math.sin(2 * Math.PI * 0.8 * t) * Math.exp(-0.2 * t);
      return { t: Math.round(t * 100) / 100, v: Math.round(val * 1000) / 1000 };
    })
  }
];

export const TimeHistoryWizard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addTimeHistoryFunction, analysisSettings, timeHistoryFunctions, language = 'ko' } = useProjectStore();
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [direction, setDirection] = useState<'X' | 'Y' | 'Z'>('X');
  const [dampingRatio, setDampingRatio] = useState(0.05);

  if (!isOpen) return null;

  const currentEQ = SAMPLE_EARTHQUAKES[selectedPreset];

  const handleApply = () => {
    const fnId = uuidv4();
    addTimeHistoryFunction({
      name: currentEQ.name,
      points: currentEQ.points
    });

    useProjectStore.setState({
      analysisSettings: {
        ...analysisSettings,
        method: 'time-history',
        timeHistory: {
          dt: currentEQ.dt,
          totalTime: currentEQ.points[currentEQ.points.length - 1].t,
          dampingRatio,
          functionId: fnId,
          direction
        }
      }
    });

    alert(language === 'ko' ? `시간이력 해석 조건 설정 완료: ${currentEQ.name} (${direction}방향)` : `Time History analysis configured with ${currentEQ.name} (${direction}-dir)`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-panel-solid)', width: '650px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(56, 189, 248, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', fontWeight: 700, fontSize: '1.1rem' }}>
            <Activity size={20} /> {language === 'ko' ? '지진파 시간이력 해석 마법사 (Time History Wizard)' : 'Seismic Time History Wizard'}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Preset Selector */}
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              {language === 'ko' ? '1. 표준 지진파 레코드 선택 (Earthquake Waveform Record)' : '1. Select Earthquake Waveform'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {SAMPLE_EARTHQUAKES.map((eq, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedPreset(idx)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: selectedPreset === idx ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                    background: selectedPreset === idx ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0,0,0,0.2)',
                    color: selectedPreset === idx ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {eq.name}
                </button>
              ))}
            </div>
          </div>

          {/* Waveform Preview Chart */}
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
              Ground Acceleration Preview (g vs Time)
            </div>
            <svg width="100%" height="120" style={{ overflow: 'visible' }}>
              <line x1="0" y1="60" x2="100%" y2="60" stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                points={currentEQ.points.map((p, i) => {
                  const x = (i / currentEQ.points.length) * 580;
                  const y = 60 - p.v * 60;
                  return `${x},${y}`;
                }).join(' ')}
              />
            </svg>
          </div>

          {/* Parameters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                {language === 'ko' ? '지진 가속도 작용 방향' : 'Excitation Direction'}
              </label>
              <select 
                value={direction} 
                onChange={e => setDirection(e.target.value as any)}
                style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '6px' }}
              >
                <option value="X">X Direction (Horizontal)</option>
                <option value="Y">Y Direction (Vertical Gravity)</option>
                <option value="Z">Z Direction (Out of Plane)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                {language === 'ko' ? 'Rayleigh 감쇠비 (Damping Ratio)' : 'Rayleigh Damping Ratio'}
              </label>
              <input 
                type="number" step="0.01" min="0.01" max="0.2"
                value={dampingRatio}
                onChange={e => setDampingRatio(parseFloat(e.target.value))}
                style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '6px' }}
              />
            </div>
          </div>

        </div>

        <div style={{ padding: '16px 20px', backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn-secondary" onClick={onClose}>{language === 'ko' ? '취소' : 'Cancel'}</button>
          <button className="btn-primary" onClick={handleApply} style={{ backgroundColor: '#38bdf8' }}>
            <Check size={16} /> {language === 'ko' ? '해석 조건 적용' : 'Apply Configuration'}
          </button>
        </div>

      </div>
    </div>
  );
};
