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
    <div className="shader-playground boid-swarm">
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

      {/* ⭐ Tech note */}
      <details className="battle-city-tech" open>
        <summary>
          <span className="tech-icon">⚙</span>
          Tech behind this demo
        </summary>

        <div className="tech-grid">
          <div className="tech-item">
            <div className="tech-name">GPU Instancing</div>
            <div className="tech-desc">
              Up to <strong>100,000 boids in a single draw call</strong>.
              Each boid is one instance of a shared 3D mesh — no per-object
              GameObject overhead.
            </div>
          </div>

          <div className="tech-item">
            <div className="tech-name">Curl Noise</div>
            <div className="tech-desc">
              Divergence-free vector field computed per-vertex from 3D simplex
              noise. Produces organic fluid-like motion without any CPU
              particle simulation.
            </div>
          </div>

          <div className="tech-item">
            <div className="tech-name">Zero CPU per Boid</div>
            <div className="tech-desc">
              All animation runs in the <strong>vertex shader</strong>. CPU
              only updates a single <code>uTime</code> uniform per frame —
              the rest is GPU-parallel.
            </div>
          </div>

          <div className="tech-item">
            <div className="tech-name">GLTF Model Pipeline</div>
            <div className="tech-desc">
              Boids use a loaded <code>.glb</code> model with texture, normalized
              automatically (auto-scale + auto-center). Supports GLB/FBX
              interchangeably.
            </div>
          </div>

          <div className="tech-item">
            <div className="tech-name">Adaptive Mobile Scaling</div>
            <div className="tech-desc">
              Auto-detects mobile and caps boid count + pixel ratio. Desktop
              goes up to 100k; mobile caps at 10k to keep 50+ FPS on mid-range
              devices.
            </div>
          </div>

          <div className="tech-item">
            <div className="tech-name">Realtime FPS Counter</div>
            <div className="tech-desc">
              Live FPS overlay driven by game-loop timing. Every parameter
              change (count, speed, size) is measured against actual
              frame rate.
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}