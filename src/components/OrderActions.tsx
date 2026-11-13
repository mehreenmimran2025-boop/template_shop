'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderActions({
  id,
  status,
  buyerName,
  templateTitle,
}: {
  id: string;
  status: string;
  buyerName: string;
  templateTitle: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function send(action: 'confirm' | 'cancel' | 'reopen') {
    if (action === 'confirm') {
      const ok = confirm(
        'Confirm payment received for "' + templateTitle + '"?\n\n' +
          buyerName + ' will be able to download it immediately, and it stays in their library.',
      );
      if (!ok) return;
    }
    if (action === 'cancel' && !confirm('Cancel this order? The download stays locked.')) return;

    setBusy(true);
    const res = await fetch('/api/admin/orders/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('That did not work. Please try again.');
  }

  if (status === 'PENDING') {
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => send('confirm')} disabled={busy} className="btn-olive btn-sm">
          Confirm payment
        </button>
        <button onClick={() => send('cancel')} disabled={busy} className="btn-danger btn-sm">
          Cancel
        </button>
      </div>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <button onClick={() => send('reopen')} disabled={busy} className="btn-ghost btn-sm">
        Reopen as pending
      </button>
    );
  }

  return (
    <button onClick={() => send('cancel')} disabled={busy} className="btn-ghost btn-sm">
      Revoke access
    </button>
  );
}
