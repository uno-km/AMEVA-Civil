import { v4 as uuidv4 } from 'uuid';
import type { ProjectState } from '../types/models';

export const createPortalFrameSample = (): ProjectState => {
  const state: ProjectState = {
    id: uuidv4(),
    name: '3-Story 3D Steel Building',
    unit: { length: 'm', force: 'kN' },
    nodes: {},
    elements: {},
    materials: {},
    sections: {},
    boundaryConditions: {},
    loadCases: {},
    loadCombinations: {},
    nodalLoads: {},
    elementLoads: {},
    analysisSettings: { id: uuidv4(), method: 'linear-static' },
    results: null,
    selectedItems: []
  };

  // Materials
  const matId = uuidv4();
  state.materials[matId] = {
    id: matId, name: 'S355 Steel', type: 'steel', elasticModulus: 200000000, poissonRatio: 0.3, density: 7850, yieldStrength: 355000
  };

  // Sections
  const colSecId = uuidv4();
  state.sections[colSecId] = { id: colSecId, name: 'H 400x400 (Column)', type: 'I', area: 0.02187, iy: 0.000666, iz: 0.000224 };
  const beamSecId = uuidv4();
  state.sections[beamSecId] = { id: beamSecId, name: 'H 400x200 (Beam)', type: 'I', area: 0.00841, iy: 0.000237, iz: 0.0000174 };

  // Generate 3-story building nodes (2 bays in X, 1 bay in Z)
  const stories = 3;
  const baysX = 2;
  const baysZ = 1;
  const widthX = 6;  // 6m
  const widthZ = 5;  // 5m
  const heightY = 4; // 4m per story

  const nodeMap: Record<string, string> = {}; // key: "x_y_z" -> nodeId

  for (let y = 0; y <= stories; y++) {
    for (let x = 0; x <= baysX; x++) {
      for (let z = 0; z <= baysZ; z++) {
        const id = uuidv4();
        state.nodes[id] = { id, x: x * widthX, y: y * heightY, z: z * widthZ };
        nodeMap[`${x}_${y}_${z}`] = id;
        
        // Supports at y=0
        if (y === 0) {
          const bcId = uuidv4();
          state.boundaryConditions[bcId] = { id: bcId, nodeId: id, ux: true, uy: true, uz: true, rx: true, ry: true, rz: true };
        }
      }
    }
  }

  // Generate Elements
  for (let y = 0; y <= stories; y++) {
    for (let x = 0; x <= baysX; x++) {
      for (let z = 0; z <= baysZ; z++) {
        const currentId = nodeMap[`${x}_${y}_${z}`];
        
        // Columns (vertical)
        if (y < stories) {
          const topId = nodeMap[`${x}_${y+1}_${z}`];
          const elId = uuidv4();
          state.elements[elId] = { id: elId, type: 'frame3d', startNodeId: currentId, endNodeId: topId, materialId: matId, sectionId: colSecId };
        }
        
        // Beams (X direction)
        if (x < baysX && y > 0) {
          const rightId = nodeMap[`${x+1}_${y}_${z}`];
          const elId = uuidv4();
          state.elements[elId] = { id: elId, type: 'frame3d', startNodeId: currentId, endNodeId: rightId, materialId: matId, sectionId: beamSecId };
        }
        
        // Beams (Z direction)
        if (z < baysZ && y > 0) {
          const backId = nodeMap[`${x}_${y}_${z+1}`];
          const elId = uuidv4();
          state.elements[elId] = { id: elId, type: 'frame3d', startNodeId: currentId, endNodeId: backId, materialId: matId, sectionId: beamSecId };
        }
      }
    }
  }

  // Loads
  const lcDeadId = uuidv4();
  const lcWindId = uuidv4();
  state.loadCases[lcDeadId] = { id: lcDeadId, name: 'Dead Load', type: 'dead' };
  state.loadCases[lcWindId] = { id: lcWindId, name: 'Wind Load (X)', type: 'wind' };
  
  state.nodalLoads[lcDeadId] = [];
  state.nodalLoads[lcWindId] = [];

  // Add gravity loads to top nodes and wind loads to one side
  for (let x = 0; x <= baysX; x++) {
    for (let z = 0; z <= baysZ; z++) {
      const topNodeId = nodeMap[`${x}_${stories}_${z}`];
      state.nodalLoads[lcDeadId].push({ id: uuidv4(), loadCaseId: lcDeadId, nodeId: topNodeId, fy: -50 }); // 50kN down
      
      // Wind pushing right on x=0 face
      if (x === 0) {
        for (let y = 1; y <= stories; y++) {
          const sideNodeId = nodeMap[`0_${y}_${z}`];
          state.nodalLoads[lcWindId].push({ id: uuidv4(), loadCaseId: lcWindId, nodeId: sideNodeId, fx: 20 }); // 20kN right
        }
      }
    }
  }

  return state;
};
