import { v4 as uuidv4 } from 'uuid';
import type { LoadCase, LoadCombination } from '../types/models';

export type DesignCode = 'KDS-LRFD' | 'AISC-LRFD' | 'ASD';

/**
 * Midas IT style auto load combination generator.
 * Maps raw Load Cases to standard design code combinations.
 */
export const generateAutoLoadCombinations = (
  loadCases: Record<string, LoadCase>,
  code: DesignCode = 'KDS-LRFD'
): Record<string, LoadCombination> => {
  const lcValues = Object.values(loadCases);
  const dl = lcValues.filter(lc => lc.type === 'dead').map(lc => lc.id);
  const ll = lcValues.filter(lc => lc.type === 'live').map(lc => lc.id);
  const wl = lcValues.filter(lc => lc.type === 'wind').map(lc => lc.id);
  const sl = lcValues.filter(lc => lc.type === 'seismic').map(lc => lc.id);

  const combinations: Record<string, LoadCombination> = {};
  let count = 1;

  const addComb = (name: string, factorMap: { dl?: number; ll?: number; wl?: number; sl?: number }) => {
    const factors: Record<string, number> = {};
    
    dl.forEach(id => { if (factorMap.dl) factors[id] = factorMap.dl; });
    ll.forEach(id => { if (factorMap.ll) factors[id] = factorMap.ll; });
    wl.forEach(id => { if (factorMap.wl) factors[id] = factorMap.wl; });
    sl.forEach(id => { if (factorMap.sl) factors[id] = factorMap.sl; });

    if (Object.keys(factors).length > 0) {
      const id = uuidv4();
      combinations[id] = { id, name: `CB${count++}(${name})`, factors };
    }
  };

  if (code === 'KDS-LRFD' || code === 'AISC-LRFD') {
    // 1. 1.4 DL
    addComb('1.4D', { dl: 1.4 });
    // 2. 1.2 DL + 1.6 LL
    addComb('1.2D+1.6L', { dl: 1.2, ll: 1.6 });
    // 3. 1.2 DL + 1.0 LL + 1.3 WL
    addComb('1.2D+1.0L+1.3W', { dl: 1.2, ll: 1.0, wl: 1.3 });
    // 4. 1.2 DL + 1.0 LL - 1.3 WL (Wind reverse)
    addComb('1.2D+1.0L-1.3W', { dl: 1.2, ll: 1.0, wl: -1.3 });
    // 5. 0.9 DL + 1.3 WL (Uplift)
    addComb('0.9D+1.3W', { dl: 0.9, wl: 1.3 });
    // 6. 0.9 DL - 1.3 WL
    addComb('0.9D-1.3W', { dl: 0.9, wl: -1.3 });
    
    // Seismic
    addComb('1.2D+1.0L+1.0E', { dl: 1.2, ll: 1.0, sl: 1.0 });
    addComb('1.2D+1.0L-1.0E', { dl: 1.2, ll: 1.0, sl: -1.0 });
    addComb('0.9D+1.0E', { dl: 0.9, sl: 1.0 });
    addComb('0.9D-1.0E', { dl: 0.9, sl: -1.0 });
  } else if (code === 'ASD') {
    addComb('1.0D', { dl: 1.0 });
    addComb('1.0D+1.0L', { dl: 1.0, ll: 1.0 });
    addComb('1.0D+0.75L+0.75W', { dl: 1.0, ll: 0.75, wl: 0.75 });
    addComb('1.0D+0.75L-0.75W', { dl: 1.0, ll: 0.75, wl: -0.75 });
    addComb('0.6D+0.6W', { dl: 0.6, wl: 0.6 });
    addComb('0.6D-0.6W', { dl: 0.6, wl: -0.6 });
  }

  // Envelope is computed dynamically during engine phase.
  return combinations;
};
