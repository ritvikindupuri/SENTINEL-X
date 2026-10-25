import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomUUID } from "crypto";

// Server-only. Mints a short-lived, per-session Socket.IO token signed with
// SOCKETIO_AUTH_SECRET. The secret never leaves the server (no NEXT_PUBLIC_*).
export const dynamic = "force-dynamic";

const TTL_SECONDS = 120;
const SESSION_COOKIE = "sx_sid";

const b64url = (buf: Buffer) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function POST(req: NextRequest) {
  const secret = (process.env.SOCKETIO_AUTH_SECRET || "").trim();
  const allowed = (process.env.SOCKETIO_ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  // Fail closed on missing config.
  if (secret.length < 32 || allowed.length === 0) {
    return NextResponse.json({ error: "Token service not configured" }, { status: 503 });
  }

  // CSRF / cross-site minting defense: exact Origin match required.
  const origin = (req.headers.get("origin") || "").trim();
  if (!origin || !allowed.includes(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Per-browser-session subject held in an HttpOnly cookie.
  // TODO: replace with the real authenticated user id once app login exists.
  let sub = req.cookies.get(SESSION_COOKIE)?.value;
  const isNew = !sub || !/^[0-9a-f-]{36}$/.test(sub);
  if (isNew) sub = randomUUID();

  const now = Math.floor(Date.now() / 1000);
  const body = b64url(Buffer.from(JSON.stringify({ sub, iat: now, exp: now + TTL_SECONDS })));
  const sig = b64url(createHmac("sha256", secret).update(body).digest());

  const res = NextResponse.json({ token: `${body}.${sig}`, expiresIn: TTL_SECONDS });
  res.headers.set("Cache-Control", "no-store");
  if (isNew) {
    res.cookies.set(SESSION_COOKIE, sub!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }
  return res;
}
