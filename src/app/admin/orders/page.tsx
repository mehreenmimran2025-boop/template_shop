import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { formatDateTime, money } from '@/lib/format';
import OrderActions from '@/components/OrderActions';

export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: 'pending', label: 'Waiting', status: 'PENDING' },
  { key: 'paid', label: 'Confirmed', status: 'PAID' },
  { key: 'cancelled', label: 'Cancelled', status: 'CANCELLED' },
  { key: 'all', label: 'All', status: null },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; highlight?: string };
}) {
  await requireAdmin();
  const active = FILTERS.find((f) => f.key === searchParams.status) ?? FILTERS[0];
  const where: Prisma.OrderWhereInput = active.status ? { status: active.status } : {};

  const [settings, orders, counts] = await Promise.all([
    getSettings(),
    prisma.order.findMany({
      where,
      include: { template: true, user: true, _count: { select: { downloads: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const countFor = (status: string | null) =>
    status === null
      ? counts.reduce((sum, c) => sum + c._count._all, 0)
      : (counts.find((c) => c.status === status)?._count._all ?? 0);

  return (
    <div>
      <h1 className="font-display text-4xl text-wine">Orders</h1>
      <p className="mt-2 text-sm text-brown">
        Nothing downloads until you press <span className="font-medium text-cocoa">Confirm payment</span>.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.key}
            href={'/admin/orders?status=' + filter.key}
            className={
              'rounded-full border px-4 py-1.5 text-sm transition ' +
              (active.key === filter.key
                ? 'border-wine bg-wine text-sand-light'
                : 'border-sand bg-surface text-cocoa hover:border-brown')
            }
          >
            {filter.label} ({countFor(filter.status)})
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="card mt-8 p-12 text-center text-sm text-brown">Nothing in this list.</div>
      ) : (
        <div className="mt-8 space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              id={order.publicId}
              className={
                'card p-5 ' +
                (searchParams.highlight === order.publicId ? 'border-wine ring-2 ring-wine/20' : '')
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-brown">{order.publicId}</span>
                    <span
                      className={
                        order.status === 'PAID'
                          ? 'badge-paid'
                          : order.status === 'CANCELLED'
                            ? 'badge-cancelled'
                            : 'badge-pending'
                      }
                    >
                      {order.status === 'PAID' ? 'Confirmed' : order.status === 'CANCELLED' ? 'Cancelled' : 'Waiting'}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-xl text-cocoa">{order.template.title}</p>
                  <p className="mt-1 text-sm text-brown">
                    {order.user.name} · <a href={'mailto:' + order.user.email} className="hover:text-wine">{order.user.email}</a>
                  </p>
                  <p className="mt-1 text-xs text-brown">
                    Placed {formatDateTime(order.createdAt)}
                    {order.paidAt ? ' · confirmed ' + formatDateTime(order.paidAt) : ''}
                    {' · '}
                    {order._count.downloads} download{order._count.downloads === 1 ? '' : 's'}
                  </p>
                  {order.colorChoice ? (
                    <p className="mt-2 text-sm text-brown">
                      Colour: <span className="font-medium text-cocoa">{order.colorChoice}</span>
                    </p>
                  ) : null}
                  {order.buyerNote ? (
                    <p className="mt-3 rounded-lg bg-sand-pale px-3 py-2 text-sm text-cocoa">
                      <span className="eyebrow">Note from buyer</span>
                      <br />
                      {order.buyerNote}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className="font-display text-2xl text-wine">
                    {money(order.amountCents, settings.currencySymbol)}
                  </span>
                  <OrderActions
                    id={order.id}
                    status={order.status}
                    buyerName={order.user.name}
                    templateTitle={order.template.title}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
