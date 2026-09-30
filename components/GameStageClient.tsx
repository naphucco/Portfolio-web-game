// components/GameStageClient.tsx
'use client';

import dynamic from 'next/dynamic';
import ShaderPlayground from '@/components/ShaderPlayground';
import ArrowPuzzle from '@/components/ArrowPuzzle';
import type { Engine } from '@/data/games';

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
  if (slug === 'shader-playground') return <ShaderPlayground />;
  if (slug === 'arrow-puzzle') return <ArrowPuzzle />;
  return <GameStage engine={engine} slug={slug} />;
}