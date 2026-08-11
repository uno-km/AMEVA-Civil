import { useState } from 'react';
import { Canvas3DViewer } from './components/viewer/Canvas3DViewer';
import { SidebarLeft } from './components/layout/SidebarLeft';
import { PropertyEditor } from './components/layout/PropertyEditor';
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
import { useUIStore } from './store/uiStore';
import { createPortalFrameSample } from './data/samples';
import { RibbonMenu } from './components/layout/RibbonMenu';
import { StatusBar } from './components/layout/StatusBar';
import { ModalManager } from './components/ui/ModalManager';
import { useState } from 'react';
import './index.css';

function App() {
  const { nodes, language = 'ko', setLanguage } = useProjectStore();
  const { viewMode, activeModal, closeModal, openModal } = useUIStore();
  const [isSolving, setIsSolving] = useState(false);

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
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      {/* 1. Professional Ribbon Menu (Top) */}
      <RibbonMenu 
        onSolve={handleSolve} 
        onLoadSample={handleLoadSample} 
      />

      {/* 2. Main Workspace (Center) */}
      <div className="main-layout" style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        <SidebarLeft />
        
        <main className="center-viewport" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {viewMode === '3d' && <Canvas3DViewer />}
          {viewMode === 'spreadsheet' && <SpreadsheetEditor />}
          {viewMode === 'report' && <ReportViewer />}
        </main>

        {viewMode === '3d' && <PropertyEditor />}
      </div>

      {/* 3. Professional Status Bar (Bottom) */}
      <StatusBar />

      {/* 4. Overlays & Modals */}
      <LoadingOverlay isVisible={isSolving} message="Executing 3D FEM Matrix Solver Engine..." />
      <LoadWizard isOpen={activeModal === 'load_wizard'} onClose={closeModal} />
      <AIAssistant isOpen={activeModal === 'ai_assistant'} onClose={closeModal} />

      {/* Phases 17-20 Modals */}
      <TimeHistoryWizard isOpen={activeModal === 'load_time_history'} onClose={closeModal} />
      <OptimizerModal isOpen={activeModal === 'design_optimize'} onClose={closeModal} />
      <DXFManagerModal isOpen={activeModal === 'dxf_manager'} onClose={closeModal} />
      <WebGPUInspectorModal isOpen={activeModal === 'webgpu_inspector'} onClose={closeModal} />

      {/* Dynamic Shell Modals for Ribbon UI */}
      <ModalManager />
    </div>
  );
}

export default App;
