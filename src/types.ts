// src/types.ts

/**
 * Маркер на карте.
 * Соответствует строке таблицы `markers` в SQLite.
 */
export interface Marker {
  id: number;
  latitude: number;
  longitude: number;
  title: string | null;
  created_at: string;
}

/**
 * Маркер + количество привязанных изображений.
 * Используется на карте для выбора цвета пина.
 */
export interface MarkerWithCount extends Marker {
  image_count: number;
}

/**
 * Изображение, привязанное к маркеру.
 */
export interface MarkerImage {
  id: number;
  marker_id: number;
  uri: string;
  created_at: string;
}

/**
 * Координата — удобный алиас для работы с react-native-maps.
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Параметры навигации Expo Router.
 */
export type RootStackParamList = {
  index: undefined;
  'marker/[id]': { id: string };
};

/**
 * Тип контекста базы данных.
 */
export interface DatabaseContextType {
  // Операции с маркерами
  addMarker: (latitude: number, longitude: number) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  getMarkers: () => Promise<Marker[]>;
  getMarkersWithImageCount: () => Promise<MarkerWithCount[]>;
  renameMarker: (id: number, title: string | null) => Promise<void>;

  // Операции с изображениями
  addImage: (markerId: number, uri: string) => Promise<number>;
  deleteImage: (id: number) => Promise<void>;
  getMarkerImages: (markerId: number) => Promise<MarkerImage[]>;

  // Статусы
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;

  // Повторная инициализация БД
  retryInit: () => Promise<void>;
}