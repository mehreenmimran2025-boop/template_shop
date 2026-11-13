'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/settings', label: 'Store settings' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:w-52 lg:shrink-0">
      <ul className="flex gap-2 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:overflow-visible">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={
                  'block whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition ' +
                  (active
                    ? 'bg-wine font-medium text-sand-light'
                    : 'text-cocoa hover:bg-sand-pale')
                }
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
