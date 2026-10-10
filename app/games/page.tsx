// app/games/page.tsx
import Image from 'next/image';
import GameCard from '@/components/GameCard';
import { games } from '@/data/games';
import YouTubeEmbed from '@/components/YouTubeEmbed';

export default function GamesPage() {
  return (
    <main className="page-container">
      {/* ===== MY GAMES ===== */}
      <h1 className="section-title">Gameplay Videos</h1>
      <p className="lead">
        Four casual mobile games built and shipped during 2024–2025.
        All titles were published to the store and have since been delisted —
        the gameplay videos below are the surviving record.
      </p>

      <div className="videos-grid">
        <div className="video-card">
          <div className="video-embed">
            <YouTubeEmbed videoId="fR8jzLLAoPA" title="Bullet Striker Hyper" />
          </div>
          <div className="video-info">
            <h3>Bullet Striker Hyper</h3>
            <p>Action · Unity · Shooter game with a cover system</p>
          </div>
        </div>

        <div className="video-card">
          <div className="video-embed">
            <YouTubeEmbed videoId="Xfk6lLR0SMM" title="Tactics Core" />
          </div>
          <div className="video-info">
            <h3>Tactics Core</h3>
            <p>Strategy · Unity · Tactical top-down tank shooter game</p>
          </div>
        </div>

        <div className="video-card">
          <div className="video-embed">
            <YouTubeEmbed videoId="BR1siK1choY" title="Galactic Survival" />
          </div>
          <div className="video-info">
            <h3>Galactic Survival</h3>
            <p>Strategy · Unity · Wave-based space survival</p>
          </div>
        </div>

        <div className="video-card">
          <div className="video-embed">
            <YouTubeEmbed videoId="bkJpo61N-go" title="Fourth Game" />
          </div>
          <div className="video-info">
            <h3>Fourth Game Title</h3>
            <p>Casual · Unity · Strategy game with merge mechanics</p>
          </div>
        </div>
      </div>

      {/* ===== OTHER PROJECTS ===== */}
      <section className="about-section" style={{ marginTop: 64 }}>
        <h2 className="section-title">Other Projects</h2>

        <div className="projects-grid">
          <article className="project-card">
            <div className="project-cover">
              <Image
                src="/about/project-monsters-war.gif"
                alt="Monsters War"
                width={600}
                height={340}
              />
            </div>
            <div className="project-info">
              <h3>Monsters War</h3>
              <p>Mobile Strategy · Unity · Millions of downloads on Google Play</p>
            </div>
          </article>

          <article className="project-card">
            <div className="project-cover">
              <Image
                src="/about/project-card-game.png"
                alt="Online Realtime Card Game"
                width={600}
                height={340}
              />
            </div>
            <div className="project-info">
              <h3>Online Realtime Card Game</h3>
              <p>Multiplayer · Cocos Creator 2 + Pomelo · Realtime state sync</p>
            </div>
          </article>

          <article className="project-card">
            <div className="project-cover">
              <Image
                src="/about/project-3d-app.jpg"
                alt="Interactive 3D App"
                width={600}
                height={340}
              />
            </div>
            <div className="project-info">
              <h3>Interactive 3D Mobile App</h3>
              <p>Unity3D · Complex UI · Smooth 3D model interaction</p>
            </div>
          </article>
        </div>
      </section>

      {/* ===== DEMOS ===== */}
      <section className="about-section" style={{ marginTop: 64 }}>
        <h2 className="section-title">Demos</h2>
        <p className="lead" style={{ marginBottom: 24 }}>
          Each game only loads its engine when you hit play. The page stays light and opens fast.
        </p>
        <div className="games-grid">
          {games.map((g) => <GameCard key={g.slug} {...g} />)}
        </div>
      </section>
    </main>
  );
}