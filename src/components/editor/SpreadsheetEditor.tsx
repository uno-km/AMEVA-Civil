import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';

export const SpreadsheetEditor: React.FC = () => {
  const { nodes, elements, setNodes, setElements } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'nodes' | 'elements'>('nodes');
  const [pasteData, setPasteData] = useState('');

  const handlePasteNodes = () => {
    const lines = pasteData.trim().split('\n');
    const newNodes = { ...nodes };
    lines.forEach(line => {
      const [id, x, y, z] = line.split(/\t|,/).map(s => s.trim());
      if (id && !isNaN(Number(x))) {
        newNodes[id] = {
          id,
          x: Number(x) || 0,
          y: Number(y) || 0,
          z: Number(z) || 0
        };
      }
    });
    setNodes(newNodes);
    setPasteData('');
  };

  const handlePasteElements = () => {
    const lines = pasteData.trim().split('\n');
    const newElements = { ...elements };
    lines.forEach(line => {
      const [id, type, startNodeId, endNodeId, materialId, sectionId] = line.split(/\t|,/).map(s => s.trim());
      if (id && startNodeId && endNodeId) {
        newElements[id] = {
          id,
          type: (type as any) || 'frame3d',
          startNodeId,
          endNodeId,
          materialId: materialId || Object.keys(useProjectStore.getState().materials)[0],
          sectionId: sectionId || Object.keys(useProjectStore.getState().sections)[0]
        };
      }
    });
    setElements(newElements);
    setPasteData('');
  };

  return (
    <div className="spreadsheet-editor" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', padding: '16px 16px 0 16px', background: 'linear-gradient(180deg, var(--bg-app) 0%, transparent 100%)' }}>
        <button 
          onClick={() => setActiveTab('nodes')}
          style={{ padding: '10px 24px', background: activeTab === 'nodes' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', borderBottom: activeTab === 'nodes' ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === 'nodes' ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, borderTopLeftRadius: '8px', borderTopRightRadius: '8px', transition: 'all 0.2s' }}
        >
          Nodes
        </button>
        <button 
          onClick={() => setActiveTab('elements')}
          style={{ padding: '10px 24px', background: activeTab === 'elements' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', borderBottom: activeTab === 'elements' ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === 'elements' ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, borderTopLeftRadius: '8px', borderTopRightRadius: '8px', transition: 'all 0.2s' }}
        >
          Elements
        </button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <textarea 
            placeholder="Paste Excel data here (Tab separated)&#10;Format for Nodes: ID, X, Y, Z&#10;Format for Elements: ID, Type, Node1, Node2, MatID, SecID"
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            style={{ flex: 1, height: '80px', padding: '12px', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--bg-border)', borderRadius: '6px', resize: 'none', fontSize: '0.85rem' }}
          />
          <button 
            className="btn-primary" 
            onClick={activeTab === 'nodes' ? handlePasteNodes : handlePasteElements}
            style={{ height: '80px', width: '140px', display: 'flex', flexDirection: 'column', gap: '4px' }}
          >
            <span style={{ fontSize: '1.2rem' }}>📋</span>
            <span>Import Excel</span>
          </button>
        </div>

        <div className="table-container" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--bg-border)', boxShadow: 'var(--glass-shadow)' }}>
          <table>
            <thead>
              {activeTab === 'nodes' ? (
                <tr>
                  <th>Node ID</th>
                  <th>X (m)</th>
                  <th>Y (m)</th>
                  <th>Z (m)</th>
                </tr>
              ) : (
                <tr>
                  <th>Element ID</th>
                  <th>Type</th>
                  <th>Start Node</th>
                  <th>End Node</th>
                  <th>Material</th>
                  <th>Section</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === 'nodes' && Object.values(nodes).map(n => (
                <tr key={n.id}>
                  <td>{n.id}</td>
                  <td>{n.x}</td>
                  <td>{n.y}</td>
                  <td>{n.z}</td>
                </tr>
              ))}
              {activeTab === 'elements' && Object.values(elements).map(e => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.type}</td>
                  <td>{e.startNodeId}</td>
                  <td>{e.endNodeId}</td>
                  <td>{e.materialId}</td>
                  <td>{e.sectionId}</td>
                </tr>
              ))}
              {activeTab === 'nodes' && Object.values(nodes).length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>No nodes defined. Paste from Excel to import.</td></tr>
              )}
              {activeTab === 'elements' && Object.values(elements).length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>No elements defined. Paste from Excel to import.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
