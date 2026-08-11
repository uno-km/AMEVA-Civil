import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProjectState, ID, Node, Element, Material, Section, BoundaryCondition, LoadCase, NodalLoad, ElementLoad, AnalysisResult, SelectedItem, TimeHistoryFunction } from '../types/models';
import { v4 as uuidv4 } from 'uuid';

interface ProjectActions {
  setProjectName: (name: string) => void;
  addNode: (node: Omit<Node, 'id'>) => void;
  updateNode: (id: ID, node: Partial<Node>) => void;
  deleteNode: (id: ID) => void;
  setNodes: (nodes: Record<ID, Node>) => void;
  
  addElement: (element: Omit<Element, 'id'>) => void;
  updateElement: (id: ID, element: Partial<Element>) => void;
  deleteElement: (id: ID) => void;
  setElements: (elements: Record<ID, Element>) => void;
  
  addMaterial: (material: Omit<Material, 'id'>) => void;
  addSection: (section: Omit<Section, 'id'>) => void;
  addBoundaryCondition: (bc: Omit<BoundaryCondition, 'id'>) => void;
  
  addLoadCase: (lc: Omit<LoadCase, 'id'>) => void;
  addNodalLoad: (load: Omit<NodalLoad, 'id'>) => void;
  addElementLoad: (load: Omit<ElementLoad, 'id'>) => void;
  
  addTimeHistoryFunction: (th: Omit<TimeHistoryFunction, 'id'>) => void;

  clearResults: () => void;
  setResults: (results: AnalysisResult) => void;
  loadProject: (state: ProjectState) => void;
  
  setSelectedItems: (items: SelectedItem[]) => void;
  setCaptureImage: (dataUrl: string) => void;
}

const initialState: ProjectState = {
  id: uuidv4(),
  name: 'New Project',
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
  timeHistoryFunctions: {},
  results: null,
  selectedItems: []
};

