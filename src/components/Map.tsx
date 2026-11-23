// src/components/Map.tsx
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, LongPressEvent } from 'react-native-maps';
import { router } from 'expo-router';
import type { MarkerWithCount, Coordinate } from '../types';

interface MapProps {
  markers: MarkerWithCount[];
  onLongPress: (coordinate: Coordinate) => void;
  showsUserLocation?: boolean;
  userCoordinate?: Coordinate | null;
}

export default function Map({
  markers,
  onLongPress,
  showsUserLocation = true,
  userCoordinate,
}: MapProps) {
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (userCoordinate && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userCoordinate.latitude,
          longitude: userCoordinate.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000
      );
    }
  }, [userCoordinate]);

  const handleLongPress = (event: LongPressEvent) => {
    onLongPress(event.nativeEvent.coordinate);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 55.751244,
          longitude: 37.618423,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onLongPress={handleLongPress}
        showsUserLocation={showsUserLocation}
        loadingEnabled
      >
        {markers.map((marker) => {
          const hasImages = marker.image_count > 0;
          return (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              title={marker.title ?? `Маркер #${marker.id}`}
              pinColor={hasImages ? 'red' : 'blue'}
              onPress={() => {
                try {
                  router.push({
                    pathname: '/marker/[id]',
                    params: { id: marker.id },
                  });
                } catch (e) {
                  if (__DEV__) console.error('[Map] navigation error:', e);
                }
              }}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});