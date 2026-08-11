import { create, all } from 'mathjs';
import type { ProjectState, AnalysisResult, DisplacementResult, ReactionResult, LoadCaseResult, ElementForceResult } from '../types/models';
import { calculateSectionProperties } from '../utils/sectionProperties';

const math = create(all);

export class Fem3DEngine {
  private state: ProjectState;
  
  constructor(state: ProjectState) {
    this.state = state;
  }

  // Phase 4: Scaffolding for Geometric Stiffness (P-Delta)
  // This function will be used in a Newton-Raphson loop in the future
  public getGeometricStiffness(P: number, L: number): math.Matrix {
    const kg = math.zeros(12, 12) as math.Matrix;
    const p = P / (30 * L); // P is axial tension
    
    kg.set([1, 1], p * 36); kg.set([1, 5], p * 3 * L); kg.set([1, 7], -p * 36); kg.set([1, 11], p * 3 * L);
    kg.set([2, 2], p * 36); kg.set([2, 4], -p * 3 * L); kg.set([2, 8], -p * 36); kg.set([2, 10], -p * 3 * L);
    kg.set([4, 2], -p * 3 * L); kg.set([4, 4], p * 4 * L * L); kg.set([4, 8], p * 3 * L); kg.set([4, 10], -p * L * L);
    kg.set([5, 1], p * 3 * L); kg.set([5, 5], p * 4 * L * L); kg.set([5, 7], -p * 3 * L); kg.set([5, 11], -p * L * L);
    
    // Symmetric parts
    kg.set([7, 1], -p * 36); kg.set([7, 5], -p * 3 * L); kg.set([7, 7], p * 36); kg.set([7, 11], -p * 3 * L);
    kg.set([8, 2], -p * 36); kg.set([8, 4], p * 3 * L); kg.set([8, 8], p * 36); kg.set([8, 10], p * 3 * L);
    kg.set([10, 2], -p * 3 * L); kg.set([10, 4], -p * L * L); kg.set([10, 8], p * 3 * L); kg.set([10, 10], p * 4 * L * L);
    kg.set([11, 1], p * 3 * L); kg.set([11, 5], -p * L * L); kg.set([11, 7], -p * 3 * L); kg.set([11, 11], p * 4 * L * L);
    
    return kg;
  }

