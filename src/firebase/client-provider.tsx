
'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from './provider';
import { getSdks } from '.';
import { signInAnonymously } from 'firebase/auth';
import { useToast } from '../hooks/use-toast';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { FirebaseErrorListener } from '../components/FirebaseErrorListener';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const { toast } = useToast();
  
  const firebaseServices = useMemo(() => {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    return getSdks(app);
  }, []);

  useEffect(() => {
    const { auth } = firebaseServices;
    if (auth.currentUser) return;

    signInAnonymously(auth).catch((error) => {
      console.error("Anonymous sign-in failed:", error);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'Could not connect to the service. Please refresh the page.'
      });
    });
  }, [firebaseServices, toast]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      database={firebaseServices.database}
      auth={firebaseServices.auth}
    >
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
