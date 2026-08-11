/**
 * Time-dependent material properties models
 * Based on CEB-FIP Model Code 1990 (MC90)
 */

export function calculateCEBFIP90Creep(
  fck: number, // Characteristic cylinder compressive strength (MPa)
  RH: number, // Relative humidity (%)
  h0: number, // Notional size of member (2Ac/u) in mm
  t0: number, // Age of concrete at loading (days)
  t: number // Age of concrete at the moment considered (days)
): number {
  if (t <= t0) return 0;

  // 1. Notional creep coefficient phi_0
  const fcm = fck + 8; // Mean compressive strength
  const phi_RH = 1 + (1 - RH / 100) / (0.46 * Math.pow(h0 / 100, 1 / 3));
  const beta_fcm = 5.3 / Math.sqrt(fcm / 10);
  const beta_t0 = 1 / (0.1 + Math.pow(t0, 0.2));
  
  const phi_0 = phi_RH * beta_fcm * beta_t0;

  // 2. Development of creep with time beta_c(t, t0)
  const beta_H = 150 * (1 + Math.pow(1.2 * RH / 100, 18)) * h0 / 100 + 250;
  const beta_c = Math.pow((t - t0) / (beta_H + t - t0), 0.3);

  // 3. Creep coefficient phi(t, t0)
  return phi_0 * beta_c;
}

export function calculateCEBFIP90Shrinkage(
  _fck: number,
  RH: number,
  h0: number,
  ts: number, // Age of concrete at start of drying (days)
  t: number // Age of concrete at the moment considered (days)
): number {
  if (t <= ts) return 0;
  
  // 1. Notional shrinkage strain epsilon_cs0
  const epsilon_s_fcm = (160 + 10 * beta_sc(9)) * 1e-6; // beta_sc depends on cement type, assuming normal (9)
  const beta_RH = -1.55 * (1 - Math.pow(RH / 100, 3));
  const epsilon_cs0 = epsilon_s_fcm * beta_RH;

  // 2. Development of shrinkage with time beta_s(t, ts)
  const beta_s = Math.sqrt((t - ts) / (350 * Math.pow(h0 / 100, 2) + t - ts));

  // 3. Shrinkage strain epsilon_cs(t, ts)
  return epsilon_cs0 * beta_s;
}

function beta_sc(type: 4 | 5 | 9): number {
  switch (type) {
    case 4: return 4; // Slow setting
    case 5: return 5; // Normal
    case 9: return 9; // Rapid setting
    default: return 5;
  }
}

export function calculateTimeDependentModulus(
  Ec28: number,
  creepCoefficient: number
): number {
  // Effective modulus of elasticity (Age-adjusted effective modulus method)
  // For precise analysis, a relaxation coefficient (chi) is used, typically ~0.8
  const chi = 0.8; 
  return Ec28 / (1 + chi * creepCoefficient);
}
