// app/games/page.tsx
import GameCard from '@/components/GameCard';
import { games } from '@/data/games';

export default function GamesPage() {
  return (
    <main className="page-container">
      <p className="eyebrow">All demos</p>
      <h1>Games</h1>
      <p className="lead">
        Each game only loads its engine when you hit play. The page stays light and opens fast.
      </p>
      <div className="games-grid">
        {games.map((g) => <GameCard key={g.slug} {...g} />)}
      </div>
    </main>
  );
}