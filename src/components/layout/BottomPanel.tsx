import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { ChevronUp, ChevronDown, Activity, AlertCircle } from 'lucide-react';

export const BottomPanel: React.FC = () => {
  const { results } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'displacements' | 'reactions'>('displacements');

  return (
    <div className={`bottom-panel ${isOpen ? 'open' : ''}`} style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, 
      backgroundColor: 'var(--bg-panel)', borderTop: '1px solid var(--bg-border)',
      transition: 'height 0.3s ease', display: 'flex', flexDirection: 'column',
      backdropFilter: 'var(--glass-blur)', zIndex: 20,
      height: isOpen ? '250px' : '40px'
    }}>
      {/* Panel Header */}
      <div 
        className="panel-header" 
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '40px', padding: '0 20px', background: 'linear-gradient(90deg, rgba(59,130,246,0.1) 0%, transparent 100%)' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={16} color={results && results.status === 'success' ? 'var(--success)' : 'var(--text-secondary)'} />
          <span style={{ fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>Analysis Results</span>
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </div>

      {/* Panel Content */}
      {isOpen && (
        <div className="panel-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: 0 }}>
          {!results ? (
            <div style={{ padding: '24px', color: 'var(--text-tertiary)', textAlign: 'center', fontStyle: 'italic' }}>
              No results available. Click 'Solve Engine' to run the analysis.
            </div>
          ) : results.status === 'error' ? (
            <div style={{ padding: '24px', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 500 }}>
              <AlertCircle size={20} /> {results.error || results.message || 'Unknown error occurred'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--bg-border)', padding: '0 16px', background: 'rgba(0,0,0,0.2)' }}>
                <button 
                  className={`tab-btn ${activeTab === 'displacements' ? 'active' : ''}`}
                  onClick={() => setActiveTab('displacements')}
                  style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'displacements' ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === 'displacements' ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                >
                  Displacements
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'reactions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reactions')}
                  style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'reactions' ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === 'reactions' ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                >
                  Reactions
                </button>
              </div>

              {/* Data Tables */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'displacements' && (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>LC</th>
                          <th>Node ID</th>
                          <th>Dx (mm)</th>
                          <th>Dy (mm)</th>
                          <th>Dz (mm)</th>
                          <th>Rx (rad)</th>
                          <th>Ry (rad)</th>
                          <th>Rz (rad)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(results.loadCases).flatMap(([lcId, lc]) => 
                          Object.entries(lc.displacements).map(([nodeId, d]) => (
                            <tr key={`${lcId}-${nodeId}`}>
                              <td>{lcId.substring(0,6)}</td>
                              <td>{nodeId.substring(0,8)}</td>
                              <td>{(d.dx * 1000).toFixed(4)}</td>
                              <td>{(d.dy * 1000).toFixed(4)}</td>
                              <td>{(d.dz * 1000).toFixed(4)}</td>
                              <td>{d.rx.toFixed(6)}</td>
                              <td>{d.ry.toFixed(6)}</td>
                              <td>{d.rz.toFixed(6)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'reactions' && (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>LC</th>
                          <th>Node ID</th>
                          <th>Fx (kN)</th>
                          <th>Fy (kN)</th>
                          <th>Fz (kN)</th>
                          <th>Mx (kNm)</th>
                          <th>My (kNm)</th>
                          <th>Mz (kNm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(results.loadCases).flatMap(([lcId, lc]) => 
                          Object.entries(lc.reactions)
                            .filter(([_, r]) => Math.abs(r.fx)>1e-6 || Math.abs(r.fy)>1e-6 || Math.abs(r.fz)>1e-6 || Math.abs(r.mx)>1e-6 || Math.abs(r.my)>1e-6 || Math.abs(r.mz)>1e-6)
                            .map(([nodeId, r]) => (
                            <tr key={`${lcId}-${nodeId}`}>
                              <td>{lcId.substring(0,6)}</td>
                              <td>{nodeId.substring(0,8)}</td>
                              <td>{r.fx.toFixed(2)}</td>
                              <td>{r.fy.toFixed(2)}</td>
                              <td>{r.fz.toFixed(2)}</td>
                              <td>{r.mx.toFixed(2)}</td>
                              <td>{r.my.toFixed(2)}</td>
                              <td>{r.mz.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
