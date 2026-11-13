import crypto from 'crypto';
import path from 'path';

const IMAGE_TYPES = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'];
const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function safeExt(name: string, fallback = '') {
  const ext = path.extname(name).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : fallback;
}

function randomSlug(ext: string) {
  return `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${ext}`;
}

// ─── Vercel Blob helpers ───────────────────────────────────────────────────

async function blobPut(blobPath: string, file: File) {
  const { put } = await import('@vercel/blob');
  const result = await put(blobPath, file, { access: 'public' });
  return result.url;
}

async function blobDel(url: string) {
  try {
    const { del } = await import('@vercel/blob');
    await del(url);
  } catch {}
}

// ─── Local filesystem helpers ──────────────────────────────────────────────

async function localSave(dir: string, name: string, file: File) {
  const { promises: fs } = await import('fs');
  await fs.mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, name), buffer);
}

const LOCAL_PREVIEWS = path.join(process.cwd(), 'public', 'uploads', 'previews');
const LOCAL_FILES = path.join(process.cwd(), 'data', 'files');

// ─── Public API ────────────────────────────────────────────────────────────

/** Saves a preview image and returns its public URL. */
export async function savePreview(file: File): Promise<string | null> {
  const ext = safeExt(file.name);
  if (!IMAGE_TYPES.includes(ext)) return null;
  const slug = randomSlug(ext);
  if (USE_BLOB) return blobPut(`previews/${slug}`, file);
  await localSave(LOCAL_PREVIEWS, slug, file);
  return `/uploads/previews/${slug}`;
}

/** Saves the purchasable file and returns its stored reference (blob URL or local name). */
export async function saveTemplateFile(file: File): Promise<string> {
  const slug = randomSlug(safeExt(file.name, '.bin'));
  if (USE_BLOB) return blobPut(`files/${slug}`, file);
  await localSave(LOCAL_FILES, slug, file);
  return slug;
}

/** Resolves a stored file reference to an absolute local path (local-only). */
export function templateFilePath(stored: string) {
  const resolved = path.join(LOCAL_FILES, path.basename(stored));
  if (!resolved.startsWith(LOCAL_FILES)) throw new Error('Invalid file path');
  return resolved;
}

/** Returns true when the stored reference is a remote blob URL. */
export function isBlobUrl(stored: string) {
  return stored.startsWith('https://');
}

export async function deletePreview(ref: string) {
  if (ref.startsWith('https://')) { await blobDel(ref); return; }
  if (!ref.startsWith('/uploads/previews/')) return;
  try {
    const { promises: fs } = await import('fs');
    await fs.rm(path.join(process.cwd(), 'public', ref.replace(/^\//, '')), { force: true });
  } catch {}
}

export async function deleteTemplateFile(ref: string) {
  if (!ref) return;
  if (ref.startsWith('https://')) { await blobDel(ref); return; }
  try {
    const { promises: fs } = await import('fs');
    await fs.rm(templateFilePath(ref), { force: true });
  } catch {}
}
