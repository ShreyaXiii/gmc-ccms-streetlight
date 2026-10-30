export interface EnergySummary {
  totalKWh: number;
  totalCostInr: number;
  estimatedSavingsKWh: number;
  estimatedSavingsInr: number;
  averagePowerW: number;
  peakPowerW: number;
  tariffPerKWh: number; // e.g. INR 7.20 / kWh (PGVCL Gujarat Municipal Tariff)
}

export interface WardEnergyStats {
  ward: number;
  lightCount: number;
  activeLights: number;
  totalPowerW: number;
  todayKWh: number;
  monthlyKWh: number;
  faultCount: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  totalPowerW: number;
  energyKWh: number;
  averageVoltageV: number;
  totalCurrentA: number;
  ambientLightLux: number;
  activeLightsCount: number;
  faultCount: number;
  savingsW: number;
}

