import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getShopContext } from '@/lib/shop';
import { formatDateTime, parsePreviews } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order' };

export default async function OrderPage({ params }: { params: { publicId: string } }) {
  const user = await requireUser('/library/' + params.publicId);
  const { settings, price, country } = await getShopContext();
  const [order] = await Promise.all([
    prisma.order.findUnique({
      where: { publicId: params.publicId },
      include: { template: true, downloads: { orderBy: { createdAt: 'desc' }, take: 5 } },
    }),
  ]);

  if (!order || (order.userId !== user.id && user.role !== 'ADMIN')) notFound();

  const cover = parsePreviews(order.template.previews)[0];
  const isPaid = order.status === 'PAID';
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="container-x max-w-4xl py-14">
      <Link href="/library" className="text-sm text-brown hover:text-wine">← Back to my library</Link>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <h1 className="font-display text-4xl text-wine">Order {order.publicId}</h1>
        <span className={isPaid ? 'badge-paid' : isCancelled ? 'badge-cancelled' : 'badge-pending'}>
          {isPaid ? 'All yours' : isCancelled ? 'Cancelled' : 'Almost there'}
        </span>
      </div>
      <p className="mt-2 text-sm text-brown">Placed {formatDateTime(order.createdAt)}</p>

      <div className="mt-9 grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <div className="card overflow-hidden">
          <div className="aspect-[4/3] bg-sand-pale">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="p-5">
            <h2 className="font-display text-xl text-cocoa">{order.template.title}</h2>
            <p className="mt-1 text-sm text-brown">{order.template.tagline}</p>
            <p className="mt-4 font-display text-2xl text-wine">
              {order.amountCents === 0 ? 'Free' : price(order.amountCents).main}
            </p>
            {order.colorChoice ? (
              <p className="mt-2 text-sm text-brown">Colour: <span className="font-medium text-cocoa">{order.colorChoice}</span></p>
            ) : null}
          </div>
        </div>

        <div>
          {isPaid ? (
            <div className="rounded-xl2 border border-olive/30 bg-olive-pale/60 p-6">
              <h2 className="font-display text-2xl text-olive">All done — enjoy it</h2>
              <p className="mt-2 text-sm leading-relaxed text-cocoa">
                Confirmed {order.paidAt ? formatDateTime(order.paidAt) : ''}. It stays in your library.
              </p>
              <a href={'/api/download/' + order.publicId} className="btn-olive mt-5 w-full">
                Download {order.template.fileName || 'file'}
              </a>
              {order.downloads.length > 0 ? (
                <p className="mt-4 text-xs text-brown">
                  Last downloaded {formatDateTime(order.downloads[0].createdAt)}
                </p>
              ) : null}
            </div>
          ) : isCancelled ? (
            <div className="rounded-xl2 border border-mauve bg-mauve-pale/60 p-6">
              <h2 className="font-display text-2xl text-wine">This order was cancelled</h2>
              {order.adminNote ? <p className="mt-2 text-sm text-cocoa">{order.adminNote}</p> : null}
              <Link href={'/templates/' + order.template.slug} className="btn-ghost mt-5">
                Order it again
              </Link>
            </div>
          ) : (
            <div className="rounded-xl2 border border-sand bg-surface p-6 shadow-card">
              <h2 className="font-display text-2xl text-cocoa">Whenever you are ready</h2>
              <p className="mt-2 text-sm leading-relaxed text-brown">{settings.paymentInstructions}</p>

              <div className="mt-5 rounded-xl bg-sand-pale/80 p-4">
                <p className="eyebrow mb-2">Payment details</p>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-cocoa">
                  {settings.paymentDetails}
                </pre>
              </div>

              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-brown">Amount to send</dt>
                  <dd className="font-semibold text-cocoa">{price(order.amountCents).base}</dd>
                </div>
                {price(order.amountCents).converted ? (
                  <div className="flex justify-between">
                    <dt className="text-brown">In {country.currency}</dt>
                    <dd className="text-cocoa">{price(order.amountCents).converted}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt className="text-brown">Reference</dt>
                  <dd className="font-semibold text-cocoa">{order.publicId}</dd>
                </div>
              </dl>

              {settings.whatsapp ? (
                <a
                  href={
                    'https://wa.me/' +
                    settings.whatsapp.replace(/[^0-9]/g, '') +
                    '?text=' +
                    encodeURIComponent(
                      'Hi! I just paid for order ' + order.publicId + ' (' + order.template.title + ').',
                    )
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary mt-6 w-full"
                >
                  Send me a quick message
                </a>
              ) : settings.contactEmail ? (
                <a
                  href={'mailto:' + settings.contactEmail + '?subject=' + encodeURIComponent('Payment for order ' + order.publicId)}
                  className="btn-primary mt-6 w-full"
                >
                  Send me a quick message
                </a>
              ) : null}

              <p className="mt-4 rounded-lg bg-sand-pale px-3 py-2.5 text-xs leading-relaxed text-brown">
                Your download appears here once I confirm your payment. No rush.
              </p>
            </div>
          )}

          {order.buyerNote ? (
            <div className="card mt-6 p-5">
              <p className="eyebrow">Your note</p>
              <p className="mt-2 text-sm text-cocoa">{order.buyerNote}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
