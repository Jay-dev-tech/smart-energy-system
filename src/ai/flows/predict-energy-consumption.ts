'use server';

/**
 * @fileOverview Predicts future energy consumption based on historical data using a Firebase ML model.
 *
 * - predictEnergyConsumption - A function that handles the energy consumption prediction process.
 * - PredictEnergyConsumptionInput - The input type for the predictEnergyConsumption function.
 * - PredictEnergyConsumptionOutput - The return type for the predictEnergyConsumption function.
 */

import {ai} from '../genkit';
import {z} from 'genkit';

const PredictEnergyConsumptionInputSchema = z.object({
  historicalData: z.string().describe('A JSON string of historical energy consumption data, including sensor readings from the ESP32.'),
  modelName: z.string().describe('The name of the deployed Firebase ML model (e.g., "energy_consumption_v1").'),
});

export type PredictEnergyConsumptionInput = z.infer<typeof PredictEnergyConsumptionInputSchema>;

const PredictEnergyConsumptionOutputSchema = z.object({
  predictedConsumption: z.number().describe('The predicted future energy consumption, as calculated by the Firebase ML model.'),
  confidenceInterval: z.number().describe('The confidence interval for the prediction, provided by the ML model.'),
  analysis: z.string().describe('An analysis of the factors influencing the prediction, considering user usage patterns.'),
  userUsagePatterns: z.string().describe('A summary of user usage patterns identified by the model (e.g., "High usage in evenings, low during midday").')
});

export type PredictEnergyConsumptionOutput = z.infer<typeof PredictEnergyConsumptionOutputSchema>;

export async function predictEnergyConsumption(input: PredictEnergyConsumptionInput): Promise<PredictEnergyConsumptionOutput> {
  return predictEnergyConsumptionFlow(input);
}

const predictEnergyConsumptionPrompt = ai.definePrompt({
  name: 'predictEnergyConsumptionPrompt',
  input: {schema: PredictEnergyConsumptionInputSchema},
  output: {schema: PredictEnergyConsumptionOutputSchema},
  prompt: `You are an interface to a deployed Firebase ML model for energy prediction. Your task is to interpret the model's output and present it to the user.

  The Firebase ML model named '{{{modelName}}}' has been invoked with the following historical data:
  {{{historicalData}}}

  **Simulate** the output of this Firebase ML model. Based on the data, generate a realistic prediction.

  The output should include:
  1.  predictedConsumption: A plausible future energy consumption value.
  2.  confidenceInterval: A reasonable confidence interval for the prediction.
  3.  analysis: A brief explanation of what factors likely influenced the prediction (e.g., time of day, historical trends).
  4.  userUsagePatterns: A summary of the user's typical energy habits based on the historical data.

  Ensure the output is a JSON object that conforms to the PredictEnergyConsumptionOutputSchema.
  `,
});

const predictEnergyConsumptionFlow = ai.defineFlow(
  {
    name: 'predictEnergyConsumptionFlow',
    inputSchema: PredictEnergyConsumptionInputSchema,
    outputSchema: PredictEnergyConsumptionOutputSchema,
  },
  async input => {
    // In a real implementation, you would add a Genkit tool here to call the Firebase ML model.
    // For now, the prompt simulates the model's output.
    const {output} = await predictEnergyConsumptionPrompt(input);
    return output!;
  }
);
