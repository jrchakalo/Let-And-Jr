import { NextResponse } from "next/server";
import { CHECKOUT_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(CHECKOUT_COOKIE_NAME);
  return res;
}
