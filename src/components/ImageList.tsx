// src/components/ImageList.tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { MarkerImage } from '../types';

interface ImageListProps {
  images: MarkerImage[];
  onDelete: (imageId: number) => Promise<void>;
}

export default function ImageList({ images, onDelete }: ImageListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (deletingId !== null) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (images.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Изображений пока нет</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {images.map((item) => (
        <View key={item.id} style={styles.item}>
          <Image source={{ uri: item.uri }} style={styles.image} />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
            disabled={deletingId !== null}
            accessibilityLabel="Удалить изображение"
          >
            {deletingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.deleteText}>✕</Text>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  image: { width: '100%', height: '100%' },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 14 },
});