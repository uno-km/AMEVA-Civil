import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Cpu, CheckCircle2, AlertTriangle, Zap, X } from 'lucide-react';
import { webGPUAccelerator } from '../../engine/webgpuSolver';

export const WebGPUInspectorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { language = 'ko' } = useProjectStore();
  const isWebGPUSupported = webGPUAccelerator.getIsSupported();

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-panel-solid)', width: '550px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>
            <Cpu size={20} /> {language === 'ko' ? 'WebGPU 병렬 하드웨어 가속 상태 (Compute Engine)' : 'WebGPU Parallel Compute Inspector'}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ padding: '16px', borderRadius: '8px', background: isWebGPUSupported ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', border: isWebGPUSupported ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            {isWebGPUSupported ? <CheckCircle2 size={32} color="#10b981" /> : <AlertTriangle size={32} color="#f59e0b" />}
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                {isWebGPUSupported ? (language === 'ko' ? 'WebGPU 가속 엔진 활성화됨' : 'WebGPU Compute Engine Active') : (language === 'ko' ? 'WASM CPU 대체 모드 작동 중' : 'WASM CPU Fallback Mode Active')}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {isWebGPUSupported
                  ? (language === 'ko' ? 'GPU 컴퓨팅 셰이더(WGSL)를 통해 대규모 FEM 강성 행렬 조립 및 행렬-벡터 곱셈이 하드웨어 병렬 처리됩니다.' : 'WGSL Compute Shaders handle large-scale matrix computations directly on GPU.')
                  : (language === 'ko' ? 'WebGPU를 사용할 수 없어 고성능 WASM Multi-thread CPU 솔버가 대체 구동됩니다.' : 'WebGPU API is unavailable. High-performance WASM CPU solver is active.')}
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>API Provider</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>WebGPU (W3C Standard)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Shader Language</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>WGSL (WebGPU Shading Language)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Workgroup Dispatch Size</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>64 threads / workgroup</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Max Matrix Acceleration</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>Up to 100,000 DOFs</span>
            </div>
          </div>

        </div>

        <div style={{ padding: '16px 20px', backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>{language === 'ko' ? '확인' : 'OK'}</button>
        </div>

      </div>
    </div>
  );
};
