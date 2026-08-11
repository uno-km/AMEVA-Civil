import type { Material, Section } from '../types/models';

export const DEFAULT_MATERIALS: Omit<Material, 'id'>[] = [
  {
    name: 'S355 (Steel)',
    type: 'steel',
    elasticModulus: 200000000, // kN/m2 (200 GPa)
    poissonRatio: 0.3,
    density: 7850,
    yieldStrength: 355000,
  },
  {
    name: 'C30/37 (Concrete)',
    type: 'concrete',
    elasticModulus: 33000000, // kN/m2 (33 GPa)
    poissonRatio: 0.2,
    density: 2500,
    yieldStrength: 30000,
  }
];

export const DEFAULT_SECTIONS: Omit<Section, 'id'>[] = [
  {
    name: 'IPE 300',
    type: 'I',
    area: 0.00538,
    iy: 0.0000836,
    iz: 0.00000604
  },
  {
    name: 'Rect 300x400',
    type: 'rectangle',
    area: 0.12,
    iy: 0.0016, // bd^3/12 -> 0.3 * 0.4^3 / 12 = 0.0016
    iz: 0.0009  // db^3/12 -> 0.4 * 0.3^3 / 12 = 0.0009
  }
];

// Helper to generate a new object with initial default values
export const createDefaultNode = () => ({ x: 0, y: 0, z: 0 });
export const createDefaultMaterial = () => ({ ...DEFAULT_MATERIALS[0] });
export const createDefaultSection = () => ({ ...DEFAULT_SECTIONS[0] });
export const createDefaultBoundaryCondition = (nodeId: string) => ({ nodeId, ux: true, uy: true, uz: true, rx: false, ry: false, rz: true });
export const createDefaultLoadCase = () => ({ name: 'New Load Case', type: 'live' as const });
