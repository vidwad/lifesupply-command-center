import { NextResponse } from "next/server";

import { INTAKE_MESSAGE, INTAKE_STATUS, receiveInquiry } from "@/server/public-inquiry/intake";
import { MAX_BODY_BYTES } from "@/server/public-inquiry/abuse";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Public inquiry intake on the Command Center host (WB-702). Unauthenticated
 * by design; every control lives in `receiveInquiry`: size, origin,
 * validation, the intake flag, rate limit, store readiness, idempotency.
 * Responses never echo the submitted body and never carry visitor data.
 */
export async function POST(request: Request) {
  let body: unknown = null;
  let bodyBytes = 0;
  try {
    const text = await request.text();
    bodyBytes = Buffer.byteLength(text, "utf8");
    if (bodyBytes <= MAX_BODY_BYTES) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: INTAKE_MESSAGE.invalid }, { status: 400, headers: NO_STORE });
  }
  const result = await receiveInquiry({ body, bodyBytes, headers: request.headers });
  if (result.ok) {
    return NextResponse.json(
      { reference: result.reference },
      { status: result.duplicate ? 200 : 201, headers: NO_STORE },
    );
  }
  const status = INTAKE_STATUS[result.reason];
  return NextResponse.json(
    {
      error: INTAKE_MESSAGE[result.reason],
      ...(result.reason === "invalid" ? { issues: result.issues } : {}),
    },
    { status, headers: { ...NO_STORE, ...(status === 429 ? { "Retry-After": "600" } : {}) } },
  );
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405, headers: NO_STORE });
}
