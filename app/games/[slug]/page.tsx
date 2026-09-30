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
      <Link href="/games" className="back-link">← All games</Link>

      <header className="game-header">
        <h1>{game.title}</h1>
        <p className="lead">{game.description}</p>
        <div className="game-tags">
          {game.tags.map((t) => <span key={t} className="tag">{t}</span>)}
        </div>
      </header>

      <GameStageClient engine={game.engine} slug={game.slug} />

      <div className="game-hint">
        {game.slug === 'shader-playground' && '🖱 Drag to rotate · Sliders on the right to tweak shaders'}
        {game.slug === 'flappy' && '⌨ SPACE / Click to flap'}
        {game.slug === 'tower-defense' && '🖱 Click to place towers · SPACE to start wave'}
        {game.slug === 'proc-gen' && '🖱 Adjust sliders · Click Regenerate for a new map'}
        {game.slug === 'arrow-puzzle' && '🖱 Tap an arrow · Clear all arrows to win'}
      </div>
    </main>
  );
}