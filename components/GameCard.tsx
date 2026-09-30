// components/GameCard.jsx
import Link from 'next/link';

export default function GameCard({ slug, title, description, tags, art }) {
  return (
    <Link href={`/games/${slug}`} className="game-card">
      <div className="card-cover">
        <div className="card-art">{art}</div>
        <div className="card-overlay">
          <span className="play-indicator">▶ Chơi ngay</span>
        </div>
      </div>
      <div className="card-info">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="tags">
          {tags.map((t) => <span key={t} className="tag">{t}</span>)}
        </div>
      </div>
    </Link>
  );
}