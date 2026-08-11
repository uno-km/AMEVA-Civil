import { useState } from 'react';
import { Canvas3DViewer } from './components/viewer/Canvas3DViewer';
import { SidebarLeft } from './components/layout/SidebarLeft';
import { PropertyEditor } from './components/layout/PropertyEditor';
import { BottomPanel } from './components/layout/BottomPanel';
import { SpreadsheetEditor } from './components/editor/SpreadsheetEditor';
import { ReportViewer } from './components/report/ReportViewer';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { LoadWizard } from './components/ui/LoadWizard';
import { AIAssistant } from './components/assistant/AIAssistant';
import { TimeHistoryWizard } from './components/ui/TimeHistoryWizard';
import { OptimizerModal } from './components/ui/OptimizerModal';
import { DXFManagerModal } from './components/ui/DXFManagerModal';
import { WebGPUInspectorModal } from './components/ui/WebGPUInspectorModal';
import { Fem3DEngine } from './engine/fem3d';
import { useProjectStore } from './store/projectStore';
import { createPortalFrameSample } from './data/samples';
import { Play, RotateCcw, Box, Table, FileText, Zap, Sparkles, Globe, Download, Upload, Cpu, Activity } from 'lucide-react';
import { translations } from './utils/i18n';
import { webGPUAccelerator } from './engine/webgpuSolver';
import './index.css';

