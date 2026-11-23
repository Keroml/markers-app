// src/app/index.tsx
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Map from '../components/Map';
import { useDatabase } from '../contexts/DatabaseContext';
import { useUserLocation } from '../hooks/useUserLocation';
import type { Coordinate, MarkerWithCount } from '../types';

export default function IndexScreen() {
  const {
    getMarkersWithImageCount,
    addMarker,
    isLoading,
    isInitialized,
    error,
    retryInit,
  } = useDatabase();

  const { coordinate: userCoord, error: locationError } = useUserLocation();

  const [markers, setMarkers] = useState<MarkerWithCount[]>([]);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  const [creating, setCreating] = useState(false);

  const getMarkersRef = useRef(getMarkersWithImageCount);
  getMarkersRef.current = getMarkersWithImageCount;

  useFocusEffect(
    useCallback(() => {
      if (!isInitialized) return;
      let cancelled = false;

      (async () => {
        setLoadingMarkers(true);
        try {
          const data = await getMarkersRef.current();
          if (!cancelled) setMarkers(data);
        } catch (e) {
          if (!cancelled) {
            Alert.alert('Ошибка', 'Не удалось загрузить маркеры');
          }
        } finally {
          if (!cancelled) setLoadingMarkers(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [isInitialized])
  );

  const handleLongPress = async (coordinate: Coordinate) => {
    if (creating) return;
    setCreating(true);
    try {
      await addMarker(coordinate.latitude, coordinate.longitude);
      const updated = await getMarkersRef.current();
      setMarkers(updated);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось создать маркер');
      if (__DEV__) console.error('[IndexScreen] addMarker error:', e);
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Инициализация базы данных...</Text>
      </View>
    );
  }

  if (!isInitialized && error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Ошибка базы данных</Text>
        <Text style={styles.text}>{error.message}</Text>
        <View style={styles.retryWrapper}>
          <Button title="Повторить" onPress={() => void retryInit()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Map
        markers={markers}
        onLongPress={handleLongPress}
        showsUserLocation={!!userCoord}
        userCoordinate={userCoord}
      />

      {(loadingMarkers || creating) && (
        <View style={styles.overlay}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}

      <View style={styles.hint}>
        <Text style={styles.hintText}>
          {creating
            ? 'Создание маркера...'
            : locationError
              ? 'Геолокация недоступна'
              : 'Долгое нажатие — добавить маркер'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: { marginTop: 12, fontSize: 14, color: '#666', textAlign: 'center' },
  errorText: { fontSize: 18, fontWeight: '600', color: '#c00' },
  overlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  hint: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintText: { color: '#fff', fontSize: 13 },
  retryWrapper: { marginTop: 16 },
});