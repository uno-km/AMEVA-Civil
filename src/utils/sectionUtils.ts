import * as THREE from 'three';
import type { Section } from '../types/models';

/**
 * Creates a THREE.Shape based on the section properties.
 * If actual dimensions are not present, approximates based on Area and Inertia.
 */
export const createSectionShape = (section: Section): THREE.Shape => {
  const shape = new THREE.Shape();
  
  if (section.type === 'rectangle') {
    const b = section.dimensions?.b || Math.sqrt(section.area);
    const h = section.dimensions?.h || section.area / b;
    
    shape.moveTo(-b/2, -h/2);
    shape.lineTo(b/2, -h/2);
    shape.lineTo(b/2, h/2);
    shape.lineTo(-b/2, h/2);
    shape.lineTo(-b/2, -h/2);
    return shape;
  }
  
  if (section.type === 'circle') {
    const r = section.dimensions?.d ? section.dimensions.d / 2 : Math.sqrt(section.area / Math.PI);
    shape.absarc(0, 0, r, 0, Math.PI * 2, false);
    return shape;
  }

  // I-shape or generic
  // Default dimensions if missing:
  const bf = section.dimensions?.b || 0.2; // 200mm
  const d = section.dimensions?.h || 0.4;  // 400mm
  const tw = section.dimensions?.t1 || 0.01; // 10mm
  const tf = section.dimensions?.t2 || 0.015; // 15mm

  // Standard I-beam cross section
  shape.moveTo(-bf/2, -d/2);
  shape.lineTo(bf/2, -d/2);
  shape.lineTo(bf/2, -d/2 + tf);
  shape.lineTo(tw/2, -d/2 + tf);
  shape.lineTo(tw/2, d/2 - tf);
  shape.lineTo(bf/2, d/2 - tf);
  shape.lineTo(bf/2, d/2);
  shape.lineTo(-bf/2, d/2);
  shape.lineTo(-bf/2, d/2 - tf);
  shape.lineTo(-tw/2, d/2 - tf);
  shape.lineTo(-tw/2, -d/2 + tf);
  shape.lineTo(-bf/2, -d/2 + tf);
  shape.lineTo(-bf/2, -d/2);

  return shape;
};
