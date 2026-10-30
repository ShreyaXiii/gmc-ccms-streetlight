export interface PowerSample {
  timestamp: string; // ISO-8601
  powerW: number;
}

/**
 * Calculates instantaneous electrical power.
 * Supports DC systems or AC with configurable power factor (cos phi).
 * Default pf = 0.95 for modern LED streetlighting drivers.
 */
export function calculateInstantaneousPower(
  voltageV: number,
  currentA: number,
  powerFactor: number = 0.95,
  isDirectCurrent: boolean = true
): number {
  if (voltageV <= 0 || currentA <= 0) return 0;
  if (isDirectCurrent) {
    // DC prototype: P = V * I
    return Number((voltageV * currentA).toFixed(2));
  }
  // AC mains: P = V * I * pf
  return Number((voltageV * currentA * powerFactor).toFixed(2));
}

/**
 * Calculates cumulative energy in kilowatt-hours (kWh) using
 * Trapezoidal Numerical Integration over discrete time series samples:
 * E (kWh) = sum( (P[i-1] + P[i]) / 2 * (t[i] - t[i-1]) / 3600 ) / 1000
 */
export function integrateEnergyKWh(samples: PowerSample[]): number {
  if (!samples || samples.length < 2) return 0;

  // Sort ascending by timestamp
  const sorted = [...samples].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let cumulativeJoules = 0;

  for (let i = 1; i < sorted.length; i++) {
    const tPrev = new Date(sorted[i - 1].timestamp).getTime() / 1000; // seconds
    const tCurr = new Date(sorted[i].timestamp).getTime() / 1000;
    const deltaSeconds = tCurr - tPrev;

    // Ignore unrealistic gaps (e.g., > 1 hour disconnect)
    if (deltaSeconds > 0 && deltaSeconds < 3600) {
      const avgPowerWatts = (sorted[i - 1].powerW + sorted[i].powerW) / 2;
      cumulativeJoules += avgPowerWatts * deltaSeconds;
    }
  }

  // 1 kWh = 3,600,000 Joules
  const totalKWh = cumulativeJoules / 3600000;
  return Number(totalKWh.toFixed(4));
}

/**
 * Calculates municipal electricity cost and estimated savings in INR
 * Based on Gujarat PGVCL Municipal Streetlighting Tariffs.
 */
export function calculateTariffCost(
  energyKWh: number,
  tariffPerKWh: number = 7.20 // INR per kWh
): number {
  return Number((energyKWh * tariffPerKWh).toFixed(2));
}

/**
 * Estimates energy savings from smart LDR automatic dimming/switching
 * vs non-automated 12-hour full-burn baseline.
 */
export function calculateSavings(
  actualKWh: number,
  baselineKWh: number,
  tariffPerKWh: number = 7.20
): { savedKWh: number; savedInr: number; savingsPercent: number } {
  const savedKWh = Math.max(0, baselineKWh - actualKWh);
  const savedInr = calculateTariffCost(savedKWh, tariffPerKWh);
  const savingsPercent = baselineKWh > 0 ? Number(((savedKWh / baselineKWh) * 100).toFixed(1)) : 0;

  return {
    savedKWh: Number(savedKWh.toFixed(2)),
    savedInr,
    savingsPercent,
  };
}

