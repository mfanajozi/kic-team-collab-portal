import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KIC Team Collab Portal',
  description: 'Internal collaboration tool for Kingdom International Consulting',
  icons: {
    icon: 'images/kic-favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
