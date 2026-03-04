"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { FamilyWithGuests, Guest } from "@/lib/types";

type GuestWithGroup = Guest & { groupName: string };

export default function EventoPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<FamilyWithGuests[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [marking, setMarking] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    inputRef.current?.focus();
  }, []);

  const allGuests: GuestWithGroup[] = families.flatMap((f) =>
    (f.guests ?? []).map((g) => ({ ...g, groupName: f.name }))
  );

  const confirmedGuests = allGuests.filter((g) => g.rsvp_status === "CONFIRMED");
  const attendedCount = confirmedGuests.filter((g) => g.attended).length;

  const query = search.trim().toLowerCase();
  const results: GuestWithGroup[] =
    query.length >= 2
      ? allGuests.filter((g) => g.name.toLowerCase().includes(query))
      : [];

  async function toggleAttendance(guest: GuestWithGroup) {
    setMarking(guest.id);
    try {
      const res = await fetch(`/api/admin/guests/${guest.id}/attend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attended: !guest.attended }),
      });
      if (res.ok) {
        const updated: Guest = await res.json();
        setFamilies((prev) =>
          prev.map((f) => ({
            ...f,
            guests: (f.guests ?? []).map((g) =>
              g.id === updated.id
                ? { ...g, attended: updated.attended, attended_at: updated.attended_at }
                : g
            ),
          }))
        );
        setSearch("");
        inputRef.current?.focus();
      }
    } finally {
      setMarking(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/evento/logout", { method: "POST" });
    router.replace("/evento/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-navy tracking-[0.2em]">DIA DO EVENTO</h1>
          <p className="text-navy/50 text-xs mt-1">
            Busque o convidado pelo nome e confirme a presença
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs uppercase tracking-widest text-navy/50 hover:text-navy transition-colors"
        >
          Sair
        </button>
      </div>

      <div className="flex gap-6 flex-wrap">
        <div className="flex flex-col">
          <span className="font-display text-3xl text-navy">{attendedCount}</span>
          <span className="text-[10px] uppercase tracking-widest text-navy/40">Presentes</span>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-3xl text-navy">{confirmedGuests.length}</span>
          <span className="text-[10px] uppercase tracking-widest text-navy/40">Confirmados</span>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-3xl text-navy">{confirmedGuests.length - attendedCount}</span>
          <span className="text-[10px] uppercase tracking-widest text-navy/40">Aguardando</span>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-3xl text-navy">{allGuests.length}</span>
          <span className="text-[10px] uppercase tracking-widest text-navy/40">Total convidados</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-w-md">
        <input
          ref={inputRef}
          type="text"
          placeholder="Digite o nome do convidado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-navy/20 px-4 py-3 text-sm text-navy outline-none focus:border-navy/60 transition-colors"
          disabled={loading}
        />
        {query.length > 0 && query.length < 2 && (
          <p className="text-navy/40 text-xs">Digite pelo menos 2 caracteres para buscar.</p>
        )}
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-2 max-w-md">
          {results.map((g) => (
            <div
              key={g.id}
              className={`flex items-center justify-between border px-4 py-3 ${
                g.attended ? "border-green-300 bg-green-50" : "border-navy/15 bg-white/60"
              }`}
            >
              <div>
                <p className="text-sm text-navy font-medium">{g.name}</p>
                <p className="text-[11px] text-navy/40">{g.groupName}</p>
                {g.rsvp_status === "DECLINED" && (
                  <p className="text-[10px] text-red-500 uppercase tracking-widest mt-0.5">
                    Havia recusado
                  </p>
                )}
                {g.rsvp_status === "PENDING" && (
                  <p className="text-[10px] text-yellow-600 uppercase tracking-widest mt-0.5">
                    Sem confirmação prévia
                  </p>
                )}
              </div>
              <button
                disabled={marking === g.id}
                onClick={() => toggleAttendance(g)}
                className={`text-xs px-3 py-2 tracking-widest uppercase transition-colors disabled:opacity-50 ${
                  g.attended
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-navy text-cream hover:bg-navy/85"
                }`}
              >
                {marking === g.id ? "..." : g.attended ? "Presente ✓" : "Marcar presença"}
              </button>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && (
        <p className="text-navy/40 text-sm max-w-md">Nenhum convidado encontrado com esse nome.</p>
      )}

      {attendedCount > 0 && (
        <div className="flex flex-col gap-3 mt-4">
          <h2 className="text-[11px] uppercase tracking-widest text-navy/40">
            Presenças confirmadas ({attendedCount})
          </h2>
          <div className="overflow-x-auto max-w-2xl">
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
                    Horário
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {allGuests
                  .filter((g) => g.attended)
                  .sort((a, b) => (b.attended_at ?? "").localeCompare(a.attended_at ?? ""))
                  .map((g) => (
                    <tr key={g.id} className="border-b border-navy/5">
                      <td className="py-2 px-3 text-navy/80">{g.name}</td>
                      <td className="py-2 px-3 text-navy/50 text-xs">{g.groupName}</td>
                      <td className="py-2 px-3 text-navy/40 text-xs">
                        {g.attended_at
                          ? new Date(g.attended_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => toggleAttendance(g)}
                          disabled={marking === g.id}
                          className="text-[10px] text-red-400 hover:text-red-600 uppercase tracking-widest disabled:opacity-50"
                        >
                          Desfazer
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