export const useProjectStore = create<ProjectState & ProjectActions>()(
  persist(
    (set) => ({
      ...initialState,
      
      setProjectName: (name) => set({ name }),
      setSelectedItems: (items) => set({ selectedItems: items }),
      setCaptureImage: (dataUrl) => set({ captureImage: dataUrl }),
      
      addNode: (node) => set((state) => {
        const id = uuidv4();
        return { nodes: { ...state.nodes, [id]: { ...node, id } }, selectedItems: [{ id, type: 'node' }] };
      }),
      
      updateNode: (id, nodeUpdate) => set((state) => ({
        nodes: {
          ...state.nodes,
          [id]: { ...state.nodes[id], ...nodeUpdate }
        }
      })),
      
      deleteNode: (id) => set((state) => {
        const newNodes = { ...state.nodes };
        delete newNodes[id];
        return { 
          nodes: newNodes, 
          selectedItems: state.selectedItems.filter(i => i.id !== id) 
        };
      }),
      
      addElement: (element) => set((state) => {
        const id = uuidv4();
        return { elements: { ...state.elements, [id]: { ...element, id } }, selectedItems: [{ id, type: 'element' }] };
      }),
      
      updateElement: (id, elementUpdate) => set((state) => ({
        elements: {
          ...state.elements,
          [id]: { ...state.elements[id], ...elementUpdate }
        }
      })),
      
      deleteElement: (id) => set((state) => {
        const newElements = { ...state.elements };
        delete newElements[id];
        return { 
          elements: newElements,
          selectedItems: state.selectedItems.filter(i => i.id !== id) 
        };
      }),
      
      addMaterial: (material) => set((state) => {
        const id = uuidv4();
        return { materials: { ...state.materials, [id]: { ...material, id } }, selectedItems: [{ id, type: 'material' }] };
      }),
      
      addSection: (section) => set((state) => {
        const id = uuidv4();
        return { sections: { ...state.sections, [id]: { ...section, id } }, selectedItems: [{ id, type: 'section' }] };
      }),
      
      addBoundaryCondition: (bc) => set((state) => {
        const id = uuidv4();
        return { boundaryConditions: { ...state.boundaryConditions, [id]: { ...bc, id } }, selectedItems: [{ id, type: 'boundaryCondition' }] };
      }),
      
      addLoadCase: (lc) => set((state) => {
        const id = uuidv4();
        return { loadCases: { ...state.loadCases, [id]: { ...lc, id } }, selectedItems: [{ id, type: 'loadCase' }] };
      }),
      
      addNodalLoad: (load) => set((state) => {
        const id = uuidv4();
        const newLoad = { ...load, id };
        const lcId = load.loadCaseId;
        return {
          nodalLoads: {
            ...state.nodalLoads,
            [lcId]: [...(state.nodalLoads[lcId] || []), newLoad]
          },
          selectedItems: [{ id, type: 'nodalLoad' }]
        };
      }),
      
      addElementLoad: (load) => set((state) => {
        const id = uuidv4();
        const newLoad = { ...load, id };
        const lcId = load.loadCaseId;
        return {
          elementLoads: {
            ...state.elementLoads,
            [lcId]: [...(state.elementLoads[lcId] || []), newLoad]
          },
          selectedItems: [{ id, type: 'elementLoad' }]
        };
      }),
      
      addTimeHistoryFunction: (th) => set((state) => {
        const id = uuidv4();
        return { timeHistoryFunctions: { ...state.timeHistoryFunctions, [id]: { ...th, id } } };
      }),

      generateAutoLoadCombinations: () => set((state) => {
        const loadCases = state.loadCases;
        const dlIds = Object.keys(loadCases).filter(id => loadCases[id].type === 'dead');
        const llIds = Object.keys(loadCases).filter(id => loadCases[id].type === 'live');
        const wlIds = Object.keys(loadCases).filter(id => loadCases[id].type === 'wind');
        const slIds = Object.keys(loadCases).filter(id => loadCases[id].type === 'seismic');

        const newCombinations = { ...state.loadCombinations };
        
        // Basic KDS/ACI/AISC Combinations
        // 1. 1.4DL
        if (dlIds.length > 0) {
          const id = uuidv4();
          const factors: Record<string, number> = {};
          dlIds.forEach(did => factors[did] = 1.4);
          newCombinations[id] = { id, name: 'LCB1: 1.4DL', factors };
        }

        // 2. 1.2DL + 1.6LL
        if (dlIds.length > 0 && llIds.length > 0) {
          const id = uuidv4();
          const factors: Record<string, number> = {};
          dlIds.forEach(did => factors[did] = 1.2);
          llIds.forEach(lid => factors[lid] = 1.6);
          newCombinations[id] = { id, name: 'LCB2: 1.2DL + 1.6LL', factors };
        }

        // 3. 1.2DL + 1.0LL + 1.3WL
        if (dlIds.length > 0 && wlIds.length > 0) {
          const id = uuidv4();
          const factors: Record<string, number> = {};
          dlIds.forEach(did => factors[did] = 1.2);
          llIds.forEach(lid => factors[lid] = 1.0);
          wlIds.forEach(wid => factors[wid] = 1.3);
          newCombinations[id] = { id, name: 'LCB3: 1.2DL + 1.0LL + 1.3WL', factors };
        }

        // 4. 0.9DL + 1.3WL
        if (dlIds.length > 0 && wlIds.length > 0) {
          const id = uuidv4();
          const factors: Record<string, number> = {};
          dlIds.forEach(did => factors[did] = 0.9);
          wlIds.forEach(wid => factors[wid] = 1.3);
          newCombinations[id] = { id, name: 'LCB4: 0.9DL + 1.3WL', factors };
        }
        
        // 5. 1.2DL + 1.0LL + 1.0E (Seismic)
        if (dlIds.length > 0 && slIds.length > 0) {
          const id = uuidv4();
          const factors: Record<string, number> = {};
          dlIds.forEach(did => factors[did] = 1.2);
          llIds.forEach(lid => factors[lid] = 1.0);
          slIds.forEach(sid => factors[sid] = 1.0);
          newCombinations[id] = { id, name: 'LCB5: 1.2DL + 1.0LL + 1.0E', factors };
        }

        return { loadCombinations: newCombinations };
      }),
      
      clearResults: () => set({ results: null }),
      setResults: (results) => set({ results }),
      
      setNodes: (nodes) => set({ nodes }),
      setElements: (elements) => set({ elements }),

      loadProject: (projectState) => set(projectState)
    }),
    {
      name: 'ameva-civil-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => !['selectedItems'].includes(key))
      ),
    }
  )
);
