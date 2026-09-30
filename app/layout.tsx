// app/layout.tsx
import type { ReactNode } from 'react';
import Nav from '@/components/Nav';
import './globals.css';

export const metadata = {
  title: 'Nguyen An Phuc — Game Developer',
  description: 'Portfolio game developer: Unity, Cocos, Phaser, Three.js.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}