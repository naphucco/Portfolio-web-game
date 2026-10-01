// components/BattleCity3D.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { BattleCityHandle, BattleCityParams } from '@/games/battle-city-3d';

const DEFAULT_PARAMS: BattleCityParams = {
  moveSpeed: 4.5,
};

export default function BattleCity3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<BattleCityHandle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!containerRef.current) return;
      try {
        const mod = await import('@/games/battle-city-3d');
        if (cancelled || !containerRef.current) return;

        const { ready } = mod.initBattleCity(containerRef.current, DEFAULT_PARAMS);
        const handle = await ready;

        if (cancelled) {
          handle.destroy();
          return;
        }
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
  }, []);

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
      </div>

      <div className="battle-city-hint">
        <span className="hint-item">
          <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd>
          <span className="hint-label">Move</span>
        </span>
        <span className="hint-sep">·</span>
        <span className="hint-item">
          <kbd>SPACE</kbd>
          <span className="hint-label">Fire</span>
        </span>
      </div>
    </div>
  );
}