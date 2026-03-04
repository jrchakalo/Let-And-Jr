"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { FamilyWithGuests, Guest, RsvpStatus } from "@/lib/types";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";

// ─── Types ────────────────────────────────────────────────────────────
interface ChangeStatusTarget {
  guest: Guest;
  newStatus: RsvpStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────
function statusColor(s: RsvpStatus) {
  if (s === "CONFIRMED") return "text-green-700";
  if (s === "DECLINED") return "text-red-600";
  return "text-navy/50";
}

function statusLabel(s: RsvpStatus) {
  if (s === "CONFIRMED") return "Presença confirmada";
  if (s === "DECLINED") return "Não consigo comparecer";
  return "Aguardando resposta";
}

// ─── Confirmation Modal ────────────────────────────────────────────────
function ConfirmChangeModal({
  target,
  onConfirm,
  onCancel,
}: {
  target: ChangeStatusTarget;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const wasConfirmed = target.guest.rsvp_status === "CONFIRMED";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 px-4">
      <div className="bg-cream rounded-none max-w-sm w-full p-8 flex flex-col gap-6 border border-navy/15 shadow-2xl">
        <p className="font-display text-lg text-navy leading-relaxed text-center">
          {wasConfirmed
            ? "Você já confirmou presença."
            : "Você já indicou que não poderá comparecer."}
          <br />
          Deseja realmente alterar sua resposta?
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full bg-navy text-cream py-3 text-xs tracking-[0.2em] uppercase hover:bg-navy/90 transition-colors"
          >
            Sim, alterar resposta
          </button>
          <button
            onClick={onCancel}
            className="w-full border border-navy/30 text-navy py-3 text-xs tracking-[0.2em] uppercase hover:bg-navy/5 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Guest Card ────────────────────────────────────────────────────────
function GuestCard({
  guest,
  onStatusChange,
  loading,
}: {
  guest: Guest;
  onStatusChange: (guest: Guest, status: RsvpStatus) => void;
  loading: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const isAnswered = guest.rsvp_status !== "PENDING";
  const showButtons = !isAnswered || editing;

  return (
    <div className="border border-navy/15 p-6 flex flex-col gap-4 bg-white/50">
      <p className="font-display text-lg md:text-xl text-navy tracking-wide">
        {guest.name}
      </p>

      {isAnswered && !editing && (
        <p className={`text-xs uppercase tracking-widest ${statusColor(guest.rsvp_status)}`}>
          ● {statusLabel(guest.rsvp_status)}
        </p>
      )}

      {showButtons ? (
        <div className="flex gap-3 flex-wrap mt-1">
          <button
            disabled={loading}
            onClick={() => {
              setEditing(false);
              onStatusChange(guest, "CONFIRMED");
            }}
            className={`flex-1 py-3 text-xs tracking-[0.2em] uppercase transition-colors border ${
              guest.rsvp_status === "CONFIRMED"
                ? "bg-navy text-cream border-navy"
                : "border-navy/30 text-navy hover:bg-navy hover:text-cream"
            } disabled:opacity-50`}
          >
            Confirmar presença
          </button>
          <button
            disabled={loading}
            onClick={() => {
              setEditing(false);
              onStatusChange(guest, "DECLINED");
            }}
            className={`flex-1 py-3 text-xs tracking-[0.2em] uppercase transition-colors border ${
              guest.rsvp_status === "DECLINED"
                ? "bg-red-600 text-cream border-red-600"
                : "border-navy/30 text-navy hover:bg-red-50 hover:border-red-400 hover:text-red-700"
            } disabled:opacity-50`}
          >
            Não poderei ir
          </button>
        </div>
      ) : (
        <div className="flex gap-3 flex-wrap mt-1">
          <Link
            href="/presentes"
            className="flex-1 text-center bg-navy text-cream py-3 text-xs tracking-[0.2em] uppercase hover:bg-navy/85 transition-colors"
          >
            Ver lista de presentes
          </Link>
          <button
            onClick={() => setEditing(true)}
            className="flex-1 border border-navy/30 text-navy py-3 text-xs tracking-[0.2em] uppercase hover:bg-navy/5 transition-colors"
          >
            Mudar resposta
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────
export default function PresencaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [family, setFamily] = useState<FamilyWithGuests | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [changeTarget, setChangeTarget] = useState<ChangeStatusTarget | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resolve async params
  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  // Fetch family data
  const fetchFamily = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rsvp/${t}`);
      if (!res.ok) throw new Error("Link inválido ou expirado.");
      const data: FamilyWithGuests = await res.json();
      setFamily(data);
      setGuests(data.guests ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchFamily(token);
  }, [token, fetchFamily]);

  function handleStatusChange(guest: Guest, newStatus: RsvpStatus) {
    if (guest.rsvp_status !== "PENDING") {
      setChangeTarget({ guest, newStatus });
    } else {
      commitStatusChange(guest.id, newStatus);
    }
  }

  async function commitStatusChange(guestId: string, status: RsvpStatus) {
    setPending(true);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/rsvp/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, status }),
      });
      if (!res.ok) throw new Error("Erro ao salvar. Tente novamente.");
      const updated: Guest = await res.json();
      setGuests((prev) =>
        prev.map((g) => (g.id === updated.id ? updated : g))
      );
      setSuccessMsg(
        status === "CONFIRMED"
          ? "Presença confirmada! Nos vemos no grande dia!"
          : "Resposta salva. Agradecemos por nos avisar."
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setPending(false);
    }
  }

  function handleModalConfirm() {
    if (!changeTarget) return;
    commitStatusChange(changeTarget.guest.id, changeTarget.newStatus);
    setChangeTarget(null);
  }

  // ─── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <p className="font-display text-navy/50 tracking-widest uppercase text-sm animate-pulse">
          Carregando...
        </p>
      </main>
    );
  }

  if (error && !family) {
    return (
      <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center gap-6">
        <p className="font-display text-2xl text-navy">Ops!</p>
        <p className="text-navy/60 tracking-wide max-w-sm">{error}</p>
        <p className="text-xs uppercase tracking-widest text-navy/40">
          Verifique o link enviado pelo casal.
        </p>
      </main>
    );
  }

  const allAnswered =
    guests.length > 0 && guests.every((g) => g.rsvp_status !== "PENDING");

  return (
    <>
      {changeTarget && (
        <ConfirmChangeModal
          target={changeTarget}
          onConfirm={handleModalConfirm}
          onCancel={() => setChangeTarget(null)}
        />
      )}

      <main className="min-h-screen bg-cream flex flex-col items-center w-full overflow-x-hidden">
        {/* ─── OLÁ! section ──────────────────────────────────────────── */}
        <section className="w-full bg-navy text-cream py-0 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="/img/nos1.jpg"
              alt="Letícia e Júnior"
              fill
              className="object-cover object-center opacity-40"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-[#283b63]/85" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between max-w-5xl mx-auto px-6 py-28 md:py-36 gap-12">
            <h2 className="text-5xl md:text-7xl tracking-[0.2em] text-cream shrink-0">
              O L Á !
            </h2>
            <p className="text-base md:text-xl font-display leading-relaxed md:text-right text-cream/90 max-w-lg">
              É uma honra e uma grande benção compartilhar esse dia, que
              transbordará amor, carinho e propósito, com você! Por isso,
              desejamos sua presença e coração conosco nesse momento!
            </p>
          </div>
        </section>

        {/* ─── Quando & Onde ─────────────────────────────────────────── */}
        <section className="w-full bg-cream py-16 px-6 flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 w-full max-w-3xl items-start text-center">
            {/* QUANDO */}
            <div className="flex flex-col items-center">
              <h3 className="text-lg md:text-xl tracking-[0.25em] mb-6 text-navy">
                QUANDO?
              </h3>
              <div className="flex items-center justify-center gap-4 font-display text-navy">
                <div className="text-right leading-snug">
                  <span className="block text-3xl md:text-4xl">04</span>
                  <span className="block text-xs opacity-60">de</span>
                  <span className="block text-xl md:text-2xl">Junho</span>
                </div>
                <div className="h-16 w-px bg-navy/30 transform rotate-12 shrink-0" />
                <div className="text-left leading-snug">
                  <span className="block text-3xl md:text-4xl">15:00</span>
                  <span className="block text-xs opacity-60">da</span>
                  <span className="block text-xl md:text-2xl">Tarde</span>
                </div>
              </div>
              <div className="mt-5">
                <AddToCalendarButton />
              </div>
            </div>

            {/* Center illustration */}
            <div className="relative h-48 md:h-56 w-full opacity-70">
              <Image
                src="/img/flor2.png"
                alt="Ilustração floral"
                fill
                className="object-contain mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* ONDE */}
            <div className="flex flex-col items-center">
              <h3 className="text-lg md:text-xl tracking-[0.25em] mb-6 text-navy">
                ONDE?
              </h3>
              <p className="font-display text-xl text-navy leading-relaxed">
                Chácara Nossa
                <br />
                Senhora Desatadora
                <br />
                dos nós.
              </p>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block border border-navy/40 px-5 py-2 text-[10px] uppercase tracking-widest text-navy hover:bg-navy hover:text-cream transition-colors duration-200"
              >
                Acesse a localização!
              </a>
            </div>
          </div>
        </section>

        {/* ─── CONFIRME SUA PRESENÇA ─────────────────────────────────── */}
        <section className="w-full border-t border-navy/10 py-16 px-6 flex flex-col items-center max-w-lg mx-auto gap-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl tracking-[0.2em] text-navy mb-2">
              CONFIRME SUA PRESENÇA
            </h2>
            {family && (
              <p className="text-sm text-navy/50 tracking-wide">
                {family.name}
              </p>
            )}
          </div>

          {successMsg && allAnswered && (
            <div className="w-full bg-navy/5 border border-navy/10 p-5 text-center">
              <p className="font-display text-navy text-base">{successMsg}</p>
            </div>
          )}

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <div className="w-full flex flex-col gap-4">
            {guests.map((g) => (
              <GuestCard
                key={g.id}
                guest={g}
                onStatusChange={handleStatusChange}
                loading={pending}
              />
            ))}
          </div>

          {guests.length === 0 && (
            <p className="text-navy/40 text-sm text-center">
              Nenhum convidado encontrado para este link.
            </p>
          )}
        </section>

        <section className="w-full bg-cream py-24 px-6 flex flex-col items-center border-t border-navy/10">
          <h2 className="text-2xl md:text-4xl tracking-[0.2em] mb-16 text-center text-navy">
            ALGUNS DETALHES E INFOS...
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto text-center">
            <div className="flex flex-col items-center gap-5">
              <div className="w-16 h-16 flex items-center justify-center border border-navy/20 rounded-full text-navy/40">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
                </svg>
              </div>
              <p className="text-sm md:text-base tracking-wider leading-relaxed text-navy/70">
                Pedimos gentilmente que os convidados evitem trajes na{" "}
                <strong className="text-navy">cor azul em qualquer tom.</strong>
              </p>
            </div>

            <div className="flex flex-col items-center gap-5">
              <div className="w-16 h-16 flex items-center justify-center border border-navy/20 rounded-full text-navy/40">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 14.5 5-5"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 9.5 5 5"/>
                </svg>
              </div>
              <p className="text-sm md:text-base tracking-wider leading-relaxed text-navy/70">
                O convite de cada um é <strong className="text-navy">individual</strong>{" "}
                e apenas para aqueles que o receberam.
              </p>
            </div>

            <div className="flex flex-col items-center gap-5">
              <div className="w-16 h-16 flex items-center justify-center border border-navy/20 rounded-full text-navy/40">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 13v5"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 11.47V8"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 11h1a3 3 0 0 1 2.745 4.211"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2 2 20 20"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.536 7.535C6.766 7.649 6.154 8 5.5 8a2.5 2.5 0 0 1-1.768-4.268"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.727 3.204C9.306 2.767 9.885 2 11 2c1.56 0 2 1.5 3 1.5s1.72-.5 2.5-.5a1 1 0 1 1 0 5c-.78 0-1.5-.5-2.5-.5a3.149 3.149 0 0 0-.842.12"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.6V18"/>
                </svg>
              </div>
              <p className="text-sm md:text-base tracking-wider leading-relaxed text-navy/70">
                Agradecemos a compreensão de todos para a{" "}
                <strong className="text-navy">não entrada de bebidas alcoólicas</strong>{" "}
                no local.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Footer ───────────────────────────────────────────────── */}
        <footer className="mt-auto w-full bg-navy text-cream py-6 flex justify-center">
          <span className="font-display text-base tracking-[0.3em] uppercase">
            Letícia <em className="italic not-italic font-ampersand">&amp;</em>{" "}
            Júnior
          </span>
        </footer>
      </main>
    </>
  );
}
