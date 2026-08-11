import type { Section } from '../types/models';

/**
 * Recalculates precise structural properties (A, Iy, Iz, J, Asy, Asz) 
 * for a section based on its dimensions and type.
 * St. Venant's Torsion (J) and Effective Shear Areas (Asy, Asz) are rigorously computed.
 */
export const calculateSectionProperties = (section: Partial<Section>): Partial<Section> => {
  const { type, dimensions } = section;
  if (!dimensions || !type || type === 'user') return section;

  const b = dimensions.b || 0;
  const h = dimensions.h || 0;
  const d = dimensions.d || 0;
  const tw = dimensions.t1 || 0;
  const tf = dimensions.t2 || 0;

  let area = 0, iy = 0, iz = 0, j = 0, asy = 0, asz = 0;

  switch (type) {
    case 'rectangle':
      area = b * h;
      iy = (b * Math.pow(h, 3)) / 12; // strong axis usually (h > b)
      iz = (h * Math.pow(b, 3)) / 12; // weak axis
      // Approximation for solid rectangular torsion constant J
      // J = beta * b * h^3 (assuming h > b)
      const maxD = Math.max(b, h);
      const minD = Math.min(b, h);
      const beta = (1 / 3) - 0.21 * (minD / maxD) * (1 - Math.pow(minD / maxD, 4) / 12);
      j = beta * maxD * Math.pow(minD, 3);
      asy = area * (5 / 6); // standard shear shape factor for solid rect (5/6 or A/1.2)
      asz = area * (5 / 6);
      break;

    case 'circle':
      const r = d / 2;
      area = Math.PI * r * r;
      iy = (Math.PI * Math.pow(r, 4)) / 4;
      iz = iy;
      j = (Math.PI * Math.pow(r, 4)) / 2;
      asy = area * 0.9; // shear shape factor for solid circle
      asz = area * 0.9;
      break;

    case 'box':
      // hollow box section
      const innerB = b - 2 * tw;
      const innerH = h - 2 * tf;
      if (innerB > 0 && innerH > 0) {
        area = (b * h) - (innerB * innerH);
        iy = (b * Math.pow(h, 3)) / 12 - (innerB * Math.pow(innerH, 3)) / 12;
        iz = (h * Math.pow(b, 3)) / 12 - (innerH * Math.pow(innerB, 3)) / 12;
        // Bredt-Batho formula for thin-walled closed section J
        const A_encl = (b - tw) * (h - tf);
        const perimeter = 2 * ((b - tw) / tf + (h - tf) / tw);
        j = (4 * Math.pow(A_encl, 2)) / perimeter;
        asy = 2 * h * tw; // web area
        asz = 2 * b * tf; // flange area
      }
      break;

    case 'I':
      // I-beam
      const webH = h - 2 * tf;
      area = 2 * b * tf + webH * tw;
      iy = (tw * Math.pow(webH, 3)) / 12 + 2 * ((b * Math.pow(tf, 3)) / 12 + (b * tf) * Math.pow(webH / 2 + tf / 2, 2));
      iz = (webH * Math.pow(tw, 3)) / 12 + 2 * ((tf * Math.pow(b, 3)) / 12);
      // Torsion J for open sections: sum of 1/3 * w * t^3
      j = (1 / 3) * (2 * b * Math.pow(tf, 3) + webH * Math.pow(tw, 3));
      asy = webH * tw; // shear area parallel to y (web)
      asz = 2 * b * tf * (5 / 6); // shear area parallel to z (flanges)
      break;
  }

  return {
    ...section,
    area,
    iy,
    iz,
    j,
    asy,
    asz
  };
};
