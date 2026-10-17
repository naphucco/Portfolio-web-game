// components/CanvasMemoryGrid.tsx
'use client';

import { useEffect, useRef } from 'react';
import { MemoryGrid } from '@/games/memory-grid';

export default function CanvasMemoryGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = new MemoryGrid(canvasRef.current);
    return () => game.destroy();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', borderRadius: 10, touchAction: 'none', cursor: 'pointer' }}
    />
  );
}