// app/games/page.jsx
import GameCard from '@/components/GameCard';
import { games } from '@/data/games';

export default function GamesPage() {
  return (
    <main className="page-container">
      <p className="eyebrow">Tất cả demo</p>
      <h1>Games</h1>
      <p className="lead">
        Mỗi game chỉ tải engine khi bạn bấm chơi. Trang vẫn nhẹ và mở nhanh.
      </p>
      <div className="games-grid">
        {games.map((g) => <GameCard key={g.slug} {...g} />)}
      </div>
    </main>
  );
}