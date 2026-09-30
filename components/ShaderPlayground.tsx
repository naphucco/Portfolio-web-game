// components/ShaderPlayground.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { ShaderHandle, ShaderParams } from '@/games/shader-playground';

const DEFAULT_PARAMS: ShaderParams = {
  toonLevels: 4,
  glowIntensity: 0.6,
  outlineWidth: 0.04,
  windStrength: 0.2,
  hue: 180,
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
  { key: 'glowIntensity', label: 'Glow',        min: 0, max: 2,    step: 0.05,  format: (v) => v.toFixed(2) },
  { key: 'outlineWidth',  label: 'Outline',     min: 0, max: 0.15, step: 0.005, format: (v) => v.toFixed(3) },
  { key: 'windStrength',  label: 'Wind',        min: 0, max: 1,    step: 0.05,  format: (v) => v.toFixed(2) },
  { key: 'hue',           label: 'Hue',         min: 0, max: 360,  step: 5,     format: (v) => `${v.toFixed(0)}°` },
];

export default function ShaderPlayground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<ShaderHandle | null>(null);
  const [params, setParams] = useState<ShaderParams>(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!containerRef.current) return;
      const mod = await import('@/games/shader-playground');
      if (cancelled || !containerRef.current) return;

      handleRef.current = mod.initShaderPlayground(containerRef.current, DEFAULT_PARAMS);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  const updateParam = (key: keyof ShaderParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    handleRef.current?.setParam(key, value);
  };

  const reset = () => {
    setParams(DEFAULT_PARAMS);
    (Object.keys(DEFAULT_PARAMS) as (keyof ShaderParams)[]).forEach((k) => {
      handleRef.current?.setParam(k, DEFAULT_PARAMS[k]);
    });
  };

  return (
    <div className="shader-playground">
      <div className="shader-viewport" ref={containerRef}>
        {loading && (
          <div className="shader-loading">
            <span className="spinner" /> Loading shader…
          </div>
        )}
      </div>

      <div className="shader-controls">
        <div className="shader-controls-head">
          <h3>Shader Parameters</h3>
          <button className="reset-btn" onClick={reset}>Reset</button>
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
      </div>
    </div>
  );
}