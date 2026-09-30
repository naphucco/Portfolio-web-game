// app/games/[slug]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import GameStageClient from '@/components/GameStageClient';
import { games, getGameBySlug } from '@/data/games';

export function generateStaticParams() {
  return games.map((g) => ({ slug: g.slug }));
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return notFound();

  return (
    <main className="page-container">
      <Link href="/games" className="back-link">← Tất cả game</Link>

      <header className="game-header">
        <h1>{game.title}</h1>
        <p className="lead">{game.description}</p>
        <div className="game-tags">
          {game.tags.map((t) => <span key={t} className="tag">{t}</span>)}
        </div>
      </header>

      {/* Dùng wrapper client */}
      <GameStageClient engine={game.engine} slug={game.slug} />

      <div className="game-hint">
        {game.slug === 'dodge' && '⌨ ← → hoặc A/D · SPACE để chơi lại'}
        {game.slug === 'flappy' && '⌨ SPACE / Click để bay'}
        {game.slug === 'cube3d' && '🖱 Kéo chuột để xoay khối'}
      </div>
    </main>
  );
}