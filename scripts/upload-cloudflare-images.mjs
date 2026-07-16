#!/usr/bin/env node
/**
 * Cloudflare Images upload + manifest generator (Phase 1).
 *
 * This script preprocesses local photos (compress to a Cloudflare-safe
 * "upload master"), uploads them to Cloudflare Images, and writes/updates a
 * JSON manifest that maps each photo to its Cloudflare Images ID.
 *
 * It does NOT touch anything the Astro site currently reads. The site keeps
 * working exactly as it does today. The generated manifest is meant to be
 * consumed by a future Phase 2 change to the gallery components, once we're
 * happy with the manifest shape.
 *
 * Usage:
 *   node scripts/upload-cloudflare-images.mjs <album> [options]
 *
 * Examples:
 *   node scripts/upload-cloudflare-images.mjs chicago
 *   node scripts/upload-cloudflare-images.mjs chicago --input ~/Pictures/gallery-import/chicago
 *   node scripts/upload-cloudflare-images.mjs chicago --dry-run
 *   node scripts/upload-cloudflare-images.mjs chicago --force --tag trip:2025
 *
 * Options:
 *   --input <dir>          Local folder of source photos.
 *                           Default: photo-import/<album>
 *   --manifest <file>      Manifest output path.
 *                           Default: src/content/albums/<album>.images.json
 *   --max-dimension <n>    Optional max long-edge pixels. If omitted, original resolution is preserved.
 *   --quality <n>          Initial JPEG quality for over-limit files, 1-100 (default: 98)
 *   --max-bytes <n>        Target max size in bytes for the upload master (default: 19922944 = 19 MiB)
 *   --tag <value>          Extra tag to attach (repeatable), stored in Cloudflare metadata
 *   --force                Re-upload even if the file hash matches the manifest
 *   --prune                Remove manifest entries whose source file is no longer present
 *   --dry-run              Do all local processing (hash + resize) but skip the
 *                           Cloudflare API call and skip writing the manifest
 *   --help                 Show this help text
 *
 * Required environment variables (not required for --dry-run):
 *   CF_ACCOUNT_ID           Cloudflare account ID
 *   CF_IMAGES_API_TOKEN     Cloudflare API token with Cloudflare Images: Edit permission
 *
 * Optional environment variables:
 *   CF_IMAGES_DELIVERY_HASH Recorded into the manifest for convenience (used later
 *                           by the site to build https://imagedelivery.net/<hash>/<id>/<variant> URLs)
 *
 * Local .env setup:
 *   1. Create a local secrets file at the repo root, next to package.json:
 *        .env.local   (preferred, gitignored)
 *      or:
 *        .env         (also gitignored in this repo)
 *   2. Put your real Cloudflare values in that file:
 *        CF_ACCOUNT_ID=your_account_id
 *        CF_IMAGES_API_TOKEN=your_cloudflare_images_edit_token
 *        CF_IMAGES_DELIVERY_HASH=your_delivery_hash_optional
 *
 * The script automatically loads `.env.local` first, then `.env` as a fallback.
 * Never commit real API tokens.
 */

import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const REPO_ROOT = process.cwd()
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const CLOUDFLARE_IMAGES_HARD_LIMIT_BYTES = 20 * 1024 * 1024 // Cloudflare's stated per-image cap

const DEFAULTS = {
  maxDimension: null,
  quality: 98,
  maxBytes: 19 * 1024 * 1024, // 19 MiB target, just under Cloudflare's 20 MiB limit
}

function toCamelCase(key) {
  return key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function parseArgs(argv) {
  const args = { _: [], tags: [] }
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (token === '--') {
      continue
    }
    if (token === '--help' || token === '-h') {
      args.help = true
      continue
    }
    if (token.startsWith('--')) {
      const key = token.slice(2)
      if (key === 'force' || key === 'prune' || key === 'dry-run') {
        args[toCamelCase(key)] = true
        continue
      }
      if (key === 'tag') {
        args.tags.push(argv[++i])
        continue
      }
      args[toCamelCase(key)] = argv[++i]
      continue
    }
    args._.push(token)
  }
  return args
}

