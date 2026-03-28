import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://managedad.com";

  const pages = [
    "",
    "/features",
    "/pricing",
    "/about",
    "/contact",
    "/blog",
    "/privacy",
    "/terms",
    "/refund",
  ];

  const blogSlugs = [
    "ai-ad-optimization-guide",
    "google-ads-negative-keywords",
    "click-fraud-prevention",
    "meta-ads-automation",
    "performance-marketing-saas",
    "roas-optimization-strategies",
  ];

  return [
    ...pages.map((p) => ({
      url: `${base}${p}`,
      lastModified: new Date(),
      changeFrequency: (p === "/blog" ? "weekly" : "monthly") as
        | "weekly"
        | "monthly",
      priority:
        p === ""
          ? 1.0
          : p === "/features" || p === "/pricing"
            ? 0.9
            : 0.7,
    })),
    ...blogSlugs.map((s) => ({
      url: `${base}/blog/${s}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
