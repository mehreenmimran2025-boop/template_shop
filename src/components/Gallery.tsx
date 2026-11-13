'use client';

import { useState } from 'react';

export default function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl2 border border-sand bg-sand-pale font-display text-5xl text-mauve">
        {title.charAt(0)}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl2 border border-sand bg-surface shadow-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={title} className="aspect-[4/3] w-full object-cover" />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={
                'h-16 w-20 overflow-hidden rounded-lg border-2 transition ' +
                (i === active ? 'border-wine' : 'border-sand/70 hover:border-brown')
              }
              aria-label={'Preview ' + (i + 1)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
