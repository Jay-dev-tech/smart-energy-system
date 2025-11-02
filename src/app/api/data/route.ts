
import { NextResponse, type NextRequest } from 'next/server';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, child } from 'firebase/database';
import { firebaseConfig } from '../../../firebase/config';

// Server-side specific initialization for API routes
function initializeFirebaseOnServer() {
  if (getApps().some(app => app.name === 'api-route')) {
    return getApp('api-route');
  }
  return initializeApp(firebaseConfig, 'api-route');
}

const serverApp = initializeFirebaseOnServer();
const database = getDatabase(serverApp);

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('Device-API-Key');
    const body = await request.json();

    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'app/apiKey'));
    const expectedApiKey = snapshot.exists() ? snapshot.val() : null;

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ success: false, error: 'Device API Key is invalid or missing.' }, { status: 401 });
    }

    if (!body || typeof body !== 'object') {
        return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const secret = process.env.FIREBASE_DATABASE_SECRET;
    if (!secret) {
      console.error('FIREBASE_DATABASE_SECRET is not set in environment variables.');
      return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
    }

    const databaseUrl = firebaseConfig.databaseURL;
    const path = `app/energyData.json?auth=${secret}`;
    const url = `${databaseUrl}/${path}`;

    const response = await fetch(url, {
      method: 'POST', // POST to push a new entry with a unique ID
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to write energy data to database.');
    }

    return NextResponse.json({ success: true, message: 'Data received successfully.' });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
