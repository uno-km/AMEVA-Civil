import { ProjectState, ID, Section } from '../types/models';
import { KS_H_BEAMS, StandardSection } from '../data/steelSections';
import { calculateSectionProperties } from '../utils/sectionProperties';

export interface OptimizationReport {
  elementId: ID;
  currentSectionName: string;
  recommendedSection: StandardSection;
  maxRatio: number;
  weightSavingsPercent: number;
}

export function optimizeStructureSections(state: ProjectState): {
  updatedSections: Record<ID, Section>;
  updatedElements: typeof state.elements;
  reports: OptimizationReport[];
} {
  const results = state.results;
  if (!results || !results.envelope) {
    throw new Error("Cannot optimize without solver results. Run solver first.");
  }

  const reports: OptimizationReport[] = [];
  const updatedSections: Record<ID, Section> = { ...state.sections };
  const updatedElements = { ...state.elements };

  for (const el of Object.values(state.elements)) {
    const sec = state.sections[el.sectionId];
    const mat = state.materials[el.materialId];
    const Fy = mat.yieldStrength || 235e6; // Pa (235 MPa default)
    const E = mat.elasticModulus || 200e9; // Pa

    const envMax = results.envelope.max.elementForces[el.id];
    const envMin = results.envelope.min.elementForces[el.id];

    if (!envMax || !envMin) continue;

    // Peak internal forces
    const maxP = Math.max(Math.abs(envMax.nodes.start.fx), Math.abs(envMin.nodes.start.fx), Math.abs(envMax.nodes.end.fx), Math.abs(envMin.nodes.end.fx));
    const maxMy = Math.max(Math.abs(envMax.nodes.start.my), Math.abs(envMin.nodes.start.my), Math.abs(envMax.nodes.end.my), Math.abs(envMin.nodes.end.my));
    const maxMz = Math.max(Math.abs(envMax.nodes.start.mz), Math.abs(envMin.nodes.start.mz), Math.abs(envMax.nodes.end.mz), Math.abs(envMin.nodes.end.mz));

    // Find lightest section that satisfies Demand/Capacity <= 1.0
    let bestCandidate: StandardSection | null = null;

    for (const candidate of KS_H_BEAMS) {
      const Pn = Fy * candidate.area; // Axial capacity
      const Mny = Fy * candidate.zy; // Bending Y capacity
      const Mnz = Fy * candidate.zz; // Bending Z capacity

      const ratioP = maxP / (Pn || 1e-6);
      const ratioMy = maxMy / (Mny || 1e-6);
      const ratioMz = maxMz / (Mnz || 1e-6);
      
      // Combined Stress Ratio (KDS LRFD interaction equation approximation)
      const combinedRatio = ratioP + ratioMy + ratioMz;

      if (combinedRatio <= 1.0) {
        bestCandidate = candidate;
        break; // Standard sections are sorted by weight ascending
      }
    }

    if (!bestCandidate) {
      bestCandidate = KS_H_BEAMS[KS_H_BEAMS.length - 1]; // Use largest if none fits
    }

    // Current section properties
    const curSec = calculateSectionProperties(sec);
    const curWeight = (curSec.area || 0.005) * 7850;
    const newWeight = bestCandidate.weightPerMeter;

    const savings = ((curWeight - newWeight) / (curWeight || 1)) * 100;

    // Check if new section ID exists, else create
    let newSecId = Object.keys(updatedSections).find(
      id => updatedSections[id].name === bestCandidate!.name
    );

    if (!newSecId) {
      newSecId = `sec_opt_${bestCandidate.name}`;
      updatedSections[newSecId] = {
        id: newSecId,
        name: bestCandidate.name,
        type: 'I-shape',
        area: bestCandidate.area,
        iy: bestCandidate.iy,
        iz: bestCandidate.iz,
        j: bestCandidate.j,
        dimensions: {
          b: bestCandidate.b,
          h: bestCandidate.h,
          tw: bestCandidate.tw,
          tf: bestCandidate.tf
        }
      };
    }

    updatedElements[el.id] = {
      ...el,
      sectionId: newSecId
    };

    reports.push({
      elementId: el.id,
      currentSectionName: sec.name,
      recommendedSection: bestCandidate,
      maxRatio: Math.min(1.0, (maxP / (Fy * bestCandidate.area) + maxMy / (Fy * bestCandidate.zy) + maxMz / (Fy * bestCandidate.zz))),
      weightSavingsPercent: Math.round(savings * 10) / 10
    });
  }

  return { updatedSections, updatedElements, reports };
}
