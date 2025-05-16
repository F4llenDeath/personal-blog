export async function getAlbumImages(albumId: string) {
    const images = import.meta.glob<{ default: ImageMetadata }>(
      "/src/content/albums/**/*.{jpeg,jpg}"
    );

    const entries = Object.entries(images)
      .filter(([key]) => key.includes(albumId))
      .sort(([a], [b]) => a.localeCompare(b));

    const resolvedImages = await Promise.all(
      entries.map(([, importer]) => importer().then((mod) => mod.default))
    );

    return resolvedImages;
  }