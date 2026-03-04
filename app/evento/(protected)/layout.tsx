import { redirect } from "next/navigation";
import { isCheckoutAuthenticated } from "@/lib/admin-auth";

export default async function ProtectedEventoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await isCheckoutAuthenticated();
  if (!auth) redirect("/evento/login");

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <main className="flex-1 px-4 py-8 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}
