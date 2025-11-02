import type { SwitchState, HistoricalDataPoint, EnergyData } from './types';

export const INITIAL_ENERGY_DATA: EnergyData = {
  voltage: 230.5,
  current: 5.2,
  batteryLevel: 85,
  power: 1198.6,
  temperature: 25.5,
  humidity: 60,
  totalConsumption: 1234.5,
  energyRemain: 45.2,
};

export const INITIAL_SWITCHES: SwitchState[] = [
  { id: 1, name: 'Switch 1', state: true },
  { id: 2, name: 'Switch 2', state: false },
  { id: 3, name: 'Switch 3', state: false },
  { id: 4, name: 'Switch 4', state: true },
  { id: 5, name: 'Switch 5', state: false },
];

export const HOURLY_USAGE_DATA: HistoricalDataPoint[] = [
  { time: '00:00', consumption: 0.5, generation: 0 },
  { time: '01:00', consumption: 0.4, generation: 0 },
  { time: '02:00', consumption: 0.4, generation: 0 },
  { time: '03:00', consumption: 0.3, generation: 0 },
  { time: '04:00', consumption: 0.3, generation: 0 },
  { time: '05:00', consumption: 0.5, generation: 0 },
  { time: '06:00', consumption: 0.8, generation: 0.1 },
  { time: '07:00', consumption: 1.2, generation: 0.5 },
  { time: '08:00', consumption: 1.1, generation: 1.2 },
  { time: '09:00', consumption: 1.0, generation: 2.0 },
  { time: '10:00', consumption: 0.9, generation: 2.8 },
  { time: '11:00', consumption: 0.8, generation: 3.5 },
  { time: '12:00', consumption: 0.9, generation: 4.0 },
  { time: '13:00', consumption: 1.0, generation: 4.2 },
  { time: '14:00', consumption: 1.1, generation: 3.8 },
  { time: '15:00', consumption: 1.2, generation: 3.0 },
  { time: '16:00', consumption: 1.5, generation: 2.1 },
  { time: '17:00', consumption: 1.8, generation: 1.2 },
  { time: '18:00', consumption: 2.5, generation: 0.4 },
  { time: '19:00', consumption: 3.0, generation: 0 },
  { time: '20:00', consumption: 2.8, generation: 0 },
  { time: '21:00', consumption: 2.2, generation: 0 },
  { time: '22:00', consumption: 1.5, generation: 0 },
  { time: '23:00', consumption: 0.9, generation: 0 },
];
