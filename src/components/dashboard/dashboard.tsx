
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../../hooks/use-toast';
import { runEnergyPrediction, runIntelligentSwitchControl, updateSwitchState, getSwitchStates } from '../../app/actions';
import { INITIAL_ENERGY_DATA, INITIAL_SWITCHES } from '../../lib/data';
import type { EnergyData, SwitchState } from '../../lib/types';
import { EnergyMetrics } from './energy-metrics';
import { SwitchControl } from './switch-control';
import { UsageHistory } from './usage-history';
import { PredictionAnalytics } from './prediction-analytics';
import type { PredictEnergyConsumptionOutput } from '../../ai/flows/predict-energy-consumption';
import { useDatabase, useMemoFirebase } from '../../firebase';
import { onValue, ref, query, orderByChild, limitToLast } from 'firebase/database';

export function Dashboard() {
  const [energyData, setEnergyData] = useState<EnergyData>(INITIAL_ENERGY_DATA);
  const [switches, setSwitches] = useState<SwitchState[]>(INITIAL_SWITCHES);
  const [userPreferences, setUserPreferences] = useState('Prioritize extending battery life and reducing cost. Only turn on essential appliances if battery is below 40%.');
  const [prediction, setPrediction] = useState<PredictEnergyConsumptionOutput | null>(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const { toast } = useToast();
  const database = useDatabase();

  // Ref to prevent multiple optimizations for the same low-battery event
  const lowBatteryOptimizationTriggered = useRef(false);

  const handlePrediction = useCallback(async () => {
    setIsPredictionLoading(true);
    setAiReasoning('');
    const result = await runEnergyPrediction();
    if (result.success && result.data) {
      setPrediction(result.data);
      toast({
        title: "Prediction Ready",
        description: "Future energy consumption has been forecasted.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Prediction Failed",
        description: result.error,
      });
    }
    setIsPredictionLoading(false);
  }, [toast]);

  const updateAllSwitches = useCallback(async (newSwitchDbStates: boolean[]) => {
    // The AI returns the database state (false=ON, true=OFF).
    // The UI state should be the inverse of the database state.
    const updatedSwitches = switches.map((s, i) => ({
      ...s,
      // UI state is ON (true) if DB state is false
      state: !newSwitchDbStates[i], 
    }));

    // Optimistically update UI
    setSwitches(updatedSwitches);

    // Call server action for each switch. The server action will handle the inversion.
    // We send the UI state to the action.
    for (const s of updatedSwitches) {
      // no need to await, fire and forget
      updateSwitchState(s.id, s.name, s.state);
    }
  }, [switches]);

  const handleOptimization = useCallback(async (isAutomatic: boolean = false) => {
    if (!prediction) {
      // Run prediction if it's not available yet
      await handlePrediction();
    }
    // Use a function to get the latest prediction state
    setPrediction(latestPrediction => {
      if (!latestPrediction) {
        toast({
          variant: "destructive",
          title: "Cannot Optimize",
          description: "Prediction data is not available. Please try again.",
        });
        return latestPrediction;
      }
      
      setIsOptimizing(true);
      runIntelligentSwitchControl({
        ...energyData,
        powerConsumption: energyData.power,
        predictedUsage: latestPrediction.predictedConsumption,
        userPreferences,
        userUsagePatterns: latestPrediction.userUsagePatterns,
      }).then(result => {
        if (result.success && result.data) {
          const { switch1State, switch2State, switch3State, switch4State, switch5State, reasoning } = result.data;
          // The AI returns the database state (false=ON, true=OFF)
          const newSwitchDbStates = [switch1State, switch2State, switch3State, switch4State, switch5State];
          
          updateAllSwitches(newSwitchDbStates);
          
          setAiReasoning(reasoning);
          toast({
            title: isAutomatic ? "Low Battery Action" : "Optimization Complete",
            description: isAutomatic ? "AI has adjusted switches to conserve power." : "Switches have been adjusted intelligently.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Optimization Failed",
            description: result.error,
          });
        }
        setIsOptimizing(false);
      });
      
      return latestPrediction;
    });

  }, [prediction, energyData, userPreferences, handlePrediction, toast, updateAllSwitches]);

  useEffect(() => {
    handlePrediction(); // Initial prediction on load
  }, [handlePrediction]);

  // This query now explicitly asks for the single latest entry based on the timestamp.
  const energyDataQuery = useMemoFirebase(() => database ? query(ref(database, 'app/energyData'), orderByChild('timestamp'), limitToLast(1)) : null, [database]);
  const switchStatesRef = useMemoFirebase(() => database ? ref(database, 'app/switchStates') : null, [database]);

  useEffect(() => {
    if (!energyDataQuery) return;
    const unsubscribe = onValue(energyDataQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Get the single latest entry from the query result
        const latestKey = Object.keys(data)[0];
        if (latestKey) {
            const latestData = data[latestKey];
             setEnergyData(prev => {
                const newBatteryLevel = latestData.batteryLevel ?? prev.batteryLevel;
                
                // --- Automatic low-battery optimization logic ---
                // This logic needs to run *before* the state update to have access to the *previous* state
                // to avoid re-triggering.
                const hasJustDropped = newBatteryLevel < 40 && prev.batteryLevel >= 40;

                if (hasJustDropped && !lowBatteryOptimizationTriggered.current) {
                    lowBatteryOptimizationTriggered.current = true; // Set flag
                    // We must pass the new data directly to the optimization function
                    const currentEnergyData = {
                        ...prev,
                        ...latestData,
                        power: (latestData.voltage && latestData.current) ? latestData.voltage * latestData.current : prev.power,
                    };
                    handleOptimization(true);
                } else if (newBatteryLevel >= 40) {
                    lowBatteryOptimizationTriggered.current = false; // Reset flag
                }
                
                // Return the new state for the UI
                return {
                    ...prev, // keep fields not sent by device
                    voltage: latestData.voltage ?? prev.voltage,
                    current: latestData.current ?? prev.current,
                    batteryLevel: newBatteryLevel,
                    power: (latestData.voltage && latestData.current) ? latestData.voltage * latestData.current : prev.power,
                    temperature: latestData.temperature ?? prev.temperature,
                    humidity: latestData.humidity ?? prev.humidity,
                };
             });
        }
      }
    });
    return () => unsubscribe();
  }, [energyDataQuery, handleOptimization]);

   useEffect(() => {
    if (!switchStatesRef) return;
    const unsubscribe = onValue(switchStatesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSwitches(prevSwitches => {
          const updatedSwitches = [...prevSwitches];
          let hasChanged = false;
          Object.entries(data).forEach(([id, s]: [string, any]) => {
            const switchId = parseInt(id, 10);
            const switchIndex = updatedSwitches.findIndex(sw => sw.id === switchId);
            // The database stores the relay state for NC relays: false is ON, true is OFF.
            // The UI state should be the inverse: true is ON, false is OFF.
            const newUiState = !s.state; 

            if (switchIndex !== -1 && updatedSwitches[switchIndex].state !== newUiState) {
              updatedSwitches[switchIndex] = { ...updatedSwitches[switchIndex], name: s.name, state: newUiState };
              hasChanged = true;
            }
          });
          return hasChanged ? updatedSwitches : prevSwitches;
        });
      }
    });
    return () => unsubscribe();
  }, [switchStatesRef]);

  const handleSwitchChange = async (id: number, checked: boolean) => {
    const targetSwitch = switches.find(s => s.id === id);
    if (!targetSwitch) return;

    // Optimistic UI update
    setSwitches(prev => prev.map(s => s.id === id ? { ...s, state: checked } : s));
    setAiReasoning('');

    // `checked` is the UI state (true for ON). The action will invert it for the DB.
    const result = await updateSwitchState(id, targetSwitch.name, checked);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
      // Revert UI on failure
      setSwitches(prev => prev.map(s => s.id === id ? { ...s, state: !checked } : s));
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8 xl:col-span-9 space-y-6">
        <EnergyMetrics energyData={energyData} />
        <SwitchControl
          switches={switches}
          userPreferences={userPreferences}
          aiReasoning={aiReasoning}
          isOptimizing={isOptimizing}
          isPredictionAvailable={!!prediction}
          onSwitchChange={handleSwitchChange}
          onPreferencesChange={setUserPreferences}
          onOptimize={() => handleOptimization(false)}
        />
      </div>

      <div className="lg:col-span-4 xl:col-span-3 space-y-6">
         <PredictionAnalytics
          prediction={prediction}
          isLoading={isPredictionLoading}
          onPredict={handlePrediction}
        />
        <UsageHistory />
      </div>
    </div>
  );
}
