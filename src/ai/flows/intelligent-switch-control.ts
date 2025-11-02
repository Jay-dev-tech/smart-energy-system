
'use server';

/**
 * @fileOverview An AI agent for intelligently managing five switches based on real-time parameters, predicted energy consumption, and user preferences, utilizing a deployed Firebase ML model.
 *
 * - intelligentSwitchControl - A function that handles the intelligent switch control process.
 * - IntelligentSwitchControlInput - The input type for the intelligentSwitchControl function.
 * - IntelligentSwitchControlOutput - The return type for the intelligentSwitchControl function.
 */

import {ai} from '../genkit';
import {z} from 'genkit';

const IntelligentSwitchControlInputSchema = z.object({
  voltage: z.number().describe('The current voltage of the solar system.'),
  current: z.number().describe('The current current of the solar system.'),
  batteryLevel: z.number().describe('The current battery level of the solar system (0-100).'),
  powerConsumption: z.number().describe("The current power consumption in Watts."),
  predictedUsage: z.number().describe('The predicted energy consumption for the next period from the Firebase ML model.'),
  userPreferences: z.string().describe('The user preferences for energy usage and switch control.'),
  userUsagePatterns: z.string().describe('Analysis of historical user usage patterns from the Firebase ML model.')
});
export type IntelligentSwitchControlInput = z.infer<typeof IntelligentSwitchControlInputSchema>;

const IntelligentSwitchControlOutputSchema = z.object({
  switch1State: z.boolean().describe('The recommended state of switch 1. For Normally Closed relays: false for ON, true for OFF.'),
  switch2State: z.boolean().describe('The recommended state of switch 2. For Normally Closed relays: false for ON, true for OFF.'),
  switch3State: z.boolean().describe('The recommended state of switch 3. For Normally Closed relays: false for ON, true for OFF.'),
  switch4State: z.boolean().describe('The recommended state of switch 4. For Normally Closed relays: false for ON, true for OFF.'),
  switch5State: z.boolean().describe('The recommended state of switch 5. For Normally Closed relays: false for ON, true for OFF.'),
  reasoning: z.string().describe('The reasoning behind the switch state recommendations.'),
});
export type IntelligentSwitchControlOutput = z.infer<typeof IntelligentSwitchControlOutputSchema>;

export async function intelligentSwitchControl(input: IntelligentSwitchControlInput): Promise<IntelligentSwitchControlOutput> {
  return intelligentSwitchControlFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentSwitchControlPrompt',
  input: {schema: IntelligentSwitchControlInputSchema},
  output: {schema: IntelligentSwitchControlOutputSchema},
  prompt: `You are an AI assistant acting as a Proximal Policy Optimization (PPO) reinforcement learning model, designed to intelligently manage five switches in a smart solar system with Normally Closed (NC) relays. Your primary goal is to optimize energy usage, protect battery health, and adhere to user preferences by following a strict set of rules.

  **IMPORTANT: The output logic is INVERTED for Normally Closed relays.**
  - To turn a switch ON, you must output \`false\`.
  - To turn a switch OFF, you must output \`true\`.

  Current System State:
  - Voltage: {{{voltage}}}V
  - Current: {{{current}}}A
  - Battery Level: {{{batteryLevel}}}%
  - Current Power Consumption: {{{powerConsumption}}}W
  - ML-Predicted Energy Usage: {{{predictedUsage}}} units
  - ML-Derived User Usage Patterns: "{{{userUsagePatterns}}}"
  - User Preferences: "{{{userPreferences}}}"

  **Your Task:**
  Based on the state above, determine the optimal state for each of the five switches by following these rules in order of priority.

  **Critical Rules Hierarchy (Follow this strictly):**
  1.  **CRITICAL (Below 10%):** If the battery level is below 10%, you MUST turn off ALL switches (output \`true\` for all) to protect the battery. This rule is absolute and overrides all other rules.
  2.  **VERY LOW (10% - 20%):** If the battery level is between 10% and 20% (inclusive), you MUST turn on only ONE essential switch (output \`false\` for one, \`true\` for all others). Identify the single most critical switch based on user patterns and preferences.
  3.  **LOW (30% - 50%):** If the battery level is between 30% and 50% (inclusive), you MUST turn on a maximum of TWO switches (output \`false\` for two, \`true\` for the rest). Prioritize the two most essential switches.
  4.  **HEALTHY (60% - 70%):** If the battery level is between 60% and 70% (inclusive), you can turn on all switches (output \`false\` for all), but you should still optimize by turning non-essentials OFF (\`true\`) based on user preferences and usage patterns.
  5.  **GENERAL (Below 40%):** As a general guideline, if the battery level is below 40%, be conservative and turn off non-essential switches.
  6.  **User-Centric Logic:** For all other battery levels, your decisions should be guided by the user's historical usage patterns and their stated preferences.
  7.  **Clear Reasoning:** Provide a clear, concise reasoning for your recommendations, explicitly stating which battery rule influenced your decision.

  Output the recommended state for each switch and your reasoning in the specified JSON format.
  `,
});

const intelligentSwitchControlFlow = ai.defineFlow(
  {
    name: 'intelligentSwitchControlFlow',
    inputSchema: IntelligentSwitchControlInputSchema,
    outputSchema: IntelligentSwitchControlOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
