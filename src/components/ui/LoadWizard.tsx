import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { X, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const LoadWizard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { nodes, loadCases } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'nodal' | 'element'>('nodal');
  const [selectedLc, setSelectedLc] = useState<string>(Object.keys(loadCases)[0] || '');
  
  const [nodeId, setNodeId] = useState('');
  const [fx, setFx] = useState(0);
  const [fy, setFy] = useState(0);
  const [fz, setFz] = useState(0);
  
  if (!isOpen) return null;

  const handleAddNodalLoad = () => {
    if (!selectedLc || !nodeId || !nodes[nodeId]) {
      alert('Select a valid load case and node.');
      return;
    }
    
    useProjectStore.setState((state) => {
      const currentLoads = state.nodalLoads[selectedLc] || [];
      return {
        nodalLoads: {
          ...state.nodalLoads,
          [selectedLc]: [...currentLoads, { id: uuidv4(), loadCaseId: selectedLc, nodeId, fx, fy, fz, mx: 0, my: 0, mz: 0 }]
        }
      };
    });
    
    setFx(0); setFy(0); setFz(0);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-app)', width: '600px', borderRadius: '12px',
        border: '1px solid var(--bg-border)', boxShadow: 'var(--glass-shadow)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Load Wizard</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        
        <div style={{ display: 'flex', borderBottom: '1px solid var(--bg-border)', background: 'rgba(0,0,0,0.2)' }}>
          <button onClick={() => setActiveTab('nodal')} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: activeTab === 'nodal' ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === 'nodal' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Nodal Loads</button>
          <button onClick={() => setActiveTab('element')} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: activeTab === 'element' ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === 'element' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Element Loads (WIP)</button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Load Case</label>
              <select value={selectedLc} onChange={e => setSelectedLc(e.target.value)} style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff' }}>
                {Object.values(loadCases).map(lc => <option key={lc.id} value={lc.id}>{lc.name}</option>)}
              </select>
            </div>
          </div>
          
          {activeTab === 'nodal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-panel)', padding: '16px', borderRadius: '8px', border: '1px solid var(--bg-border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Node ID</label>
                  <select value={nodeId} onChange={e => setNodeId(e.target.value)} style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff' }}>
                    <option value="">Select Node</option>
                    {Object.values(nodes).map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fx (kN)</label>
                  <input type="number" value={fx} onChange={e => setFx(Number(e.target.value))} style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fy (kN)</label>
                  <input type="number" value={fy} onChange={e => setFy(Number(e.target.value))} style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fz (kN)</label>
                  <input type="number" value={fz} onChange={e => setFz(Number(e.target.value))} style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff' }} />
                </div>
              </div>
              <button onClick={handleAddNodalLoad} className="btn-primary" style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} /> Add Load
              </button>
            </div>
          )}

          {activeTab === 'element' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-panel)', padding: '16px', borderRadius: '8px', border: '1px solid var(--bg-border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Element ID</label>
                  <select value={elementId} onChange={e => setElementId(e.target.value)} style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff' }}>
                    <option value="">Select Element</option>
                    {Object.values(elements).map(e => <option key={e.id} value={e.id}>{e.id}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Type</label>
                  <select value={elemLoadType} onChange={e => setElemLoadType(e.target.value as any)} style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff' }}>
                    <option value="uniform">Uniform</option>
                    <option value="trapezoidal">Trapezoidal</option>
                    <option value="concentrated">Concentrated</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Direction</label>
                  <select value={elemDirection} onChange={e => setElemDirection(e.target.value as any)} style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff' }}>
                    <option value="global-Y">Global Y (Gravity)</option>
                    <option value="global-X">Global X</option>
                    <option value="global-Z">Global Z</option>
                    <option value="local-y">Local y</option>
                    <option value="local-z">Local z</option>
                    <option value="local-x">Local x (Axial)</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>w1 (Start Magnitude)</label>
                  <input type="number" value={w1} onChange={e => setW1(Number(e.target.value))} style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff' }} />
                </div>
                
                {elemLoadType === 'trapezoidal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>w2 (End Magnitude)</label>
                    <input type="number" value={w2} onChange={e => setW2(Number(e.target.value))} style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff' }} />
                  </div>
                )}
                
                {elemLoadType === 'concentrated' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Distance (m)</label>
                    <input type="number" value={distance} onChange={e => setDistance(Number(e.target.value))} style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff' }} />
                  </div>
                )}
              </div>
              <button onClick={handleAddElementLoad} className="btn-primary" style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <Plus size={16} /> Add Element Load
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
