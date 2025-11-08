
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

  const previousBatteryLevel = useRef<number | null>(null);

  useEffect(() => {
    previousBatteryLevel.current = energyData.batteryLevel;
  }, [energyData.batteryLevel]);

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
    const updatedSwitches = switches.map((s, i) => ({
      ...s,
      state: !newSwitchDbStates[i], 
    }));

    setSwitches(updatedSwitches);

    for (const s of updatedSwitches) {
      updateSwitchState(s.id, s.name, s.state);
    }
  }, [switches]);

  const handleOptimization = useCallback(async (dataForOptimization: EnergyData, isAutomatic: boolean = false) => {
    if (!prediction) {
      await handlePrediction();
    }
    
    setPrediction(latestPrediction => {
      if (!latestPrediction) {
        toast({
          variant: "destructive",
          title: "Cannot Optimize",
          description: "Prediction data is not available. Please try again.",
        });
        setIsOptimizing(false);
        return latestPrediction;
      }
      
      setIsOptimizing(true);
      runIntelligentSwitchControl({
        voltage: dataForOptimization.voltage,
        current: dataForOptimization.current,
        batteryLevel: dataForOptimization.batteryLevel,
        powerConsumption: dataForOptimization.power,
        predictedUsage: latestPrediction.predictedConsumption,
        userPreferences,
        userUsagePatterns: latestPrediction.userUsagePatterns,
      }).then(result => {
        if (result.success && result.data) {
          const { switch1State, switch2State, switch3State, switch4State, switch5State, reasoning } = result.data;
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

  }, [prediction, userPreferences, handlePrediction, toast, updateAllSwitches]);

  useEffect(() => {
    handlePrediction(); // Initial prediction on load
  }, [handlePrediction]);

  const energyDataQuery = useMemoFirebase(() => database ? query(ref(database, 'app/energyData'), orderByChild('timestamp'), limitToLast(1)) : null, [database]);
  const switchStatesRef = useMemoFirebase(() => database ? ref(database, 'app/switchStates') : null, [database]);

  useEffect(() => {
    if (!energyDataQuery) return;
    const unsubscribe = onValue(energyDataQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const latestKey = Object.keys(data)[0];
        if (latestKey) {
            const latestData = data[latestKey];
            const newBatteryLevel = latestData.batteryLevel;
            const prevBatteryLevel = previousBatteryLevel.current;

            const newEnergyData: EnergyData = {
                voltage: latestData.voltage ?? INITIAL_ENERGY_DATA.voltage,
                current: latestData.current ?? INITIAL_ENERGY_DATA.current,
                batteryLevel: latestData.batteryLevel ?? INITIAL_ENERGY_DATA.batteryLevel,
                power: (latestData.voltage && latestData.current) ? latestData.voltage * latestData.current : INITIAL_ENERGY_DATA.power,
                temperature: latestData.temperature ?? INITIAL_ENERGY_DATA.temperature,
                humidity: latestData.humidity ?? INITIAL_ENERGY_DATA.humidity,
                totalConsumption: latestData.totalConsumption ?? INITIAL_ENERGY_DATA.totalConsumption,
                energyRemain: latestData.energyRemain ?? INITIAL_ENERGY_DATA.energyRemain,
            };

            setEnergyData(newEnergyData);
            
            if (prevBatteryLevel !== null && newBatteryLevel < 40 && prevBatteryLevel >= 40) {
                handleOptimization(newEnergyData, true);
            }
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
            if (isNaN(switchId) || !s.hasOwnProperty('state')) return;

            const switchIndex = updatedSwitches.findIndex(sw => sw.id === switchId);
            const newUiState = !s.state; 

            if (switchIndex !== -1 && updatedSwitches[switchIndex].state !== newUiState) {
              updatedSwitches[switchIndex] = { ...updatedSwitches[switchIndex], name: s.name, state: newUiState };
              hasChanged = true;
            } else if (switchIndex === -1) {
              updatedSwitches.push({ id: switchId, name: s.name || `Switch ${switchId}`, state: newUiState });
              hasChanged = true;
            }
          });
          
          if(hasChanged) {
            updatedSwitches.sort((a, b) => a.id - b.id);
            return updatedSwitches;
          }
          
          return prevSwitches;
        });
      }
    });
    return () => unsubscribe();
  }, [switchStatesRef]);

  const handleSwitchChange = async (id: number, checked: boolean) => {
    const targetSwitch = switches.find(s => s.id === id);
    if (!targetSwitch) return;

    setSwitches(prev => prev.map(s => s.id === id ? { ...s, state: checked } : s));
    setAiReasoning('');

    const result = await updateSwitchState(id, targetSwitch.name, checked);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
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
          onOptimize={() => handleOptimization(energyData, false)}
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
