// src/hooks/useUserLocation.ts
import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

interface UserLocationState {
  coordinate: { latitude: number; longitude: number } | null;
  isLoading: boolean;
  error: string | null;
  permissionGranted: boolean;
  refresh: () => Promise<void>;
}

export function useUserLocation(): UserLocationState {
  const [coordinate, setCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Запрос foreground-разрешения
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        setError('Доступ к геолокации не разрешён');
        return;
      }
      setPermissionGranted(true);

      // 2. Получение текущей позиции
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoordinate({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Не удалось получить местоположение: ${message}`);
      if (__DEV__) console.error('[useUserLocation] error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLocation();
  }, [fetchLocation]);

  return {
    coordinate,
    isLoading,
    error,
    permissionGranted,
    refresh: fetchLocation,
  };
}