'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MessageActions({
  id,
  handled,
  mailto,
}: {
  id: string;
  handled: boolean;
  mailto: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function send(method: 'PATCH' | 'DELETE', action?: string) {
    if (method === 'DELETE' && !confirm('Delete this message?')) return;
    setBusy(true);
    const res = await fetch('/api/admin/messages/' + id, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: action ? JSON.stringify({ action }) : undefined,
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('That did not work.');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={mailto} className="btn-primary btn-sm">Reply by email</a>
      <button
        onClick={() => send('PATCH', handled ? 'unhandled' : 'handled')}
        disabled={busy}
        className="btn-ghost btn-sm"
      >
        {handled ? 'Mark unread' : 'Mark done'}
      </button>
      <button onClick={() => send('DELETE')} disabled={busy} className="btn-danger btn-sm">
        Delete
      </button>
    </div>
  );
}
