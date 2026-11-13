import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-cream px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="font-display text-5xl text-wine">This page has wandered off</h1>
      <p className="max-w-md text-sm text-brown">
        The link may be old, or the template may have been unpublished.
      </p>
      <Link href="/templates" className="btn-primary mt-2">Browse the collection</Link>
    </div>
  );
}
