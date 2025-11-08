
'use server';

import { intelligentSwitchControl, IntelligentSwitchControlInput } from '../ai/flows/intelligent-switch-control';
import { predictEnergyConsumption, PredictEnergyConsumptionOutput } from '../ai/flows/predict-energy-consumption';
import { HOURLY_USAGE_DATA } from '../lib/data';
import { getDatabase, ref, get, child, set, serverTimestamp, push } from 'firebase/database';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '../firebase/config';
import { randomUUID } from 'crypto';

// Server-side specific initialization
function initializeFirebaseOnServer() {
  if (getApps().some(app => app.name === 'server-actions')) {
    return getApp('server-actions');
  }
  return initializeApp(firebaseConfig, 'server-actions');
}

const serverApp = initializeFirebaseOnServer();
const database = getDatabase(serverApp);


export async function runIntelligentSwitchControl(input: IntelligentSwitchControlInput) {
  try {
    const result = await intelligentSwitchControl(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in intelligentSwitchControl:', error);
    return { success: false, error: 'Failed to get intelligent recommendations.' };
  }
}

export async function runEnergyPrediction() {
  try {
    const historicalDataString = JSON.stringify(HOURLY_USAGE_DATA);
    const result = await predictEnergyConsumption({
      historicalData: historicalDataString,
      modelName: 'energy_consumption_v1',
    });
    return { success: true, data: result as PredictEnergyConsumptionOutput };
  } catch (error) {
    console.error('Error in predictEnergyConsumption:', error);
    return { success: false, error: 'Failed to predict energy consumption.' };
  }
}

export async function generateApiKey() {
  try {
    const secret = process.env.FIREBASE_DATABASE_SECRET;
    if (!secret) {
      throw new Error('Server configuration error: Missing database secret.');
    }
    const databaseUrl = firebaseConfig.databaseURL;
    const readPath = `app/apiKey.json?auth=${secret}`;
    const readUrl = `${databaseUrl}/${readPath}`;

    // First, try to fetch the existing key
    const readResponse = await fetch(readUrl);
    
    // The key might not exist, which can return a 404 or a null body, which is OK.
    if (readResponse.ok) {
        const existingKey = await readResponse.json();
        if (existingKey) {
            return { success: true, data: { apiKey: existingKey } };
        }
    }

    // If no key exists, generate and write a new one
    const newApiKey = randomUUID();
    const writePath = `app/apiKey.json?auth=${secret}`;
    const writeUrl = `${databaseUrl}/${writePath}`;
    
    const writeResponse = await fetch(writeUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApiKey),
    });

    if (!writeResponse.ok) {
        const errorData = await writeResponse.json();
        throw new Error(errorData.error || 'Failed to write new API key.');
    }

    return { success: true, data: { apiKey: newApiKey } };
  } catch (error: any) {
    console.error('Error generating API key:', error);
    return { success: false, error: error.message || 'Failed to generate API key.' };
  }
}

export async function getApiKey() {
   try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'app/apiKey'));
    const apiKey = snapshot.exists() ? snapshot.val() : null;
    return { success: true, data: { apiKey } };
  } catch (error: any) {
    console.error('Error fetching API key:', error);
    return { success: false, error: 'Could not fetch API key. Check database rules and connectivity.' };
  }
}

export async function updateSwitchState(switchId: number, name: string, state: boolean) {
  try {
    const databaseUrl = firebaseConfig.databaseURL;
    if (!databaseUrl) {
      throw new Error('databaseURL is not defined in firebaseConfig');
    }
    const secret = process.env.FIREBASE_DATABASE_SECRET;
    if (!secret) {
      console.error('FIREBASE_DATABASE_SECRET is not set in environment variables.');
      throw new Error('Server configuration error: Missing database secret.');
    }

    // INVERT THE LOGIC FOR NORMALLY CLOSED RELAYS
    // UI "ON" (true) becomes `false` in DB. UI "OFF" (false) becomes `true` in DB.
    const dbState = !state;

    // Use PUT to directly set the boolean value at the 'state' path.
    const path = `app/switchStates/${switchId}/state.json?auth=${secret}`;
    const url = `${databaseUrl}/${path}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send the inverted boolean value directly.
      body: JSON.stringify(dbState),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update switch ${switchId}.`);
    }

    return { success: true };
  } catch (error: any) {.
    console.error(`Error updating switch ${switchId}:`, error);
    return { success: false, error: error.message || `Failed to update switch ${switchId}.` };
  }
}


export async function getSwitchStates() {
  try {
    const switchesRef = ref(database, 'app/switchStates');
    const snapshot = await get(switchesRef);
    const switchStates = snapshot.exists() ? snapshot.val() : null;
    return { success: true, data: switchStates };
  } catch (error: any) {
    console.error('Error fetching switch states:', error);
    return { success: false, error: error.message || 'Failed to fetch switch states.' };
  }
}

export async function simulateBatteryLevel(level: number) {
  try {
    const energyDataRef = ref(database, 'app/energyData');
    const newEntryRef = push(energyDataRef); // Create a new entry with a unique key
    
    // Set the data for the new entry, including a server-side timestamp
    await set(newEntryRef, {
      batteryLevel: level,
      timestamp: serverTimestamp(),
      voltage: 230,
      current: 0, // Default values for simulation
      power: 0,
      temperature: 25,
      humidity: 60,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error simulating battery level:', error);
    return { success: false, error: error.message || 'Failed to simulate battery level.' };
  }
}
