'use client';

import dynamic from 'next/dynamic';
import ShaderPlayground from '@/components/ShaderPlayground';
import ArrowPuzzle from '@/components/ArrowPuzzle';
import BoidSwarm from '@/components/BoidSwarm';
import BattleCity3D from '@/components/BattleCity3D';
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
  if (slug === 'boid-swarm') return <BoidSwarm />;
  if (slug === 'battle-city-3d') return <BattleCity3D />;
  return <GameStage engine={engine} slug={slug} />;
}