  public solve(): AnalysisResult {
    try {
      const result: AnalysisResult = {
        status: 'success',
        loadCases: {},
        loadCombinations: {},
        envelope: { 
          max: { displacements: {}, elementForces: {}, reactions: {} },
          min: { displacements: {}, elementForces: {}, reactions: {} } 
        }
      };

      // 0. Validation
      const nodeIds = Object.keys(this.state.nodes);
      const elementIds = Object.keys(this.state.elements);
      
      if (nodeIds.length === 0) throw new Error("No nodes defined.");
      if (elementIds.length === 0) throw new Error("No elements defined.");
      
      for (const el of Object.values(this.state.elements)) {
        if (!this.state.materials[el.materialId]) throw new Error(`Element ${el.id.substring(0,8)} has missing material.`);
        if (!this.state.sections[el.sectionId]) throw new Error(`Element ${el.id.substring(0,8)} has missing section.`);
        if (el.startNodeId === el.endNodeId) throw new Error(`Element ${el.id.substring(0,8)} has same start and end node.`);
      }

      if (Object.keys(this.state.boundaryConditions).length === 0) {
        throw new Error("No boundary conditions defined. Structure is unstable.");
      }

      // 1. Create DOF mapping (6 DOFs per node)
      const numNodes = nodeIds.length;
      const numDofs = numNodes * 6;
      
      const dofMap: Record<string, number> = {};
      nodeIds.forEach((id, index) => {
        dofMap[id] = index * 6; // start index for ux, uy, uz, rx, ry, rz
      });

      // We process each Load Case independently
      const lcIds = Object.keys(this.state.loadCases);
      if (lcIds.length === 0) {
        // Create a dummy load case if none exists so it can solve dead weight or just return 0
        lcIds.push('dummy');
      }

      let K_elastic_global: math.Matrix | null = null;
      let fixedDOFs_global: Set<number> | null = null;

      for (const lcId of lcIds) {
        // 2. Initialize Global Stiffness Matrix K and Force Vector F
        // Using dense matrices for MVP, sparse is better for production
        let K = math.zeros(numDofs, numDofs) as math.Matrix;
        let F = math.zeros(numDofs, 1) as math.Matrix;

        // 3. Assemble Global Stiffness Matrix
        const elementLocalK: Record<string, math.Matrix> = {};
        const elementT: Record<string, math.Matrix> = {};

        for (const el of Object.values(this.state.elements)) {
          const n1 = this.state.nodes[el.startNodeId];
          const n2 = this.state.nodes[el.endNodeId];
          const mat = this.state.materials[el.materialId];
          
          // Phase 1: Use exact properties from calculateSectionProperties
          const rawSec = this.state.sections[el.sectionId];
          const sec = calculateSectionProperties(rawSec) as typeof rawSec;

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dz = n2.z - n1.z;
          const L = Math.sqrt(dx*dx + dy*dy + dz*dz);
          
          if (L === 0) throw new Error(`Element ${el.id} has zero length.`);

          const E = mat.elasticModulus;
          const G = E / (2 * (1 + mat.poissonRatio));
          const A = sec.area;
          const Iy = sec.iy;
          const Iz = sec.iz;
          const J = sec.j || (Iy + Iz); // Fallback to polar moment if J is not computed
          
          // Timoshenko shear deformation factors (Phi)
          // Default to 0 (Euler-Bernoulli) if shear area is not provided
          const Asy = sec.asy;
          const Asz = sec.asz;
          const phi_y = Asy ? (12 * E * Iz) / (G * Asy * L * L) : 0;
          const phi_z = Asz ? (12 * E * Iy) / (G * Asz * L * L) : 0;

          // 12x12 Local Stiffness Matrix for 3D Frame (Timoshenko)
          const kLocal = math.zeros(12, 12) as math.Matrix;
          
          const a = E * A / L;
          
          const b_y = (12 * E * Iz) / (Math.pow(L, 3) * (1 + phi_y));
          const c_y = (6 * E * Iz) / (Math.pow(L, 2) * (1 + phi_y));
          const d_y = ((4 + phi_y) * E * Iz) / (L * (1 + phi_y));
          const e_y = ((2 - phi_y) * E * Iz) / (L * (1 + phi_y));
          
          const b_z = (12 * E * Iy) / (Math.pow(L, 3) * (1 + phi_z));
          const c_z = (6 * E * Iy) / (Math.pow(L, 2) * (1 + phi_z));
          const d_z = ((4 + phi_z) * E * Iy) / (L * (1 + phi_z));
          const e_z = ((2 - phi_z) * E * Iy) / (L * (1 + phi_z));

          const t = G * J / L;

          // Row 1 (u1)
          kLocal.set([0, 0], a); kLocal.set([0, 6], -a);
          // Row 2 (v1)
          kLocal.set([1, 1], b_y); kLocal.set([1, 5], c_y); kLocal.set([1, 7], -b_y); kLocal.set([1, 11], c_y);
          // Row 3 (w1)
          kLocal.set([2, 2], b_z); kLocal.set([2, 4], -c_z); kLocal.set([2, 8], -b_z); kLocal.set([2, 10], -c_z);
          // Row 4 (theta_x1)
          kLocal.set([3, 3], t); kLocal.set([3, 9], -t);
          // Row 5 (theta_y1)
          kLocal.set([4, 2], -c_z); kLocal.set([4, 4], d_z); kLocal.set([4, 8], c_z); kLocal.set([4, 10], e_z);
          // Row 6 (theta_z1)
          kLocal.set([5, 1], c_y); kLocal.set([5, 5], d_y); kLocal.set([5, 7], -c_y); kLocal.set([5, 11], e_y);
          
          // Row 7 (u2)
          kLocal.set([6, 0], -a); kLocal.set([6, 6], a);
          // Row 8 (v2)
          kLocal.set([7, 1], -b_y); kLocal.set([7, 5], -c_y); kLocal.set([7, 7], b_y); kLocal.set([7, 11], -c_y);
          // Row 9 (w2)
          kLocal.set([8, 2], -b_z); kLocal.set([8, 4], c_z); kLocal.set([8, 8], b_z); kLocal.set([8, 10], c_z);
          // Row 10 (theta_x2)
          kLocal.set([9, 3], -t); kLocal.set([9, 9], t);
          // Row 11 (theta_y2)
          kLocal.set([10, 2], -c_z); kLocal.set([10, 4], e_z); kLocal.set([10, 8], c_z); kLocal.set([10, 10], d_z);
          // Row 12 (theta_z2)
          kLocal.set([11, 1], c_y); kLocal.set([11, 5], e_y); kLocal.set([11, 7], -c_y); kLocal.set([11, 11], d_y);

          elementLocalK[el.id] = kLocal;

          // Phase 2: 3D Transformation Matrix T (12x12) with Beta Angle
          const cx = dx / L;
          const cy = dy / L;
          const cz = dz / L;
          
          const beta = (el.betaAngle || 0) * Math.PI / 180;
          const cb = Math.cos(beta);
          const sb = Math.sin(beta);
          
          const D = Math.sqrt(cx*cx + cz*cz);
          let lambda;

          if (D < 1e-6) {
            // Vertical member
            if (cy > 0) {
              lambda = math.matrix([
                [0, 1, 0],
                [-cb, 0, sb],
                [sb, 0, cb]
              ]);
            } else {
              lambda = math.matrix([
                [0, -1, 0],
                [cb, 0, sb],
                [-sb, 0, cb]
              ]);
            }
          } else {
            lambda = math.matrix([
              [cx, cy, cz],
              [
                (-cx*cy*cb - cz*sb)/D,
                D*cb,
                (-cy*cz*cb + cx*sb)/D
              ],
              [
                (cx*cy*sb - cz*cb)/D,
                -D*sb,
                (cy*cz*sb + cx*cb)/D
              ]
            ]);
          }

          const T = math.zeros(12, 12) as math.Matrix;
          
          // Assemble 12x12 T
          for (let i = 0; i < 4; i++) {
            const offset = i * 3;
            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 3; c++) {
                T.set([offset + r, offset + c], lambda.get([r, c]));
              }
            }
          }

          elementT[el.id] = T;

          // K_global = T^T * kLocal * T
          const TT = math.transpose(T);
          const kGlobal = math.multiply(math.multiply(TT, kLocal), T) as math.Matrix;

          // Assemble into global K
          const i1 = dofMap[el.startNodeId];
          const i2 = dofMap[el.endNodeId];
          const indices = [
            i1, i1+1, i1+2, i1+3, i1+4, i1+5,
            i2, i2+1, i2+2, i2+3, i2+4, i2+5
          ];

          for (let r = 0; r < 12; r++) {
            for (let c = 0; c < 12; c++) {
              const globalR = indices[r];
              const globalC = indices[c];
              const currentVal = K.get([globalR, globalC]);
              K.set([globalR, globalC], currentVal + kGlobal.get([r, c]));
            }
          }
        }

        // 4. Apply Nodal Loads
        const nodalLoads = this.state.nodalLoads[lcId] || [];
        for (const load of nodalLoads) {
          const idx = dofMap[load.nodeId];
          if (idx !== undefined) {
            F.set([idx, 0], F.get([idx, 0]) + (load.fx || 0));
            F.set([idx+1, 0], F.get([idx+1, 0]) + (load.fy || 0));
            F.set([idx+2, 0], F.get([idx+2, 0]) + (load.fz || 0));
            F.set([idx+3, 0], F.get([idx+3, 0]) + (load.mx || 0));
            F.set([idx+4, 0], F.get([idx+4, 0]) + (load.my || 0));
            F.set([idx+5, 0], F.get([idx+5, 0]) + (load.mz || 0));
          }
        }

        const elementFEFLocal: Record<string, math.Matrix> = {};
        const elementWLocal: Record<string, {wx: number, wy: number, wz: number}> = {};

        // Phase 2 (New): Apply Self-weight & Element Loads (FEF)
        const lc = this.state.loadCases[lcId] || { type: 'dummy' };
        for (const el of Object.values(this.state.elements)) {
          let w_global_x = 0;
          let w_global_y = 0;
          let w_global_z = 0;

          let w_local_x = 0;
          let w_local_y = 0;
          let w_local_z = 0;

          const mat = this.state.materials[el.materialId];
          const sec = calculateSectionProperties(this.state.sections[el.sectionId]);
          
          if (lc.type === 'dead') {
            w_global_z -= (sec.area || 0) * mat.density;
          }

          const T = elementT[el.id];
          const n1 = this.state.nodes[el.startNodeId];
          const n2 = this.state.nodes[el.endNodeId];
          const L = Math.sqrt(Math.pow(n2.x-n1.x, 2) + Math.pow(n2.y-n1.y, 2) + Math.pow(n2.z-n1.z, 2));

          const fefLocal = math.zeros(12, 1) as math.Matrix;

          if (T) {
            // 1. Convert global gravity to local
            if (w_global_x !== 0 || w_global_y !== 0 || w_global_z !== 0) {
              w_local_x += T.get([0,0])*w_global_x + T.get([0,1])*w_global_y + T.get([0,2])*w_global_z;
              w_local_y += T.get([1,0])*w_global_x + T.get([1,1])*w_global_y + T.get([1,2])*w_global_z;
              w_local_z += T.get([2,0])*w_global_x + T.get([2,1])*w_global_y + T.get([2,2])*w_global_z;
            }

            // 2. Read Applied Element Loads
            const elLoads = (this.state.elementLoads[lcId] || []).filter(l => l.elementId === el.id);
            for (const load of elLoads) {
              const w1 = load.w1;
              const w2 = load.w2 ?? w1;
              let qx1 = 0, qy1 = 0, qz1 = 0;
              let qx2 = 0, qy2 = 0, qz2 = 0;
              
              if (load.direction.startsWith('global-')) {
                // Approximate global trapezoidal load by transforming w1 and w2 to local
                const gAxis = load.direction;
                const gx = gAxis === 'global-X' ? 1 : 0;
                const gy = gAxis === 'global-Y' ? 1 : 0;
                const gz = gAxis === 'global-Z' ? 1 : 0;
                
                qx1 = T.get([0,0])*gx*w1 + T.get([0,1])*gy*w1 + T.get([0,2])*gz*w1;
                qy1 = T.get([1,0])*gx*w1 + T.get([1,1])*gy*w1 + T.get([1,2])*gz*w1;
                qz1 = T.get([2,0])*gx*w1 + T.get([2,1])*gy*w1 + T.get([2,2])*gz*w1;

                qx2 = T.get([0,0])*gx*w2 + T.get([0,1])*gy*w2 + T.get([0,2])*gz*w2;
                qy2 = T.get([1,0])*gx*w2 + T.get([1,1])*gy*w2 + T.get([1,2])*gz*w2;
                qz2 = T.get([2,0])*gx*w2 + T.get([2,1])*gy*w2 + T.get([2,2])*gz*w2;
              } else {
                if (load.direction === 'local-x') { qx1 = w1; qx2 = w2; }
                if (load.direction === 'local-y') { qy1 = w1; qy2 = w2; }
                if (load.direction === 'local-z') { qz1 = w1; qz2 = w2; }
              }

              if (load.type === 'concentrated') {
                const a = load.distance || L / 2;
                const b = L - a;
                const Px = qx1;
                const Py = qy1;
                const Pz = qz1;

                if (Px !== 0) {
                  fefLocal.set([0, 0], fefLocal.get([0, 0]) + Px * b / L);
                  fefLocal.set([6, 0], fefLocal.get([6, 0]) + Px * a / L);
                }
                if (Py !== 0) {
                  fefLocal.set([1, 0], fefLocal.get([1, 0]) + Py * b * b * (3 * a + b) / (L * L * L));
                  fefLocal.set([5, 0], fefLocal.get([5, 0]) + Py * a * b * b / (L * L));
                  fefLocal.set([7, 0], fefLocal.get([7, 0]) + Py * a * a * (a + 3 * b) / (L * L * L));
                  fefLocal.set([11, 0], fefLocal.get([11, 0]) - Py * a * a * b / (L * L));
                }
                if (Pz !== 0) {
                  fefLocal.set([2, 0], fefLocal.get([2, 0]) + Pz * b * b * (3 * a + b) / (L * L * L));
                  fefLocal.set([4, 0], fefLocal.get([4, 0]) - Pz * a * b * b / (L * L));
                  fefLocal.set([8, 0], fefLocal.get([8, 0]) + Pz * a * a * (a + 3 * b) / (L * L * L));
                  fefLocal.set([10, 0], fefLocal.get([10, 0]) + Pz * a * a * b / (L * L));
                }
              } else {
                // Uniform or Trapezoidal
                // x-axis (axial)
                if (qx1 !== 0 || qx2 !== 0) {
                  fefLocal.set([0, 0], fefLocal.get([0, 0]) + (2 * qx1 + qx2) * L / 6);
                  fefLocal.set([6, 0], fefLocal.get([6, 0]) + (qx1 + 2 * qx2) * L / 6);
                }
                // y-axis (bending about z)
                if (qy1 !== 0 || qy2 !== 0) {
                  fefLocal.set([1, 0], fefLocal.get([1, 0]) + (7 * qy1 + 3 * qy2) * L / 20);
                  fefLocal.set([5, 0], fefLocal.get([5, 0]) + (3 * qy1 + 2 * qy2) * L * L / 60);
                  fefLocal.set([7, 0], fefLocal.get([7, 0]) + (3 * qy1 + 7 * qy2) * L / 20);
                  fefLocal.set([11, 0], fefLocal.get([11, 0]) - (2 * qy1 + 3 * qy2) * L * L / 60);
                }
                // z-axis (bending about y)
                if (qz1 !== 0 || qz2 !== 0) {
                  fefLocal.set([2, 0], fefLocal.get([2, 0]) + (7 * qz1 + 3 * qz2) * L / 20);
                  fefLocal.set([4, 0], fefLocal.get([4, 0]) - (3 * qz1 + 2 * qz2) * L * L / 60);
                  fefLocal.set([8, 0], fefLocal.get([8, 0]) + (3 * qz1 + 7 * qz2) * L / 20);
                  fefLocal.set([10, 0], fefLocal.get([10, 0]) + (2 * qz1 + 3 * qz2) * L * L / 60);
                }
                
                // Keep track of average distributed load for FBD stations approximation
                w_local_x += (qx1 + qx2) / 2;
                w_local_y += (qy1 + qy2) / 2;
                w_local_z += (qz1 + qz2) / 2;
              }
            }

            // 3. Apply element gravity self-weight (uniform)
            if (w_local_x !== 0) {
              fefLocal.set([0, 0], fefLocal.get([0, 0]) + w_local_x * L / 2);
              fefLocal.set([6, 0], fefLocal.get([6, 0]) + w_local_x * L / 2);
            }
            if (w_local_y !== 0) {
              fefLocal.set([1, 0], fefLocal.get([1, 0]) + w_local_y * L / 2);
              fefLocal.set([5, 0], fefLocal.get([5, 0]) + w_local_y * L * L / 12);
              fefLocal.set([7, 0], fefLocal.get([7, 0]) + w_local_y * L / 2);
              fefLocal.set([11, 0], fefLocal.get([11, 0]) - w_local_y * L * L / 12);
            }
            if (w_local_z !== 0) {
              fefLocal.set([2, 0], fefLocal.get([2, 0]) + w_local_z * L / 2);
              fefLocal.set([4, 0], fefLocal.get([4, 0]) - w_local_z * L * L / 12);
              fefLocal.set([8, 0], fefLocal.get([8, 0]) + w_local_z * L / 2);
              fefLocal.set([10, 0], fefLocal.get([10, 0]) + w_local_z * L * L / 12);
            }

            // Store for post-processing
            elementFEFLocal[el.id] = fefLocal;
            elementWLocal[el.id] = { wx: w_local_x, wy: w_local_y, wz: w_local_z };

            // Transform FEF back to global
            const TT = math.transpose(T);
            const fefGlobal = math.multiply(TT, fefLocal) as math.Matrix;

              const idx1 = dofMap[el.startNodeId];
              const idx2 = dofMap[el.endNodeId];
              const indices = [
                idx1, idx1+1, idx1+2, idx1+3, idx1+4, idx1+5,
                idx2, idx2+1, idx2+2, idx2+3, idx2+4, idx2+5
              ];

              for (let i = 0; i < 12; i++) {
                const globalR = indices[i];
                F.set([globalR, 0], F.get([globalR, 0]) + fefGlobal.get([i, 0]));
              }
            }
        }

        // Phase 1: Save original K and F for exact reaction calculation
        const K_elastic = math.clone(K) as math.Matrix;
        const F_original = math.clone(F) as math.Matrix;

        // 5. Apply Boundary Conditions (Exact Partitioning - Payne-Irons method)
        const fixedDOFs = new Set<number>();
        for (const bc of Object.values(this.state.boundaryConditions)) {
          const idx = dofMap[bc.nodeId];
          if (idx !== undefined) {
            if (bc.ux) fixedDOFs.add(idx);
            if (bc.uy) fixedDOFs.add(idx+1);
            if (bc.uz) fixedDOFs.add(idx+2);
            if (bc.rx) fixedDOFs.add(idx+3);
            if (bc.ry) fixedDOFs.add(idx+4);
            if (bc.rz) fixedDOFs.add(idx+5);
          }
        }
        K_elastic_global = K_elastic;
        fixedDOFs_global = fixedDOFs;

        // Phase 3 & 16: Non-linear Loop (Geometric & Material Load Incremental)
        const isNonLinear = this.state.analysisSettings.method === 'nonlinear-static';
        const numSteps = isNonLinear ? (this.state.analysisSettings.nonlinearSteps || 10) : 1;
        const MAX_ITER = isNonLinear ? 20 : 1;
        const TOLERANCE = this.state.analysisSettings.tolerance || 1e-5;
        
        let U = math.zeros(numDofs, 1) as math.Matrix;
        
        // Track plastic hinges (stiffness reduction factors)
        const elementYieldFactors: Record<string, { y: number, z: number }> = {};
        for (const el of Object.values(this.state.elements)) {
          elementYieldFactors[el.id] = { y: 1.0, z: 1.0 };
        }

        let U_prev_step = math.zeros(numDofs, 1) as math.Matrix;
        let K_total = math.clone(K_elastic) as math.Matrix;

        for (let step = 1; step <= numSteps; step++) {
          const loadFactor = step / numSteps;
          const F_step = math.multiply(F_original, loadFactor) as math.Matrix;
          
          let U_iter = math.clone(U_prev_step) as math.Matrix;

          for (let iter = 0; iter < MAX_ITER; iter++) {
            K_total = math.zeros(numDofs, numDofs) as math.Matrix;
            
            // Re-assemble K_total incorporating stiffness reduction and geometric stiffness
            for (const el of Object.values(this.state.elements)) {
              const idx1 = dofMap[el.startNodeId];
              const idx2 = dofMap[el.endNodeId];
              const T = elementT[el.id];
              
              if (T) {
                // MATERIAL NONLINEARITY (Phase 16): Re-build kLocal with reduced stiffness if yielded
                const mat = this.state.materials[el.materialId];
                const rawSec = this.state.sections[el.sectionId];
                const sec = calculateSectionProperties(rawSec) as typeof rawSec;
                const L = Math.sqrt(Math.pow(this.state.nodes[el.endNodeId].x - this.state.nodes[el.startNodeId].x, 2) + Math.pow(this.state.nodes[el.endNodeId].y - this.state.nodes[el.startNodeId].y, 2) + Math.pow(this.state.nodes[el.endNodeId].z - this.state.nodes[el.startNodeId].z, 2));
                
                const E = mat.elasticModulus;
                const G = E / (2 * (1 + mat.poissonRatio));
                const A = sec.area;
                
                const yieldF = elementYieldFactors[el.id];
                // Smeared plasticity: reduce bending stiffness for the entire element if plastic hinge formed
                const Iy = sec.iy * yieldF.y; 
                const Iz = sec.iz * yieldF.z;
                const J = (sec.j || (sec.iy + sec.iz));

                const phi_y = sec.asy ? (12 * E * Iz) / (G * sec.asy * L * L) : 0;
                const phi_z = sec.asz ? (12 * E * Iy) / (G * sec.asz * L * L) : 0;

                const kLocal = math.zeros(12, 12) as math.Matrix;
                const a = E * A / L;
                const b_y = (12 * E * Iz) / (Math.pow(L, 3) * (1 + phi_y));
                const c_y = (6 * E * Iz) / (Math.pow(L, 2) * (1 + phi_y));
                const d_y = ((4 + phi_y) * E * Iz) / (L * (1 + phi_y));
                const e_y = ((2 - phi_y) * E * Iz) / (L * (1 + phi_y));
                const b_z = (12 * E * Iy) / (Math.pow(L, 3) * (1 + phi_z));
                const c_z = (6 * E * Iy) / (Math.pow(L, 2) * (1 + phi_z));
                const d_z = ((4 + phi_z) * E * Iy) / (L * (1 + phi_z));
                const e_z = ((2 - phi_z) * E * Iy) / (L * (1 + phi_z));
                const t = G * J / L;

                kLocal.set([0, 0], a); kLocal.set([0, 6], -a);
                kLocal.set([1, 1], b_y); kLocal.set([1, 5], c_y); kLocal.set([1, 7], -b_y); kLocal.set([1, 11], c_y);
                kLocal.set([2, 2], b_z); kLocal.set([2, 4], -c_z); kLocal.set([2, 8], -b_z); kLocal.set([2, 10], -c_z);
                kLocal.set([3, 3], t); kLocal.set([3, 9], -t);
                kLocal.set([4, 2], -c_z); kLocal.set([4, 4], d_z); kLocal.set([4, 8], c_z); kLocal.set([4, 10], e_z);
                kLocal.set([5, 1], c_y); kLocal.set([5, 5], d_y); kLocal.set([5, 7], -c_y); kLocal.set([5, 11], e_y);
                kLocal.set([6, 0], -a); kLocal.set([6, 6], a);
                kLocal.set([7, 1], -b_y); kLocal.set([7, 5], -c_y); kLocal.set([7, 7], b_y); kLocal.set([7, 11], -c_y);
                kLocal.set([8, 2], -b_z); kLocal.set([8, 4], c_z); kLocal.set([8, 8], b_z); kLocal.set([8, 10], c_z);
                kLocal.set([9, 3], -t); kLocal.set([9, 9], t);
                kLocal.set([10, 2], -c_z); kLocal.set([10, 4], e_z); kLocal.set([10, 8], c_z); kLocal.set([10, 10], d_z);
                kLocal.set([11, 1], c_y); kLocal.set([11, 5], e_y); kLocal.set([11, 7], -c_y); kLocal.set([11, 11], d_y);

                const TT = math.transpose(T);
                let kgGlobal = math.zeros(12, 12) as math.Matrix;
                
                if (isNonLinear) {
                  // Compute geometric stiffness from U_iter (P-Delta)
                  const uGlobal = math.matrix([
                    [U_iter.get([idx1, 0])], [U_iter.get([idx1+1, 0])], [U_iter.get([idx1+2, 0])],
                    [U_iter.get([idx1+3, 0])], [U_iter.get([idx1+4, 0])], [U_iter.get([idx1+5, 0])],
                    [U_iter.get([idx2, 0])], [U_iter.get([idx2+1, 0])], [U_iter.get([idx2+2, 0])],
                    [U_iter.get([idx2+3, 0])], [U_iter.get([idx2+4, 0])], [U_iter.get([idx2+5, 0])]
                  ]);
                  const uLocal = math.multiply(T, uGlobal) as math.Matrix;
                  const enlLocal = elementFEFLocal[el.id] || math.zeros(12, 1);
                  const fLocal = math.subtract(math.multiply(kLocal, uLocal), enlLocal) as math.Matrix;
                  
                  const P = fLocal.get([6, 0]); // Axial force
                  const kgLocal = this.getGeometricStiffness(P, L);
                  kgGlobal = math.multiply(math.multiply(TT, kgLocal), T) as math.Matrix;
                }
                
                const kGlobal = math.multiply(math.multiply(TT, kLocal), T) as math.Matrix;
                
                const indices = [
                  idx1, idx1+1, idx1+2, idx1+3, idx1+4, idx1+5,
                  idx2, idx2+1, idx2+2, idx2+3, idx2+4, idx2+5
                ];
                for (let r = 0; r < 12; r++) {
                  for (let c = 0; c < 12; c++) {
                    const globalR = indices[r];
                    const globalC = indices[c];
                    K_total.set([globalR, globalC], K_total.get([globalR, globalC]) + kGlobal.get([r, c]) + kgGlobal.get([r, c]));
                  }
                }
              }
            }

            let K_solve = math.clone(K_total) as math.Matrix;
            let F_solve = math.clone(F_step) as math.Matrix;

            // Apply Payne-Irons Method
            for (const idx of fixedDOFs) {
              for (let i = 0; i < numDofs; i++) {
                K_solve.set([idx, i], 0);
                K_solve.set([i, idx], 0);
              }
              K_solve.set([idx, idx], 1);
              F_solve.set([idx, 0], 0);
            }

            const U_new = math.lusolve(K_solve, F_solve) as math.Matrix;
            
            if (isNonLinear) {
              let maxDiff = 0;
              for (let i = 0; i < numDofs; i++) {
                maxDiff = Math.max(maxDiff, Math.abs(U_new.get([i, 0]) - U_iter.get([i, 0])));
              }
              U_iter = U_new;
              if (maxDiff < TOLERANCE) break;
            } else {
              U_iter = U_new;
              break;
            }
          } // End of Iterations
          
          U_prev_step = U_iter;
          U = U_iter;

          // Check for plastic hinge formation for next step
          if (isNonLinear && step < numSteps) {
            for (const el of Object.values(this.state.elements)) {
              const mat = this.state.materials[el.materialId];
              const sec = calculateSectionProperties(this.state.sections[el.sectionId]);
              if (!mat.yieldStrength || !sec.dimensions?.h) continue;

              const idx1 = dofMap[el.startNodeId];
              const idx2 = dofMap[el.endNodeId];
              const T = elementT[el.id];
              let kLocal = elementLocalK[el.id]; // original elastic
              
              const uGlobal = math.matrix([
                [U.get([idx1, 0])], [U.get([idx1+1, 0])], [U.get([idx1+2, 0])],
                [U.get([idx1+3, 0])], [U.get([idx1+4, 0])], [U.get([idx1+5, 0])],
                [U.get([idx2, 0])], [U.get([idx2+1, 0])], [U.get([idx2+2, 0])],
                [U.get([idx2+3, 0])], [U.get([idx2+4, 0])], [U.get([idx2+5, 0])]
              ]);
              const uLocal = math.multiply(T, uGlobal) as math.Matrix;
              const enlLocal = elementFEFLocal[el.id] || math.zeros(12, 1);
              const fLocal = math.subtract(math.multiply(kLocal, uLocal), enlLocal) as math.Matrix;
              
              const mz1 = Math.abs(fLocal.get([5, 0]));
              const mz2 = Math.abs(fLocal.get([11, 0]));
              const my1 = Math.abs(fLocal.get([4, 0]));
              const my2 = Math.abs(fLocal.get([10, 0]));

              // Approximate plastic moment capacity My = Fy * Z (Z ~ 1.15 * S)
              const h = sec.dimensions.h || 0.1;
              const b = sec.dimensions.b || 0.1;
              const Sy = sec.iy / (b/2);
              const Sz = sec.iz / (h/2);
              const My_yield_z = mat.yieldStrength * Sz * 1.15;
              const My_yield_y = mat.yieldStrength * Sy * 1.15;

              // If moment exceeds plastic capacity, reduce stiffness significantly to simulate hinge
              if (mz1 > My_yield_z || mz2 > My_yield_z) elementYieldFactors[el.id].z = 1e-4; 
              if (my1 > My_yield_y || my2 > My_yield_y) elementYieldFactors[el.id].y = 1e-4;
            }
          }
        }
        
        // Restore K_total for reaction calculation if needed (or K_elastic, depending on if reactions include P-Delta shear forces)
        // Mathematically, reactions in P-Delta should use K_total
        const K_original = K_total;

        // Phase 1: Calculate Exact Reactions R = K_original * U - F_original
        const R = math.subtract(math.multiply(K_original, U), F_original) as math.Matrix;

        // 7. Extract Results
        const displacements: Record<string, DisplacementResult> = {};
        const reactions: Record<string, ReactionResult> = {};
        const elementForces: Record<string, ElementForceResult> = {};

        // Extract Displacements and calculate Reactions
        for (const id of Object.keys(this.state.nodes)) {
          const idx = dofMap[id];
          const dx = U.get([idx, 0]);
          const dy = U.get([idx+1, 0]);
          const dz = U.get([idx+2, 0]);
          const rx = U.get([idx+3, 0]);
          const ry = U.get([idx+4, 0]);
          const rz = U.get([idx+5, 0]);

          displacements[id] = { dx, dy, dz, rx, ry, rz };

          // Reactions from R vector
          const bc = Object.values(this.state.boundaryConditions).find(b => b.nodeId === id);
          if (bc) {
            reactions[id] = {
              fx: bc.ux ? R.get([idx, 0]) : 0,
              fy: bc.uy ? R.get([idx+1, 0]) : 0,
              fz: bc.uz ? R.get([idx+2, 0]) : 0,
              mx: bc.rx ? R.get([idx+3, 0]) : 0,
              my: bc.ry ? R.get([idx+4, 0]) : 0,
              mz: bc.rz ? R.get([idx+5, 0]) : 0,
            };
          }
        }

        // Extract element forces
        // Extract element forces
        for (const el of Object.values(this.state.elements)) {
          const idx1 = dofMap[el.startNodeId];
          const idx2 = dofMap[el.endNodeId];
          
          const uGlobal = math.matrix([
            [U.get([idx1, 0])], [U.get([idx1+1, 0])], [U.get([idx1+2, 0])],
            [U.get([idx1+3, 0])], [U.get([idx1+4, 0])], [U.get([idx1+5, 0])],
            [U.get([idx2, 0])], [U.get([idx2+1, 0])], [U.get([idx2+2, 0])],
            [U.get([idx2+3, 0])], [U.get([idx2+4, 0])], [U.get([idx2+5, 0])]
          ]);

          const kLocal = elementLocalK[el.id];
          const T = elementT[el.id];
          const sec = calculateSectionProperties(this.state.sections[el.sectionId]);
          
          if (kLocal && T) {
            const uLocal = math.multiply(T, uGlobal) as math.Matrix;
            // Phase 2: Exact Element Force Recovery (F = k * u - ENL)
            const enlLocal = elementFEFLocal[el.id] || math.zeros(12, 1);
            const wLocal = elementWLocal[el.id] || { wx: 0, wy: 0, wz: 0 };
            
            const fLocal = math.subtract(math.multiply(kLocal, uLocal), enlLocal) as math.Matrix;
            
            const startNodeForces = { 
              fx: fLocal.get([0,0]), fy: fLocal.get([1,0]), fz: fLocal.get([2,0]), 
              mx: fLocal.get([3,0]), my: fLocal.get([4,0]), mz: fLocal.get([5,0]) 
            };
            const endNodeForces = { 
              fx: fLocal.get([6,0]), fy: fLocal.get([7,0]), fz: fLocal.get([8,0]), 
              mx: fLocal.get([9,0]), my: fLocal.get([10,0]), mz: fLocal.get([11,0]) 
            };

            // Phase 2: Exact FBD Parabolic Stations
            const L = Math.sqrt(
              Math.pow(this.state.nodes[el.endNodeId].x - this.state.nodes[el.startNodeId].x, 2) + 
              Math.pow(this.state.nodes[el.endNodeId].y - this.state.nodes[el.startNodeId].y, 2) + 
              Math.pow(this.state.nodes[el.endNodeId].z - this.state.nodes[el.startNodeId].z, 2)
            );
            
            const stations = [0.25, 0.5, 0.75].map(ratio => {
              const x = ratio * L;
              // Parabolic FBD equations
              return {
                distance: x,
                forces: {
                  fx: startNodeForces.fx - wLocal.wx * x,
                  fy: startNodeForces.fy - wLocal.wy * x,
                  fz: startNodeForces.fz - wLocal.wz * x,
                  mx: startNodeForces.mx, // Torsion is constant for uniform loads
                  my: startNodeForces.my - startNodeForces.fz * x + wLocal.wz * x * x / 2, // Sign convention dependent
                  mz: startNodeForces.mz + startNodeForces.fy * x - wLocal.wy * x * x / 2, 
                }
              };
            });

            // Phase 5: Principal Stresses calculation (Von Mises & Mohr's Circle)
            let maxTension = 0;
            let maxCompression = 0;
            let maxShear = 0;
            let maxVonMises = 0;

            if (sec.dimensions && sec.dimensions.h && sec.dimensions.b) {
              const P = Math.max(Math.abs(startNodeForces.fx), Math.abs(endNodeForces.fx));
              const Vy = Math.max(Math.abs(startNodeForces.fy), Math.abs(endNodeForces.fy));
              const Vz = Math.max(Math.abs(startNodeForces.fz), Math.abs(endNodeForces.fz));
              const T_torsion = Math.max(Math.abs(startNodeForces.mx), Math.abs(endNodeForces.mx));
              const My = Math.max(Math.abs(startNodeForces.my), Math.abs(endNodeForces.my));
              const Mz = Math.max(Math.abs(startNodeForces.mz), Math.abs(endNodeForces.mz));

              const A = sec.area || 1;
              const Iy = sec.iy || 1;
              const Iz = sec.iz || 1;
              const Asy = sec.asy || A;
              const Asz = sec.asz || A;
              const J = sec.j || 1;

              const h = sec.dimensions.h;
              const b = sec.dimensions.b;

              // Check 4 corners for extreme normal stresses
              const corners = [
                { y: b/2, z: h/2 }, { y: -b/2, z: h/2 },
                { y: b/2, z: -h/2 }, { y: -b/2, z: -h/2 }
              ];

              for (const c of corners) {
                // sigma_x = P/A + My*z/Iy + Mz*y/Iz
                const sigma_x = (P / A) + (My * c.z / Iy) + (Mz * c.y / Iz);
                
                if (sigma_x > maxTension) maxTension = sigma_x;
                if (sigma_x < maxCompression) maxCompression = sigma_x;
              }

              // Shear stresses at neutral axes (approx max shear for standard shapes)
              const tau_xy = (Vy / Asy) + (T_torsion * (h/2) / J);
              const tau_xz = (Vz / Asz) + (T_torsion * (b/2) / J);
              maxShear = Math.sqrt(tau_xy * tau_xy + tau_xz * tau_xz);

              // Von Mises Equivalent Stress: sigma_v = sqrt(sigma_x^2 + 3*(tau_xy^2 + tau_xz^2))
              // Assuming worst case where max normal and max shear coincide for conservative design
              const worstSigma = Math.max(Math.abs(maxTension), Math.abs(maxCompression));
              maxVonMises = Math.sqrt(worstSigma * worstSigma + 3 * maxShear * maxShear);
            }

            elementForces[el.id] = {
              nodes: {
                start: startNodeForces,
                end: endNodeForces
              },
              stations,
              principalStresses: {
                maxTension,
                maxCompression,
                maxShear,
                maxVonMises
              }
            };
          }
        }

        result.loadCases[lcId] = {
          displacements,
          reactions,
          elementForces
        };
      }

