import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Sphere, Cone, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { useProjectStore } from '../../store/projectStore';
import type { Node, BoundaryCondition, NodalLoad, Section, ElementForceResult } from '../../types/models';
import { createSectionShape } from '../../utils/sectionUtils';

const NodeElement = ({ node, isSelected, onClick }: { node: Node, isSelected: boolean, onClick: (e: any) => void }) => {
  return (
    <Sphere position={[node.x, node.y, node.z]} args={[0.2, 16, 16]} onClick={onClick}>
      <meshStandardMaterial color={isSelected ? '#ef4444' : '#3b82f6'} />
    </Sphere>
  );
};

const BoundaryConditionElement = ({ node, bc }: { node: Node, bc: BoundaryCondition }) => {
  if (!bc.ux && !bc.uy && !bc.uz) return null;
  // A simple pyramid for support
  return (
    <Cone position={[node.x, node.y - 0.3, node.z]} args={[0.4, 0.6, 4]} rotation={[0, Math.PI / 4, 0]}>
      <meshStandardMaterial color="#fbbf24" />
    </Cone>
  );
};

const LoadElement = ({ node, load }: { node: Node, load: NodalLoad }) => {
  if (!load.fx && !load.fy && !load.fz) return null;
  // Arrow pointing to the node based on load direction
  // Simplified for MVP: just a red cylinder acting as an arrow shaft
  const length = 1.5;
  const isDown = (load.fy || 0) < 0;
  const isRight = (load.fx || 0) > 0;
  
  let pos: [number, number, number] = [node.x, node.y, node.z];
  let rot: [number, number, number] = [0, 0, 0];

  if (isDown) {
    pos = [node.x, node.y + length/2 + 0.2, node.z];
  } else if (isRight) {
    pos = [node.x - length/2 - 0.2, node.y, node.z];
    rot = [0, 0, -Math.PI / 2];
  }

  return (
    <group position={pos} rotation={rot}>
      <Cylinder args={[0.05, 0.05, length, 8]}>
        <meshStandardMaterial color="#f43f5e" />
      </Cylinder>
      {/* Arrow Head */}
      <Cone position={[0, -length/2, 0]} args={[0.15, 0.4, 8]} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial color="#f43f5e" />
      </Cone>
    </group>
  );
};

const FrameElement = ({ n1, n2, section, isSelected, onClick, forces, showBMD, showStress }: { n1: Node, n2: Node, section: Section, isSelected: boolean, onClick: (e: any) => void, forces?: ElementForceResult, showBMD: boolean, showStress: boolean }) => {
  const shape = useMemo(() => createSectionShape(section), [section]);
  
  const meshData = useMemo(() => {
    const start = new THREE.Vector3(n1.x, n1.y, n1.z);
    const end = new THREE.Vector3(n2.x, n2.y, n2.z);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    
    const extrudeSettings = { depth: length, bevelEnabled: false, curveSegments: 2 };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.translate(0, 0, -length / 2);
    
    const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion();
    const axis = new THREE.Vector3(0, 0, 1);
    
    quaternion.setFromUnitVectors(axis, direction.normalize());
    if (Math.abs(direction.y) > 0.99) {
      quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), direction.y > 0 ? -Math.PI/2 : Math.PI/2);
    }

    return { geom, position, quaternion, length };
  }, [n1, n2, shape]);

  // Generate BMD Plane Geometry if forces exist and showBMD is true
  const bmdData = useMemo(() => {
    if (!showBMD || !forces) return null;
    const { start, end } = forces.nodes;
    // Scale factor for visualization
    const scale = 0.05; 
    
    // Create a shape for BMD
    const bmdShape = new THREE.Shape();
    bmdShape.moveTo(0, 0); // start center
    bmdShape.lineTo(0, start.mz * scale); // start height
    bmdShape.lineTo(meshData.length, end.mz * scale); // end height
    bmdShape.lineTo(meshData.length, 0); // end center
    bmdShape.lineTo(0, 0);

    const bmdGeom = new THREE.ShapeGeometry(bmdShape);
    bmdGeom.translate(-meshData.length / 2, 0, 0);
    
    // Rotate to match the element's local axis (local y-z plane)
    bmdGeom.rotateY(-Math.PI / 2);

    return { geom: bmdGeom };
  }, [forces, showBMD, meshData.length]);

  const elementColor = useMemo(() => {
    if (isSelected) return '#ef4444';
    if (showStress && forces && forces.principalStresses && forces.principalStresses.maxVonMises !== undefined) {
      // Very simple heatmap from Blue (0) to Red (High stress)
      const stress = forces.principalStresses.maxVonMises;
      const maxStressThreshold = 250; // Assume 250 MPa is high
      const ratio = Math.min(Math.max(stress / maxStressThreshold, 0), 1);
      
      const r = Math.round(ratio * 255);
      const b = Math.round((1 - ratio) * 255);
      return `rgb(${r}, 0, ${b})`;
    }
    return '#6b7280';
  }, [isSelected, showStress, forces]);

  return (
    <group position={meshData.position} quaternion={meshData.quaternion}>
      <mesh onClick={onClick}>
        <primitive object={meshData.geom} attach="geometry" />
        <meshStandardMaterial 
          color={elementColor} 
          roughness={0.4} 
          metalness={0.3} 
          side={THREE.DoubleSide}
          transparent={showBMD}
          opacity={showBMD ? 0.3 : 1}
        />
        <lineSegments>
          <edgesGeometry args={[meshData.geom]} />
          <lineBasicMaterial color={isSelected ? '#ffffff' : '#1f2937'} linewidth={1} transparent={showBMD} opacity={showBMD ? 0.1 : 1} />
        </lineSegments>
      </mesh>

      {/* Render BMD */}
      {bmdData && (
        <mesh>
          <primitive object={bmdData.geom} attach="geometry" />
          <meshBasicMaterial color="#3b82f6" side={THREE.DoubleSide} transparent opacity={0.6} />
          <lineSegments>
            <edgesGeometry args={[bmdData.geom]} />
            <lineBasicMaterial color="#1d4ed8" linewidth={2} />
          </lineSegments>
        </mesh>
      )}
    </group>
  );
};

