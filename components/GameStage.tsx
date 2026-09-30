// components/GameStage.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { Engine } from '@/data/games';

type Props = {
  engine: Engine;
  slug: string;
};

const PHASER_SCENES: Record<string, () => Promise<{ default: any }>> = {
  flappy: () => import('@/games/flappy').then((m) => ({ default: m.FlappyScene })),
};

export default function GameStage({ engine, slug }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!playing) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        if (engine === 'phaser') {
          const Phaser = (await import('phaser')).default;
          const SceneLoader = PHASER_SCENES[slug];
          if (!SceneLoader) throw new Error(`No scene for slug: ${slug}`);

          const { default: Scene } = await SceneLoader();
          if (cancelled || !containerRef.current) return;

          const game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: 640,
            height: 360,
            backgroundColor: '#0b0b16',
            scale: {
              mode: Phaser.Scale.FIT,
              autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            scene: [Scene],
          });

          cleanupRef.current = () => game.destroy(true);
        }
      } catch (err) {
        console.error('Failed to load game:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [playing, engine, slug]);

  return (
    <div className="stage">
      <div ref={containerRef} className="phaser-container" />

      {!playing && (
        <div className="cover" onClick={() => setPlaying(true)}>
          <div className="cover-art">▶</div>
          <button className="play-btn">Play now</button>
        </div>
      )}

      {loading && (
        <div className="loading">
          <span className="spinner" /> Loading engine…
        </div>
      )}

      {playing && (
        <button
          className="stop-btn"
          onClick={() => setPlaying(false)}
          title="Stop"
        >
          ✕
        </button>
      )}
    </div>
  );
}