'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TemplateRowActions({
  id,
  title,
  published,
}: {
  id: string;
  title: string;
  published: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function send(action: string) {
    setBusy(true);
    const res = await fetch('/api/admin/templates/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('That did not work. Please try again.');
  }

  async function remove() {
    if (!confirm('Delete "' + title + '"? Buyers who already own it keep their copy in their library.')) return;
    setBusy(true);
    const res = await fetch('/api/admin/templates/' + id, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Could not delete it.');
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => send('toggle-published')} disabled={busy} className="btn-ghost btn-sm">
        {published ? 'Unpublish' : 'Publish'}
      </button>
      <button onClick={remove} disabled={busy} className="btn-danger btn-sm">
        Delete
      </button>
    </div>
  );
}