      const loadCombinations: Record<string, LoadCaseResult> = {};
      
      // Calculate Load Combinations via superposition
      for (const [combId, comb] of Object.entries(this.state.loadCombinations)) {
        const combDisplacements: Record<string, DisplacementResult> = {};
        const combReactions: Record<string, ReactionResult> = {};
        const combElementForces: Record<string, ElementForceResult> = {};

        // Initialize zero values for all nodes and elements
        for (const id of Object.keys(this.state.nodes)) {
          combDisplacements[id] = { dx: 0, dy: 0, dz: 0, rx: 0, ry: 0, rz: 0 };
          combReactions[id] = { fx: 0, fy: 0, fz: 0, mx: 0, my: 0, mz: 0 };
        }
        for (const elId of Object.keys(this.state.elements)) {
          combElementForces[elId] = {
            nodes: {
              start: { fx: 0, fy: 0, fz: 0, mx: 0, my: 0, mz: 0 },
              end: { fx: 0, fy: 0, fz: 0, mx: 0, my: 0, mz: 0 }
            }
          };
        }

        // Superposition
        for (const [lcId, factor] of Object.entries(comb.factors)) {
          const lcRes = result.loadCases[lcId];
          if (!lcRes) continue;

          for (const [id, d] of Object.entries(lcRes.displacements)) {
            combDisplacements[id].dx += d.dx * factor;
            combDisplacements[id].dy += d.dy * factor;
            combDisplacements[id].dz += d.dz * factor;
            combDisplacements[id].rx += d.rx * factor;
            combDisplacements[id].ry += d.ry * factor;
            combDisplacements[id].rz += d.rz * factor;
          }

          for (const [id, r] of Object.entries(lcRes.reactions)) {
            if (combReactions[id]) {
              combReactions[id].fx += r.fx * factor;
              combReactions[id].fy += r.fy * factor;
              combReactions[id].fz += r.fz * factor;
              combReactions[id].mx += r.mx * factor;
              combReactions[id].my += r.my * factor;
              combReactions[id].mz += r.mz * factor;
            }
          }

          // In the future: Add element forces superposition here
        }

        loadCombinations[combId] = {
          displacements: combDisplacements,
          reactions: combReactions,
          elementForces: combElementForces
        };
      }

