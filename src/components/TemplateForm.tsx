'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export type ColorOption = { name: string; hex: string; hex2?: string; filePath?: string; fileName?: string };

export type TemplateFormValues = {
  id?: string;
  title: string;
  slug: string;
  tagline: string;
  category: string;
  tags: string;
  price: string;
  description: string;
  includes: string;
  published: boolean;
  featured: boolean;
  sortOrder: number;
  previews: string[];
  fileName: string;
  colors: ColorOption[];
};

const EMPTY: TemplateFormValues = {
  title: '',
  slug: '',
  tagline: '',
  category: 'General',
  tags: '',
  price: '',
  description: '',
  includes: '',
  published: false,
  featured: false,
  sortOrder: 0,
  previews: [],
  fileName: '',
  colors: [],
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export default function TemplateForm({
  initial,
  currency,
  categories,
}: {
  initial?: TemplateFormValues;
  currency: string;
  categories: string[];
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [values, setValues] = useState<TemplateFormValues>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [keptPreviews, setKeptPreviews] = useState<string[]>(initial?.previews ?? []);
  const [newPreviews, setNewPreviews] = useState<File[]>([]);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [colorFiles, setColorFiles] = useState<Record<number, File>>({});
  const [newColor, setNewColor] = useState({ name: '', hex: '#B4A4D4', hex2: '', useHex2: false });
  const newColorFileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof TemplateFormValues>(key: K, value: TemplateFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!isEdit && !newFile && Object.keys(colorFiles).length === 0) {
      setError('Attach the file buyers will download — either one main file or a file per colour.');
      return;
    }

    setBusy(true);
    const body = new FormData();
    body.set('title', values.title);
    body.set('slug', values.slug || slugify(values.title));
    body.set('tagline', values.tagline);
    body.set('category', values.category.trim() || 'General');
    body.set('tags', values.tags);
    body.set('price', values.price || '0');
    body.set('description', values.description);
    body.set('includes', values.includes);
    body.set('published', values.published ? '1' : '0');
    body.set('featured', values.featured ? '1' : '0');
    body.set('sortOrder', String(values.sortOrder));
    body.set('colors', JSON.stringify(values.colors));
    values.colors.forEach((_, i) => {
      if (colorFiles[i]) body.append(`color_file_${i}`, colorFiles[i]);
    });
    body.set('keptPreviews', JSON.stringify(keptPreviews));
    newPreviews.forEach((file) => body.append('previews', file));
    if (newFile) body.set('file', newFile);

    try {
      const res = await fetch(isEdit ? '/api/admin/templates/' + initial!.id : '/api/admin/templates', {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the template.');
      router.push('/admin/templates');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <div className="card space-y-5 p-6">
          <h2 className="font-display text-2xl text-cocoa">The listing</h2>

          <div>
            <label className="label" htmlFor="title">Title</label>
            <input
              id="title"
              className="input"
              required
              value={values.title}
              onChange={(e) => {
                set('title', e.target.value);
                if (!slugTouched) set('slug', slugify(e.target.value));
              }}
              placeholder="Evergreen Instagram Kit"
            />
          </div>

          <div>
            <label className="label" htmlFor="tagline">One-line description</label>
            <input
              id="tagline"
              className="input"
              value={values.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder="24 editable posts + 12 story covers"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="category">Category</label>
              <input
                id="category"
                className="input"
                list="category-options"
                value={values.category}
                onChange={(e) => set('category', e.target.value)}
              />
              <datalist id="category-options">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label" htmlFor="price">Price ({currency})</label>
              <input
                id="price"
                className="input"
                inputMode="decimal"
                value={values.price}
                onChange={(e) => set('price', e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="65"
              />
              <p className="mt-1 text-xs text-brown">0 = free, and it unlocks instantly.</p>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="tags">Tags</label>
            <input
              id="tags"
              className="input"
              value={values.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="instagram, canva, branding"
            />
          </div>

          <div>
            <label className="label" htmlFor="description">Full description</label>
            <textarea
              id="description"
              className="textarea"
              rows={6}
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Leave a blank line between paragraphs."
            />
          </div>

          <div>
            <label className="label" htmlFor="includes">What&apos;s included — one per line</label>
            <textarea
              id="includes"
              className="textarea"
              rows={5}
              value={values.includes}
              onChange={(e) => set('includes', e.target.value)}
              placeholder={'24 square post templates\n12 story covers\nColour + font guide'}
            />
          </div>

          <div>
            <label className="label" htmlFor="slug">Page address</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-brown">/templates/</span>
              <input
                id="slug"
                className="input"
                value={values.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', slugify(e.target.value));
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card space-y-4 p-6">
          <h2 className="font-display text-2xl text-cocoa">Preview images</h2>
          <p className="text-sm text-brown">The first one is the cover.</p>

          {keptPreviews.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {keptPreviews.map((src) => (
                <div key={src} className="group relative overflow-hidden rounded-lg border border-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setKeptPreviews((p) => p.filter((x) => x !== src))}
                    className="absolute right-1 top-1 rounded-full bg-wine px-2 py-0.5 text-[10px] text-sand-light opacity-90"
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewPreviews(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-cocoa file:mr-3 file:rounded-full file:border-0 file:bg-sand-pale file:px-4 file:py-2 file:text-sm file:text-cocoa hover:file:bg-sand"
          />
          {newPreviews.length > 0 ? (
            <p className="text-xs text-olive">{newPreviews.length} new image(s) ready to upload</p>
          ) : null}
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-display text-2xl text-cocoa">Colour options</h2>
          <p className="text-sm text-brown">Each colour gets its own file. Buyers pick a colour and download it.</p>

          {values.colors.length > 0 ? (
            <div className="space-y-3">
              {values.colors.map((c, i) => (
                <div key={i} className="rounded-xl border border-sand p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-7 w-7 flex-shrink-0 rounded-full border border-sand/60 shadow-sm"
                      style={{
                        background: c.hex2
                          ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)`
                          : c.hex,
                      }}
                    />
                    <span className="flex-1 text-sm font-medium text-cocoa">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        set('colors', values.colors.filter((_, j) => j !== i));
                        setColorFiles((prev) => {
                          const next: Record<number, File> = {};
                          Object.entries(prev).forEach(([k, v]) => {
                            const ki = Number(k);
                            if (ki !== i) next[ki > i ? ki - 1 : ki] = v;
                          });
                          return next;
                        });
                      }}
                      className="text-xs text-brown hover:text-wine"
                    >
                      Remove
                    </button>
                  </div>
                  {c.fileName && !colorFiles[i] ? (
                    <p className="text-xs text-olive">Current: {c.fileName}</p>
                  ) : null}
                  {colorFiles[i] ? (
                    <p className="text-xs text-olive">{colorFiles[i].name} ready to upload</p>
                  ) : null}
                  <input
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setColorFiles((prev) => ({ ...prev, [i]: f }));
                    }}
                    className="block w-full text-xs text-cocoa file:mr-2 file:rounded-full file:border-0 file:bg-sand-pale file:px-3 file:py-1 file:text-xs file:text-cocoa hover:file:bg-sand"
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className="rounded-xl border border-sand bg-sand-pale/40 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brown">New colour</p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="label" htmlFor="colorHex">Colour 1</label>
                <input
                  id="colorHex"
                  type="color"
                  value={newColor.hex}
                  onChange={(e) => setNewColor((c) => ({ ...c, hex: e.target.value }))}
                  className="h-9 w-14 cursor-pointer rounded-lg border border-sand bg-surface p-1"
                />
              </div>
              {newColor.useHex2 ? (
                <div>
                  <label className="label" htmlFor="colorHex2">Colour 2</label>
                  <input
                    id="colorHex2"
                    type="color"
                    value={newColor.hex2 || '#FFFFFF'}
                    onChange={(e) => setNewColor((c) => ({ ...c, hex2: e.target.value }))}
                    className="h-9 w-14 cursor-pointer rounded-lg border border-sand bg-surface p-1"
                  />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setNewColor((c) => ({ ...c, useHex2: !c.useHex2, hex2: '' }))}
                className="btn-ghost btn-sm mt-5"
              >
                {newColor.useHex2 ? '− Remove 2nd' : '+ 2nd colour'}
              </button>
            </div>

            <div>
              <label className="label" htmlFor="colorName">Colour name</label>
              <input
                id="colorName"
                className="input"
                value={newColor.name}
                onChange={(e) => setNewColor((c) => ({ ...c, name: e.target.value }))}
                placeholder="Ivory, Black, Sage…"
              />
            </div>

            <div>
              <label className="label">File for this colour</label>
              <input
                type="file"
                ref={newColorFileRef}
                className="block w-full text-sm text-cocoa file:mr-3 file:rounded-full file:border-0 file:bg-sand-pale file:px-4 file:py-2 file:text-sm file:text-cocoa hover:file:bg-sand"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!newColor.name.trim()) return;
                const idx = values.colors.length;
                set('colors', [
                  ...values.colors,
                  {
                    name: newColor.name.trim(),
                    hex: newColor.hex,
                    ...(newColor.useHex2 && newColor.hex2 ? { hex2: newColor.hex2 } : {}),
                  },
                ]);
                const f = newColorFileRef.current?.files?.[0];
                if (f) setColorFiles((prev) => ({ ...prev, [idx]: f }));
                setNewColor({ name: '', hex: '#B4A4D4', hex2: '', useHex2: false });
                if (newColorFileRef.current) newColorFileRef.current.value = '';
              }}
              className="btn-ghost btn-sm"
            >
              Add colour
            </button>
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-display text-2xl text-cocoa">The file buyers get</h2>
          <p className="text-sm text-brown">Private — sent only after you confirm an order.</p>

          {values.fileName ? (
            <p className="rounded-lg bg-sand-pale px-3 py-2 text-sm text-cocoa">
              Current file: <span className="font-medium">{values.fileName}</span>
            </p>
          ) : null}

          <input
            type="file"
            onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-cocoa file:mr-3 file:rounded-full file:border-0 file:bg-sand-pale file:px-4 file:py-2 file:text-sm file:text-cocoa hover:file:bg-sand"
          />
          {newFile ? <p className="text-xs text-olive">{newFile.name} ready to upload</p> : null}
          {isEdit ? <p className="text-xs text-brown">Leave empty to keep the current file.</p> : null}
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-display text-2xl text-cocoa">Visibility</h2>
          <label className="flex items-start gap-3 text-sm text-cocoa">
            <input
              type="checkbox"
              checked={values.published}
              onChange={(e) => set('published', e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#5E233C]"
            />
            <span>
              <span className="font-medium">Published</span>
              <span className="block text-xs text-brown">Visible in the shop.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-cocoa">
            <input
              type="checkbox"
              checked={values.featured}
              onChange={(e) => set('featured', e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#5E233C]"
            />
            <span>
              <span className="font-medium">Featured</span>
              <span className="block text-xs text-brown">Shown on the home page.</span>
            </span>
          </label>
          <div>
            <label className="label" htmlFor="sortOrder">Sort order</label>
            <input
              id="sortOrder"
              type="number"
              className="input"
              value={values.sortOrder}
              onChange={(e) => set('sortOrder', Number(e.target.value) || 0)}
            />
          </div>
        </div>

        {error ? <p className="rounded-lg bg-mauve-pale px-4 py-3 text-sm text-wine">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add template'}
          </button>
          <Link href="/admin/templates" className="btn-ghost">Cancel</Link>
        </div>
      </div>
    </form>
  );
}
