
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onValue,
  Unsubscribe,
  DataSnapshot,
} from 'firebase/database';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCollection<T = any>(
  memoizedQuery: (Query & { __memo?: boolean }) | null | undefined
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!memoizedQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe: Unsubscribe = onValue(
      memoizedQuery,
      (snapshot: DataSnapshot) => {
        const results: ResultItemType[] = [];
        snapshot.forEach((childSnapshot) => {
          results.push({ ...(childSnapshot.val() as T), id: childSnapshot.key as string });
        });
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: Error) => {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: memoizedQuery.toString(), 
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  if (memoizedQuery && !memoizedQuery.__memo) {
    throw new Error('Query was not properly memoized using useMemoFirebase');
  }

  return { data, isLoading, error };
}
