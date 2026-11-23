// src/database/operations.ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Marker, MarkerImage, MarkerWithCount } from '../types';

async function withLogging<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const result = await fn();
    if (__DEV__) console.log(`[db:${label}] ok`);
    return result;
  } catch (e) {
    if (__DEV__) console.error(`[db:${label}] error:`, e);
    throw e instanceof Error ? e : new Error(String(e));
  }
}

// ---------- MARKERS ----------

export async function createMarker(
  db: SQLiteDatabase,
  latitude: number,
  longitude: number
): Promise<number> {
  return withLogging('createMarker', async () => {
    const result = await db.runAsync(
      'INSERT INTO markers (latitude, longitude) VALUES (?, ?);',
      [latitude, longitude]
    );
    if (result.lastInsertRowId == null) {
      throw new Error('Не удалось получить id созданного маркера');
    }
    return result.lastInsertRowId;
  });
}

export async function deleteMarker(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  return withLogging('deleteMarker', async () => {
    const result = await db.runAsync('DELETE FROM markers WHERE id = ?;', [id]);
    if (result.changes === 0 && __DEV__) {
      console.warn(`[db:deleteMarker] id=${id} not found`);
    }
  });
}

export async function getAllMarkers(
  db: SQLiteDatabase
): Promise<Marker[]> {
  return withLogging('getAllMarkers', async () => {
    return db.getAllAsync<Marker>(
      'SELECT id, latitude, longitude, title, created_at FROM markers ORDER BY id DESC;'
    );
  });
}

export async function getAllMarkersWithImageCount(
  db: SQLiteDatabase
): Promise<MarkerWithCount[]> {
  return withLogging('getAllMarkersWithImageCount', async () => {
    return db.getAllAsync<MarkerWithCount>(
      `SELECT m.id, m.latitude, m.longitude, m.title, m.created_at,
              COUNT(i.id) AS image_count
       FROM markers m
       LEFT JOIN marker_images i ON i.marker_id = m.id
       GROUP BY m.id
       ORDER BY m.id DESC;`
    );
  });
}

export async function getMarkerById(
  db: SQLiteDatabase,
  id: number
): Promise<Marker | null> {
  return withLogging('getMarkerById', async () => {
    return db.getFirstAsync<Marker>(
      'SELECT id, latitude, longitude, title, created_at FROM markers WHERE id = ?;',
      [id]
    );
  });
}

export async function updateMarkerTitle(
  db: SQLiteDatabase,
  id: number,
  title: string | null
): Promise<void> {
  return withLogging('updateMarkerTitle', async () => {
    const normalized = title?.trim() ? title.trim() : null;
    const result = await db.runAsync(
      'UPDATE markers SET title = ? WHERE id = ?;',
      [normalized, id]
    );
    if (result.changes === 0) {
      throw new Error(`Маркер id=${id} не найден`);
    }
  });
}

// ---------- IMAGES ----------

export async function addImage(
  db: SQLiteDatabase,
  markerId: number,
  uri: string
): Promise<number> {
  return withLogging('addImage', async () => {
    const result = await db.runAsync(
      'INSERT INTO marker_images (marker_id, uri) VALUES (?, ?);',
      [markerId, uri]
    );
    if (result.lastInsertRowId == null) {
      throw new Error('Не удалось получить id добавленного изображения');
    }
    return result.lastInsertRowId;
  });
}

export async function deleteImage(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  return withLogging('deleteImage', async () => {
    const result = await db.runAsync(
      'DELETE FROM marker_images WHERE id = ?;',
      [id]
    );
    if (result.changes === 0 && __DEV__) {
      console.warn(`[db:deleteImage] id=${id} not found`);
    }
  });
}

export async function getImagesByMarker(
  db: SQLiteDatabase,
  markerId: number
): Promise<MarkerImage[]> {
  return withLogging('getImagesByMarker', async () => {
    return db.getAllAsync<MarkerImage>(
      'SELECT id, marker_id, uri, created_at FROM marker_images WHERE marker_id = ? ORDER BY id DESC;',
      [markerId]
    );
  });
}