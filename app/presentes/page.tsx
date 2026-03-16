"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Gift } from "@/lib/types";
import { createBrowserClient } from "@/lib/supabase/client";

const HONEYMOON_PIX_CODE =
  "00020126580014br.gov.bcb.pix0136a88eb9e6-1260-48ca-8b9f-c05f16f958945204000053039865802BR5909JRCHAKALO6009Sao Paulo610901227-20062230519daqr2166860298502896304558C";

// ─── Helpers ──────────────────────────────────────────────────────────
function fmtBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

function cotaInfo(gift: Gift) {
  if (!gift.is_cota || !gift.cota_value) return null;
  const total = Math.ceil(gift.price / gift.cota_value);
  const paid = gift.cotas_paid ?? 0;
  const pct = Math.min((paid / total) * 100, 100);
  return { total, paid, remaining: total - paid, pct };
}

// ─── Gift status badge ────────────────────────────────────────────────
function StatusBadge({ status }: { status: Gift["status"] }) {
  if (status === "AVAILABLE") return null;
  const map: Record<string, string> = {
    RESERVED: "Reservado",
    PAID: "Presenteado",
    CLAIMED_MANUALLY: "Comprado",
  };
  return (
    <span className="absolute top-3 right-3 bg-navy/80 text-cream text-[10px] uppercase tracking-widest px-2 py-1">
      {map[status] ?? status}
    </span>
  );
}

