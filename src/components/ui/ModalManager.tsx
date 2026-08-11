import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { X, Hammer } from 'lucide-react';

// A mapping of Modal IDs to their display titles
const MODAL_TITLES: Record<string, string> = {
  'wizard_base': 'Base Structure Wizard',
  'wizard_ucs': 'User Coordinate System (UCS)',
  'wizard_frame': 'Frame Wizard',
  'wizard_truss': 'Truss Wizard',
  'node_create': 'Create Nodes',
  'node_translate': 'Translate Nodes',
  'node_merge': 'Merge Nodes',
  'element_create': 'Create Elements',
  'element_extrude': 'Extrude Elements',
  'prop_material': 'Material Properties',
  'prop_section': 'Section Properties',
  'prop_thickness': 'Thickness Properties',
  'bound_support': 'Define Supports',
  'bound_spring': 'Define Point Springs',
  'load_cases': 'Static Load Cases',
  'load_nodal': 'Nodal Loads',
  'load_beam': 'Beam Loads',
  'load_time_history': 'Time History Functions',
  'load_spectrum': 'Response Spectrum Functions',
  'analysis_options': 'Analysis Options',
  'analysis_perform': 'Perform Analysis',
  'result_reaction': 'Reaction Forces',
  'result_deform': 'Deformations',
  'result_force': 'Beam Forces/Moments',
  'result_stress': 'Stresses',
  'result_mode': 'Vibration Mode Shapes',
  'design_optimize': 'AI Section Optimization',
};

export const ModalManager: React.FC = () => {
  const { activeModal, closeModal } = useUIStore();

  if (!activeModal) return null;

  const title = MODAL_TITLES[activeModal] || `Modal: ${activeModal}`;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: '400px', background: 'var(--bg-panel)',
        borderRadius: '8px', border: '1px solid var(--bg-border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--bg-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.03)', borderRadius: '8px 8px 0 0'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hammer size={18} color="var(--accent)" />
            {title}
          </div>
          <X size={18} color="var(--text-secondary)" style={{ cursor: 'pointer' }} onClick={closeModal} />
        </div>

        {/* Body placeholder */}
        <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚧</div>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Under Construction</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
            This modal panel for <b>{title}</b> is currently a placeholder. <br/>
            Full logic will be implemented in subsequent development phases!
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--bg-border)',
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
          background: 'rgba(0,0,0,0.2)', borderRadius: '0 0 8px 8px'
        }}>
          <button onClick={closeModal} style={{
            background: 'transparent', border: '1px solid var(--text-secondary)',
            color: 'var(--text-primary)', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer'
          }}>
            Cancel
          </button>
          <button onClick={closeModal} style={{
            background: 'var(--accent)', border: 'none',
            color: '#fff', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
          }}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
