import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/projectStore';
import { webGPUAccelerator } from '../../engine/webgpuSolver';
import { 
  Box, MousePointer2, Grid, Scaling, Layers, Type, MapPin, Minimize2, Frame, 
  Workflow, Zap, PlayCircle, BarChart3, TrendingUp, Settings, HelpCircle, Save, FolderOpen,
  Anchor, Activity, Link2, GitBranch, Table, FileText
} from 'lucide-react';

const TABS = [
  'View', 'Structure', 'Node/Element', 'Properties', 'Boundary', 'Load', 'Analysis', 'Results', 'Design'
];

interface RibbonMenuProps {
  onSolve: () => void;
  onLoadSample: () => void;
}

export const RibbonMenu: React.FC<RibbonMenuProps> = ({ onSolve, onLoadSample }) => {
  const { activeRibbonTab, setActiveRibbonTab, openModal, setViewMode } = useUIStore();
  const { language, setLanguage } = useProjectStore();

  const RibbonButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
    <div 
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', minWidth: '60px',
        transition: 'all 0.2s', border: '1px solid transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.border = '1px solid transparent';
      }}
    >
      <Icon size={24} color="#e2e8f0" strokeWidth={1.5} />
      <span style={{ fontSize: '0.65rem', color: '#cbd5e1', textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );

  const RibbonGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '12px' }}>
      <div style={{ display: 'flex', gap: '4px', flex: 1, padding: '4px 8px' }}>
        {children}
      </div>
      <div style={{ fontSize: '0.6rem', color: '#64748b', textAlign: 'center', marginTop: 'auto', paddingBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeRibbonTab) {
      case 'View':
        return (
          <>
            <RibbonGroup title="Workspace">
              <RibbonButton icon={Box} label="3D View" onClick={() => setViewMode('3d')} />
              <RibbonButton icon={Table} label="Spreadsheet" onClick={() => setViewMode('spreadsheet')} />
              <RibbonButton icon={FileText} label="Report" onClick={() => setViewMode('report')} />
            </RibbonGroup>
            <RibbonGroup title="Display">
              <RibbonButton icon={Settings} label="Display Options" onClick={() => openModal('view_display')} />
              <RibbonButton icon={Grid} label="Grids" onClick={() => openModal('view_grid')} />
            </RibbonGroup>
          </>
        );
      case 'Structure':
        return (
          <>
            <RibbonGroup title="Base">
              <RibbonButton icon={Box} label="Base Struct" onClick={() => openModal('wizard_base')} />
              <RibbonButton icon={Grid} label="UCS" onClick={() => openModal('wizard_ucs')} />
            </RibbonGroup>
            <RibbonGroup title="Wizard">
              <RibbonButton icon={Frame} label="Frame" onClick={() => openModal('wizard_frame')} />
              <RibbonButton icon={GitBranch} label="Truss" onClick={() => openModal('wizard_truss')} />
            </RibbonGroup>
            <RibbonGroup title="Import">
              <RibbonButton icon={FolderOpen} label="DXF/CAD" onClick={() => openModal('dxf_manager')} />
            </RibbonGroup>
          </>
        );
      case 'Node/Element':
        return (
          <>
            <RibbonGroup title="Node">
              <RibbonButton icon={MapPin} label="Create" onClick={() => openModal('node_create')} />
              <RibbonButton icon={Scaling} label="Translate" onClick={() => openModal('node_translate')} />
              <RibbonButton icon={Minimize2} label="Merge" onClick={() => openModal('node_merge')} />
            </RibbonGroup>
            <RibbonGroup title="Element">
              <RibbonButton icon={Link2} label="Create" onClick={() => openModal('element_create')} />
              <RibbonButton icon={Layers} label="Extrude" onClick={() => openModal('element_extrude')} />
            </RibbonGroup>
          </>
        );
      case 'Properties':
        return (
          <>
            <RibbonGroup title="Material & Section">
              <RibbonButton icon={Box} label="Material" onClick={() => openModal('prop_material')} />
              <RibbonButton icon={Grid} label="Section" onClick={() => openModal('prop_section')} />
              <RibbonButton icon={Type} label="Thickness" onClick={() => openModal('prop_thickness')} />
            </RibbonGroup>
          </>
        );
      case 'Boundary':
        return (
          <>
            <RibbonGroup title="Supports">
              <RibbonButton icon={Anchor} label="Supports" onClick={() => openModal('bound_support')} />
              <RibbonButton icon={Workflow} label="Spring" onClick={() => openModal('bound_spring')} />
            </RibbonGroup>
          </>
        );
      case 'Load':
        return (
          <>
            <RibbonGroup title="Smart Load">
              <RibbonButton icon={Zap} label="Load Wizard" onClick={() => openModal('load_wizard')} />
            </RibbonGroup>
            <RibbonGroup title="Static Loads">
              <RibbonButton icon={Box} label="Load Cases" onClick={() => openModal('load_cases')} />
              <RibbonButton icon={Anchor} label="Nodal Load" onClick={() => openModal('load_nodal')} />
              <RibbonButton icon={Grid} label="Beam Load" onClick={() => openModal('load_beam')} />
            </RibbonGroup>
            <RibbonGroup title="Dynamic">
              <RibbonButton icon={Activity} label="Time History" onClick={() => openModal('load_time_history')} />
              <RibbonButton icon={Zap} label="Spectrum" onClick={() => openModal('load_spectrum')} />
            </RibbonGroup>
          </>
        );
      case 'Analysis':
        return (
          <>
            <RibbonGroup title="Control">
              <RibbonButton icon={Settings} label="Options" onClick={() => openModal('analysis_options')} />
              <RibbonButton icon={PlayCircle} label="Perform" onClick={onSolve} />
            </RibbonGroup>
          </>
        );
      case 'Results':
        return (
          <>
            <RibbonGroup title="Static">
              <RibbonButton icon={Anchor} label="Reactions" onClick={() => openModal('result_reaction')} />
              <RibbonButton icon={MapPin} label="Deform" onClick={() => openModal('result_deform')} />
              <RibbonButton icon={TrendingUp} label="Forces" onClick={() => openModal('result_force')} />
              <RibbonButton icon={BarChart3} label="Stresses" onClick={() => openModal('result_stress')} />
            </RibbonGroup>
            <RibbonGroup title="Dynamic">
              <RibbonButton icon={Activity} label="Vibration Mode" onClick={() => openModal('result_mode')} />
            </RibbonGroup>
          </>
        );
      case 'Design':
        return (
          <>
            <RibbonGroup title="Auto Design">
              <RibbonButton icon={Zap} label="AI Optimize" onClick={() => openModal('design_optimize')} />
            </RibbonGroup>
          </>
        );
      default:
        return (
          <div style={{ padding: '16px', color: '#94a3b8', fontSize: '0.8rem' }}>
            Select a tool from the ribbon...
          </div>
        );
    }
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', 
      background: '#1e293b', borderBottom: '1px solid #0f172a',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      zIndex: 100
    }}>
      {/* File Menu / Quick Access (Very Top) */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', padding: '4px 12px', gap: '16px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem', fontStyle: 'italic', letterSpacing: '1px' }}>AMEVA <span style={{ color: '#38bdf8' }}>Civil</span></div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Save size={16} color="#94a3b8" style={{ cursor: 'pointer' }} />
            <FolderOpen size={16} color="#94a3b8" style={{ cursor: 'pointer' }} />
            <div onClick={onLoadSample} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
              Load Sample
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span 
            onClick={() => openModal('webgpu_inspector')}
            style={{ cursor: 'pointer', fontSize: '0.65rem', background: webGPUAccelerator.getIsSupported() ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)', color: webGPUAccelerator.getIsSupported() ? '#10b981' : '#9ca3af', border: webGPUAccelerator.getIsSupported() ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '2px 8px', fontWeight: 600 }}
          >
            {webGPUAccelerator.getIsSupported() ? 'WebGPU Accelerated' : 'WASM CPU Mode'}
          </span>
          <button 
            onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
            style={{ color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.5)', background: 'rgba(56, 189, 248, 0.1)', fontWeight: 700, borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            {language === 'ko' ? 'ENG' : '한글'}
          </button>
          <button 
            onClick={() => openModal('ai_assistant')}
            style={{ color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.5)', background: 'rgba(16, 185, 129, 0.1)', fontWeight: 700, borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            AI Assistant
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#1e293b', padding: '0 8px' }}>
        {TABS.map(tab => (
          <div
            key={tab}
            onClick={() => setActiveRibbonTab(tab)}
            style={{
              padding: '6px 16px',
              fontSize: '0.75rem',
              fontWeight: activeRibbonTab === tab ? 600 : 400,
              color: activeRibbonTab === tab ? '#38bdf8' : '#cbd5e1',
              borderBottom: activeRibbonTab === tab ? '2px solid #38bdf8' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: activeRibbonTab === tab ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Ribbon Content Panels */}
      <div style={{ display: 'flex', gap: '12px', padding: '8px', minHeight: '80px', background: '#1e293b' }}>
        {renderTabContent()}
      </div>
    </div>
  );
};
