export type ID = string;

export interface ProjectUnit {
  length: 'm' | 'mm' | 'cm';
  force: 'kN' | 'N' | 'tf';
}

export interface Node {
  id: ID;
  x: number;
  y: number;
  z: number;
}

export interface Material {
  id: ID;
  name: string;
  type: 'concrete' | 'steel' | 'user';
  elasticModulus: number; // E
  poissonRatio: number; // v
  density: number;
  yieldStrength: number;
  compressiveStrength?: number;
  thermalExpansion?: number; // 열팽창계수 (e.g., 1.2e-5 for concrete/steel)
}

export interface Section {
  id: ID;
  name: string;
  type: 'rectangle' | 'circle' | 'I' | 'box' | 'user';
  area: number; // A
  iy: number; // Moment of inertia about y-axis
  iz: number; // Moment of inertia about z-axis
  j?: number; // Torsional constant
  asy?: number; // Effective shear area in y
  asz?: number; // Effective shear area in z
  dimensions?: {
    b?: number;
    h?: number;
    d?: number;
    t1?: number; // tw for I-beam
    t2?: number; // tf for I-beam
  };
}

export interface Element {
  id: ID;
  type: 'frame2d' | 'frame3d';
  startNodeId: ID;
  endNodeId: ID;
  materialId: ID;
  sectionId: ID;
  betaAngle?: number; // Local axis rotation in degrees (Beta Angle)
}

export interface BoundaryCondition {
  id: ID;
  nodeId: ID;
  ux?: boolean; // true if fixed
  uy?: boolean;
  uz?: boolean;
  rx?: boolean;
  ry?: boolean;
  rz?: boolean;
}

export interface LoadCase {
  id: ID;
  name: string;
  type: 'dead' | 'live' | 'wind' | 'seismic' | 'user';
}

export interface LoadCombination {
  id: ID;
  name: string;
  factors: Record<ID, number>; // key: loadCaseId, value: factor
}

export interface NodalLoad {
  id: ID;
  loadCaseId: ID;
  nodeId: ID;
  fx?: number;
  fy?: number;
  fz?: number;
  mx?: number;
  my?: number;
  mz?: number;
}

export interface ElementLoad {
  id: ID;
  loadCaseId: ID;
  elementId: ID;
  type: 'uniform' | 'trapezoidal' | 'concentrated';
  direction: 'global-X' | 'global-Y' | 'global-Z' | 'local-x' | 'local-y' | 'local-z';
  w1: number; // load magnitude at start (or constant for uniform/concentrated)
  w2?: number; // load magnitude at end (for trapezoidal)
  distance?: number; // distance from start node (for concentrated load)
}

export interface TimeHistoryFunction {
  id: ID;
  name: string;
  points: { t: number; v: number }[]; // Time vs Value (Acceleration/Force)
}

export interface AnalysisSettings {
  id: ID;
  method: 'linear-static' | 'nonlinear-static' | 'time-history';
  nonlinearSteps?: number;
  tolerance?: number;
  timeHistory?: {
    dt: number; // Time step size (e.g. 0.01s)
    totalTime: number; // Total duration (e.g. 10s)
    dampingRatio: number; // e.g. 0.05 for 5%
    functionId: ID; // Which function to use
    direction: 'X' | 'Y' | 'Z'; // Direction of base excitation
  };
}

export interface DisplacementResult {
  dx: number;
  dy: number;
  dz: number;
  rx: number;
  ry: number;
  rz: number;
}

export interface ReactionResult {
  fx: number;
  fy: number;
  fz: number;
  mx: number;
  my: number;
  mz: number;
}

export interface SixDofForce { fx: number; fy: number; fz: number; mx: number; my: number; mz: number; }

export interface ElementForceResult {
  nodes: {
    start: SixDofForce;
    end: SixDofForce;
  };
  // Phase 5: Intermediate stations and stresses
  stations?: { distance: number; forces: SixDofForce }[];
  principalStresses?: {
    maxTension: number;
    maxCompression: number;
    maxShear: number;
    maxVonMises?: number; // Phase 5 Equivalent Stress
  };
}

export interface LoadCaseResult {
  displacements: Record<ID, DisplacementResult>;
  reactions: Record<ID, ReactionResult>;
  elementForces: Record<ID, ElementForceResult>;
}

export interface AnalysisResult {
  status: 'success' | 'error';
  error?: string;
  message?: string;
  loadCases: Record<ID, LoadCaseResult>;
  loadCombinations: Record<ID, LoadCaseResult>;
  envelope: {
    max: LoadCaseResult;
    min: LoadCaseResult;
  };
  eigenvalues?: {
    frequencies: number[]; // Natural frequencies in Hz
    modeShapes: Record<ID, DisplacementResult>[]; // Array of mode shapes
  };
  timeHistoryResults?: {
    time: number;
    displacements: Record<ID, DisplacementResult>;
  }[];
}

export type EntityType = 'node' | 'element' | 'material' | 'section' | 'boundaryCondition' | 'loadCase' | 'nodalLoad' | 'elementLoad';

export interface SelectedItem {
  id: ID;
  type: EntityType;
}

export interface ProjectState {
  id: ID;
  name: string;
  unit: ProjectUnit;
  nodes: Record<ID, Node>;
  elements: Record<ID, Element>;
  materials: Record<ID, Material>;
  sections: Record<ID, Section>;
  boundaryConditions: Record<ID, BoundaryCondition>;
  loadCases: Record<ID, LoadCase>;
  loadCombinations: Record<ID, LoadCombination>;
  nodalLoads: Record<ID, NodalLoad[]>; // Grouped by loadCaseId for easier lookup
  elementLoads: Record<ID, ElementLoad[]>;
  analysisSettings: AnalysisSettings;
  timeHistoryFunctions: Record<ID, TimeHistoryFunction>;
  results: AnalysisResult | null;
  selectedItems: SelectedItem[];
  captureImage?: string;
}
