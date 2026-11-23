// src/utils/imageStorage.ts
import { Directory, File, Paths } from 'expo-file-system';

const IMAGES_DIR = new Directory(Paths.document, 'marker-images');

/**
 * Копирует выбранное изображение из временного кеша image-picker
 * в постоянную папку приложения (documentDirectory).
 */
export async function persistImage(
  sourceUri: string,
  markerId: number
): Promise<string> {
  // Создаём папку при первом вызове (intermediates = mkdir -p)
  if (!IMAGES_DIR.exists) {
    IMAGES_DIR.create({ intermediates: true });
  }

  const ext = sourceUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const filename = `marker_${markerId}_${Date.now()}.${ext}`;
  const destFile = new File(IMAGES_DIR, filename);

  // Копирование: создаём File из исходного URI и копируем в папку
  const sourceFile = new File(sourceUri);
  sourceFile.copy(destFile);

  return destFile.uri;
}

/**
 * Удаляет файл изображения с диска.
 * Не бросает, если файла нет — это не критично.
 */
export async function deleteImageFile(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (e) {
    if (__DEV__) console.warn('[imageStorage] delete error:', e);
  }
}