// ─── Gift Card ────────────────────────────────────────────────────────
function GiftCard({
  gift,
  onGift,
}: {
  gift: Gift;
  onGift: (gift: Gift) => void;
}) {
  const cota = cotaInfo(gift);
  const unavailable =
    gift.status !== "AVAILABLE" ||
    (cota !== null && cota.remaining === 0);

  return (
    <div
      className={`flex flex-col border border-navy/10 bg-white relative ${
        unavailable ? "opacity-60" : ""
      }`}
    >
      {/* Photo */}
      <div className="relative h-52 w-full bg-cream/50">
        {gift.image_url ? (
          <Image
            src={gift.image_url}
            alt={gift.name}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-navy/20">
            <svg
              className="w-12 h-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <StatusBadge status={gift.status} />
        {gift.is_cota && (
          <span className="absolute top-3 left-3 bg-cream/90 text-navy text-[10px] uppercase tracking-widest px-2 py-1 border border-navy/20">
            Cota
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2">
        <p className="font-display text-sm md:text-base text-navy leading-snug">
          {gift.name}
        </p>

        {cota ? (
          <>
            <p className="text-navy/70 text-xs">
              Cota: {fmtBRL(gift.cota_value!)} · Total: {fmtBRL(gift.price)}
            </p>
            {/* Progress bar */}
            <div className="flex flex-col gap-1">
              <div className="w-full h-2 bg-navy/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy transition-all duration-500"
                  style={{ width: `${cota.pct}%` }}
                />
              </div>
              <p className="text-[10px] text-navy/50 tracking-wide">
                {cota.paid} de {cota.total} cotas
                {cota.remaining > 0
                  ? ` · ${cota.remaining} restante${cota.remaining !== 1 ? "s" : ""}`
                  : " · Completo!"}
              </p>
            </div>
          </>
        ) : (
          <p className="text-navy/70 text-xs">{fmtBRL(gift.price)}</p>
        )}

        <button
          disabled={unavailable}
          onClick={() => onGift(gift)}
          className="mt-2 w-full bg-navy text-cream py-3 text-xs tracking-[0.2em] uppercase hover:bg-navy/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {unavailable
            ? cota && cota.remaining === 0
              ? "Completo!"
              : "Indisponível"
            : cota
            ? "Contribuir"
            : "Presentear"}
        </button>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────
type ModalStep =
  | "options"
  | "cota-form"
  | "cota-pay-form"
  | "pay-form"
  | "pay-loading"
  | "store-name"
  | "store-reserved"
  | "claim-name"
  | "claim-done";

function GiftModal({
  gift,
  onClose,
  onGiftUpdated,
}: {
  gift: Gift;
  onClose: () => void;
  onGiftUpdated: (g: Gift) => void;
}) {
  const [step, setStep] = useState<ModalStep>(
    gift.is_cota && gift.cota_value ? "cota-form" : "options"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cotaQty, setCotaQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cota = cotaInfo(gift);
  const price = fmtBRL(gift.price);

  // ── Cota: pay via MP ─────────────────────────────────────
  async function handleCotaPay(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Preencha seu nome e e-mail.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId: gift.id,
          payerName: name,
          payerEmail: email,
          cotaQuantity: cotaQty,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar pagamento.");
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
    }
  }

  // ── Option 1: Contribute (Mercado Pago) — regular gift ───
  async function handlePaySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Preencha seu nome e e-mail.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId: gift.id, payerName: name, payerEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar pagamento.");
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
    }
  }

  // ── Option 2: Buy at store — step 1 name ────────────────
  async function handleStoreReserve(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Preencha seu nome.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gifts/${gift.id}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao reservar.");
      onGiftUpdated(data);
      setStep("store-reserved");
      if (gift.store_url) window.open(gift.store_url, "_blank");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  // ── Option 2: Confirm store purchase ────────────────────
  async function handleStoreConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gifts/${gift.id}/confirm-store`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao confirmar.");
      onGiftUpdated(data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  // ── Option 3: Manual claim ───────────────────────────────
  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Preencha seu nome.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gifts/${gift.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao registrar.");
      onGiftUpdated(data);
      setStep("claim-done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-navy/60 px-0 md:px-4">
      <div className="bg-cream w-full md:max-w-md md:rounded-none border border-navy/15 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-navy/10">
          <div>
            <p className="font-display text-base text-navy">{gift.name}</p>
            {cota ? (
              <p className="text-xs text-navy/50 mt-1">
                Cota {fmtBRL(gift.cota_value!)} · Total {price}
              </p>
            ) : (
              <p className="text-xs text-navy/50 mt-1">{price}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-navy/40 hover:text-navy ml-4 shrink-0"
            aria-label="Fechar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {error && (
            <p className="text-red-600 text-xs text-center">{error}</p>
          )}

          {/* ── COTA: choose quantity + manual/pay ── */}
          {step === "cota-form" && cota && (
            <div className="flex flex-col gap-5">
              {/* Progress summary */}
              <div className="flex flex-col gap-1">
                <div className="w-full h-2 bg-navy/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-navy transition-all"
                    style={{ width: `${cota.pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-navy/50 text-center">
                  {cota.paid} de {cota.total} cotas doadas ·{" "}
                  {cota.remaining} restente{cota.remaining !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Quantity selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-navy/60 tracking-wide text-center">
                  Quantas cotas deseja contribuir?
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setCotaQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 border border-navy/30 text-navy text-lg flex items-center justify-center hover:bg-navy/5"
                  >
                    −
                  </button>
                  <span className="text-xl font-display text-navy w-8 text-center">
                    {cotaQty}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCotaQty((q) => Math.min(cota.remaining, q + 1))
                    }
                    className="w-8 h-8 border border-navy/30 text-navy text-lg flex items-center justify-center hover:bg-navy/5"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-navy/50 text-center">
                  Total: {fmtBRL(cotaQty * gift.cota_value!)}
                </p>
              </div>

              <button
                onClick={() => {
                  setError(null);
                  setStep("cota-pay-form");
                }}
                className="w-full bg-navy text-cream py-4 text-xs tracking-[0.2em] uppercase hover:bg-navy/85 transition-colors"
              >
                Contribuir via Pix / Cartão
              </button>
            </div>
          )}

          {/* ── COTA: pay form ── */}
          {step === "cota-pay-form" && cota && (
            <form onSubmit={handleCotaPay} className="flex flex-col gap-4">
              <p className="text-xs text-navy/60 text-center tracking-wide">
                {cotaQty} cota{cotaQty > 1 ? "s" : ""} ={" "}
                {fmtBRL(cotaQty * gift.cota_value!)}
                <br />
                Você será redirecionado ao Mercado Pago.
              </p>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-navy/20 bg-transparent px-4 py-3 text-sm text-navy placeholder-navy/30 outline-none focus:border-navy/60 transition-colors"
              />
              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-navy/20 bg-transparent px-4 py-3 text-sm text-navy placeholder-navy/30 outline-none focus:border-navy/60 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-cream py-4 text-xs tracking-[0.2em] uppercase hover:bg-navy/85 transition-colors disabled:opacity-50"
              >
                {loading ? "Aguarde..." : "Ir para o pagamento"}
              </button>
              <button
                type="button"
                onClick={() => setStep("cota-form")}
                className="text-navy/40 text-xs text-center hover:text-navy underline"
              >
                Voltar
              </button>
            </form>
          )}

          {/* ── STEP: options (regular gift) ── */}
          {step === "options" && (
            <>
              <button
                onClick={() => {
                  setError(null);
                  setStep("pay-form");
                }}
                className="w-full bg-navy text-cream py-4 text-xs tracking-[0.2em] uppercase hover:bg-navy/85 transition-colors"
              >
                Contribuir com o valor ({price})
              </button>
              {gift.store_url && (
                <button
                  onClick={() => {
                    setError(null);
                    setStep("store-name");
                  }}
                  className="w-full border border-navy/30 text-navy py-4 text-xs tracking-[0.2em] uppercase hover:bg-navy/5 transition-colors"
                >
                  Comprar em uma loja online
                </button>
              )}
              <button
                onClick={() => {
                  setError(null);
                  setStep("claim-name");
                }}
                className="w-full text-navy/50 underline underline-offset-4 py-2 text-xs tracking-wider text-center hover:text-navy transition-colors"
              >
                Já comprei / Vou entregar em mãos
              </button>
            </>
          )}

          {/* ── STEP: pay-form ── */}
          {step === "pay-form" && (
            <form onSubmit={handlePaySubmit} className="flex flex-col gap-4">
              <p className="text-xs text-navy/60 text-center tracking-wide">
                Você será redirecionado ao Mercado Pago para pagar via Pix ou
                Cartão.
              </p>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-navy/20 bg-transparent px-4 py-3 text-sm text-navy placeholder-navy/30 outline-none focus:border-navy/60 transition-colors"
              />
              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-navy/20 bg-transparent px-4 py-3 text-sm text-navy placeholder-navy/30 outline-none focus:border-navy/60 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-cream py-4 text-xs tracking-[0.2em] uppercase hover:bg-navy/85 transition-colors disabled:opacity-50"
              >
                {loading ? "Aguarde..." : "Ir para o pagamento"}
              </button>
              <button
                type="button"
                onClick={() => setStep("options")}
                className="text-navy/40 text-xs text-center hover:text-navy underline"
              >
                Voltar
              </button>
            </form>
          )}

          {/* ── STEP: store-name ── */}
          {step === "store-name" && (
            <form onSubmit={handleStoreReserve} className="flex flex-col gap-4">
              <p className="text-xs text-navy/60 text-center tracking-wide">
                Vamos reservar este presente para você enquanto compra na loja.
                Qual o seu nome?
              </p>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-navy/20 bg-transparent px-4 py-3 text-sm text-navy placeholder-navy/30 outline-none focus:border-navy/60 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full border border-navy/30 text-navy py-4 text-xs tracking-[0.2em] uppercase hover:bg-navy/5 transition-colors disabled:opacity-50"
              >
                {loading ? "Reservando..." : "Reservar e abrir a loja"}
              </button>
              <button
                type="button"
                onClick={() => setStep("options")}
                className="text-navy/40 text-xs text-center hover:text-navy underline"
              >
                Voltar
              </button>
            </form>
          )}

          {/* ── STEP: store-reserved ── */}
          {step === "store-reserved" && (
            <div className="flex flex-col gap-5 text-center">
              <p className="text-navy/70 text-sm leading-relaxed">
                Presente reservado! O link da loja foi aberto em uma nova aba.
                <br />
                <br />
                Quando finalizar a compra, clique abaixo para confirmar.
              </p>
              <button
                disabled={loading}
                onClick={handleStoreConfirm}
                className="w-full bg-navy text-cream py-4 text-xs tracking-[0.2em] uppercase hover:bg-navy/85 transition-colors disabled:opacity-50"
              >
                {loading ? "Confirmando..." : "Confirmei a compra na loja"}
              </button>
              <p className="text-navy/30 text-xs">
                Não comprou ainda? Feche este modal — o presente ficará
                reservado por 24h.
              </p>
            </div>
          )}

          {/* ── STEP: claim-name ── */}
          {step === "claim-name" && (
            <form onSubmit={handleClaim} className="flex flex-col gap-4">
              <p className="text-xs text-navy/60 text-center tracking-wide">
                {gift.is_cota
                  ? `Que ótimo! Registraremos sua contribuição de ${cotaQty} cota${cotaQty > 1 ? "s" : ""}. Qual o seu nome?`
                  : "Que ótimo! Qual o seu nome para registrarmos?"}
              </p>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-navy/20 bg-transparent px-4 py-3 text-sm text-navy placeholder-navy/30 outline-none focus:border-navy/60 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-cream py-4 text-xs tracking-[0.2em] uppercase hover:bg-navy/85 transition-colors disabled:opacity-50"
              >
                {loading ? "Registrando..." : "Registrar presente"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setStep(gift.is_cota && gift.cota_value ? "cota-form" : "options")
                }
                className="text-navy/40 text-xs text-center hover:text-navy underline"
              >
                Voltar
              </button>
            </form>
          )}

          {/* ── STEP: claim-done ── */}
          {step === "claim-done" && (
            <div className="text-center flex flex-col gap-5">
              <p className="font-display text-navy text-base">
                Obrigado, {name}!
              </p>
              <p className="text-navy/60 text-sm">
                Registramos seu presente. Não vemos a hora de celebrar com
                você!
              </p>
              <button
                onClick={onClose}
                className="w-full border border-navy/30 text-navy py-3 text-xs tracking-[0.2em] uppercase hover:bg-navy/5 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page (inner — needs Suspense for useSearchParams) ───────────────
function PresentesContent() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const searchParams = useSearchParams();

  const rawMpStatus = searchParams.get("status") ?? searchParams.get("collection_status");
  const rawMpReference =
    searchParams.get("gift") ?? searchParams.get("external_reference");

  const mpStatus = useMemo<"success" | "failure" | "pending" | null>(() => {
    const normalized = (rawMpStatus ?? "").toLowerCase();

    if (!normalized) return null;
    if (normalized === "success" || normalized === "approved") return "success";
    if (normalized === "pending" || normalized === "in_process" || normalized === "inprocess") {
      return "pending";
    }
    if (
      normalized === "failure" ||
      normalized === "rejected" ||
      normalized === "cancelled" ||
      normalized === "canceled" ||
      normalized === "denied"
    ) {
      return "failure";
    }

    return null;
  }, [rawMpStatus]);

  const mpGiftId = useMemo(() => {
    if (!rawMpReference) return null;
    return rawMpReference.split("|")[0] ?? null;
  }, [rawMpReference]);

  const mpPaymentId =
    searchParams.get("payment_id") ?? searchParams.get("collection_id");
  const mpKind = useMemo(() => {
    const explicitKind = searchParams.get("kind");
    if (explicitKind) return explicitKind;
    if (rawMpReference?.includes("|cota|")) return "cota";
    return "gift";
  }, [rawMpReference, searchParams]);
  const mpQtyRaw = useMemo(() => {
    const explicitQty = searchParams.get("qty");
    if (explicitQty) return explicitQty;
    if (!rawMpReference) return null;
    const parts = rawMpReference.split("|");
    return parts[2] ?? null;
  }, [rawMpReference, searchParams]);
  const [paymentBannerStatus, setPaymentBannerStatus] = useState<
    "success" | "failure" | "pending" | null
  >(null);
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);

  const fetchGifts = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/gifts");
      const data: Gift[] = await res.json();
      setGifts(Array.isArray(data) ? data : []);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifts(true);
  }, [fetchGifts]);

  useEffect(() => {
    if (!supabase) return;

    const handleFocus = () => {
      fetchGifts(false);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchGifts(false);
    };

    const channel = supabase
      .channel("public-presentes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gifts" },
        () => fetchGifts(false)
      )
      .subscribe();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchGifts, supabase]);

  useEffect(() => {
    if (mpStatus === "success" && mpGiftId) {
      setGifts((prev) =>
        prev.map((g) =>
          g.id === mpGiftId ? { ...g, status: "PAID" as const } : g
        )
      );
    }
  }, [mpStatus, mpGiftId]);

  useEffect(() => {
    if (mpStatus !== "success" && mpStatus !== "failure" && mpStatus !== "pending") {
      return;
    }

    setPaymentBannerStatus(mpStatus);

    const clearUrlTimer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("status");
      url.searchParams.delete("collection_status");
      url.searchParams.delete("collection_id");
      url.searchParams.delete("gift");
      url.searchParams.delete("external_reference");
      url.searchParams.delete("payment_id");
      url.searchParams.delete("payment_type");
      url.searchParams.delete("merchant_order_id");
      url.searchParams.delete("preference_id");
      url.searchParams.delete("site_id");
      url.searchParams.delete("processing_mode");
      url.searchParams.delete("merchant_account_id");
      url.searchParams.delete("kind");
      url.searchParams.delete("qty");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }, 400);

    const hideBannerTimer = window.setTimeout(() => {
      setPaymentBannerStatus(null);
    }, 12000);

    return () => {
      window.clearTimeout(clearUrlTimer);
      window.clearTimeout(hideBannerTimer);
    };
  }, [mpStatus]);

  useEffect(() => {
    if (mpStatus !== "pending" || !mpGiftId) return;

    const gift = gifts.find((item) => item.id === mpGiftId);
    if (gift?.status !== "PAID") return;

    setPaymentBannerStatus("success");

    const qtyParsed = mpQtyRaw ? Number.parseInt(mpQtyRaw, 10) : 1;
    const qty = Number.isFinite(qtyParsed) && qtyParsed > 0 ? qtyParsed : 1;
    const isCota = mpKind === "cota";
    const giftName = gift.name;

    const message = isCota
      ? `Obrigado! Sua contribuição de ${qty} cota${qty > 1 ? "s" : ""} para "${giftName}" foi registrada com carinho.`
      : `Obrigado! Seu presente "${giftName}" foi registrado com carinho.`;

    setThankYouMessage(message);
  }, [gifts, mpGiftId, mpKind, mpQtyRaw, mpStatus]);

  useEffect(() => {
    if (!mpPaymentId) return;

    const timer = window.setTimeout(() => {
      void (async () => {
        const res = await fetch(`/api/mercadopago/webhook?type=payment&id=${encodeURIComponent(mpPaymentId)}`, {
          method: "GET",
        });
        const payload = (await res.json().catch(() => null)) as
          | {
              approved?: boolean;
              giftId?: string | null;
              isCota?: boolean;
            }
          | null;

        if (payload?.approved) {
          const qtyParsed = mpQtyRaw ? Number.parseInt(mpQtyRaw, 10) : 1;
          const qty = Number.isFinite(qtyParsed) && qtyParsed > 0 ? qtyParsed : 1;
          const resolvedGiftId = payload.giftId ?? mpGiftId;
          const resolvedGift = resolvedGiftId
            ? gifts.find((item) => item.id === resolvedGiftId)
            : null;
          const giftName = resolvedGift?.name ?? "presente";
          const isCotaPayment = payload.isCota ?? mpKind === "cota";

          setPaymentBannerStatus("success");
          setThankYouMessage(
            isCotaPayment
              ? `Obrigado! Sua contribuição de ${qty} cota${qty > 1 ? "s" : ""} para "${giftName}" foi registrada com carinho.`
              : `Obrigado! Seu presente "${giftName}" foi registrado com carinho.`
          );
        }

        await fetchGifts(false);
      })();
    }, 600);

    return () => window.clearTimeout(timer);
  }, [fetchGifts, gifts, mpGiftId, mpKind, mpPaymentId, mpQtyRaw]);

  useEffect(() => {
    if (mpStatus !== "success") return;

    const qtyParsed = mpQtyRaw ? Number.parseInt(mpQtyRaw, 10) : 1;
    const qty = Number.isFinite(qtyParsed) && qtyParsed > 0 ? qtyParsed : 1;
    const isCota = mpKind === "cota";
    const gift = mpGiftId ? gifts.find((item) => item.id === mpGiftId) : null;
    const giftName = gift?.name ?? "presente";

    const message = isCota
      ? `Obrigado! Sua contribuição de ${qty} cota${qty > 1 ? "s" : ""} para "${giftName}" foi registrada com carinho.`
      : `Obrigado! Seu presente "${giftName}" foi registrado com carinho.`;

    setThankYouMessage(message);
  }, [gifts, mpGiftId, mpKind, mpQtyRaw, mpStatus]);

  function handleGiftUpdated(updated: Gift) {
    setGifts((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    if (selectedGift?.id === updated.id) setSelectedGift(updated);
  }

  async function handleCopyPix() {
    await navigator.clipboard.writeText(HONEYMOON_PIX_CODE);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  }

  return (
    <>
      {selectedGift && (
        <GiftModal
          gift={selectedGift}
          onClose={() => setSelectedGift(null)}
          onGiftUpdated={handleGiftUpdated}
        />
      )}

      {showPixModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 flex items-center justify-center px-4">
          <div className="bg-cream w-full max-w-md border border-navy/15 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-serif text-navy tracking-widest uppercase text-base md:text-lg text-center w-full">
                Para contribuir
              </h3>
            </div>

            <div className="w-full flex justify-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 border border-navy/15 bg-white">
                <Image
                  src="/img/pix.png"
                  alt="QR Code Pix"
                  fill
                  className="object-contain p-2"
                />
              </div>
            </div>

            <p className="text-center text-xs text-navy/60">
              Agradecemos desde já pelo carinho!
            </p>

            <button
              onClick={handleCopyPix}
              className="w-full bg-navy text-cream py-3 text-xs tracking-[0.2em] uppercase hover:bg-navy/85 transition-colors"
            >
              {pixCopied ? "Copiado!" : "Copiar Pix"}
            </button>

            <button
              onClick={() => setShowPixModal(false)}
              className="w-full border border-navy/30 text-navy py-3 text-xs tracking-[0.2em] uppercase hover:bg-navy/5 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-cream flex flex-col w-full overflow-x-hidden">
        {/* ─── Back to Home ────────────────────────────────── */}
        <div className="w-full bg-navy px-4 md:px-8 pt-5 pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-cream/80 hover:text-cream transition-colors"
          >
            ← Retornar ao Home
          </Link>
        </div>

        {/* ─── Hero section ────────────────────────────────── */}
        <section className="w-full bg-navy text-cream py-24 px-6 flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-5xl tracking-[0.2em] mb-3 text-cream">
            SE DESEJAR
          </h1>
          <h2 className="text-3xl md:text-5xl tracking-[0.2em] mb-6 text-cream">
            NOS PRESENTEAR
          </h2>
          <p className="font-display text-base md:text-lg italic text-cream/80 max-w-md leading-relaxed">
            Cada presente é um pedacinho do seu coração chegando até nós. Se
            desejar nos agraciar, fizemos uma listinha com muito carinho!
          </p>
        </section>

        {/* ─── MP status banner ────────────────────────── */}
        {paymentBannerStatus === "success" && (
          <div className="w-full bg-green-50 border-b border-green-200 py-4 px-6 text-center">
            <p className="text-green-900 font-display text-base mb-1">Obrigada!</p>
            <p className="text-green-800 text-sm font-display">
              Pagamento confirmado! Muito obrigado pelo carinho.
            </p>
          </div>
        )}
        {paymentBannerStatus === "failure" && (
          <div className="w-full bg-red-50 border-b border-red-200 py-4 px-6 text-center">
            <p className="text-red-700 text-sm font-display">
              Pagamento não concluído. Tente novamente.
            </p>
          </div>
        )}
        {paymentBannerStatus === "pending" && (
          <div className="w-full bg-yellow-50 border-b border-yellow-200 py-4 px-6 text-center">
            <p className="text-yellow-800 text-sm font-display">
              Pagamento pendente. Você será notificado quando for aprovado.
            </p>
          </div>
        )}
        {thankYouMessage && (
          <div className="w-full bg-green-50 border-b border-green-200 py-4 px-6 text-center">
            <p className="text-green-900 text-sm font-display">{thankYouMessage}</p>
          </div>
        )}

        {/* ─── Gift grid ───────────────────────────────── */}
        <section className="w-full py-16 px-4 md:px-8 max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-24">
              <p className="text-navy/40 text-sm uppercase tracking-widest animate-pulse">
                Carregando lista...
              </p>
            </div>
          ) : gifts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-navy/40 font-display text-lg">
                Em breve a lista de presentes estará disponível.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  onGift={setSelectedGift}
                />
              ))}
            </div>
          )}
        </section>

        <section className="w-full border-t border-navy/10 py-16 px-6 flex flex-col items-center text-center">
          <h2 className="text-2xl md:text-4xl tracking-[0.2em] text-navy mb-6">
            Contribuição para a Lua de Mel
          </h2>
          <p className="max-w-2xl font-display text-base md:text-lg leading-relaxed text-navy/70 mb-8">
            Se preferir, você também pode nos presentear com uma contribuição em qualquer valor. Ficaremos muito felizes! O valor será destinado à nossa lua de mel, que já estamos planejando com muito carinho.
          </p>
          <button
            onClick={() => setShowPixModal(true)}
            className="bg-navy text-cream px-8 py-3 text-xs tracking-[0.2em] uppercase hover:bg-navy/85 transition-colors"
          >
            Contribuir
          </button>
        </section>

        {/* ─── Footer ──────────────────────────────────── */}
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

// ─── Outer page with Suspense boundary ────────────────────────────────
export default function PresentesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-cream flex items-center justify-center">
          <p className="text-navy/40 text-sm uppercase tracking-widest animate-pulse">
            Carregando...
          </p>
        </main>
      }
    >
      <PresentesContent />
    </Suspense>
  );
}
