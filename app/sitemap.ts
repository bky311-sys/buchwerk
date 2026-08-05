import type { MetadataRoute } from "next";
import { getPublishedBooks } from "@/lib/shop/queries";
import { ARTIKEL } from "@/lib/ratgeber/articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://buchwerk.info";

// Stündlich neu aufbauen, damit frisch veröffentlichte Buchshop-Bücher ohne
// Deploy in der Sitemap landen.
export const revalidate = 3600;

// Public, indexable pages plus die veröffentlichten Buchshop-Bücher. Die
// Buchseiten sind die inhaltsreichsten (und am ehesten verlinkbaren) Seiten —
// genau die sollen in den Index. Fällt die DB-Abfrage aus, liefern wir die
// statischen Routen statt eines Sitemap-Fehlers.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/buchshop",
    "/ratgeber",
    "/impressum",
    "/datenschutz",
    "/agb",
    "/widerruf",
    "/widerruf-erklaeren",
  ];

  const artikelEntries: MetadataRoute.Sitemap = ARTIKEL.map((artikel) => ({
    url: `${SITE_URL}/ratgeber/${artikel.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  let bookEntries: MetadataRoute.Sitemap = [];
  try {
    const books = await getPublishedBooks();
    bookEntries = books.map((book) => ({
      url: `${SITE_URL}/buchshop/${book.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // best-effort — statische Routen reichen als Fallback
  }

  return [
    ...routes.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.6,
    })),
    ...artikelEntries,
    ...bookEntries,
  ];
}
