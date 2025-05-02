export async function getAlbumImages(albumId: string) {
    let images = import.meta.glob<{ default: ImageMetadata }>(
      "/src/content/albums/**/*.{jpeg,jpg}"
    );
  
    images = Object.fromEntries(
      Object.entries(images).filter(([key]) => key.includes(albumId))
    );

    const entries = Object.entries(images)
      .sort(([pathA], [pathB]) => pathA.localeCompare(pathB));
    const resolvedImages = await Promise.all(
      entries.map(([, loader]) => loader().then((mod) => mod.default))
    );
    return resolvedImages;
  }