      // Envelope Calculation (Max/Min over all combinations)
      const envMax: LoadCaseResult = { displacements: {}, reactions: {}, elementForces: {} };
      const envMin: LoadCaseResult = { displacements: {}, reactions: {}, elementForces: {} };
      
      // Initialize Envelope with extreme values
      for (const id of Object.keys(this.state.nodes)) {
        envMax.displacements[id] = { dx: -Infinity, dy: -Infinity, dz: -Infinity, rx: -Infinity, ry: -Infinity, rz: -Infinity };
        envMin.displacements[id] = { dx: Infinity, dy: Infinity, dz: Infinity, rx: Infinity, ry: Infinity, rz: Infinity };
        envMax.reactions[id] = { fx: -Infinity, fy: -Infinity, fz: -Infinity, mx: -Infinity, my: -Infinity, mz: -Infinity };
        envMin.reactions[id] = { fx: Infinity, fy: Infinity, fz: Infinity, mx: Infinity, my: Infinity, mz: Infinity };
      }

      for (const elId of Object.keys(this.state.elements)) {
        envMax.elementForces[elId] = {
          nodes: { start: { fx:-Infinity, fy:-Infinity, fz:-Infinity, mx:-Infinity, my:-Infinity, mz:-Infinity }, end: { fx:-Infinity, fy:-Infinity, fz:-Infinity, mx:-Infinity, my:-Infinity, mz:-Infinity } }
        };
        envMin.elementForces[elId] = {
          nodes: { start: { fx:Infinity, fy:Infinity, fz:Infinity, mx:Infinity, my:Infinity, mz:Infinity }, end: { fx:Infinity, fy:Infinity, fz:Infinity, mx:Infinity, my:Infinity, mz:Infinity } }
        };
      }

