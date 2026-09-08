import { NextResponse } from "next/server";

import { getPublicLifeSupplySite } from "@/server/public-web/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const site = await getPublicLifeSupplySite();
    return NextResponse.json(site, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
        Vary: "Accept-Encoding",
      },
    });
  } catch (error) {
    console.error("Public website data is unavailable", error);
    return NextResponse.json(
      { error: "Public website data is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
