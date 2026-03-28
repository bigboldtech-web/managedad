import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/admin",
          "/api",
          "/settings",
          "/automations",
          "/chat",
          "/fraud",
          "/creatives",
          "/competitors",
          "/landing-pages",
          "/campaigns",
          "/google-ads",
          "/meta-ads",
          "/optimization",
          "/keywords",
          "/billing",
          "/city-campaigns",
          "/audit",
          "/analytics",
          "/reports",
        ],
      },
    ],
    sitemap: "https://managedad.com/sitemap.xml",
  };
}
