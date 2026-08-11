import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Layers, Box, Cpu, Grid } from 'lucide-react';
import { createDefaultNode, createDefaultMaterial, createDefaultSection, createDefaultBoundaryCondition, createDefaultLoadCase } from '../../constants/templates';
import { generateAutoLoadCombinations } from '../../engine/loadCombinations';

export const SidebarLeft: React.FC = () => {
  const { nodes, elements, materials, sections, loadCases, loadCombinations, boundaryConditions, analysisSettings, addNode, addElement, addMaterial, addSection, addBoundaryCondition, addLoadCase } = useProjectStore();

  const handleAddNode = () => {
    addNode(createDefaultNode());
  };

  const handleAddElement = () => {
    const nodeVals = Object.values(nodes);
    const matVals = Object.values(materials);
    const secVals = Object.values(sections);
    
    if (nodeVals.length < 2 || matVals.length === 0 || secVals.length === 0) {
      alert("Need at least 2 nodes, 1 material, and 1 section to create an element.");
      return;
    }
    
    addElement({
      type: 'frame3d',
      startNodeId: nodeVals[0].id,
      endNodeId: nodeVals[1].id,
      materialId: matVals[0].id,
      sectionId: secVals[0].id
    });
  };

  const handleAddMaterial = () => {
    addMaterial(createDefaultMaterial());
  };

  const handleAddSection = () => {
    addSection(createDefaultSection());
  };

  const handleAddBC = () => {
    const nodeVals = Object.values(nodes);
    if (nodeVals.length === 0) return alert("Need a node for BC");
    addBoundaryCondition(createDefaultBoundaryCondition(nodeVals[0].id));
  };

  const handleAddLoadCase = () => {
    addLoadCase(createDefaultLoadCase());
  };

  const handleAutoGenerateCombos = () => {
    const combos = generateAutoLoadCombinations(loadCases, 'KDS-LRFD');
    useProjectStore.setState({ loadCombinations: combos });
  };

  return (
    <aside className="sidebar-left" style={{ width: '260px' }}>
      <div className="panel-header">
        <span style={{ color: 'var(--accent)', marginRight: '8px' }}>❖</span> Project Explorer
      </div>
      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
        {[
          { label: 'Nodes', count: Object.keys(nodes).length, icon: <Layers size={16} />, add: handleAddNode },
          { label: 'Elements', count: Object.keys(elements).length, icon: <Grid size={16} />, add: handleAddElement },
          { label: 'Materials', count: Object.keys(materials).length, icon: <Cpu size={16} />, add: handleAddMaterial },
          { label: 'Sections', count: Object.keys(sections).length, icon: <Box size={16} />, add: handleAddSection },
          { label: 'Boundary Cond.', count: Object.keys(boundaryConditions).length, icon: <Box size={16} />, add: handleAddBC },
          { label: 'Load Cases', count: Object.keys(loadCases).length, icon: <Layers size={16} />, add: handleAddLoadCase },
        ].map((item, idx) => (
          <div key={idx} style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'pointer'
          }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
              {item.label}
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.count}</span>
            </div>
            <button onClick={item.add} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span>
            </button>
          </div>
        ))}
        
        <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)', marginTop: '8px'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--success)' }}><Layers size={16} /></span>
            Combos
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{Object.keys(loadCombinations).length}</span>
          </div>
          <button onClick={handleAutoGenerateCombos} style={{ background: 'var(--success)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 'bold' }}>
            AUTO KDS
          </button>
        </div>

        {/* Phase 16: Analysis Settings UI */}
        <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>Analysis Settings</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Method
              <select 
                value={analysisSettings?.method || 'linear-static'}
                onChange={(e) => useProjectStore.setState(state => ({ analysisSettings: { ...state.analysisSettings, method: e.target.value as any } }))}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', outline: 'none' }}
              >
                <option value="linear-static">Linear Static</option>
                <option value="nonlinear-static">Non-Linear (P-Delta + Hinge)</option>
              </select>
            </label>
            
            {analysisSettings?.method === 'nonlinear-static' && (
              <>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Load Steps
                  <input 
                    type="number" min="1" max="100"
                    value={analysisSettings?.nonlinearSteps || 10}
                    onChange={(e) => useProjectStore.setState(state => ({ analysisSettings: { ...state.analysisSettings, nonlinearSteps: parseInt(e.target.value) } }))}
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', width: '60px', textAlign: 'right' }}
                  />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Tolerance
                  <input 
                    type="number" step="0.0001"
                    value={analysisSettings?.tolerance || 0.0001}
                    onChange={(e) => useProjectStore.setState(state => ({ analysisSettings: { ...state.analysisSettings, tolerance: parseFloat(e.target.value) } }))}
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', width: '80px', textAlign: 'right' }}
                  />
                </label>
              </>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
};
