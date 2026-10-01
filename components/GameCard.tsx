// components/GameCard.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { GameMeta } from '@/data/games';

export default function GameCard({
  slug,
  title,
  description,
  tags,
  art,
  cover,
}: GameMeta) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link href={`/games/${slug}`} className="game-card">
      <div className="card-cover">
        {cover && !imgError ? (
          <img
            src={cover}
            alt={title}
            className="card-cover-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="card-art">{art}</div>
        )}
        <div className="card-overlay">
          <span className="play-indicator">▶ Play now</span>
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