function printHelp() {
  console.log(`Cloudflare Images upload + manifest generator (Phase 1)

Usage:
  node scripts/upload-cloudflare-images.mjs <album> [options]

Examples:
  node scripts/upload-cloudflare-images.mjs chicago
  node scripts/upload-cloudflare-images.mjs chicago --input ~/Pictures/gallery-import/chicago
  node scripts/upload-cloudflare-images.mjs chicago --dry-run
  node scripts/upload-cloudflare-images.mjs chicago --force --tag trip:2025

Options:
  --input <dir>          Local folder of source photos (default: photo-import/<album>)
  --manifest <file>      Manifest output path (default: src/content/albums/<album>.images.json)
  --max-dimension <n>    Optional max long-edge pixels. If omitted, original resolution is preserved.
  --quality <n>          Initial JPEG quality for over-limit files, 1-100 (default: ${DEFAULTS.quality})
  --max-bytes <n>        Target max size in bytes for the upload master (default: ${DEFAULTS.maxBytes})
  --tag <value>          Extra tag to attach (repeatable), stored in Cloudflare metadata
  --force                Re-upload even if the file hash matches the manifest
  --prune                Remove manifest entries whose source file is no longer present
  --dry-run              Process locally only, skip upload and manifest write
  --help                 Show this help text

Required env vars (not required for --dry-run):
  CF_ACCOUNT_ID, CF_IMAGES_API_TOKEN

Optional env var:
  CF_IMAGES_DELIVERY_HASH

Local .env setup:
  Create .env.local or .env at the repo root, next to package.json:

    CF_ACCOUNT_ID=your_account_id
    CF_IMAGES_API_TOKEN=your_cloudflare_images_edit_token
    CF_IMAGES_DELIVERY_HASH=your_delivery_hash_optional

  The script automatically loads .env.local first, then .env as a fallback.
  These files are gitignored; do not commit real API tokens.
`)
}

async function loadDotEnvFiles(root) {
  // Load .env.local first so it takes priority, then fill in gaps from .env.
  for (const filename of ['.env.local', '.env']) {
    try {
      const content = await fs.readFile(path.join(root, filename), 'utf8')
      for (const rawLine of content.split('\n')) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue
        const eq = line.indexOf('=')
        if (eq === -1) continue
        const key = line.slice(0, eq).trim()
        let value = line.slice(eq + 1).trim()
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        if (process.env[key] === undefined) {
          process.env[key] = value
        }
      }
    } catch {
      // Ignore missing files.
    }
  }
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'application/octet-stream'
}

function getJpegUploadFilename(filename) {
  return filename.replace(/\.[^.]+$/, '.jpg')
}

async function getDisplayDimensions(buffer) {
  const metadata = await sharp(buffer).metadata()
  const width = metadata.width
  const height = metadata.height

  if (!width || !height) {
    throw new Error('Could not read image dimensions')
  }

  // EXIF orientation values 5-8 rotate/swap displayed width and height.
  if (metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8) {
    return { width: height, height: width }
  }

  return { width, height }
}

/**
 * Build a Cloudflare-Images-safe "upload master".
 *
 * By default, if the source file is already under maxBytes, it is uploaded
 * unchanged. That preserves original pixels, JPEG encoder choices, metadata,
 * and file size as much as possible.
 *
 * If the source file is too large, it is recompressed at the original
 * resolution. If maxDimension is provided, the image is resized to fit inside
 * that long edge before compression.
 *
 * Retries with lower quality until it fits under maxBytes. It does not resize
 * as a fallback unless maxDimension was explicitly provided.
 */
