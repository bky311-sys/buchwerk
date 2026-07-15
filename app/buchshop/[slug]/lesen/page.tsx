import { notFound, redirect } from "next/navigation";
import { getReadableBookBySlug } from "@/lib/shop/reader-queries";

export const dynamic = "force-dynamic";

// Entry point: /buchshop/<slug>/lesen jumps to the first written chapter. Access
// checks live on the chapter page, which is where the text actually is.
export default async function ReaderEntry({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getReadableBookBySlug(slug);
  if (!book || book.chapters.length === 0) notFound();

  redirect(`/buchshop/${slug}/lesen/${book.chapters[0].position}`);
}
