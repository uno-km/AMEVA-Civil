import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Sparkles, CheckCircle2, TrendingDown, X } from 'lucide-react';
import { optimizeStructureSections, type OptimizationReport } from '../../engine/optimizer';

export const OptimizerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { results, language = 'ko' } = useProjectStore();
  const [reports, setReports] = useState<OptimizationReport[]>([]);
  const [isOptimized, setIsOptimized] = useState(false);

  if (!isOpen) return null;

  const handleRunOptimization = () => {
    const state = useProjectStore.getState();
    try {
      const { updatedSections, updatedElements, reports } = optimizeStructureSections(state);
      setReports(reports);
      setIsOptimized(true);
      useProjectStore.setState({ sections: updatedSections, elements: updatedElements, results: null });
    } catch (err: any) {
      alert(err.message || "Run solver first!");
    }
  };

  const totalSavings = reports.length > 0 
    ? (reports.reduce((sum, r) => sum + r.weightSavingsPercent, 0) / reports.length).toFixed(1) 
    : '0.0';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-panel-solid)', width: '750px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(139, 92, 246, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#c4b5fd', fontWeight: 700, fontSize: '1.1rem' }}>
            <Sparkles size={20} /> {language === 'ko' ? 'AI 강재 단면 자동 최적화 시스템' : 'AI Steel Section Optimizer'}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
          
          {!isOptimized ? (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <Sparkles size={48} color="#c4b5fd" style={{ margin: '0 auto 16px auto', display: 'block' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#fff' }}>
                {language === 'ko' ? 'KDS LRFD 검토 기반 단면 자동 다이어트' : 'Automated Structural Weight Reduction'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 20px auto' }}>
                {language === 'ko' 
                  ? '부재력 포괄(Envelope) 결과와 KS H형강 단면 DB를 대조하여 D/C 비율(안전율) 1.0을 만족하는 최소 중량 규격 단면을 탐색합니다.' 
                  : 'Scans all members against KS standard steel section DB to find the minimum weight section satisfying Demand/Capacity ratio <= 1.0.'}
              </p>
              <button className="btn-primary" onClick={handleRunOptimization} style={{ backgroundColor: '#8b5cf6', padding: '10px 24px', fontSize: '0.95rem' }}>
                <Sparkles size={18} /> {language === 'ko' ? '원클릭 최적화 시작' : 'Start Optimization'}
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, padding: '14px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TrendingDown size={32} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{language === 'ko' ? '평균 강재 중량 절감률' : 'Average Weight Savings'}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>-{totalSavings}%</div>
                  </div>
                </div>
                <div style={{ flex: 1, padding: '14px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={32} color="#c4b5fd" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{language === 'ko' ? '최적화 적용 부재' : 'Optimized Members'}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c4b5fd' }}>{reports.length} EA</div>
                  </div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>{language === 'ko' ? '부재 ID' : 'Member ID'}</th>
                    <th style={{ padding: '10px' }}>{language === 'ko' ? '기존 단면' : 'Original Section'}</th>
                    <th style={{ padding: '10px' }}>{language === 'ko' ? '추천 최적 단면' : 'Optimal Section'}</th>
                    <th style={{ padding: '10px' }}>D/C Ratio</th>
                    <th style={{ padding: '10px' }}>{language === 'ko' ? '중량 절감' : 'Savings'}</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace' }}>{r.elementId.substring(0, 8)}</td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{r.currentSectionName}</td>
                      <td style={{ padding: '10px', color: '#c4b5fd', fontWeight: 700 }}>{r.recommendedSection.name}</td>
                      <td style={{ padding: '10px', color: '#10b981', fontWeight: 600 }}>{r.maxRatio.toFixed(3)}</td>
                      <td style={{ padding: '10px', color: '#38bdf8', fontWeight: 600 }}>-{r.weightSavingsPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

        </div>

        <div style={{ padding: '16px 20px', backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn-secondary" onClick={onClose}>{language === 'ko' ? '닫기' : 'Close'}</button>
        </div>

      </div>
    </div>
  );
};
