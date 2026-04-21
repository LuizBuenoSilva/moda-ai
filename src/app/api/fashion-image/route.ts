import { NextRequest, NextResponse } from "next/server";

// Cache for 24 h so we don't burn Pexels rate limits
export const revalidate = 86400;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ url: null });

  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    // No key configured — return null so the UI falls back to color placeholder
    return NextResponse.json({ url: null });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=3&orientation=portrait&size=small`,
      {
        headers: { Authorization: key },
        // Next.js fetch cache
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) return NextResponse.json({ url: null });

    const data = await res.json();
    const photo = data.photos?.[0];
    const url: string | null = photo?.src?.medium ?? null;

    return NextResponse.json(
      { url },
      { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600" } }
    );
  } catch {
    return NextResponse.json({ url: null });
  }
}
