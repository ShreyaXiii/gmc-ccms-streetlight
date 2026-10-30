import { describe, it, expect } from 'vitest';
import {
  calculateInstantaneousPower,
  integrateEnergyKWh,
  calculateTariffCost,
  calculateSavings,
  PowerSample,
} from '../energyCalculator';

describe('Energy Calculator & Numerical Integration Tests', () => {
  it('correctly calculates DC instantaneous power (P = V * I)', () => {
    const power = calculateInstantaneousPower(5.0, 0.14, 1.0, true);
    expect(power).toBe(0.7);
  });

  it('correctly calculates AC instantaneous power with power factor (P = V * I * pf)', () => {
    const power = calculateInstantaneousPower(230.0, 0.5, 0.95, false);
    expect(power).toBe(109.25);
  });

  it('returns 0 when voltage or current is zero', () => {
    expect(calculateInstantaneousPower(0, 0.5)).toBe(0);
    expect(calculateInstantaneousPower(5.0, 0)).toBe(0);
  });

  it('calculates energy using Trapezoidal Numerical Integration', () => {
    // 100 Watts constant load over 3600 seconds (1 hour) = 0.1 kWh
    const now = Date.now();
    const samples: PowerSample[] = [
      { timestamp: new Date(now).toISOString(), powerW: 100 },
      { timestamp: new Date(now + 1800 * 1000).toISOString(), powerW: 100 },
      { timestamp: new Date(now + 3600 * 1000).toISOString(), powerW: 100 },
    ];

    const energyKWh = integrateEnergyKWh(samples);
    expect(energyKWh).toBeCloseTo(0.1, 3);
  });

  it('calculates municipal electricity cost based on Gujarat PGVCL tariff', () => {
    // 10 kWh @ ₹7.20 / kWh = ₹72.00
    const cost = calculateTariffCost(10, 7.20);
    expect(cost).toBe(72.00);
  });

  it('estimates savings accurately between automated and baseline consumption', () => {
    const actualKWh = 60;
    const baselineKWh = 100;
    const savings = calculateSavings(actualKWh, baselineKWh, 7.20);

    expect(savings.savedKWh).toBe(40);
    expect(savings.savedInr).toBe(288.00); // 40 * 7.20
    expect(savings.savingsPercent).toBe(40.0);
  });
});

