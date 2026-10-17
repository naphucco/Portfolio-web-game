'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Engine } from '@/data/games';

// Dynamic import — không SSR vì dùng canvas/window
const CanvasMemoryGrid = dynamic(
  () => import('@/components/CanvasMemoryGrid'),
  { ssr: false, loading: () => <div className="loading">Loading…</div> }
);

const PHASER_SCENES: Record<string, () => Promise<{ default: any }>> = {
  // flappy đã bỏ
};

const CANVAS_COMPONENTS: Record<string, React.ComponentType> = {
  'memory-grid': CanvasMemoryGrid,
};

type Props = { engine: Engine; slug: string };

export default function GameStage({ engine, slug }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const CanvasComp = useMemo(
    () => (engine === 'canvas' ? CANVAS_COMPONENTS[slug] : null),
    [engine, slug]
  );

  useEffect(() => {
    if (!playing || engine !== 'phaser') return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const Phaser = (await import('phaser')).default;
        const loader = PHASER_SCENES[slug];
        if (!loader) throw new Error(`No scene for slug: ${slug}`);
        const { default: Scene } = await loader();
        if (cancelled || !containerRef.current) return;

        const game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: containerRef.current,
          width: 640, height: 360,
          backgroundColor: '#0b0b16',
          scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
          scene: [Scene],
        });
        cleanupRef.current = () => game.destroy(true);
      } catch (err) {
        console.error('Failed to load game:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [playing, engine, slug]);

  return (
    <div className={`stage${engine === 'canvas' ? ' stage--canvas' : ''}`}>
      <div
        ref={containerRef}
        className={engine === 'canvas' ? 'canvas-container' : 'phaser-container'}
      >
        {playing && CanvasComp && <CanvasComp />}
      </div>

      {!playing && (
        <div className="cover" onClick={() => setPlaying(true)}>
          <div className="cover-art">▶</div>
          <button className="play-btn">Play now</button>
        </div>
      )}
      {/* loading, stop-btn giữ nguyên */}
    </div>
  );
}