const DeformedFrameElement = ({ n1, n2 }: { n1: Node, n2: Node }) => {
  const points = useMemo(() => {
    return [new THREE.Vector3(n1.x, n1.y, n1.z), new THREE.Vector3(n2.x, n2.y, n2.z)];
  }, [n1, n2]);

  return (
    <Line
      points={points}
      color="#10b981"
      lineWidth={2}
      dashed
    />
  );
};

export const Canvas3DViewer: React.FC = () => {
  const { nodes, elements, results, selectedItems, setSelectedItems } = useProjectStore();
  const [showDeformed, setShowDeformed] = useState(false);
  const [showBMD, setShowBMD] = useState(false);
  const [showStress, setShowStress] = useState(false);
  
  const activeResult = results;
  const initialResultId = activeResult?.loadCombinations && Object.keys(activeResult.loadCombinations).length > 0 
    ? Object.keys(activeResult.loadCombinations)[0] 
    : (activeResult?.loadCases ? Object.keys(activeResult.loadCases)[0] : '');
  
  const [activeResultId, setActiveResultId] = useState(initialResultId);

  const currentResultMap = activeResultId.startsWith('mode-')
    ? { displacements: activeResult?.eigenvalues?.modeShapes[parseInt(activeResultId.split('-')[1])] || {} }
    : activeResultId.startsWith('th-')
      ? { displacements: activeResult?.timeHistoryResults?.[parseInt(activeResultId.split('-')[1])]?.displacements || {} }
      : (activeResult?.loadCombinations && activeResult.loadCombinations[activeResultId]) 
        ? activeResult.loadCombinations[activeResultId] 
        : (activeResult?.loadCases ? activeResult.loadCases[activeResultId] : null);

  const handleNodeClick = (e: any, id: string) => {
    e.stopPropagation();
    setSelectedItems([{ id, type: 'node' }]);
  };

  const handleElementClick = (e: any, id: string) => {
    e.stopPropagation();
    setSelectedItems([{ id, type: 'element' }]);
  };

  const handlePointerMissed = () => {
    setSelectedItems([]);
  };

  const getDeformedNode = (nodeId: string) => {
    if (!currentResultMap || !showDeformed) return null;
    const disp = currentResultMap.displacements[nodeId];
    if (!disp) return null;

    const scale = 50; // amplification factor for visibility
    return {
      ...nodes[nodeId],
      x: nodes[nodeId].x + disp.dx * scale,
      y: nodes[nodeId].y + disp.dy * scale,
      z: nodes[nodeId].z + disp.dz * scale
    };
  };

  return (
    <div className="canvas-container" style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#111827' }}>
      <Canvas
        camera={{ position: [10, 15, 25], fov: 50 }}
        onPointerMissed={handlePointerMissed}
        gl={{ preserveDrawingBuffer: true }}
      >
        <color attach="background" args={['#111827']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Ground Grid */}
        <Grid
          args={[100, 100]}
          cellSize={1}
          cellThickness={1}
          cellColor="#333"
          sectionSize={5}
          sectionThickness={1.5}
          sectionColor="#555"
          fadeDistance={50}
          fadeStrength={1}
          position={[0, -0.5, 0]}
        />
        
        <OrbitControls makeDefault />

        {/* Draw Original Elements */}
        {Object.values(elements).map(el => {
          const n1 = nodes[el.startNodeId];
          const n2 = nodes[el.endNodeId];
          const section = useProjectStore.getState().sections[el.sectionId];
          if (!n1 || !n2 || !section) return null;
          const isSelected = selectedItems.some(i => i.id === el.id);

          // Get forces for this element based on active result
          let forces: ElementForceResult | undefined;
          if (activeResult) {
            const lcRes = activeResult.loadCases[activeResultId] || activeResult.loadCombinations[activeResultId];
            if (lcRes && lcRes.elementForces) {
              forces = lcRes.elementForces[el.id];
            }
          }

          return (
            <FrameElement 
              key={el.id} 
              n1={n1} 
              n2={n2} 
              section={section}
              isSelected={isSelected} 
              onClick={(e) => handleElementClick(e, el.id)} 
              forces={forces}
              showBMD={showBMD}
              showStress={showStress}
            />
          );
        })}

        {/* Draw Deformed Elements if enabled */}
        {showDeformed && Object.values(elements).map(el => {
          const dn1 = getDeformedNode(el.startNodeId);
          const dn2 = getDeformedNode(el.endNodeId);
          if (!dn1 || !dn2) return null;
          return (
            <DeformedFrameElement 
              key={`def-${el.id}`} 
              n1={dn1} 
              n2={dn2} 
            />
          );
        })}

        {/* Draw Nodes */}
        {Object.values(nodes).map(node => {
          const n = showDeformed ? getDeformedNode(node.id) : node;
          if (!n) return null;
          const isSelected = selectedItems.some(i => i.id === node.id);
          return (
            <NodeElement 
              key={node.id} 
              node={n} 
              isSelected={isSelected} 
              onClick={(e) => handleNodeClick(e, node.id)} 
            />
          );
        })}

        {/* Draw Boundary Conditions */}
        {Object.values(useProjectStore.getState().boundaryConditions).map(bc => {
          const node = nodes[bc.nodeId];
          if (!node) return null;
          return <BoundaryConditionElement key={bc.id} node={node} bc={bc} />;
        })}

        {/* Draw Nodal Loads for the first load case */}
        {Object.entries(useProjectStore.getState().nodalLoads).map(([_lcId, loads]) => 
          loads.map(load => {
            const node = nodes[load.nodeId];
            if (!node) return null;
            return <LoadElement key={load.id} node={node} load={load} />;
          })
        )}

        {/* Draw Element Loads */}
        {Object.entries(useProjectStore.getState().elementLoads).map(([_lcId, loads]) => 
          loads.map(load => {
            const el = elements[load.elementId];
            if (!el) return null;
            const n1 = nodes[el.startNodeId];
            const n2 = nodes[el.endNodeId];
            if (!n1 || !n2) return null;
            
            const pos: [number, number, number] = [(n1.x + n2.x)/2, (n1.y + n2.y)/2 + 1, (n1.z + n2.z)/2];
            return (
              <group key={load.id} position={pos}>
                <Cylinder args={[0.05, 0.05, 1, 8]}>
                  <meshStandardMaterial color="#facc15" />
                </Cylinder>
                <Cone position={[0, -0.5, 0]} args={[0.15, 0.4, 8]} rotation={[Math.PI, 0, 0]}>
                  <meshStandardMaterial color="#facc15" />
                </Cone>
              </group>
            );
          })
        )}
      </Canvas>

      {/* 3D UI Overlay Toolbar */}
      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--bg-border)', backdropFilter: 'var(--glass-blur)', width: '260px', boxShadow: 'var(--glass-shadow)' }}>
        <h4 style={{ margin: '0', fontSize: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--bg-border)', paddingBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent)' }}>❖</span> Post-Processing
          </span>
          <button 
            onClick={() => {
              const canvas = document.querySelector('.canvas-container canvas') as HTMLCanvasElement;
              if (canvas) {
                useProjectStore.getState().setCaptureImage(canvas.toDataURL('image/png'));
                alert("3D View Captured for Report!");
              }
            }}
            style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            CAPTURE
          </button>
        </h4>
        
        {activeResult && activeResult.status === 'success' ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Case / Combo</label>
              <select 
                value={activeResultId} 
                onChange={e => setActiveResultId(e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
              >
                <optgroup label="Load Cases">
                  {Object.keys(activeResult.loadCases).map(id => (
                    <option key={`lc-${id}`} value={id}>LC: {id.substring(0,6)}</option>
                  ))}
                </optgroup>
                {activeResult.loadCombinations && Object.keys(activeResult.loadCombinations).length > 0 && (
                  <optgroup label="Load Combinations">
                    {Object.keys(activeResult.loadCombinations).map(id => (
                      <option key={`cb-${id}`} value={id}>Comb: {useProjectStore.getState().loadCombinations[id]?.name || id.substring(0,6)}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, padding: '8px', background: showDeformed ? 'rgba(16, 185, 129, 0.15)' : 'transparent', borderRadius: '6px', border: showDeformed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent', transition: 'all 0.2s' }}>
                <input type="checkbox" checked={showDeformed} onChange={e => setShowDeformed(e.target.checked)} style={{ accentColor: '#10b981' }} />
                Deformed Shape
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, padding: '8px', background: showBMD ? 'rgba(59, 130, 246, 0.15)' : 'transparent', borderRadius: '6px', border: showBMD ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent', transition: 'all 0.2s' }}>
                <input type="checkbox" checked={showBMD} onChange={e => setShowBMD(e.target.checked)} style={{ accentColor: '#3b82f6' }} />
                Bending Moment (BMD)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, padding: '8px', background: showStress ? 'rgba(245, 158, 11, 0.15)' : 'transparent', borderRadius: '6px', border: showStress ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent', transition: 'all 0.2s' }}>
                <input type="checkbox" checked={showStress} onChange={e => setShowStress(e.target.checked)} style={{ accentColor: '#f59e0b' }} />
                Stress Contour
              </label>
            </div>
            
            {activeResult.timeHistoryResults && activeResult.timeHistoryResults.length > 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>⏱ Time History Playback</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <input 
                    type="range" 
                    min="0" 
                    max={activeResult.timeHistoryResults.length - 1} 
                    onChange={e => {
                      const stepIdx = parseInt(e.target.value);
                      setActiveResultId(`th-${stepIdx}`);
                      setShowDeformed(true);
                    }}
                    style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>t = 0.00s</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                      {activeResult.timeHistoryResults[parseInt(activeResultId.replace('th-', '')) || 0]?.time.toFixed(2)}s
                    </span>
                    <span>{activeResult.timeHistoryResults[activeResult.timeHistoryResults.length - 1].time.toFixed(2)}s</span>
                  </div>
                </div>
              </div>
            )}

            {activeResult.eigenvalues && activeResult.eigenvalues.modeShapes.length > 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Mode Shape</label>
                <select 
                  onChange={e => {
                    const idx = parseInt(e.target.value);
                    if (idx >= 0) {
                      setActiveResultId(`mode-${idx}`);
                      setShowDeformed(true);
                    } else {
                      setActiveResultId(initialResultId);
                    }
                  }}
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', outline: 'none', marginTop: '6px' }}
                >
                  <option value="-1">None</option>
                  {activeResult.eigenvalues.frequencies.map((freq, i) => (
                    <option key={`mode-${i}`} value={i}>Mode {i+1} ({freq.toFixed(2)} Hz)</option>
                  ))}
                </select>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--danger)', textAlign: 'center', padding: '16px 0', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            No Analysis Results
          </div>
        )}
      </div>
    </div>
  );
};
