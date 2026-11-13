import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { formatDateTime, money } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  await requireAdmin();
  const settings = await getSettings();

  const [templates, published, pendingOrders, customers, revenue, recent, unreadMessages, saves] = await Promise.all([
    prisma.template.count(),
    prisma.template.count({ where: { published: true } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { amountCents: true } }),
    prisma.order.findMany({
      include: { template: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.message.count({ where: { handled: false } }),
    prisma.wishlist.count(),
  ]);

  const stats = [
    { label: 'Confirmed revenue', value: money(revenue._sum.amountCents ?? 0, settings.currencySymbol) },
    { label: 'Waiting on you', value: String(pendingOrders), accent: pendingOrders > 0 },
    { label: 'Templates', value: published + ' live · ' + (templates - published) + ' draft' },
    { label: 'Customers', value: String(customers) },
    { label: 'New messages', value: String(unreadMessages), accent: unreadMessages > 0 },
    { label: 'Wishlisted', value: saves + ' save' + (saves === 1 ? '' : 's') },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl text-wine">Dashboard</h1>
      <p className="mt-2 text-sm text-brown">
        {pendingOrders > 0
          ? pendingOrders + ' order' + (pendingOrders === 1 ? '' : 's') + ' waiting for your confirmation.'
          : 'Everything is confirmed. Nothing waiting.'}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={'card p-5 ' + (stat.accent ? 'border-wine/40 bg-mauve-pale/50' : '')}
          >
            <p className="eyebrow">{stat.label}</p>
            <p className="mt-2 font-display text-2xl text-cocoa">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/templates/new" className="btn-primary">Add a template</Link>
        <Link href="/admin/orders" className="btn-ghost">Review orders</Link>
        <Link href="/admin/messages" className="btn-ghost">
          Messages{unreadMessages > 0 ? ' (' + unreadMessages + ')' : ''}
        </Link>
        <Link href="/admin/settings" className="btn-ghost">Store settings</Link>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-cocoa">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-wine link-underline">All orders</Link>
        </div>

        {recent.length === 0 ? (
          <div className="card mt-4 p-10 text-center text-sm text-brown">No orders yet.</div>
        ) : (
          <div className="card mt-4 divide-y divide-sand/60">
            {recent.map((order) => (
              <Link
                key={order.id}
                href={'/admin/orders?highlight=' + order.publicId}
                className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-sand-pale/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-cocoa">{order.template.title}</p>
                  <p className="mt-0.5 text-xs text-brown">
                    {order.user.name} · {order.user.email} · {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-cocoa">{money(order.amountCents, settings.currencySymbol)}</span>
                  <span
                    className={
                      order.status === 'PAID'
                        ? 'badge-paid'
                        : order.status === 'CANCELLED'
                          ? 'badge-cancelled'
                          : 'badge-pending'
                    }
                  >
                    {order.status === 'PAID' ? 'Confirmed' : order.status === 'CANCELLED' ? 'Cancelled' : 'Pending'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
