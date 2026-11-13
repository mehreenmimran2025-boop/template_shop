import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getShopContext } from '@/lib/shop';
import { formatDate, parsePreviews } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My library' };

export default async function LibraryPage() {
  const user = await requireUser();
  const { price } = await getShopContext();
  const [orders] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      include: { template: true, _count: { select: { downloads: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const owned = orders.filter((o) => o.status === 'PAID');
  const pending = orders.filter((o) => o.status === 'PENDING');
  const cancelled = orders.filter((o) => o.status === 'CANCELLED');

  return (
    <div className="container-x py-14">
      <p className="eyebrow">Hello {user.name.split(' ')[0]}</p>
      <h1 className="mt-2 font-display text-5xl text-wine">My library</h1>
      <p className="mt-4 max-w-xl text-brown">Everything you have bought, ready to download any time.</p>

      {pending.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl text-cocoa">On their way to you</h2>
          <div className="mt-5 space-y-3">
            {pending.map((order) => (
              <div
                key={order.id}
                className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-display text-xl text-cocoa">{order.template.title}</p>
                  <p className="mt-1 text-sm text-brown">
                    Order {order.publicId} · {formatDate(order.createdAt)} · {price(order.amountCents).main}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge-pending">Almost there</span>
                  <Link href={'/library/' + order.publicId} className="btn-ghost btn-sm">
                    How to pay
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-14">
        <h2 className="font-display text-2xl text-cocoa">Yours</h2>
        {owned.length === 0 ? (
          <div className="card mt-5 p-10 text-center">
            <p className="font-display text-2xl text-cocoa">Your shelf is waiting</p>
            <p className="mt-2 text-sm text-brown">Anything you buy lands here and stays.</p>
            <Link href="/templates" className="btn-primary mt-6">See the collection</Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {owned.map((order) => {
              const cover = parsePreviews(order.template.previews)[0];
              return (
                <div key={order.id} className="card flex flex-col overflow-hidden">
                  <div className="aspect-[4/3] bg-sand-pale">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-xl text-cocoa">{order.template.title}</h3>
                    <p className="mt-1 text-xs text-brown">
                      Confirmed {order.paidAt ? formatDate(order.paidAt) : formatDate(order.createdAt)} ·{' '}
                      {order._count.downloads} download{order._count.downloads === 1 ? '' : 's'}
                    </p>
                    <div className="mt-auto flex gap-2 pt-5">
                      <a href={'/api/download/' + order.publicId} className="btn-primary btn-sm flex-1">
                        Download
                      </a>
                      <Link href={'/library/' + order.publicId} className="btn-ghost btn-sm">
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {cancelled.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-display text-2xl text-cocoa">Cancelled</h2>
          <div className="mt-5 space-y-3">
            {cancelled.map((order) => (
              <div key={order.id} className="card flex items-center justify-between p-4 opacity-75">
                <p className="text-sm text-cocoa">
                  {order.template.title} · order {order.publicId}
                </p>
                <span className="badge-cancelled">Cancelled</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
