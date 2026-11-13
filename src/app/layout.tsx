import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { getSettings } from '@/lib/settings';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: {
      default: settings.storeName + ' — ' + settings.tagline,
      template: '%s · ' + settings.storeName,
    },
    description: settings.heroSub,
  };
}

const themeScript = `
  (function(){
    try{
      var t=localStorage.getItem('theme');
      var d=window.matchMedia('(prefers-color-scheme: dark)').matches;
      if(t==='dark'||(t===null&&d))document.documentElement.classList.add('dark');
    }catch(e){}
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable + ' ' + sans.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
