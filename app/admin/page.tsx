"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao autenticar.");
      }
      router.replace("/admin/convidados");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      {/* Back to home */}
      <div className="absolute top-5 left-5">
        <Link
          href="/"
          className="text-[11px] uppercase tracking-widest text-navy/40 hover:text-navy transition-colors"
        >
          ← Home
        </Link>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <p className="font-serif text-2xl md:text-3xl tracking-[0.2em] text-navy">
            ORGANIZAÇÃO
          </p>
          <p className="text-xs text-navy/40 tracking-widest uppercase mt-2">
            Letícia <span className="font-ampersand">&amp;</span> Júnior
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Senha de acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-navy/20 bg-transparent px-4 py-3 text-sm text-navy placeholder-navy/30 outline-none focus:border-navy/60 transition-colors"
            autoComplete="current-password"
          />
          {error && (
            <p className="text-red-600 text-xs text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-cream py-3 text-xs tracking-[0.2em] uppercase hover:bg-navy/85 transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
