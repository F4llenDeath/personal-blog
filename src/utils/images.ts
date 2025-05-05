import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

/**
 * Get image dimensions for a file in the public directory.
 * @param publicPath - URL path starting with '/', e.g. '/originals/foo.jpg'
 * @returns width and height in pixels
 */
// Cache to avoid repeated expensive file reads + metadata extraction
const dimCache = new Map<string, Promise<{ width: number; height: number }>>();
/**
 * Get image dimensions for a file in the public directory.
 * Results are cached in-memory for the duration of the dev/build process.
 */
export function getImageDimensions(publicPath: string): Promise<{ width: number; height: number }> {
  if (!dimCache.has(publicPath)) {
    const dimPromise = (async () => {
      const relPath = publicPath.replace(/^\//, '')
      const fullPath = path.join(process.cwd(), 'public', relPath)
      const buffer = await fs.readFile(fullPath)
      const metadata = await sharp(buffer).metadata()
      if (!metadata.width || !metadata.height) {
        throw new Error(`Unable to get dimensions for image '${publicPath}'`)
      }
      return { width: metadata.width, height: metadata.height }
    })()
    dimCache.set(publicPath, dimPromise)
  }
  return dimCache.get(publicPath)!;
}