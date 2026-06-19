// /items/[id] — public viewer + share page for a VisitorItem.
//
// Renders the item's SVG inline, exposes a "download SVG" link, and sets
// Open Graph + Twitter card metadata pointing at the sibling PNG route
// so social platforms unfurl the card.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadVisitorShare } from "@/lib/town-share";

type Params = { id: string };

function publicBase(): string {
  return (process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
}

export async function generateMetadata(
  ctx: { params: Promise<Params> },
): Promise<Metadata> {
  const { id } = await ctx.params;
  const loaded = await loadVisitorShare(id);
  if (!loaded) {
    return { title: "Item not found · Core Town" };
  }
  const base = publicBase();
  const pngUrl = `${base}/api/items/${id}/png`;
  const shareUrl = `${base}/items/${id}`;
  const title = `${loaded.templateLabel} · Core Town`;
  return {
    title,
    openGraph: {
      title,
      url: shareUrl,
      type: "website",
      images: [{ url: pngUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [pngUrl],
    },
  };
}

export default async function ItemPage(
  ctx: { params: Promise<Params> },
) {
  const { id } = await ctx.params;
  const loaded = await loadVisitorShare(id);
  if (!loaded) notFound();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        background: "#0a0a0a",
        color: "#e6e6e6",
        padding: "48px 16px",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', sans-serif",
      }}
    >
      {/* The SVG body comes from a designer-authored template; field
          values are HTML-escaped at substitution time. We still render
          via <img src="/api/items/[id]/svg"> instead of inlining the
          markup so the SVG executes in the image sandbox — no DOM,
          no <script>, no foreignObject reaching the host origin's
          cookies. Slight perf cost (one extra request); large security
          gain. */}
      <img
        src={`/api/items/${id}/svg`}
        alt={loaded.templateLabel}
        width={1200}
        height={630}
        style={{
          width: "100%",
          maxWidth: "1100px",
          height: "auto",
          aspectRatio: "1200 / 630",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          borderRadius: "12px",
          background: "#000",
          display: "block",
        }}
      />
      <div style={{ fontSize: "14px", opacity: 0.7 }}>
        {loaded.templateLabel} · earned in Core Town
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <a
          href={`/api/items/${id}/png`}
          download={`${loaded.templateId}-${id}.png`}
          style={{
            padding: "10px 18px",
            background: "#fff",
            color: "#000",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Download PNG
        </a>
        <a
          href={`/api/items/${id}/svg`}
          download={`${loaded.templateId}-${id}.svg`}
          style={{
            padding: "10px 18px",
            background: "transparent",
            color: "#fff",
            border: "1px solid #444",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Download SVG
        </a>
      </div>
    </main>
  );
}
