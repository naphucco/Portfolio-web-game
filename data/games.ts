// data/games.ts
export type Engine = 'phaser' | 'three';

export interface GameMeta {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  art: string;
  engine: Engine;
}

export const games: GameMeta[] = [
  {
    slug: 'shader-playground',
    title: 'Shader Playground',
    description: 'Interactive 3D scene with custom GLSL toon, glow, outline, and wind shaders — tweak parameters in realtime.',
    tags: ['Three.js', 'GLSL', 'Shaders'],
    art: '◈',
    engine: 'three',
  },
  {
    slug: 'arrow-puzzle',
    title: 'Arrow Out Puzzle',
    description: 'Tap arrows to send them flying off the grid. Every level is procedurally generated and guaranteed solvable.',
    tags: ['Phaser 3', 'Puzzle', 'Procedural'],
    art: '→',
    engine: 'phaser',
  },
  {
    slug: 'flappy',
    title: 'Flappy Neon',
    description: 'Tap to fly and weave through the pillars. One button, infinite attempts.',
    tags: ['Phaser 3', 'One-button'],
    art: '◆',
    engine: 'phaser',
  },
  {
    slug: 'boid-swarm',
    title: 'Boid Swarm',
    description: 'Up to 100,000 GPU-instanced boids driven by curl noise in a single draw call — zero CPU per boid. (Capped at 5k on mobile for performance.)',
    tags: ['Three.js', 'GLSL', 'Instancing', 'GPU'],
    art: '⚡',
    engine: 'three',
  },
];

export function getGameBySlug(slug: string): GameMeta | undefined {
  return games.find((g) => g.slug === slug);
}