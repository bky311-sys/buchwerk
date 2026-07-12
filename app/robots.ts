import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://buchwerk.info";

// Allow indexing of public pages; keep app/auth/api areas out of the index.
// (While the preview gate is active, middleware rewrites everything to /bald;
// this takes effect once the site is live.)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/projekte", "/admin", "/api/", "/anmelden", "/registrieren"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
