import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import PasswordForm from '@/components/PasswordForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Account' };

export default async function AccountPage() {
  const user = await requireUser('/account');
  const [orders, owned] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.count({ where: { userId: user.id, status: 'PAID' } }),
  ]);

  return (
    <div className="container-x max-w-2xl py-16">
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 font-display text-5xl text-wine">{user.name}</h1>

      <div className="card mt-8 divide-y divide-sand/60">
        <div className="flex justify-between p-5 text-sm">
          <span className="text-brown">Email</span>
          <span className="text-cocoa">{user.email}</span>
        </div>
        <div className="flex justify-between p-5 text-sm">
          <span className="text-brown">Member since</span>
          <span className="text-cocoa">{formatDate(user.createdAt)}</span>
        </div>
        <div className="flex justify-between p-5 text-sm">
          <span className="text-brown">Orders</span>
          <span className="text-cocoa">
            {orders} total · {owned} in library
          </span>
        </div>
      </div>

      <div className="mt-8">
        <PasswordForm />
      </div>

      <Link href="/library" className="btn-ghost mt-8">Go to my library</Link>
    </div>
  );
}
