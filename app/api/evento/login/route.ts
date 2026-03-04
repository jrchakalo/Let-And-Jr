import { NextRequest, NextResponse } from "next/server";
import { CHECKOUT_COOKIE_NAME, COOKIE_VALUE } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password: string };

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

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