function App() {
  const { nodes, language = 'ko', setLanguage } = useProjectStore();
  const t = translations[language];
  const [viewMode, setViewMode] = useState<'3d' | 'spreadsheet' | 'report'>('3d');
  const [isSolving, setIsSolving] = useState(false);
  const [showLoadWizard, setShowLoadWizard] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Phases 17-20 Modals State
  const [showTimeHistoryWizard, setShowTimeHistoryWizard] = useState(false);
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);
  const [showDXFModal, setShowDXFModal] = useState(false);
  const [showWebGPUModal, setShowWebGPUModal] = useState(false);

  const handleSolve = () => {
    if (Object.keys(nodes).length === 0) {
      alert(language === 'ko' ? "해석할 모델 데이터가 없습니다." : "No model data to solve.");
      return;
    }
    
    setIsSolving(true);
    
    setTimeout(() => {
      try {
        const engine = new Fem3DEngine(useProjectStore.getState());
        const results = engine.solve();
        useProjectStore.setState({ results });
      } catch (err) {
        console.error("Solver failed:", err);
        alert(language === 'ko' ? "오류로 인해 해석에 실패했습니다." : "Solver failed due to an error.");
      } finally {
        setIsSolving(false);
      }
    }, 100);
  };

  const handleLoadSample = () => {
    const sampleData = createPortalFrameSample();
    useProjectStore.setState({ ...sampleData, results: null });
  };

  return (
    <div className="app-container">
      {/* Top Toolbar */}
      <div className="top-toolbar" style={{ height: '52px', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '16px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#fff', letterSpacing: '-0.5px', textShadow: '0 0 10px rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            AMEVA<span style={{ color: 'var(--accent)' }}>Civil</span>
            <span 
              onClick={() => setShowWebGPUModal(true)}
              style={{ cursor: 'pointer', fontSize: '0.65rem', background: webGPUAccelerator.getIsSupported() ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)', color: webGPUAccelerator.getIsSupported() ? '#10b981' : '#9ca3af', border: webGPUAccelerator.getIsSupported() ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '2px 8px', fontWeight: 600 }}
            >
              <Cpu size={10} style={{ display: 'inline', marginRight: '4px' }} />
              {webGPUAccelerator.getIsSupported() ? 'WebGPU Accelerated' : 'WASM CPU Mode'}
            </span>
          </div>
          
          <div className="view-toggles" style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              onClick={() => setViewMode('3d')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: viewMode === '3d' ? 'var(--bg-panel-solid)' : 'transparent', border: 'none', borderRadius: '6px', color: viewMode === '3d' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, boxShadow: viewMode === '3d' ? '0 2px 8px rgba(0,0,0,0.5)' : 'none', transition: 'all 0.2s' }}
            >
              <Box size={16} color={viewMode === '3d' ? 'var(--accent)' : 'currentColor'} /> {t.view3d}
            </button>
            <button 
              onClick={() => setViewMode('spreadsheet')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: viewMode === 'spreadsheet' ? 'var(--bg-panel-solid)' : 'transparent', border: 'none', borderRadius: '6px', color: viewMode === 'spreadsheet' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, boxShadow: viewMode === 'spreadsheet' ? '0 2px 8px rgba(0,0,0,0.5)' : 'none', transition: 'all 0.2s' }}
            >
              <Table size={16} color={viewMode === 'spreadsheet' ? 'var(--accent)' : 'currentColor'} /> {t.spreadsheet}
            </button>
            <button 
              onClick={() => setViewMode('report')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: viewMode === 'report' ? 'var(--bg-panel-solid)' : 'transparent', border: 'none', borderRadius: '6px', color: viewMode === 'report' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, boxShadow: viewMode === 'report' ? '0 2px 8px rgba(0,0,0,0.5)' : 'none', transition: 'all 0.2s' }}
            >
              <FileText size={16} color={viewMode === 'report' ? 'var(--accent)' : 'currentColor'} /> {t.report}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className="btn-secondary" 
            onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
            style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.5)', background: 'rgba(56, 189, 248, 0.1)', fontWeight: 700 }}
          >
            <Globe size={16} /> {language === 'ko' ? 'ENG' : '한글'}
          </button>
          
          {/* Phase 17 Time History Trigger */}
          <button className="btn-secondary" onClick={() => setShowTimeHistoryWizard(true)} style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.5)', background: 'rgba(56, 189, 248, 0.1)' }}>
            <Activity size={16} /> {language === 'ko' ? '지진파 시간이력' : 'Time History'}
          </button>
          
          {/* Phase 19 DXF Export/Import Modal Trigger */}
          <button className="btn-secondary" onClick={() => setShowDXFModal(true)}>
            <Download size={16} /> CAD / DXF
          </button>

          {/* Phase 18 AI Optimizer Modal Trigger */}
          <button className="btn-secondary" onClick={() => setShowOptimizerModal(true)} style={{ color: '#c4b5fd', borderColor: 'rgba(139, 92, 246, 0.5)', background: 'rgba(139, 92, 246, 0.1)' }}>
            <Sparkles size={16} /> {language === 'ko' ? 'AI 단면 최적화' : 'Optimize Sections'}
          </button>

          <button className="btn-secondary" onClick={() => setShowAIAssistant(true)} style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.5)', background: 'rgba(16, 185, 129, 0.1)' }}>
            <Sparkles size={16} /> {t.aiAssistant}
          </button>
          <button className="btn-secondary" onClick={() => setShowLoadWizard(true)} style={{ color: 'var(--accent)', borderColor: 'rgba(59, 130, 246, 0.5)' }}>
            <Zap size={16} /> {t.loadWizard}
          </button>
          <button className="btn-secondary" onClick={handleLoadSample}>
            <RotateCcw size={16} /> {t.loadSample}
          </button>
          <button className="btn-primary" onClick={handleSolve}>
            <Play size={16} fill="currentColor" /> {t.solveEngine}
          </button>
        </div>
      </div>

      <div className="main-layout" style={{ display: 'flex', height: 'calc(100vh - 52px)', position: 'relative' }}>
        <SidebarLeft />
        
        <main className="center-viewport" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {viewMode === '3d' && <Canvas3DViewer />}
          {viewMode === 'spreadsheet' && <SpreadsheetEditor />}
          {viewMode === 'report' && <ReportViewer />}
        </main>

        {viewMode === '3d' && <PropertyEditor />}
      </div>

      <BottomPanel />

      <LoadingOverlay isVisible={isSolving} message="Executing 3D FEM Matrix Solver Engine..." />
      <LoadWizard isOpen={showLoadWizard} onClose={() => setShowLoadWizard(false)} />
      <AIAssistant isOpen={showAIAssistant} onClose={() => setShowAIAssistant(false)} />

      {/* Phases 17-20 Modals */}
      <TimeHistoryWizard isOpen={showTimeHistoryWizard} onClose={() => setShowTimeHistoryWizard(false)} />
      <OptimizerModal isOpen={showOptimizerModal} onClose={() => setShowOptimizerModal(false)} />
      <DXFManagerModal isOpen={showDXFModal} onClose={() => setShowDXFModal(false)} />
      <WebGPUInspectorModal isOpen={showWebGPUModal} onClose={() => setShowWebGPUModal(false)} />
    </div>
  );
}

export default App;
