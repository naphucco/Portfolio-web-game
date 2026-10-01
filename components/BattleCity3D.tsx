// components/BattleCity3D.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { BattleCityHandle, BattleCityParams } from '@/games/battle-city-3d';

const DEFAULT_PARAMS: BattleCityParams = {
  moveSpeed: 4.5,
};

const PLAYER_MAX_HP = 4;
const MAX_ENEMIES = 7;

export default function BattleCity3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<BattleCityHandle | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [enemyAlive, setEnemyAlive] = useState(0);
  const [enemyTotal, setEnemyTotal] = useState(MAX_ENEMIES);
  const [gameOver, setGameOver] = useState<'win' | 'lose' | null>(null);
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPlayerHp(PLAYER_MAX_HP);
    setEnemyAlive(0);
    setEnemyTotal(MAX_ENEMIES);
    setGameOver(null);

    (async () => {
      if (!containerRef.current) return;
      try {
        const mod = await import('@/games/battle-city-3d');
        if (cancelled || !containerRef.current) return;

        const { ready } = mod.initBattleCity(
          containerRef.current,
          DEFAULT_PARAMS,
          {
            onPlayerHpChange: (hp) => setPlayerHp(hp),
            onEnemyCountChange: (alive, total) => {
              setEnemyAlive(alive);
              setEnemyTotal(total);
            },
            onGameOver: (win) => setGameOver(win ? 'win' : 'lose'),
          }
        );

        const handle = await ready;
        if (cancelled) { handle.destroy(); return; }
        handleRef.current = handle;
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [restartKey]);

  const restart = () => setRestartKey((k) => k + 1);

  return (
    <div className="battle-city">
      <div className="battle-city-viewport" ref={containerRef}>
        {loading && (
          <div className="shader-loading">
            <span className="spinner" /> Loading tank…
          </div>
        )}
        {error && (
          <div className="shader-loading" style={{ color: '#ff2e88' }}>
            ⚠ {error}
          </div>
        )}

        {!loading && !error && (
          <div className="battle-city-hud">
            <div className="hud-hp">
              {Array.from({ length: PLAYER_MAX_HP }).map((_, i) => (
                <span key={i} className={`hp-heart ${i < playerHp ? 'full' : 'empty'}`}>
                  ♥
                </span>
              ))}
            </div>
            <div className="hud-enemies">
              <span className="hud-label">Enemies</span>
              <span className="hud-value">
                {enemyTotal - enemyAlive} / {enemyTotal}
              </span>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="battle-city-gameover">
            <div className={`gameover-title ${gameOver}`}>
              {gameOver === 'win' ? 'VICTORY' : 'GAME OVER'}
            </div>
            <div className="gameover-sub">
              {gameOver === 'win'
                ? 'You destroyed all enemy tanks.'
                : 'Your tank was destroyed.'}
            </div>
            <button className="btn btn-primary" onClick={restart}>
              ↻ Play Again
            </button>
          </div>
        )}
      </div>

      <div className="battle-city-hint">
        <span className="hint-item">
          <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
          <span className="hint-label">Move</span>
        </span>
        <span className="hint-sep">·</span>
        <span className="hint-item">
          <kbd>SPACE</kbd>
          <span className="hint-label">Fire</span>
        </span>
      </div>

      {/* ⭐ Tech note — dạng details để gọn */}
      <details className="battle-city-tech" open>
        <summary>
          <span className="tech-icon">⚙</span>
          Tech behind this demo
        </summary>

        <div className="tech-grid">
          <div className="tech-item">
            <div className="tech-name">A* Pathfinding</div>
            <div className="tech-desc">
              Enemy tanks use BFS/A* on a 13×13 grid to route toward the player.
              Paths recompute automatically when walls are destroyed.
            </div>
          </div>

          <div className="tech-item">
            <div className="tech-name">Dynamic Grid</div>
            <div className="tech-desc">
              Wall grid updates in realtime. Every destroyed brick bumps a
              <code>wallVersion</code> counter, triggering enemy path recomputation.
            </div>
          </div>

          <div className="tech-item">
            <div className="tech-name">Enemy AI</div>
            <div className="tech-desc">
              Mix of direct pathing (chase) + randomized fire timer (2.5–5s).
              Enemies also fire at the player when line-of-sight is clear.
            </div>
          </div>

          <div className="tech-item">
            <div className="tech-name">Line-of-Sight Raycast</div>
            <div className="tech-desc">
              Row/column raycast checks for walls between enemy and player before firing.
            </div>
          </div>

          <div className="tech-item">
            <div className="tech-name">Object Pooling</div>
            <div className="tech-desc">
              Bullets, walls and enemies use pooled instances — no runtime allocations
              during play, no GC spikes.
            </div>
          </div>

          <div className="tech-item">
            <div className="tech-name">3D Model Assembly</div>
            <div className="tech-desc">
              Tanks composed from 3 FBX parts (body + turret + gun). Turret rotates
              independently for future aiming mechanics.
            </div>
          </div>

          <div className="tech-item">
            <div className="tech-name">Isometric Camera</div>
            <div className="tech-desc">
              World group rotated to keep grid aligned with screen. Smooth camera
              follow with exponential lerp.
            </div>
          </div>

          <div className="tech-item">
            <div className="tech-name">Event Callbacks</div>
            <div className="tech-desc">
              React UI subscribes to game events (HP, enemy count, game over) —
              clean separation between Three.js engine and React shell.
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}