async function buildUploadMaster(inputBuffer, { filename, maxDimension, quality, maxBytes }) {
  if (!maxDimension && inputBuffer.length <= maxBytes) {
    const { width, height } = await getDisplayDimensions(inputBuffer)
    return {
      buffer: inputBuffer,
      width,
      height,
      contentType: getContentType(filename),
      uploadFilename: filename,
      mode: 'original',
      quality: null,
    }
  }

  for (let q = quality; q >= 40; q -= q > 80 ? 2 : 5) {
    let pipeline = sharp(inputBuffer).rotate() // auto-orient using EXIF, then strip the orientation tag

    if (maxDimension) {
      pipeline = pipeline.resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    const { data, info } = await pipeline
      .jpeg({ quality: q })
      .toBuffer({ resolveWithObject: true })

    if (data.length <= maxBytes) {
      return {
        buffer: data,
        width: info.width,
        height: info.height,
        contentType: 'image/jpeg',
        uploadFilename: getJpegUploadFilename(filename),
        mode: maxDimension ? 'resized-and-compressed' : 'compressed-original-resolution',
        quality: q,
      }
    }
  }

  throw new Error(
    `Could not compress image under ${(maxBytes / 1024 / 1024).toFixed(
      2,
    )} MiB while preserving ${maxDimension ? 'the requested max dimension' : 'original resolution'}. Try a lower --quality, a larger --max-bytes below Cloudflare's 20 MiB limit, or explicitly pass --max-dimension to allow resizing.`,
  )
}

async function uploadToCloudflareImages({ accountId, apiToken, buffer, filename, contentType, metadata }) {
  const form = new FormData()
  form.append('file', new Blob([buffer], { type: contentType }), filename)
  form.append('metadata', JSON.stringify(metadata))

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: form,
    },
  )

  const json = await res.json()
  if (!res.ok || !json.success) {
    const errors =
      json?.errors?.map((e) => `${e.code}: ${e.message}`).join('; ') ?? res.statusText
    throw new Error(`Cloudflare upload failed for ${filename}: ${errors}`)
  }
  return json.result
}

