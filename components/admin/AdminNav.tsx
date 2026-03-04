"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <header className="w-full bg-navy text-cream">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="font-display text-sm tracking-[0.2em] mr-6 opacity-70">
            L <span className="font-ampersand">&amp;</span> J
          </span>
          <nav className="flex gap-4">
            <Link
              href="/admin/convidados"
              className={`text-xs uppercase tracking-widest py-1 transition-colors ${
                pathname.startsWith("/admin/convidados")
                  ? "text-cream border-b border-cream"
                  : "text-cream/60 hover:text-cream"
              }`}
            >
              Convidados
            </Link>
            <Link
              href="/admin/presentes"
              className={`text-xs uppercase tracking-widest py-1 transition-colors ${
                pathname.startsWith("/admin/presentes")
                  ? "text-cream border-b border-cream"
                  : "text-cream/60 hover:text-cream"
              }`}
            >
              Presentes
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/evento"
            className="text-xs uppercase tracking-widest text-cream/70 hover:text-cream transition-colors"
          >
            Ir para Checkout
          </Link>
          <button
            onClick={handleLogout}
            className="text-cream/50 text-xs uppercase tracking-widest hover:text-cream transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
