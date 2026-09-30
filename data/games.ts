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
    slug: 'flappy',
    title: 'Flappy Neon',
    description: 'Tap to fly and weave through the pillars. One button, infinite attempts.',
    tags: ['Phaser 3', 'One-button'],
    art: '◆',
    engine: 'phaser',
  },
  {
    slug: 'shader-playground',
    title: 'Shader Playground',
    description: 'Interactive 3D scene with custom GLSL toon, glow, outline, and wind shaders — tweak parameters in realtime.',
    tags: ['Three.js', 'GLSL', 'Shaders'],
    art: '◈',
    engine: 'three',
  },
];

export function getGameBySlug(slug: string): GameMeta | undefined {
  return games.find((g) => g.slug === slug);
}