async function readManifest(manifestPath) {
  try {
    const raw = await fs.readFile(manifestPath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help || args._.length === 0) {
    printHelp()
    process.exit(args.help ? 0 : 1)
  }

  await loadDotEnvFiles(REPO_ROOT)

  const album = args._[0]
  const inputDir = path.resolve(REPO_ROOT, args.input ?? path.join('photo-import', album))
  const manifestPath = path.resolve(
    REPO_ROOT,
    args.manifest ?? path.join('src/content/albums', `${album}.images.json`),
  )

  const maxDimension = args.maxDimension ? Number(args.maxDimension) : DEFAULTS.maxDimension
  const quality = args.quality ? Number(args.quality) : DEFAULTS.quality
  const maxBytes = args.maxBytes ? Number(args.maxBytes) : DEFAULTS.maxBytes
  const dryRun = Boolean(args.dryRun)
  const force = Boolean(args.force)
  const prune = Boolean(args.prune)
  const extraTags = args.tags ?? []

  if (maxBytes > CLOUDFLARE_IMAGES_HARD_LIMIT_BYTES) {
    console.warn(
      `Warning: --max-bytes (${maxBytes}) is above Cloudflare's stated ${CLOUDFLARE_IMAGES_HARD_LIMIT_BYTES} byte limit.`,
    )
  }

  const accountId = process.env.CF_ACCOUNT_ID
  const apiToken = process.env.CF_IMAGES_API_TOKEN
  const deliveryHash = process.env.CF_IMAGES_DELIVERY_HASH

  if (!dryRun && (!accountId || !apiToken)) {
    console.error(
      'Missing CF_ACCOUNT_ID and/or CF_IMAGES_API_TOKEN environment variables.\n' +
        'Set them in your shell, in a .env/.env.local file, or re-run with --dry-run to test locally.',
    )
    process.exit(1)
  }

  let dirEntries
  try {
    dirEntries = await fs.readdir(inputDir, { withFileTypes: true })
  } catch {
    console.error(`Input directory not found: ${inputDir}`)
    process.exit(1)
  }

  const filenames = dirEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  if (filenames.length === 0) {
    console.warn(`No supported images (${[...SUPPORTED_EXTENSIONS].join(', ')}) found in ${inputDir}`)
  }

  const existingManifest = await readManifest(manifestPath)
  const existingByFilename = new Map(
    (existingManifest?.images ?? []).map((entry) => [entry.filename, entry]),
  )

  const resultImages = []
  const failures = []
  let uploadedCount = 0
  let skippedCount = 0

  for (const filename of filenames) {
    const filePath = path.join(inputDir, filename)
    const originalBuffer = await fs.readFile(filePath)
    const hash = sha256(originalBuffer)
    const existing = existingByFilename.get(filename)

    if (existing && existing.sha256 === hash && !force) {
      console.log(`= up to date: ${filename}`)
      resultImages.push(existing)
      skippedCount++
      continue
    }

    try {
      const {
        buffer,
        width,
        height,
        contentType,
        uploadFilename,
        mode,
        quality: uploadQuality,
      } = await buildUploadMaster(originalBuffer, {
        filename,
        maxDimension,
        quality,
        maxBytes,
      })

      console.log(
        `${existing ? '~ updating' : '+ new'}: ${filename} -> ${width}x${height}, ${(
          buffer.length /
          1024 /
          1024
        ).toFixed(2)} MiB (${mode}${uploadQuality ? `, q${uploadQuality}` : ''})`,
      )

      if (dryRun) {
        resultImages.push({
          id: existing?.id ?? '(dry-run, not uploaded)',
          filename,
          uploadFilename,
          sha256: hash,
          width,
          height,
          sourceBytes: originalBuffer.length,
          uploadBytes: buffer.length,
          uploadMode: mode,
          uploadQuality,
          alt: existing?.alt ?? '',
          uploadedAt: existing?.uploadedAt ?? null,
        })
        continue
      }

      const metadata = {
        album,
        filename,
        sha256: hash,
        tags: ['site:personal-blog', `album:${album}`, ...extraTags],
      }

      const uploaded = await uploadToCloudflareImages({
        accountId,
        apiToken,
        buffer,
        filename: uploadFilename,
        contentType,
        metadata,
      })

      resultImages.push({
        id: uploaded.id,
        filename,
        uploadFilename,
        sha256: hash,
        width,
        height,
        sourceBytes: originalBuffer.length,
        uploadBytes: buffer.length,
        uploadMode: mode,
        uploadQuality,
        alt: existing?.alt ?? '',
        uploadedAt: new Date().toISOString(),
      })
      uploadedCount++
    } catch (error) {
      console.error(`x failed: ${filename}: ${error.message}`)
      failures.push({ filename, error: error.message })
      if (existing) {
        // Keep the previous manifest entry rather than dropping the image entirely.
        resultImages.push(existing)
      }
    }
  }

  if (prune) {
    const presentFilenames = new Set(filenames)
    const before = resultImages.length
    const pruned = resultImages.filter((entry) => presentFilenames.has(entry.filename))
    const removedCount = before - pruned.length
    if (removedCount > 0) {
      console.log(`- pruned ${removedCount} manifest entr${removedCount === 1 ? 'y' : 'ies'}`)
    }
    resultImages.length = 0
    resultImages.push(...pruned)
  }

  console.log('')
  console.log(
    `Done: ${uploadedCount} uploaded, ${skippedCount} unchanged, ${failures.length} failed, ${resultImages.length} total in manifest.`,
  )

  if (dryRun) {
    console.log('Dry run: manifest was not written and nothing was uploaded to Cloudflare.')
    if (failures.length > 0) process.exit(1)
    return
  }

  const manifest = {
    album,
    provider: 'cloudflare-images',
    deliveryHash: deliveryHash ?? existingManifest?.deliveryHash ?? null,
    variants: existingManifest?.variants ?? { thumb: 'thumb', large: 'large' },
    generatedAt: new Date().toISOString(),
    images: resultImages,
  }

  await fs.mkdir(path.dirname(manifestPath), { recursive: true })
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`Manifest written: ${path.relative(REPO_ROOT, manifestPath)}`)

  if (failures.length > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
