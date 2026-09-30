// app/page.jsx
import Link from 'next/link';
import GameCard from '@/components/GameCard';
import { games } from '@/data/games';

export default function Home() {
  const featured = games.slice(0, 3);
  return (
    <main className="page-container">
      <section className="hero">
        <p className="eyebrow">Game Developer · Unity / C# / WebGL</p>
        <h1>
          Mình tạo ra <span className="grad">trải nghiệm chơi được</span><br />
          ngay trên trình duyệt.
        </h1>
        <p className="lead">
          Xin chào, mình là <strong>Nguyen An Phuc</strong> — 10 năm lập trình,
          5 năm làm game. Dưới đây là vài demo chạy trực tiếp, không cần cài đặt.
        </p>
        <div className="cta-row">
          <Link href="/games" className="btn btn-primary">▶ Xem tất cả demo</Link>
          <Link href="/about" className="btn btn-ghost">Liên hệ hợp tác</Link>
        </div>
      </section>

      <section className="games-section">
        <p className="eyebrow">Playable demo</p>
        <h2>Chơi thử — không cần cài đặt.</h2>
        <div className="games-grid">
          {featured.map((g) => <GameCard key={g.slug} {...g} />)}
        </div>
        <div style={{ marginTop: 24 }}>
          <Link href="/games" className="btn btn-ghost">Xem tất cả →</Link>
        </div>
      </section>
    </main>
  );
}