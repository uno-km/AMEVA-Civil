import type { ProjectState, Node, Element, ID } from '../types/models';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate standard AutoCAD ASCII DXF format string for 3D Frame Elements
 */
export function exportToDXF(state: ProjectState): string {
  let dxf = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nTABLES\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nENTITIES\n`;

  for (const el of Object.values(state.elements)) {
    const n1 = state.nodes[el.startNodeId];
    const n2 = state.nodes[el.endNodeId];
    const sec = state.sections[el.sectionId];
    const layerName = sec ? sec.name.replace(/\s+/g, '_') : 'FRAME_ELEMENT';

    if (!n1 || !n2) continue;

    dxf += `0\nLINE\n`;
    dxf += `8\n${layerName}\n`;
    dxf += `10\n${n1.x}\n20\n${n1.y}\n30\n${n1.z}\n`; // Start Point
    dxf += `11\n${n2.x}\n21\n${n2.y}\n31\n${n2.z}\n`; // End Point
  }

  dxf += `0\nENDSEC\n0\nEOF\n`;
  return dxf;
}

/**
 * Lightweight ASCII DXF Parser to extract LINE entities into Nodes & Frame Elements
 */
export function importFromDXF(dxfText: string): { nodes: Record<ID, Node>; elements: Record<ID, Element> } {
  const lines = dxfText.split(/\r?\n/);
  const nodes: Record<ID, Node> = {};
  const elements: Record<ID, Element> = {};

  const findOrCreateNode = (x: number, y: number, z: number): string => {
    const tolerance = 1e-3;
    for (const [id, node] of Object.entries(nodes)) {
      if (Math.abs(node.x - x) < tolerance && Math.abs(node.y - y) < tolerance && Math.abs(node.z - z) < tolerance) {
        return id;
      }
    }
    const id = uuidv4();
    nodes[id] = { id, x, y, z };
    return id;
  };

  let inEntities = false;
  let currentEntity = '';
  let x1 = 0, y1 = 0, z1 = 0;
  let x2 = 0, y2 = 0, z2 = 0;

  for (let i = 0; i < lines.length - 1; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    const value = lines[i + 1].trim();

    if (code === 0 && value === 'SECTION') {
      if (lines[i + 3] && lines[i + 3].trim() === 'ENTITIES') inEntities = true;
    }
    if (code === 0 && value === 'ENDSEC') inEntities = false;

    if (inEntities) {
      if (code === 0) {
        if (currentEntity === 'LINE') {
          const startId = findOrCreateNode(x1, y1, z1);
          const endId = findOrCreateNode(x2, y2, z2);
          const elId = uuidv4();
          elements[elId] = {
            id: elId,
            type: 'frame3d',
            startNodeId: startId,
            endNodeId: endId,
            materialId: 'default_mat',
            sectionId: 'default_sec'
          };
        }
        currentEntity = value;
      } else if (currentEntity === 'LINE') {
        if (code === 10) x1 = parseFloat(value);
        if (code === 20) y1 = parseFloat(value);
        if (code === 30) z1 = parseFloat(value);
        if (code === 11) x2 = parseFloat(value);
        if (code === 21) y2 = parseFloat(value);
        if (code === 31) z2 = parseFloat(value);
      }
    }
  }

  return { nodes, elements };
}
