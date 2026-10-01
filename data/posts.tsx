// data/posts.ts
import type { ComponentType } from 'react';
import GameOptimizationContent from '@/content/blog/game-optimization';
import PlaceholderContent from '@/content/blog/placeholder';
import MobileRtsOptimizationContent from '@/content/blog/mobile-rts-optimization';

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  cover: string;
  Content: ComponentType;
};

export const posts: Post[] = [
  {
    slug: 'game-optimization',
    title: "Game Performance Optimization: You Don't Need Complex Models",
    excerpt:
      'Sprite Sheets, Billboarding, and Particle Systems — 3 simple techniques to keep mobile games at 60 FPS while still looking great.',
    date: '2026-01-15',
    tags: ['Optimization', 'Mobile', 'VFX'],
    cover: '/blog/game-optimization1.jpg',
    Content: GameOptimizationContent,
  },
  {
    slug: 'mobile-rts-optimization',
    title: 'Mobile RTS Optimization: 90 FPS on a Mid-Range Phone',
    excerpt:
      'GPU wind, baked lighting, blob shadows, and rim-light shaders — the four techniques that took a mobile RTS from "it works" to a stable 90 FPS on a Galaxy A16.',
    date: '2026-02-10',
    tags: ['Optimization', 'Shader', 'Mobile', 'RTS'],
    cover: '/blog/mobile-rts-optimization1.jpg',
    Content: MobileRtsOptimizationContent,
  },
  {
    slug: 'placeholder',
    title: 'Coming Soon',
    excerpt: 'Content is being prepared. Check back later!',
    date: '2026-02-01',
    tags: ['Coming soon'],
    cover: '/blog/placeholder.jpg',
    Content: PlaceholderContent,
  },
];

export function getPostBySlug(slug: string) {
  return posts.find((p) => p.slug === slug);
}