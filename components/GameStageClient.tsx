// components/GameStageClient.tsx
'use client';

import dynamic from 'next/dynamic';
import ShaderPlayground from '@/components/ShaderPlayground';
import type { Engine } from '@/data/games';

// Chỉ GameStage cần dynamic vì nó import Phaser ở top-level
const GameStage = dynamic(() => import('@/components/GameStage'), {
  ssr: false,
  loading: () => <div className="stage-loading">Loading…</div>,
});

export default function GameStageClient({
  engine,
  slug,
}: {
  engine: Engine;
  slug: string;
}) {
  if (slug === 'shader-playground') {
    return <ShaderPlayground />;
  }
  return <GameStage engine={engine} slug={slug} />;
}