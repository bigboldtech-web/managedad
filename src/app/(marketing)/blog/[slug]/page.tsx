import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/blog-data";

/* ---------- static params ---------- */
export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

/* ---------- dynamic metadata ---------- */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | ManagedAd Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

/* ---------- page ---------- */
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const jsonLdArticle = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "ManagedAd",
      url: "https://managedad.com",
    },
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Blog",
        item: "https://managedad.com/blog",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: post.title,
        item: `https://managedad.com/blog/${post.slug}`,
      },
    ],
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      <main
        className="min-h-screen"
        style={{ backgroundColor: "#09090b", color: "#fafafa" }}
      >
        <article className="mx-auto max-w-3xl px-6 pt-28 pb-24">
          {/* Breadcrumb */}
          <nav
            className="mb-8 flex items-center gap-2 text-sm"
            style={{ color: "#71717a" }}
            aria-label="Breadcrumb"
          >
            <Link
              href="/blog"
              className="hover:text-orange-400 transition-colors"
            >
              Blog
            </Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: "#a1a1aa" }} className="truncate">
              {post.title}
            </span>
          </nav>

          {/* Header */}
          <header>
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: "#1c1c1f", color: "#f97316" }}
            >
              {post.category}
            </span>
            <h1
              className="mt-4 text-3xl font-bold leading-tight sm:text-4xl"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              {post.title}
            </h1>
            <div
              className="mt-4 flex flex-wrap items-center gap-3 text-sm"
              style={{ color: "#71717a" }}
            >
              <time dateTime={post.date}>{post.date}</time>
              <span aria-hidden="true">&middot;</span>
              <span>{post.author}</span>
              <span aria-hidden="true">&middot;</span>
              <span>{post.readTime}</span>
            </div>
          </header>

          {/* Body */}
          <div
            className="prose-blog mt-10"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Back link */}
          <div className="mt-12 border-t pt-8" style={{ borderColor: "#27272a" }}>
            <Link
              href="/blog"
              className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors"
            >
              &larr; Back to all articles
            </Link>
          </div>

          {/* CTA */}
          <section
            className="mt-12 rounded-2xl border p-8 text-center"
            style={{ backgroundColor: "#111113", borderColor: "#27272a" }}
          >
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Ready to let AI manage your ads?
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#a1a1aa" }}>
              Start your 14-day free trial. No credit card required.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-block rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
            >
              Get started free
            </Link>
          </section>
        </article>
      </main>

      {/* Article body styles */}
      <style>{`
        .prose-blog h2 {
          font-family: Sora, sans-serif;
          font-size: 1.375rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: #fafafa;
        }
        .prose-blog p {
          color: #d4d4d8;
          line-height: 1.75;
          margin-bottom: 1rem;
        }
        .prose-blog a {
          color: #f97316;
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}
