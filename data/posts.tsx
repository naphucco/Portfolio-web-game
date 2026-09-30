// data/posts.ts
import type { ComponentType } from 'react';
import GameOptimizationContent from '@/content/blog/game-optimization';
import PlaceholderContent from '@/content/blog/placeholder';

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
    title: 'Game Performance Optimization: Bạn Không Cần Model Phức Tạp',
    excerpt:
      'Sprite Sheet, Billboarding và Particle System — 3 kỹ thuật đơn giản giữ game mobile 60 FPS mà vẫn đẹp mắt.',
    date: '2026-01-15',
    tags: ['Optimization', 'Mobile', 'VFX'],
    cover: '/blog/game-optimization1.jpg',
    Content: GameOptimizationContent,
  },
  {
    slug: 'placeholder',
    title: 'Bài viết sắp ra mắt',
    excerpt: 'Nội dung đang được chuẩn bị. Quay lại sau nhé!',
    date: '2026-02-01',
    tags: ['Coming soon'],
    cover: '/blog/placeholder.jpg',
    Content: PlaceholderContent,
  },
];

export function getPostBySlug(slug: string) {
  return posts.find((p) => p.slug === slug);
}