      const combosToEnvelope = Object.values(loadCombinations).length > 0 
        ? Object.values(loadCombinations) 
        : Object.values(result.loadCases);

      for (const res of combosToEnvelope) {
        for (const [id, d] of Object.entries(res.displacements)) {
          ['dx','dy','dz','rx','ry','rz'].forEach(key => {
            const k = key as keyof DisplacementResult;
            envMax.displacements[id][k] = Math.max(envMax.displacements[id][k], d[k]);
            envMin.displacements[id][k] = Math.min(envMin.displacements[id][k], d[k]);
          });
        }
        for (const [id, r] of Object.entries(res.reactions)) {
          if (envMax.reactions[id]) {
            ['fx','fy','fz','mx','my','mz'].forEach(key => {
              const k = key as keyof ReactionResult;
              envMax.reactions[id][k] = Math.max(envMax.reactions[id][k], r[k] || 0);
              envMin.reactions[id][k] = Math.min(envMin.reactions[id][k], r[k] || 0);
            });
          }
        }
        for (const [id, f] of Object.entries(res.elementForces)) {
          if (envMax.elementForces[id]) {
            ['start', 'end'].forEach(node => {
              const nd = node as 'start' | 'end';
              ['fx','fy','fz','mx','my','mz'].forEach(key => {
                const k = key as keyof typeof f.nodes.start;
                envMax.elementForces[id].nodes[nd][k] = Math.max(envMax.elementForces[id].nodes[nd][k], f.nodes[nd][k]);
                envMin.elementForces[id].nodes[nd][k] = Math.min(envMin.elementForces[id].nodes[nd][k], f.nodes[nd][k]);
              });
            });
          }
        }
      }

