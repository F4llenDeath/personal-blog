// Load and optimize original album images via Astro's Image component
// This glob imports URLs for all images in the public/originals folder
import path from 'path';
import { promises as fs } from 'fs';
import { getImageDimensions } from './images';

export interface AlbumImage {
  src: string;
  width: number;
  height: number;
}

/** Get all images for an album from public/originals and their dimensions. */
export async function getAlbumImages(albumId: string): Promise<AlbumImage[]> {
  const dir = path.join(process.cwd(), 'public', 'originals', albumId);
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }
  const images = files
    .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
    .sort();
  const result: AlbumImage[] = await Promise.all(
    images.map(async (file) => {
      const src = `/originals/${albumId}/${file}`;
      const { width, height } = await getImageDimensions(src);
      return { src, width, height };
    })
  );
  return result;
}