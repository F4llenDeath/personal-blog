import fs from 'node:fs/promises';
import path from 'node:path';
import type { AstroIntegration } from 'astro';

/** Delete every *.jpg / *.png that was copied unchanged into _astro/ */
//referrd to Github issue #4961
export default function removeOriginalImages(): AstroIntegration {
    return {
        name: 'remove-original-images',
        hooks: {
            'astro:build:done': async ({ dir, logger }) => {
                const outDir = path.join(dir.pathname, '_astro');
                let files: string[];

                try {
                    files = await fs.readdir(outDir);
                } catch {
                    logger.warn(`No _astro folder found in ${outDir}`);
                    return;
                }

                const originals = files.filter((f) =>
                    /\.(?:jpe?g|png)$/i.test(f) && !f.includes('_')
                );

                await Promise.all(
                    originals.map(async (file) => {
                        await fs.unlink(path.join(outDir, file));
                        logger.info(`removed original: ${file}`);
                    })
                );
            },
        },
    };
}