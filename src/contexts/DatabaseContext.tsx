// src/contexts/DatabaseContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { closeDatabase, getDatabase } from '../database/schema';
import * as ops from '../database/operations';
import type {
  DatabaseContextType,
  Marker,
  MarkerImage,
  MarkerWithCount,
} from '../types';

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const dbRef = useRef<SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const init = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsInitialized(false);
    try {
      const db = await getDatabase();
      dbRef.current = db;
      setIsInitialized(true);
    } catch (e) {
      if (__DEV__) console.error('[DatabaseProvider] init error:', e);
      setError(e instanceof Error ? e : new Error(String(e)));
      dbRef.current = null;
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void init();
    return () => {
      void closeDatabase();
      dbRef.current = null;
    };
  }, [init]);

  const requireDb = (): SQLiteDatabase => {
    if (!dbRef.current) {
      throw new Error('База данных ещё не инициализирована');
    }
    return dbRef.current;
  };

  const value = useMemo<DatabaseContextType>(
    () => ({
      addMarker: async (latitude, longitude) => {
        try {
          return await ops.createMarker(requireDb(), latitude, longitude);
        } catch (e) {
          setError(e instanceof Error ? e : new Error(String(e)));
          throw e;
        }
      },

      deleteMarker: async (id) => {
        try {
          await ops.deleteMarker(requireDb(), id);
        } catch (e) {
          setError(e instanceof Error ? e : new Error(String(e)));
          throw e;
        }
      },

      getMarkers: async (): Promise<Marker[]> => {
        try {
          return await ops.getAllMarkers(requireDb());
        } catch (e) {
          setError(e instanceof Error ? e : new Error(String(e)));
          throw e;
        }
      },

      getMarkersWithImageCount: async (): Promise<MarkerWithCount[]> => {
        try {
          return await ops.getAllMarkersWithImageCount(requireDb());
        } catch (e) {
          setError(e instanceof Error ? e : new Error(String(e)));
          throw e;
        }
      },

      renameMarker: async (id, title) => {
        try {
          await ops.updateMarkerTitle(requireDb(), id, title);
        } catch (e) {
          setError(e instanceof Error ? e : new Error(String(e)));
          throw e;
        }
      },

      addImage: async (markerId, uri) => {
        try {
          return await ops.addImage(requireDb(), markerId, uri);
        } catch (e) {
          setError(e instanceof Error ? e : new Error(String(e)));
          throw e;
        }
      },

      deleteImage: async (id) => {
        try {
          await ops.deleteImage(requireDb(), id);
        } catch (e) {
          setError(e instanceof Error ? e : new Error(String(e)));
          throw e;
        }
      },

      getMarkerImages: async (markerId): Promise<MarkerImage[]> => {
        try {
          return await ops.getImagesByMarker(requireDb(), markerId);
        } catch (e) {
          setError(e instanceof Error ? e : new Error(String(e)));
          throw e;
        }
      },

      isLoading,
      isInitialized,
      error,
      retryInit: init,
    }),
    [isLoading, isInitialized, error, init]
  );

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextType {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return ctx;
}