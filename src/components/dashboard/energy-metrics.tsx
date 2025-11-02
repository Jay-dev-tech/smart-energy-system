import type { EnergyData } from '../../lib/types';
import { EnergyMetric } from './energy-metric';

type EnergyMetricsProps = {
  energyData: EnergyData;
};

export function EnergyMetrics({ energyData }: EnergyMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <EnergyMetric label="Voltage" value={`${energyData.voltage} V`} />
      <EnergyMetric label="Current" value={`${energyData.current} A`} />
      <EnergyMetric label="Power" value={`${energyData.power} W`} />
      <EnergyMetric label="Battery" value={`${energyData.batteryLevel}%`} batteryLevel={energyData.batteryLevel} />
      <EnergyMetric label="Temperature" value={`${energyData.temperature}°C`} />
      <EnergyMetric label="Humidity" value={`${energyData.humidity}%`} />
      <EnergyMetric label="Total Consumption" value={`${energyData.totalConsumption} kWh`} />
      <EnergyMetric label="Energy Remain" value={`${energyData.energyRemain} kWh`} />
    </div>
  );
}
