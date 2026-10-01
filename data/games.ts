// data/games.ts
export type Engine = 'phaser' | 'three';

export interface GameMeta {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  art: string;          // fallback emoji
  cover: string;        // đường dẫn ảnh — rỗng = dùng art
  engine: Engine;
}

export const games: GameMeta[] = [
  {
    slug: 'battle-city-3d',
    title: 'Battle City 3D',
    description: 'Isometric 3D remake of the classic tank shooter. Drive, dodge, and protect your base from waves of enemy tanks.',
    tags: ['Three.js', '3D', 'Isometric', 'Action'],
    art: '⛨',
    cover: '/games/battle-city-3d.jpg',
    engine: 'three',
  },
  {
    slug: 'shader-playground',
    title: 'Shader Playground',
    description: 'Interactive 3D scene with custom GLSL toon, glow, outline, and wind shaders — tweak parameters in realtime.',
    tags: ['Three.js', 'GLSL', 'Shaders'],
    art: '◈',
    cover: '/games/shader-playground.jpg',
    engine: 'three',
  },
  {
    slug: 'arrow-puzzle',
    title: 'Arrow Out Puzzle',
    description: 'Tap arrows to send them flying off the grid. Every level is procedurally generated and guaranteed solvable.',
    tags: ['Phaser 3', 'Puzzle', 'Procedural'],
    art: '→',
    cover: '/games/arrow-puzzle.jpg',
    engine: 'phaser',
  },
  {
    slug: 'boid-swarm',
    title: 'Boid Swarm',
    description: 'Up to 100,000 GPU-instanced boids driven by curl noise in a single draw call — zero CPU per boid. (Capped at 10k on mobile for performance.)',
    tags: ['Three.js', 'GLSL', 'Instancing', 'GPU'],
    art: '⚡',
    cover: '/games/boid-swarm.jpg',
    engine: 'three',
  },
  {
    slug: 'flappy',
    title: 'Flappy Neon',
    description: 'Tap to fly and weave through the pillars. One button, infinite attempts.',
    tags: ['Phaser 3', 'One-button'],
    art: '◆',
    cover: '/games/flappy.jpg',
    engine: 'phaser',
  },
];

export function getGameBySlug(slug: string): GameMeta | undefined {
  return games.find((g) => g.slug === slug);
}