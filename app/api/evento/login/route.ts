import { NextRequest, NextResponse } from "next/server";
import { CHECKOUT_COOKIE_NAME, COOKIE_VALUE } from "@/lib/admin-auth";
import { samePassword } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password: string };

  const unauthorized = samePassword(req, password);
  if (unauthorized) return unauthorized;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(CHECKOUT_COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
