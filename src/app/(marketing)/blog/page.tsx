import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Blog — Ad Management Insights & Tips | ManagedAd",
  description:
    "Insights on AI-powered ad management, optimization strategies, and performance marketing from the ManagedAd team.",
};

export default function BlogPage() {
  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#09090b", color: "#fafafa" }}
    >
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-28 pb-16 text-center">
        <h1
          className="text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          Blog
        </h1>
        <p className="mt-4 text-lg" style={{ color: "#a1a1aa" }}>
          Insights on AI-powered ad management, optimization strategies, and
          performance marketing.
        </p>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-8 sm:grid-cols-2">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border p-6 transition-colors hover:border-orange-500/60"
              style={{
                backgroundColor: "#111113",
                borderColor: "#27272a",
              }}
            >
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: "#1c1c1f", color: "#f97316" }}
              >
                {post.category}
              </span>

              <h2
                className="mt-4 text-xl font-semibold leading-snug group-hover:text-orange-400 transition-colors"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                {post.title}
              </h2>

              <p
                className="mt-2 text-sm leading-relaxed line-clamp-3"
                style={{ color: "#a1a1aa" }}
              >
                {post.description}
              </p>

              <div
                className="mt-4 flex items-center gap-3 text-xs"
                style={{ color: "#71717a" }}
              >
                <span>{post.date}</span>
                <span aria-hidden="true">&middot;</span>
                <span>{post.readTime}</span>
                <span aria-hidden="true">&middot;</span>
                <span>{post.author}</span>
              </div>

              <span className="mt-4 inline-block text-sm font-medium text-orange-500 group-hover:text-orange-400 transition-colors">
                Read more &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
