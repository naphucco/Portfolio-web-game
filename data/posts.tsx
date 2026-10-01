// data/posts.ts
import type { ComponentType } from 'react';
import GameOptimizationContent from '@/content/blog/game-optimization';
import MobileRtsOptimizationContent from '@/content/blog/mobile-rts-optimization';
import AngularSignalsZonelessContent from '@/content/blog/angular-signals-zoneless';
import UdemyLearningContent from '@/content/blog/udemy-learning';

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
    slug: 'angular-signals-zoneless',
    title: 'Zone.js vs Signals: Why Angular Needed a New Reactivity Model',
    excerpt:
      'A failed interview question taught me how Zone.js silently taxed every Angular app — and how Signals solve it with surgical, zoneless updates.',
    date: '2025-11-20',
    tags: ['Angular', 'Signals', 'Performance'],
    cover: '/blog/angular-signals-zoneless.jpg',
    Content: AngularSignalsZonelessContent,
  },
  {
    slug: 'udemy-learning',
    title: 'Why I Pay $11 for Programming Courses When YouTube Is Free',
    excerpt:
      'Free tutorials are great until you realize you\'ve spent 40 hours rebuilding something that already exists. Here\'s the math behind paid structured learning.',
    date: '2020-04-14',
    tags: ['Learning', 'Career', 'Personal'],
    cover: '/blog/udemy-learning.jpg',
    Content: UdemyLearningContent,
  },
];

export function getPostBySlug(slug: string) {
  return posts.find((p) => p.slug === slug);
}