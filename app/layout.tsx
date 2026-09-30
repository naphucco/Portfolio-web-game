// app/layout.jsx
import Nav from '@/components/Nav';
import './globals.css';

export const metadata = {
  title: 'Nguyen An Phuc — Game Developer',
  description: 'Portfolio game developer: Unity, Cocos, Phaser, Three.js.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}