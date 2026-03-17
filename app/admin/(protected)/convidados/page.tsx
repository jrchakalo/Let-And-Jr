"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { FamilyWithGuests, Guest } from "@/lib/types";
import { createBrowserClient } from "@/lib/supabase/client";
import { GuestDetailModal } from "@/components/admin/GuestDetailModal";

// ─── Add Guest Modal ───────────────────────────────────────────────────
function AddGuestModal({
  familyId,
  onClose,
  onAdded,
}: {
  familyId: string;
  onClose: () => void;
  onAdded: (g: Guest) => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/families/${familyId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onAdded(data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy/50 flex items-center justify-center px-4">
      <div className="bg-cream border border-navy/15 p-6 w-full max-w-sm flex flex-col gap-4">
        <h3 className="font-serif text-navy tracking-widest uppercase text-sm">
          Adicionar Convidado
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nome do convidado"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy/60"
          />
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-navy text-cream py-2 text-xs tracking-widest uppercase disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Adicionar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-navy/30 text-navy py-2 text-xs tracking-widest uppercase"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Family Card ────────────────────────────────────────────────────────
function FamilyCard({
  family,
  onRefresh,
  onSelectGuest,
}: {
  family: FamilyWithGuests;
  onRefresh: () => void;
  onSelectGuest: (guest: Guest) => void;
}) {
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [familyName, setFamilyName] = useState(family.name);
  const [loading, setLoading] = useState(false);

  const invitePath = family.short_code
    ? `/c/${family.short_code}`
    : `/presenca/${family.magic_token}`;
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}${invitePath}`;

  async function deleteFamily() {
    if (!confirm(`Remover "${family.name}"? Todos os convidados serão removidos.`)) return;
    await fetch(`/api/admin/families/${family.id}`, { method: "DELETE" });
    onRefresh();
  }

  async function renameFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/admin/families/${family.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: familyName }),
    });
    if (res.ok) setEditingName(false);
    setLoading(false);
  }

  async function deleteGuest(guestId: string) {
    await fetch(`/api/admin/guests/${guestId}`, { method: "DELETE" });
    onRefresh();
  }

  const statusBadge = {
    PENDING: "bg-navy/10 text-navy/50",
    CONFIRMED: "bg-green-100 text-green-700",
    DECLINED: "bg-red-100 text-red-600",
  } as const;

  return (
    <div className="border border-navy/10 p-4 flex flex-col gap-3 bg-white/60">
      {/* Family header */}
      <div className="flex items-center justify-between gap-2">
        {editingName ? (
          <form onSubmit={renameFamily} className="flex gap-2 flex-1">
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="border border-navy/20 px-2 py-1 text-sm text-navy flex-1 outline-none focus:border-navy"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="text-xs text-navy border border-navy/30 px-2 py-1"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setEditingName(false)}
              className="text-xs text-navy/40"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={() => {
              setFamilyName(family.name);
              setEditingName(true);
            }}
            className="font-serif text-navy text-base tracking-wide text-left hover:underline"
          >
            {family.name}
          </button>
        )}
        <button
          onClick={deleteFamily}
          className="text-red-400 hover:text-red-600 text-xs ml-2 shrink-0"
          title="Remover família"
        >
          ✕
        </button>
      </div>

      {/* Magic link */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={link}
          className="flex-1 border border-navy/10 px-2 py-1 text-[10px] text-navy/60 bg-transparent outline-none truncate"
        />
        <button
          onClick={() => navigator.clipboard.writeText(link)}
          className="text-[10px] uppercase tracking-widest text-navy/50 border border-navy/20 px-2 py-1 hover:text-navy"
        >
          Copiar
        </button>
      </div>

      {/* Guests */}
      <ul className="flex flex-col gap-1">
        {(family.guests ?? []).map((g) => (
          <li
            key={g.id}
            className="flex items-center justify-between text-sm gap-2 cursor-pointer hover:bg-navy/5 px-2 py-1 rounded transition-colors"
            onClick={() => onSelectGuest(g)}
          >
            <span className="text-navy/80">{g.name}</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-widest ${statusBadge[g.rsvp_status]}`}
              >
                {g.rsvp_status === "PENDING"
                  ? "Pendente"
                  : g.rsvp_status === "CONFIRMED"
                  ? "Confirmado"
                  : "Recusou"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteGuest(g.id);
                }}
                className="text-red-300 hover:text-red-500 text-xs"
                title="Remover convidado"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Add guest button */}
      <button
        onClick={() => setShowAddGuest(true)}
        className="text-xs text-navy/50 hover:text-navy underline underline-offset-2 self-start"
      >
        + Adicionar convidado
      </button>

      {showAddGuest && (
        <AddGuestModal
          familyId={family.id}
          onClose={() => setShowAddGuest(false)}
          onAdded={() => onRefresh()}
        />
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function ConvidadosPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [families, setFamilies] = useState<FamilyWithGuests[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<"groups" | "list">("groups");
  const [listSort, setListSort] = useState<"name" | "group" | "status">("group");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const fetchFamilies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/families");
      const data = await res.json();
      setFamilies(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  useEffect(() => {
    if (!supabase) return;

    const handleFocus = () => fetchFamilies();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchFamilies();
    };

    const channel = supabase
      .channel("admin-convidados-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "families" },
        () => fetchFamilies()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guests" },
        () => fetchFamilies()
      )
      .subscribe();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchFamilies, supabase]);

  async function createFamily(e: React.FormEvent) {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/admin/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFamilyName.trim() }),
    });
    if (res.ok) {
      const data: FamilyWithGuests = await res.json();
      setFamilies((prev) => [...prev, data]);
      setNewFamilyName("");
    }
    setCreating(false);
  }

  async function handleStatusChange(
    guestId: string,
    newStatus: "CONFIRMED" | "DECLINED"
  ) {
    const res = await fetch(`/api/admin/guests/${guestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsvp_status: newStatus }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erro ao atualizar status");
    }
    await fetchFamilies();
  }

  // Stats
  const totalGuests = families.reduce((acc, f) => acc + (f.guests?.length ?? 0), 0);
  const confirmed = families.reduce(
    (acc, f) => acc + (f.guests?.filter((g) => g.rsvp_status === "CONFIRMED").length ?? 0),
    0
  );
  const declined = families.reduce(
    (acc, f) => acc + (f.guests?.filter((g) => g.rsvp_status === "DECLINED").length ?? 0),
    0
  );
  const pending = totalGuests - confirmed - declined;

  // Flat list of all guests with group name
  const allGuests = families.flatMap((f) =>
    (f.guests ?? []).map((g) => ({ ...g, groupName: f.name }))
  );

  const statusOrder = { CONFIRMED: 0, PENDING: 1, DECLINED: 2 } as const;
  const sortedGuests = [...allGuests].sort((a, b) => {
    if (listSort === "name") return a.name.localeCompare(b.name, "pt-BR");
    if (listSort === "group") return a.groupName.localeCompare(b.groupName, "pt-BR");
    return statusOrder[a.rsvp_status] - statusOrder[b.rsvp_status];
  });

  const statusBadge = {
    PENDING: "bg-navy/10 text-navy/50",
    CONFIRMED: "bg-green-100 text-green-700",
    DECLINED: "bg-red-100 text-red-600",
  } as const;

  const statusLabel = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmado",
    DECLINED: "Recusou",
  } as const;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-2xl text-navy tracking-[0.2em]">
          CONVIDADOS
        </h1>
        <p className="text-navy/50 text-xs mt-1">
          {totalGuests} convidados · {confirmed} confirmados · {declined} recusaram · {pending} pendentes
        </p>
      </div>

      {/* Add family */}
      <form onSubmit={createFamily} className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Nome da família ou convidado"
          value={newFamilyName}
          onChange={(e) => setNewFamilyName(e.target.value)}
          className="flex-1 border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy/60 max-w-xs"
        />
        <button
          type="submit"
          disabled={creating}
          className="bg-navy text-cream px-4 py-2 text-xs tracking-widest uppercase disabled:opacity-50"
        >
          {creating ? "..." : "Criar"}
        </button>
      </form>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("groups")}
          className={`px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors ${
            viewMode === "groups"
              ? "bg-navy text-cream border-navy"
              : "border-navy/30 text-navy/60 hover:text-navy"
          }`}
        >
          Grupos
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors ${
            viewMode === "list"
              ? "bg-navy text-cream border-navy"
              : "border-navy/30 text-navy/60 hover:text-navy"
          }`}
        >
          Lista
        </button>
      </div>

      {loading ? (
        <p className="text-navy/40 text-sm animate-pulse">Carregando...</p>
      ) : families.length === 0 ? (
        <p className="text-navy/40 text-sm">
          Nenhum convidado cadastrado ainda.
        </p>
      ) : viewMode === "groups" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {families.map((f) => (
            <FamilyCard key={f.id} family={f} onRefresh={fetchFamilies} onSelectGuest={setSelectedGuest} />
          ))}
        </div>
      ) : (
        /* ── List view ── */
        <div className="flex flex-col gap-3">
          {/* Sort controls */}
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-navy/50">
            <span>Ordenar:</span>
            {(["name", "group", "status"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setListSort(s)}
                className={`px-2 py-0.5 border transition-colors ${
                  listSort === s
                    ? "border-navy text-navy"
                    : "border-navy/20 hover:text-navy"
                }`}
              >
                {s === "name" ? "Nome" : s === "group" ? "Grupo" : "Status"}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-navy/10">
                  <th className="text-left py-2 px-3 text-[11px] uppercase tracking-widest text-navy/40 font-normal">
                    Nome
                  </th>
                  <th className="text-left py-2 px-3 text-[11px] uppercase tracking-widest text-navy/40 font-normal">
                    Grupo
                  </th>
                  <th className="text-left py-2 px-3 text-[11px] uppercase tracking-widest text-navy/40 font-normal">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedGuests.map((g) => (
                  <tr
                    key={g.id}
                    className="border-b border-navy/5 hover:bg-navy/3 cursor-pointer transition-colors"
                    onClick={() => setSelectedGuest(g)}
                  >
                    <td className="py-2 px-3 text-navy/80">{g.name}</td>
                    <td className="py-2 px-3 text-navy/50 text-xs">{g.groupName}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-widest ${statusBadge[g.rsvp_status]}`}
                      >
                        {statusLabel[g.rsvp_status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guest Detail Modal */}
      <GuestDetailModal
        guest={selectedGuest}
        isOpen={selectedGuest !== null}
        onClose={() => setSelectedGuest(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
