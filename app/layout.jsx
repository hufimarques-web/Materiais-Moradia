import './globals.css';
export const metadata = {
  applicationName: 'Materiais',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Materiais', statusBarStyle: 'black-translucent' },
  other: { 'mobile-web-app-capable': 'yes', 'apple-mobile-web-app-capable': 'yes' },
  title: 'Domaine XXV — Atelier de materiais',
  icons: { icon: '/icon.svg', apple: '/icons/apple-touch-icon.png' },
  description: 'Explore a cozinha e a casa de banho em 360° e personalize os acabamentos da sua moradia. Três ambientes, à sua medida.',
};
export const viewport = {width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#f5f3ee'};
export default function RootLayout({children}) { return <html lang="pt"><body>{children}</body></html>; }
