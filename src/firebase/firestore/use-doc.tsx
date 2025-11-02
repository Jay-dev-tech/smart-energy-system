
'use client';

import { useState, useEffect } from 'react';
import {
  DatabaseReference,
  onValue,
  Unsubscribe,
  DataSnapshot,
} from 'firebase/database';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: Error | null;
}

export function useDoc<T = any>(
  memoizedDocRef: (DatabaseReference & { __memo?: boolean }) | null | undefined
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe: Unsubscribe = onValue(
      memoizedDocRef,
      (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.val() as T), id: snapshot.key as string });
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (error: Error) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.toString(),
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef]);

  if (memoizedDocRef && !memoizedDocRef.__memo) {
    throw new Error('DatabaseReference was not properly memoized using useMemoFirebase');
  }

  return { data, isLoading, error };
}
