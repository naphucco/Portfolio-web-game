// app/blog/page.tsx
import Link from 'next/link';
import { posts } from '@/data/posts';

export const metadata = { title: 'Blog — Nguyen An Phuc' };

export default function BlogPage() {
  return (
    <main className="page-container">
      <p className="eyebrow">Blog</p>
      <h1>Bài viết &amp; chia sẻ</h1>
      <p className="lead">
        Ghi chú về game dev, tối ưu hiệu năng, và những thứ mình học được trong quá trình làm game.
      </p>

      <div className="posts-grid">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="post-card">
            <div className="post-cover">
              <img src={post.cover} alt={post.title} />
            </div>
            <div className="post-info">
              <span className="post-date">{post.date}</span>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <div className="tags">
                {post.tags.map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}