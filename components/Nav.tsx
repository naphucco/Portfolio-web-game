// components/Nav.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Đóng menu khi đổi route
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Khóa scroll khi menu mở
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="logo">
          <span className="logo-dot" /> ANPHUC.DEV
        </Link>

        <ul className={`nav-links ${open ? 'open' : ''}`}>
          <li><Link href="/">About</Link></li>
          <li><Link href="/games">Games</Link></li>
          <li><Link href="/blog">Blog</Link></li>
        </ul>

        <button
          className="nav-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className={`nav-toggle-icon ${open ? 'open' : ''}`}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
    </nav>
  );
}