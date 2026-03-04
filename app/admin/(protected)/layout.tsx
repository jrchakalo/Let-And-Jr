import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminNav from "@/components/admin/AdminNav";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await isAdminAuthenticated();
  if (!auth) redirect("/admin");

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <AdminNav />
      <main className="flex-1 px-4 py-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
