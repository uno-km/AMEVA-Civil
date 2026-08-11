export interface StandardSection {
  name: string;
  type: 'H-Beam' | 'Box' | 'Pipe' | 'Channel' | 'Angle';
  h: number; // m
  b: number; // m
  tw: number; // m
  tf: number; // m
  area: number; // m2
  iy: number; // m4
  iz: number; // m4
  zy: number; // m3 (plastic modulus)
  zz: number; // m3
  j: number; // m4
  weightPerMeter: number; // kg/m
}

export const KS_H_BEAMS: StandardSection[] = [
  { name: 'H-100x100x6x8', type: 'H-Beam', h: 0.100, b: 0.100, tw: 0.006, tf: 0.008, area: 2.19e-3, iy: 3.83e-6, iz: 1.34e-6, zy: 8.93e-5, zz: 3.85e-5, j: 4.88e-8, weightPerMeter: 17.2 },
  { name: 'H-125x125x6.5x9', type: 'H-Beam', h: 0.125, b: 0.125, tw: 0.0065, tf: 0.009, area: 3.03e-3, iy: 8.47e-6, iz: 2.93e-6, zy: 1.61e-4, zz: 6.77e-5, j: 8.65e-8, weightPerMeter: 23.8 },
  { name: 'H-150x150x7x10', type: 'H-Beam', h: 0.150, b: 0.150, tw: 0.007, tf: 0.010, area: 4.01e-3, iy: 1.62e-5, iz: 5.63e-6, zy: 2.52e-4, zz: 1.10e-4, j: 1.48e-7, weightPerMeter: 31.5 },
  { name: 'H-200x200x8x12', type: 'H-Beam', h: 0.200, b: 0.200, tw: 0.008, tf: 0.012, area: 6.35e-3, iy: 4.72e-5, iz: 1.60e-5, zy: 5.35e-4, zz: 2.30e-4, j: 3.32e-7, weightPerMeter: 49.9 },
  { name: 'H-250x250x9x14', type: 'H-Beam', h: 0.250, b: 0.250, tw: 0.009, tf: 0.014, area: 9.22e-3, iy: 1.08e-4, iz: 3.65e-5, zy: 9.75e-4, zz: 4.25e-4, j: 6.55e-7, weightPerMeter: 72.4 },
  { name: 'H-300x300x10x15', type: 'H-Beam', h: 0.300, b: 0.300, tw: 0.010, tf: 0.015, area: 1.19e-2, iy: 2.04e-4, iz: 6.75e-5, zy: 1.55e-3, zz: 6.75e-4, j: 1.05e-6, weightPerMeter: 94.0 },
  { name: 'H-350x350x12x19', type: 'H-Beam', h: 0.350, b: 0.350, tw: 0.012, tf: 0.019, area: 1.73e-2, iy: 4.03e-4, iz: 1.36e-4, zy: 2.65e-3, zz: 1.16e-3, j: 2.25e-6, weightPerMeter: 137.0 },
  { name: 'H-400x400x13x21', type: 'H-Beam', h: 0.400, b: 0.400, tw: 0.013, tf: 0.021, area: 2.18e-2, iy: 6.66e-4, iz: 2.24e-4, zy: 3.85e-3, zz: 1.68e-3, j: 3.55e-6, weightPerMeter: 172.0 }
];
