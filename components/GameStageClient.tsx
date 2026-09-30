// components/GameStageClient.tsx
'use client';

import dynamic from 'next/dynamic';
import type { Engine } from '@/data/games';

const GameStage = dynamic(() => import('@/components/GameStage'), {
  ssr: false,
  loading: () => <div className="stage-loading">Đang tải…</div>,
});

export default function GameStageClient({
  engine,
  slug,
}: {
  engine: Engine;
  slug: string;
}) {
  return <GameStage engine={engine} slug={slug} />;
}