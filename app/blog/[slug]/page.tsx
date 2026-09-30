// app/blog/[slug]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { posts, getPostBySlug } from '@/data/posts';

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return notFound();

  const { Content } = post;

  return (
    <main className="page-container">
      <Link href="/blog" className="back-link">← All articles</Link>

      <header className="post-header">
        <p className="post-date">{post.date}</p>
        <h1>{post.title}</h1>
        <div className="tags" style={{ marginTop: 14 }}>
          {post.tags.map((t) => <span key={t} className="tag">{t}</span>)}
        </div>
      </header>

      <article className="post-content">
        <Content />
      </article>
    </main>
  );
}