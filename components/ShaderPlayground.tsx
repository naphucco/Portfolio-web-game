// components/ShaderPlayground.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { ShaderHandle, ShaderMode, ShaderParams } from '@/games/shader-playground';

const DEFAULT_PARAMS: ShaderParams = {
  toonLevels: 6,
  glowIntensity: 0,
  outlineWidth: 0.02,
  windStrength: 0.1,
  hue: 180,
  softness: 0.5,
};

const CONTROLS: {
  key: keyof ShaderParams;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}[] = [
  { key: 'toonLevels',    label: 'Toon Levels', min: 2, max: 10,   step: 1,     format: (v) => v.toFixed(0) },
  { key: 'softness',      label: 'Softness',    min: 0, max: 1,    step: 0.05,  format: (v) => v.toFixed(2) },
  { key: 'glowIntensity', label: 'Glow',        min: 0, max: 2,    step: 0.05,  format: (v) => v.toFixed(2) },
  { key: 'outlineWidth',  label: 'Outline',     min: 0, max: 0.15, step: 0.005, format: (v) => v.toFixed(3) },
  { key: 'windStrength',  label: 'Wind',        min: 0, max: 1,    step: 0.05,  format: (v) => v.toFixed(2) },
  { key: 'hue',           label: 'Hue',         min: 0, max: 360,  step: 5,     format: (v) => `${v.toFixed(0)}°` },
];

export default function ShaderPlayground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<ShaderHandle | null>(null);
  const paramsRef = useRef<ShaderParams>(DEFAULT_PARAMS);
  const useTextureRef = useRef(true);

  const [params, setParams] = useState<ShaderParams>(DEFAULT_PARAMS);
  const [mode, setMode] = useState<ShaderMode>('model');
  const [useTexture, setUseTexture] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => { useTextureRef.current = useTexture; }, [useTexture]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      if (!containerRef.current) return;

      // Dọn instance cũ
      if (handleRef.current) {
        handleRef.current.destroy();
        handleRef.current = null;
      }

      try {
        const mod = await import('@/games/shader-playground');
        if (cancelled || !containerRef.current) return;

        const handle = await mod.initShaderPlayground(
          containerRef.current,
          DEFAULT_PARAMS,
          mode,
          useTextureRef.current
        );

        if (cancelled) {
          handle.destroy();
          return;
        }

        (Object.keys(paramsRef.current) as (keyof ShaderParams)[]).forEach((k) => {
          handle.setParam(k, paramsRef.current[k]);
        });
        if (mode === 'model') {
          handle.setUseTexture(useTextureRef.current);
        }

        handleRef.current = handle;
        setLoading(false);
      } catch (err) {
        console.error('Failed to init shader playground:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (handleRef.current) {
        handleRef.current.destroy();
        handleRef.current = null;
      }
    };
  }, [mode]);

  const updateParam = (key: keyof ShaderParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    handleRef.current?.setParam(key, value);
  };

  const reset = () => {
    setParams(DEFAULT_PARAMS);
    (Object.keys(DEFAULT_PARAMS) as (keyof ShaderParams)[]).forEach((k) => {
      handleRef.current?.setParam(k, DEFAULT_PARAMS[k]);
    });
    setUseTexture(true);
    handleRef.current?.setUseTexture(true);
  };

  const toggleTexture = () => {
    const next = !useTexture;
    setUseTexture(next);
    handleRef.current?.setUseTexture(next);
  };

  const changeMode = (next: ShaderMode) => {
    if (next === mode) return;
    setMode(next);
  };

  return (
    <div className="shader-playground">
      <div className="shader-viewport" ref={containerRef}>
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
          <h3>Shader Parameters</h3>
          <button className="reset-btn" onClick={reset}>Reset</button>
        </div>

        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'model' ? 'active' : ''}`}
            onClick={() => changeMode('model')}
          >
            Model
          </button>
          <button
            className={`mode-btn ${mode === 'procedural' ? 'active' : ''}`}
            onClick={() => changeMode('procedural')}
          >
            Procedural
          </button>
        </div>

        {CONTROLS.map((ctrl) => (
          <div className="slider-row" key={ctrl.key}>
            <div className="slider-label">
              <span>{ctrl.label}</span>
              <span className="slider-value">{ctrl.format(params[ctrl.key])}</span>
            </div>
            <input
              type="range"
              min={ctrl.min}
              max={ctrl.max}
              step={ctrl.step}
              value={params[ctrl.key]}
              onChange={(e) => updateParam(ctrl.key, parseFloat(e.target.value))}
            />
          </div>
        ))}

        {mode === 'model' && (
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={useTexture}
              onChange={toggleTexture}
              disabled={loading || !!error}
            />
            <span>Use texture</span>
          </label>
        )}
      </div>
    </div>
  );
}