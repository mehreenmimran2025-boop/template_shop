import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { formatDate, money } from '@/lib/format';
import CustomerActions from '@/components/CustomerActions';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const admin = await requireAdmin();
  const [settings, users] = await Promise.all([
    getSettings(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { orders: { select: { status: true, amountCents: true } } },
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-4xl text-wine">Customers</h1>
      <p className="mt-2 text-sm text-brown">{users.length} account{users.length === 1 ? '' : 's'}</p>

      <div className="card mt-8 divide-y divide-sand/60">
        {users.map((user) => {
          const paid = user.orders.filter((o) => o.status === 'PAID');
          const spent = paid.reduce((sum, o) => sum + o.amountCents, 0);
          return (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-cocoa">{user.name}</p>
                  {user.role === 'ADMIN' ? <span className="badge bg-wine text-sand-light">Owner</span> : null}
                  {user.blocked ? <span className="badge-cancelled">Blocked</span> : null}
                </div>
                <p className="mt-0.5 text-xs text-brown">
                  {user.email} · joined {formatDate(user.createdAt)} · {paid.length} purchase
                  {paid.length === 1 ? '' : 's'} · {money(spent, settings.currencySymbol)}
                </p>
              </div>
              {user.id === admin.id ? (
                <span className="text-xs text-brown">That&apos;s you</span>
              ) : (
                <CustomerActions id={user.id} name={user.name} blocked={user.blocked} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
