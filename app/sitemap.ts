import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://buchwerk.info";

// Public, indexable pages. Published Buchshop book pages (/buchshop/<slug>) can
// be added here later; kept static for now so the sitemap never depends on a DB
// call that could fail at build.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/buchshop",
    "/impressum",
    "/datenschutz",
    "/agb",
    "/widerruf",
    "/widerruf-erklaeren",
  ];
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
