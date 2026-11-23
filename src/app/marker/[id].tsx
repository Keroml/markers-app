// src/app/marker/[id].tsx
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useDatabase } from '../../contexts/DatabaseContext';
import { getMarkerById } from '../../database/operations';
import { getDatabase } from '../../database/schema';
import { persistImage, deleteImageFile } from '../../utils/imageStorage';
import ImageList from '../../components/ImageList';
import type { Marker, MarkerImage } from '../../types';

export default function MarkerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const markerId = Number(id);

  const {
    getMarkerImages,
    addImage,
    deleteImage,
    deleteMarker,
    renameMarker,
  } = useDatabase();

  const [marker, setMarker] = useState<Marker | null>(null);
  const [images, setImages] = useState<MarkerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        if (!Number.isFinite(markerId)) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const db = await getDatabase();
          const m = await getMarkerById(db, markerId);
          if (cancelled) return;
          if (!m) {
            setNotFound(true);
          } else {
            setMarker(m);
            setTitleDraft(m.title ?? '');
            const imgs = await getMarkerImages(markerId);
            if (!cancelled) setImages(imgs);
          }
        } catch (e) {
          if (!cancelled) {
            Alert.alert('Ошибка', 'Не удалось загрузить данные маркера');
            if (__DEV__) console.error(e);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [markerId, getMarkerImages])
  );

  const handleAddImage = async () => {
    if (adding) return;
    setAdding(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Нет доступа',
          'Разрешите доступ к галерее в настройках устройства'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const persistedUri = await persistImage(result.assets[0].uri, markerId);
      await addImage(markerId, persistedUri);

      const updated = await getMarkerImages(markerId);
      setImages(updated);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось добавить изображение');
      if (__DEV__) console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    const target = images.find((i) => i.id === imageId);
    try {
      await deleteImage(imageId);
      if (target) await deleteImageFile(target.uri);
      setImages((prev) => prev.filter((i) => i.id !== imageId));
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось удалить изображение');
      if (__DEV__) console.error(e);
    }
  };

  const handleDeleteMarker = () => {
    Alert.alert(
      'Удалить маркер?',
      'Все связанные изображения также будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMarker(markerId);
              await Promise.all(images.map((img) => deleteImageFile(img.uri)));
              router.back();
            } catch (e) {
              Alert.alert('Ошибка', 'Не удалось удалить маркер');
              if (__DEV__) console.error(e);
            }
          },
        },
      ]
    );
  };

  const handleSaveTitle = async () => {
    if (savingTitle) return;
    setSavingTitle(true);
    try {
      const normalized = titleDraft.trim() ? titleDraft.trim() : null;
      await renameMarker(markerId, normalized);
      setMarker((prev) => (prev ? { ...prev, title: normalized } : prev));
      Alert.alert('Готово', 'Название сохранено');
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось сохранить название');
      if (__DEV__) console.error(e);
    } finally {
      setSavingTitle(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (notFound || !marker) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Маркер не найден</Text>
        <Button title="К карте" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {marker.title ?? `Маркер #${marker.id}`}
      </Text>
      <Text style={styles.coords}>Широта: {marker.latitude.toFixed(6)}</Text>
      <Text style={styles.coords}>Долгота: {marker.longitude.toFixed(6)}</Text>

      <Text style={styles.sectionTitle}>Название</Text>
      <TextInput
        style={styles.input}
        value={titleDraft}
        onChangeText={setTitleDraft}
        placeholder={`Маркер #${marker.id}`}
        maxLength={60}
      />
      <View style={styles.buttonWrapper}>
        <Button
          title={savingTitle ? 'Сохранение...' : 'Сохранить название'}
          onPress={handleSaveTitle}
          disabled={savingTitle}
        />
      </View>

      <View style={styles.buttonWrapper}>
        <Button
          title={adding ? 'Добавление...' : 'Добавить изображение'}
          onPress={handleAddImage}
          disabled={adding}
        />
      </View>

      <TouchableOpacity
        style={styles.deleteMarkerButton}
        onPress={handleDeleteMarker}
      >
        <Text style={styles.deleteMarkerText}>Удалить маркер</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Изображения ({images.length})</Text>
      <ImageList images={images} onDelete={handleDeleteImage} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  coords: { fontSize: 14, color: '#444', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  buttonWrapper: { marginVertical: 8 },
  deleteMarkerButton: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fee',
    borderWidth: 1,
    borderColor: '#c00',
  },
  deleteMarkerText: { color: '#c00', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 18, color: '#c00', marginBottom: 16 },
});