'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerActions({
  id,
  name,
  blocked,
}: {
  id: string;
  name: string;
  blocked: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function send(action: 'block' | 'unblock' | 'delete') {
    if (action === 'delete' && !confirm('Delete ' + name + ' and all of their orders? This cannot be undone.')) return;
    if (action === 'block' && !confirm('Block ' + name + '? They will not be able to sign in or download.')) return;

    setBusy(true);
    const res = await fetch('/api/admin/customers/' + id, {
      method: action === 'delete' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: action === 'delete' ? undefined : JSON.stringify({ action }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('That did not work.');
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => send(blocked ? 'unblock' : 'block')} disabled={busy} className="btn-ghost btn-sm">
        {blocked ? 'Unblock' : 'Block'}
      </button>
      <button onClick={() => send('delete')} disabled={busy} className="btn-danger btn-sm">
        Delete
      </button>
    </div>
  );
}
