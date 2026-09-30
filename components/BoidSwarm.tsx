// components/BoidSwarm.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { BoidHandle, BoidParams } from '@/games/boids';

const DEFAULT_PARAMS: BoidParams = {
  count: 1000,
  speed: 1.0,
  swirl: 0.6,
  size: 1.5,
};

const MAX_COUNT_DESKTOP = 100000;
const MAX_COUNT_MOBILE = 10000;

export default function BoidSwarm() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<BoidHandle | null>(null);
  const [params, setParams] = useState<BoidParams>(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(60);
  const [isMobile, setIsMobile] = useState(false);

  function formatNumber(n: number): string {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Detect mobile
  useEffect(() => {
    const check = () => {
      const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || window.innerWidth < 768
        || ('ontouchstart' in window && window.innerWidth < 1024);
      setIsMobile(mobile);

      // Clamp count khi vượt max mới
      const maxAllowed = mobile ? MAX_COUNT_MOBILE : MAX_COUNT_DESKTOP;
      setParams((prev) => {
        if (prev.count > maxAllowed) {
          handleRef.current?.setParam('count', maxAllowed);
          return { ...prev, count: maxAllowed };
        }
        return prev;
      });
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Init swarm
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!containerRef.current) return;
      try {
        const mod = await import('@/games/boids');
        if (cancelled || !containerRef.current) return;

        const handle = await mod.initBoidSwarm(containerRef.current, DEFAULT_PARAMS);
        if (cancelled) {
          handle.destroy();
          return;
        }
        handleRef.current = handle;
        setLoading(false);

        const id = setInterval(() => {
          if (handleRef.current) setFps(handleRef.current.getFps());
        }, 500);

        return () => clearInterval(id);
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

  const apply = (patch: Partial<BoidParams>) => {
    const next = { ...params, ...patch };
    setParams(next);
    (Object.keys(patch) as (keyof BoidParams)[]).forEach((k) => {
      handleRef.current?.setParam(k, next[k]);
    });
  };

  const maxCount = isMobile ? MAX_COUNT_MOBILE : MAX_COUNT_DESKTOP;
  const sliderStep = isMobile ? 500 : 1000;

  return (
    <div className="shader-playground">
      <div className="shader-viewport" ref={containerRef}>
        {loading && (
          <div className="shader-loading">
            <span className="spinner" /> Loading boids…
          </div>
        )}
        {error && (
          <div className="shader-loading" style={{ color: '#ff2e88' }}>
            ⚠ {error}
          </div>
        )}
        {!loading && !error && (
          <div className="boid-fps">
            {formatNumber(params.count)} boids · {fps.toFixed(0)} FPS
          </div>
        )}
      </div>

      <div className="shader-controls">
        <div className="shader-controls-head">
          <h3>Swarm Parameters</h3>
          <button className="reset-btn" onClick={() => apply(DEFAULT_PARAMS)}>
            Reset
          </button>
        </div>

        <div className="slider-row">
          <div className="slider-label">
            <span>Boid Count</span>
            <span className="slider-value">{formatNumber(params.count)}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={maxCount}
            step={sliderStep}
            value={Math.min(params.count, maxCount)}
            onChange={(e) => apply({ count: parseInt(e.target.value) })}
          />
          {isMobile && (
            <p
              style={{
                fontSize: '0.7rem',
                color: 'var(--muted)',
                margin: '4px 0 0',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              Mobile limited to {formatNumber(MAX_COUNT_MOBILE)} for performance
            </p>
          )}
        </div>

        <div className="slider-row">
          <div className="slider-label">
            <span>Speed</span>
            <span className="slider-value">{params.speed.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={params.speed}
            onChange={(e) => apply({ speed: parseFloat(e.target.value) })}
          />
        </div>

        <div className="slider-row">
          <div className="slider-label">
            <span>Swirl</span>
            <span className="slider-value">{params.swirl.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={params.swirl}
            onChange={(e) => apply({ swirl: parseFloat(e.target.value) })}
          />
        </div>

        <div className="slider-row">
          <div className="slider-label">
            <span>Size</span>
            <span className="slider-value">{params.size.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={2}
            step={0.1}
            value={params.size}
            onChange={(e) => apply({ size: parseFloat(e.target.value) })}
          />
        </div>

        <div className="arrow-hint">
          🖱 Drag to rotate camera. GPU instancing + curl noise — zero CPU per boid.
        </div>
      </div>
    </div>
  );
}