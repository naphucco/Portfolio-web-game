// components/Nav.jsx
import Link from 'next/link';

export default function Nav() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="logo">
          <span className="logo-dot" /> ANPHUC.DEV
        </Link>
        <ul className="nav-links">
          <li><Link href="/about">Giới thiệu</Link></li>
          <li><Link href="/games">Games</Link></li>
          <li><Link href="/blog">Blog</Link></li>
        </ul>
      </div>
    </nav>
  );
}