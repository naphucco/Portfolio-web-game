// components/ArrowPuzzle.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { ArrowPuzzleHandle, ArrowPuzzleParams } from '@/games/arrow-puzzle';

const DEFAULT_PARAMS: ArrowPuzzleParams = {
  cols: 12,
  rows: 9,
  arrowCount: 20,
  seed: 1,
};

export default function ArrowPuzzle() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<ArrowPuzzleHandle | null>(null);

  const [params, setParams] = useState<ArrowPuzzleParams>(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!containerRef.current) return;
      try {
        const mod = await import('@/games/arrow-puzzle');
        if (cancelled || !containerRef.current) return;

        handleRef.current = mod.initArrowPuzzle(containerRef.current, DEFAULT_PARAMS);
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
  }, []);

  const applyParams = (next: ArrowPuzzleParams) => {
    setParams(next);
    handleRef.current?.setParams(next);
  };

  const updateArrowCount = (value: number) =>
    applyParams({ ...params, arrowCount: value });

  const updateSeed = (value: number) =>
    applyParams({ ...params, seed: value });

  const newRandom = () =>
    applyParams({ ...params, seed: Math.floor(Math.random() * 99999) + 1 });

  const restart = () => handleRef.current?.setParams(params);

  return (
    <div className="arrow-puzzle">
      <div className="arrow-viewport" ref={containerRef}>
        {loading && (
          <div className="shader-loading">
            <span className="spinner" /> Loading…
          </div>
        )}
        {error && (
          <div className="shader-loading" style={{ color: '#ff2e88' }}>
            ⚠ {error}
          </div>
        )}
      </div>

      <div className="shader-controls">
        <div className="shader-controls-head">
          <h3>Puzzle Settings</h3>
          <button className="reset-btn" onClick={restart}>Restart</button>
        </div>

        <div className="slider-row">
          <div className="slider-label">
            <span>Arrows</span>
            <span className="slider-value">{params.arrowCount}</span>
          </div>
          <input
            type="range"
            min={8}
            max={40}
            step={1}
            value={params.arrowCount}
            onChange={(e) => updateArrowCount(parseInt(e.target.value))}
          />
        </div>

        <div className="slider-row">
          <div className="slider-label">
            <span>Seed</span>
            <span className="slider-value">{params.seed}</span>
          </div>
          <input
            type="range"
            min={1}
            max={9999}
            step={1}
            value={params.seed}
            onChange={(e) => updateSeed(parseInt(e.target.value))}
          />
        </div>

        <button className="play-btn" style={{ marginTop: 8 }} onClick={newRandom}>
          🎲 New Puzzle
        </button>

        <div className="arrow-hint">
          Tap an arrow to send it flying like a snake.
          <br />
          <span style={{ color: 'var(--muted)' }}>
            Its path must be clear in the arrow's direction.
          </span>
        </div>
      </div>
    </div>
  );
}