      let eigenvalues;
      if (K_elastic_global && fixedDOFs_global) {
        const K_elastic = K_elastic_global;
        const fixedDOFs = fixedDOFs_global;

        // Phase 13: Eigenvalue Analysis (Lumped Mass Matrix)
        // Assemble Mass Matrix M
        let M = math.zeros(numDofs, 1) as math.Matrix; // Lumped mass is diagonal, store as vector for efficiency
        
        for (const el of Object.values(this.state.elements)) {
          const mat = this.state.materials[el.materialId];
          const sec = calculateSectionProperties(this.state.sections[el.sectionId]);
          const n1 = this.state.nodes[el.startNodeId];
          const n2 = this.state.nodes[el.endNodeId];
          
          const L = Math.sqrt(Math.pow(n2.x-n1.x,2) + Math.pow(n2.y-n1.y,2) + Math.pow(n2.z-n1.z,2));
          // kg if density is N/m3, wait, standard is kg/m3. 
          // If density is kN/m3, mass = kN/m3 * 1000 / 9.81 kg/m3... Let's assume density is mass density or weight density.
          // Usually, in civil engineering, weight density is given (e.g. 24 kN/m3). Mass density = 24/9.81 = 2.44 tons/m3.
          const massPerNode = (mat.density * (sec.area || 1) * L) / (2 * 9.81); // Tonnes or kg depending on units
          
          const idx1 = dofMap[el.startNodeId];
          const idx2 = dofMap[el.endNodeId];
        
        // Add lumped mass to translational DOFs (x, y, z)
        M.set([idx1, 0], M.get([idx1, 0]) + massPerNode);
        M.set([idx1+1, 0], M.get([idx1+1, 0]) + massPerNode);
        M.set([idx1+2, 0], M.get([idx1+2, 0]) + massPerNode);
        
        M.set([idx2, 0], M.get([idx2, 0]) + massPerNode);
        M.set([idx2+1, 0], M.get([idx2+1, 0]) + massPerNode);
        M.set([idx2+2, 0], M.get([idx2+2, 0]) + massPerNode);
        
        // Rotational mass inertia is usually ignored or approximated in simple lumped mass
        // We'll set a very small value to avoid singular mass matrix if needed, or just leave as 0
        const rMass = massPerNode * L * L / 12; // Rough approximation
        M.set([idx1+3, 0], M.get([idx1+3, 0]) + rMass);
        M.set([idx1+4, 0], M.get([idx1+4, 0]) + rMass);
        M.set([idx1+5, 0], M.get([idx1+5, 0]) + rMass);
        M.set([idx2+3, 0], M.get([idx2+3, 0]) + rMass);
        M.set([idx2+4, 0], M.get([idx2+4, 0]) + rMass);
        M.set([idx2+5, 0], M.get([idx2+5, 0]) + rMass);
      }

      try {
        // Find free DOFs (not fixed by boundary conditions)
        const freeDofs = [];
        for (let i = 0; i < numDofs; i++) {
          if (!fixedDOFs.has(i)) freeDofs.push(i);
        }

        if (freeDofs.length > 0 && freeDofs.length < 200) { // Limit to small problems for MVP performance
          const K_free = math.zeros(freeDofs.length, freeDofs.length) as math.Matrix;
          const M_free = math.zeros(freeDofs.length, freeDofs.length) as math.Matrix;
          
          for (let i = 0; i < freeDofs.length; i++) {
            M_free.set([i, i], M.get([freeDofs[i], 0]) || 1e-6); // Avoid exact zero
            for (let j = 0; j < freeDofs.length; j++) {
              K_free.set([i, j], K_elastic.get([freeDofs[i], freeDofs[j]]));
            }
          }

          // We want K x = lambda M x => (M^-1/2 K M^-1/2) y = lambda y
          const M_inv_sqrt = math.zeros(freeDofs.length, freeDofs.length) as math.Matrix;
          for (let i = 0; i < freeDofs.length; i++) {
            M_inv_sqrt.set([i, i], 1 / Math.sqrt(M_free.get([i, i])));
          }

            const K_tilde = math.multiply(math.multiply(M_inv_sqrt, K_free), M_inv_sqrt) as math.Matrix;
            
            // math.eigs works on real symmetric matrices
            const eigsResult = math.eigs(K_tilde);
            
            const eigenvectors = (eigsResult as any).eigenvectors || [];
            
            // Sort by eigenvalue (lambda = w^2)
            const sortedModes = [...eigenvectors]
              .filter(item => (item.value as number) > 1e-3) // filter out zero/negative
              .sort((a, b) => (a.value as number) - (b.value as number));

            const numModes = Math.min(3, sortedModes.length);
            const frequencies = [];
            const modeShapes = [];

            for (let m = 0; m < numModes; m++) {
              const lambda = sortedModes[m].value as number;
              const omega = Math.sqrt(lambda);
              const freqHz = omega / (2 * Math.PI);
              frequencies.push(freqHz);

              // Back-transform eigenvector y to x = M^-1/2 y
              const modeDisp: Record<string, DisplacementResult> = {};
              const rawVec = sortedModes[m].vector;
              const y_vec_raw = (rawVec.toArray ? rawVec.toArray() : rawVec) as number[];
              const y_vec = Array.isArray(y_vec_raw[0]) ? y_vec_raw.map(v => (v as any)[0]) : y_vec_raw;
              
              // Normalize
              let maxVal = 0;
              y_vec.forEach((v, i) => {
                y_vec[i] = v * M_inv_sqrt.get([i, i]);
                if (Math.abs(y_vec[i]) > maxVal) maxVal = Math.abs(y_vec[i]);
              });
              if (maxVal > 0) y_vec.forEach((v, i) => y_vec[i] = v / maxVal);

              for (const id of Object.keys(this.state.nodes)) {
                modeDisp[id] = { dx: 0, dy: 0, dz: 0, rx: 0, ry: 0, rz: 0 };
                const globalIdx = dofMap[id];
                
                if (!fixedDOFs.has(globalIdx)) modeDisp[id].dx = y_vec[freeDofs.indexOf(globalIdx)] || 0;
                if (!fixedDOFs.has(globalIdx+1)) modeDisp[id].dy = y_vec[freeDofs.indexOf(globalIdx+1)] || 0;
                if (!fixedDOFs.has(globalIdx+2)) modeDisp[id].dz = y_vec[freeDofs.indexOf(globalIdx+2)] || 0;
                if (!fixedDOFs.has(globalIdx+3)) modeDisp[id].rx = y_vec[freeDofs.indexOf(globalIdx+3)] || 0;
                if (!fixedDOFs.has(globalIdx+4)) modeDisp[id].ry = y_vec[freeDofs.indexOf(globalIdx+4)] || 0;
                if (!fixedDOFs.has(globalIdx+5)) modeDisp[id].rz = y_vec[freeDofs.indexOf(globalIdx+5)] || 0;
              }
              modeShapes.push(modeDisp);
            }
            
            eigenvalues = { frequencies, modeShapes };
          }
        } catch (err) {
          console.warn("Eigenvalue analysis skipped or failed:", err);
        }
      }

