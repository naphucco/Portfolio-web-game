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
    slug: 'dodge',
    title: 'Neon Dodge',
    description: 'Di chuyển né các khối năng lượng rơi xuống. Tốc độ tăng dần theo thời gian.',
    tags: ['Phaser 3', 'Survival'],
    art: '▲',
    engine: 'phaser',
  },
  {
    slug: 'flappy',
    title: 'Flappy Neon',
    description: 'Nhấn để bay, luồn qua các cột. Một nút, vô hạn lần thử.',
    tags: ['Phaser 3', 'One-button'],
    art: '◆',
    engine: 'phaser',
  },
  {
    slug: 'cube3d',
    title: 'Cube 3D',
    description: 'Khối 3D xoay, kéo chuột để thay đổi góc nhìn. Demo Three.js.',
    tags: ['Three.js', '3D'],
    art: '◼',
    engine: 'three',
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