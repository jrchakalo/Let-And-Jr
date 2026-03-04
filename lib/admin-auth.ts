import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const CHECKOUT_COOKIE_NAME = "checkout_session";
const COOKIE_VALUE = "authenticated"; // simple boolean token

/** Call from Server Components / API Routes to verify admin access */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}

/** Checkout (/evento) authentication */
export async function isCheckoutAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(CHECKOUT_COOKIE_NAME)?.value === COOKIE_VALUE;
}

/** Shared auth for internal endpoints used by both /admin and /evento */
export async function isBackofficeAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get(COOKIE_NAME)?.value === COOKIE_VALUE;
  const checkoutAuth =
    cookieStore.get(CHECKOUT_COOKIE_NAME)?.value === COOKIE_VALUE;
  return adminAuth || checkoutAuth;
}

export { CHECKOUT_COOKIE_NAME, COOKIE_NAME, COOKIE_VALUE };
