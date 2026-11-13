import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { formatDateTime } from '@/lib/format';
import MessageActions from '@/components/MessageActions';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage({ searchParams }: { searchParams: { show?: string } }) {
  await requireAdmin();
  const showAll = searchParams.show === 'all';

  const [settings, messages, unread] = await Promise.all([
    getSettings(),
    prisma.message.findMany({
      where: showAll ? {} : { handled: false },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.message.count({ where: { handled: false } }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-wine">Messages</h1>
          <p className="mt-2 text-sm text-brown">
            {unread === 0 ? 'Nothing new right now.' : unread + ' waiting for a reply.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/messages" className={showAll ? 'btn-ghost btn-sm' : 'btn-primary btn-sm'}>
            New
          </Link>
          <Link href="/admin/messages?show=all" className={showAll ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}>
            All
          </Link>
        </div>
      </div>

      {!settings.inboxEmail && !settings.contactEmail ? (
        <p className="mt-6 rounded-xl border border-mauve bg-mauve-pale/60 px-4 py-3 text-sm text-wine">
          Add your email in{' '}
          <Link href="/admin/settings" className="link-underline">Store settings</Link> so the Reply button opens your
          mail app with the right address.
        </p>
      ) : null}

      {messages.length === 0 ? (
        <div className="card mt-8 p-12 text-center text-sm text-brown">
          {showAll ? 'No messages yet.' : 'No new messages.'}
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {messages.map((message) => {
            const subject = 'Re: your message to ' + settings.storeName;
            const mailto =
              'mailto:' +
              message.email +
              '?subject=' +
              encodeURIComponent(subject) +
              '&body=' +
              encodeURIComponent('\n\n— — —\nYou wrote:\n' + message.body);

            return (
              <div key={message.id} className={'card p-5 ' + (message.handled ? 'opacity-70' : '')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-cocoa">
                      {message.name}{' '}
                      <a href={'mailto:' + message.email} className="text-sm font-normal text-brown hover:text-wine">
                        {message.email}
                      </a>
                    </p>
                    <p className="mt-0.5 text-xs text-brown">
                      {formatDateTime(message.createdAt)}
                      {message.page ? ' · from ' + message.page : ''}
                      {message.userId ? ' · has an account' : ''}
                    </p>
                  </div>
                  {message.handled ? <span className="badge-paid">Done</span> : <span className="badge-pending">New</span>}
                </div>

                <p className="mt-4 whitespace-pre-wrap rounded-xl bg-sand-pale/70 px-4 py-3 text-sm leading-relaxed text-cocoa">
                  {message.body}
                </p>

                <div className="mt-4">
                  <MessageActions id={message.id} handled={message.handled} mailto={mailto} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
