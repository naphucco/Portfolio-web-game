// components/GameCard.tsx
import Link from 'next/link';
import type { GameMeta } from '@/data/games';

export default function GameCard({ slug, title, description, tags, art }: GameMeta) {
  return (
    <Link href={`/games/${slug}`} className="game-card">
      <div className="card-cover">
        <div className="card-art">{art}</div>
        <div className="card-overlay">
          <span className="play-indicator">▶ Play now</span>
        </div>
      </div>
      <div className="card-info">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="tags">
          {tags.map((t: string) => <span key={t} className="tag">{t}</span>)}
        </div>
      </div>
    </Link>
  );
}