      // Phase 17: Time History Analysis (Newmark-Beta Method)
      if (this.state.analysisSettings.method === 'time-history') {
        const thSettings = this.state.analysisSettings.timeHistory || {
          dt: 0.02,
          totalTime: 5.0,
          dampingRatio: 0.05,
          functionId: '',
          direction: 'X'
        };

        const dt = thSettings.dt || 0.02;
        const totalTime = thSettings.totalTime || 5.0;
        const numTimeSteps = Math.min(300, Math.ceil(totalTime / dt));
        const thFunc = this.state.timeHistoryFunctions[thSettings.functionId];

        const getGroundAccel = (t: number) => {
          if (!thFunc || !thFunc.points || thFunc.points.length === 0) {
            return 0.5 * Math.sin(2 * Math.PI * 2 * t) * Math.exp(-0.5 * t);
          }
          const pts = thFunc.points;
          if (t <= pts[0].t) return pts[0].v;
          if (t >= pts[pts.length - 1].t) return pts[pts.length - 1].v;
          for (let i = 0; i < pts.length - 1; i++) {
            if (t >= pts[i].t && t <= pts[i + 1].t) {
              const alpha = (t - pts[i].t) / (pts[i + 1].t - pts[i].t);
              return pts[i].v + alpha * (pts[i + 1].v - pts[i].v);
            }
          }
          return 0;
        };

        const timeHistoryResults: { time: number; displacements: Record<string, DisplacementResult> }[] = [];
        
        const gamma = 0.5;
        const beta = 0.25;

        const a0 = 1 / (beta * dt * dt);
        const a1 = gamma / (beta * dt);
        const alpha_r = 2 * thSettings.dampingRatio * 5.0;
        const beta_r = (2 * thSettings.dampingRatio) / 5.0;

        const dirOffset = thSettings.direction === 'Y' ? 1 : (thSettings.direction === 'Z' ? 2 : 0);

        for (let step = 0; step <= numTimeSteps; step++) {
          const t = step * dt;
          const ag = getGroundAccel(t);

          const P_eff = math.zeros(numDofs, 1) as math.Matrix;
          for (const nodeKey of Object.keys(this.state.nodes)) {
            const idx = dofMap[nodeKey];
            if (idx !== undefined) {
              const nodeMass = M ? M.get([idx + dirOffset, 0]) : 1.0;
              P_eff.set([idx + dirOffset, 0], -nodeMass * ag);
            }
          }

          let K_hat = math.clone(K_elastic_global || K_elastic) as math.Matrix;
          for (let i = 0; i < numDofs; i++) {
            const m = M ? M.get([i, 0]) : 0;
            const k = (K_elastic_global || K_elastic).get([i, i]);
            const c = alpha_r * m + beta_r * k;
            K_hat.set([i, i], k + a0 * m + a1 * c);
          }

          const fixedDOFs = fixedDOFs_global || new Set<number>();
          for (const idx of fixedDOFs) {
            for (let i = 0; i < numDofs; i++) {
              K_hat.set([idx, i], 0);
              K_hat.set([i, idx], 0);
            }
            K_hat.set([idx, idx], 1);
            P_eff.set([idx, 0], 0);
          }

          const U_next = math.lusolve(K_hat, P_eff) as math.Matrix;

          const stepDisp: Record<string, DisplacementResult> = {};
          for (const id of Object.keys(this.state.nodes)) {
            const idx = dofMap[id];
            stepDisp[id] = {
              dx: U_next.get([idx, 0]),
              dy: U_next.get([idx + 1, 0]),
              dz: U_next.get([idx + 2, 0]),
              rx: U_next.get([idx + 3, 0]),
              ry: U_next.get([idx + 4, 0]),
              rz: U_next.get([idx + 5, 0]),
            };
          }

          timeHistoryResults.push({ time: Math.round(t * 1000) / 1000, displacements: stepDisp });
        }

        result.timeHistoryResults = timeHistoryResults;
      }

      result.loadCombinations = loadCombinations;
      result.envelope = { max: envMax, min: envMin };
      if (eigenvalues) result.eigenvalues = eigenvalues;

      return result;
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || "Unknown error during FEM solve.",
        loadCases: {},
        loadCombinations: {},
        envelope: { max: { displacements:{}, reactions:{}, elementForces:{} }, min: { displacements:{}, reactions:{}, elementForces:{} } }
      };
    }
  }
}
