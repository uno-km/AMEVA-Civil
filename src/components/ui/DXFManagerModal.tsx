import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { FileCode, Download, Upload, X } from 'lucide-react';
import { exportToDXF, importFromDXF } from '../../utils/dxfUtils';

export const DXFManagerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { nodes, elements, language = 'ko' } = useProjectStore();

  if (!isOpen) return null;

  const handleExport = () => {
    const state = useProjectStore.getState();
    const dxfString = exportToDXF(state);
    const blob = new Blob([dxfString], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AMEVA_Civil_Model.dxf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const { nodes: newNodes, elements: newElements } = importFromDXF(text);
        useProjectStore.setState({
          nodes: { ...useProjectStore.getState().nodes, ...newNodes },
          elements: { ...useProjectStore.getState().elements, ...newElements },
          results: null
        });
        alert(language === 'ko' ? `DXF 불러오기 완료: 절점 ${Object.keys(newNodes).length}개, 부재 ${Object.keys(newElements).length}개` : `Imported ${Object.keys(newNodes).length} nodes, ${Object.keys(newElements).length} elements.`);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-panel-solid)', width: '550px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#60a5fa', fontWeight: 700, fontSize: '1.1rem' }}>
            <FileCode size={20} /> {language === 'ko' ? 'BIM / CAD DXF 데이터 상호 운용 매니저' : 'BIM / CAD DXF Interoperability'}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <Upload size={36} color="#60a5fa" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#fff' }}>DXF Import</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {language === 'ko' ? 'AutoCAD 도면(LINE 엔티티)을 파싱하여 3D 구조 모델로 생성' : 'Import LINE entities from AutoCAD .dxf into 3D Nodes and Frame Elements.'}
            </p>
            <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#3b82f6' }}>
              <Upload size={16} /> {language === 'ko' ? 'DXF 파일 선택' : 'Select DXF File'}
              <input type="file" accept=".dxf" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <Download size={36} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#fff' }}>DXF Export</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {language === 'ko' ? '현재 3D 프레임 모델을 AutoCAD ASCII DXF 파일로 내보내기' : 'Export current 3D frame model into standard AutoCAD ASCII DXF format.'}
            </p>
            <button className="btn-primary" onClick={handleExport} style={{ backgroundColor: '#10b981' }}>
              <Download size={16} /> {language === 'ko' ? 'DXF 저장' : 'Export DXF'}
            </button>
          </div>

        </div>

        <div style={{ padding: '12px 20px', backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {language === 'ko' ? '현재 모델 정보: 절점 ' + Object.keys(nodes).length + '개 / 부재 ' + Object.keys(elements).length + '개' : 'Current Model: ' + Object.keys(nodes).length + ' Nodes / ' + Object.keys(elements).length + ' Elements'}
        </div>

      </div>
    </div>
  );
};
