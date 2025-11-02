export type EnergyData = {
  voltage: number;
  current: number;
  batteryLevel: number;
  power: number;
  temperature: number;
  humidity: number;
  totalConsumption: number;
  energyRemain: number;
};

export type SwitchState = {
  id: number;
  name: string;
  state: boolean;
};

export type HistoricalDataPoint = {
  time: string;
  consumption: number;
  generation: number;
};

// This type is now extended by the Genkit flow's output type
export type Prediction = {
  predictedConsumption: number;
  confidenceInterval: number;
  analysis: string;
  userUsagePatterns: string;
};
