"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import type { Gift, GiftContribution } from "@/lib/types";
import { createBrowserClient } from "@/lib/supabase/client";

// ─── Gift Form Modal ────────────────────────────────────────────────────
function GiftFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Gift;
  onClose: () => void;
  onSaved: (g: Gift) => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    price: initial?.price?.toString() ?? "",
    image_url: initial?.image_url ?? "",
    store_url: initial?.store_url ?? "",
    is_cota: initial?.is_cota ?? false,
    cota_value: initial?.cota_value?.toString() ?? "",
    units_total: (initial?.units_total ?? 1).toString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = initial
        ? `/api/admin/gifts/${initial.id}`
        : "/api/admin/gifts";
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price) || 0,
          image_url: form.image_url || null,
          store_url: form.store_url || null,
          is_cota: form.is_cota,
          cota_value: form.is_cota && form.cota_value ? parseFloat(form.cota_value) : null,
          units_total: form.units_total ? parseInt(form.units_total, 10) : 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved(data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy/50 flex items-center justify-center px-4">
      <div className="bg-cream border border-navy/15 p-6 w-full max-w-md flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-serif text-navy tracking-widest uppercase text-sm">
          {initial ? "Editar Presente" : "Novo Presente"}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nome do presente"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            className="border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          />
          <input
            type="number"
            placeholder="Valor (R$)"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            min="0"
            step="0.01"
            className="border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          />
          <input
            type="url"
            placeholder="URL da imagem (opcional)"
            value={form.image_url}
            onChange={(e) => update("image_url", e.target.value)}
            className="border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          />
          <input
            type="url"
            placeholder="URL da loja online (opcional)"
            value={form.store_url}
            onChange={(e) => update("store_url", e.target.value)}
            className="border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          />
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              checked={form.is_cota}
              onChange={(e) => update("is_cota", e.target.checked)}
              className="accent-navy"
            />
            É uma cota (contribuição parcial)
          </label>
          {form.is_cota && (
            <input
              type="number"
              placeholder="Valor por cota (R$)"
              value={form.cota_value}
              onChange={(e) => update("cota_value", e.target.value)}
              min="0.01"
              step="0.01"
              className="border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
            />
          )}
          {!form.is_cota && (
            <input
              type="number"
              placeholder="Quantidade de unidades"
              value={form.units_total}
              onChange={(e) => update("units_total", e.target.value)}
              min="1"
              step="1"
              className="border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
            />
          )}
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-navy text-cream py-2 text-xs tracking-widest uppercase disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar"}
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

// ─── Gift Row ────────────────────────────────────────────────────────────
function GiftRow({
  gift,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onCancelReserve,
}: {
  gift: Gift;
  onEdit: () => void;
  onDelete: () => void;
  onMarkAsPaid: () => void;
  onCancelReserve: () => void;
}) {
  const price = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(gift.price);

  const statusColor: Record<string, string> = {
    AVAILABLE: "text-navy/40",
    RESERVED: "text-yellow-600",
    PAID: "text-green-600",
    CLAIMED_MANUALLY: "text-blue-600",
  };
  const statusLabel: Record<string, string> = {
    AVAILABLE: "Disponível",
    RESERVED: `Reservado (${gift.reserved_by_name ?? "?"})`,
    PAID: `Pago (${gift.reserved_by_name ?? "?"})`,
    CLAIMED_MANUALLY: `Manual (${gift.reserved_by_name ?? "?"})`,
  };

  return (
    <tr className="border-b border-navy/10 hover:bg-navy/2">
      <td className="py-3 pr-3">
        {gift.image_url ? (
          <div className="relative w-10 h-10 shrink-0">
            <Image
              src={gift.image_url}
              alt={gift.name}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-navy/5 flex items-center justify-center text-navy/20 text-xs">
            ?
          </div>
        )}
      </td>
      <td className="py-3 pr-3">
        <p className="text-sm text-navy">{gift.name}</p>
        {gift.is_cota && gift.cota_value && (
          <span className="text-[10px] text-navy/40 uppercase tracking-widest">
            cota · {gift.cotas_paid ?? 0}/{Math.ceil(gift.price / gift.cota_value)} pagas
          </span>
        )}
        {gift.is_cota && !gift.cota_value && (
          <span className="text-[10px] text-navy/40 uppercase tracking-widest">cota</span>
        )}
        {!gift.is_cota && (
          <span className="text-[10px] text-navy/40 uppercase tracking-widest">
            unidades · {gift.units_remaining ?? 1}/{gift.units_total ?? 1} disponíveis
          </span>
        )}
      </td>
      <td className="py-3 pr-3 text-sm text-navy whitespace-nowrap">{price}</td>
      <td className={`py-3 pr-3 text-xs ${statusColor[gift.status]}`}>
        {statusLabel[gift.status]}
      </td>
      <td className="py-3 flex gap-2 justify-end">
        {gift.status === "RESERVED" && (
          <button
            onClick={onMarkAsPaid}
            className="text-xs text-green-700 hover:text-green-800 border border-green-200 px-2 py-1"
          >
            Marcar presenteado
          </button>
        )}
        {gift.status === "RESERVED" && (
          <button
            onClick={onCancelReserve}
            className="text-xs text-amber-700 hover:text-amber-800 border border-amber-200 px-2 py-1"
          >
            Cancelar reserva
          </button>
        )}
        <button
          onClick={onEdit}
          className="text-xs text-navy/50 hover:text-navy border border-navy/20 px-2 py-1"
        >
          Editar
        </button>
        <button
          onClick={onDelete}
          className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1"
        >
          Remover
        </button>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function PresentesAdminPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [contributions, setContributions] = useState<GiftContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | undefined>();
  const [viewMode, setViewMode] = useState<"gifts" | "contributions">("gifts");

  const fetchGifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gifts");
      const data = await res.json();
      setGifts(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContributions = useCallback(async () => {
    const res = await fetch("/api/admin/contributions");
    const data = await res.json();
    setContributions(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    fetchGifts();
    fetchContributions();
  }, [fetchGifts, fetchContributions]);

  useEffect(() => {
    if (!supabase) return;

    const handleFocus = () => {
      fetchGifts();
      fetchContributions();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchGifts();
        fetchContributions();
      }
    };

    const channel = supabase
      .channel("admin-presentes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gifts" },
        () => {
          fetchGifts();
          fetchContributions();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gift_contributions" },
        () => fetchContributions()
      )
      .subscribe();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchContributions, fetchGifts, supabase]);

  function handleSaved(gift: Gift) {
    setGifts((prev) => {
      const idx = prev.findIndex((g) => g.id === gift.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = gift;
        return next;
      }
      return [...prev, gift];
    });
  }

  async function handleDelete(giftId: string) {
    if (!confirm("Remover este presente da lista?")) return;
    await fetch(`/api/admin/gifts/${giftId}`, { method: "DELETE" });
    setGifts((prev) => prev.filter((g) => g.id !== giftId));
  }

  async function handleMarkAsPaid(gift: Gift) {
    const res = await fetch(`/api/admin/gifts/${gift.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      alert("Não foi possível atualizar o status deste presente.");
      return;
    }

    handleSaved(data as Gift);
  }

  async function handleCancelReserve(gift: Gift) {
    const res = await fetch(`/api/admin/gifts/${gift.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "AVAILABLE" }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      alert("Não foi possível cancelar a reserva deste presente.");
      return;
    }

    handleSaved(data as Gift);
  }

  const available = gifts.filter((g) => g.status === "AVAILABLE").length;
  const taken = gifts.length - available;

  const giftStatusLabel: Record<Gift["status"], string> = {
    AVAILABLE: "Disponível",
    RESERVED: "Reservado",
    PAID: "Pago",
    CLAIMED_MANUALLY: "Manual",
  };

  const deliveryLabel: Record<GiftContribution["contribution_type"], string> = {
    MERCADOPAGO_GIFT: "Mercado Pago",
    MERCADOPAGO_COTA: "Mercado Pago (Cota)",
    MANUAL_CLAIM: "Entrega em mãos",
    STORE_CONFIRM: "Compra em loja",
    MANUAL_COTA: "Cota manual",
  };

  function displayContributionEmail(email: string | null) {
    if (!email) return "-";
    const trimmed = email.trim();
    if (!trimmed.includes("@")) return "-";
    return trimmed;
  }

  function contributionGiftStatus(c: GiftContribution) {
    if (!c.gift?.status) return "-";
    const isCotaContribution =
      c.contribution_type === "MERCADOPAGO_COTA" || c.contribution_type === "MANUAL_COTA";

    if (isCotaContribution && c.gift.status === "AVAILABLE") {
      return "Cota recebida";
    }

    return giftStatusLabel[c.gift.status];
  }

  return (
    <div className="flex flex-col gap-6">
      {(showForm || editingGift) && (
        <GiftFormModal
          initial={editingGift}
          onClose={() => { setShowForm(false); setEditingGift(undefined); }}
          onSaved={handleSaved}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl text-navy tracking-[0.2em]">
            PRESENTES
          </h1>
          <p className="text-navy/50 text-xs mt-1">
            {gifts.length} itens · {available} disponíveis · {taken} reservados/comprados
          </p>
        </div>
        <button
          onClick={() => { setEditingGift(undefined); setShowForm(true); }}
          className="bg-navy text-cream px-4 py-2 text-xs tracking-widest uppercase whitespace-nowrap"
        >
          + Novo presente
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("gifts")}
          className={`px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors ${
            viewMode === "gifts"
              ? "bg-navy text-cream border-navy"
              : "border-navy/30 text-navy/60 hover:text-navy"
          }`}
        >
          Presentes
        </button>
        <button
          onClick={() => setViewMode("contributions")}
          className={`px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors ${
            viewMode === "contributions"
              ? "bg-navy text-cream border-navy"
              : "border-navy/30 text-navy/60 hover:text-navy"
          }`}
        >
          Contribuições
        </button>
      </div>

      {loading ? (
        <p className="text-navy/40 text-sm animate-pulse">Carregando...</p>
      ) : viewMode === "gifts" && gifts.length === 0 ? (
        <p className="text-navy/40 text-sm">Nenhum presente cadastrado.</p>
      ) : viewMode === "gifts" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead>
              <tr className="border-b-2 border-navy/10 text-left">
                <th className="py-2 pr-3 text-[10px] uppercase tracking-widest text-navy/40 w-12" />
                <th className="py-2 pr-3 text-[10px] uppercase tracking-widest text-navy/40">
                  Nome
                </th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-widest text-navy/40">
                  Valor
                </th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-widest text-navy/40">
                  Status
                </th>
                <th className="py-2 text-[10px] uppercase tracking-widest text-navy/40 text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((g) => (
                <GiftRow
                  key={g.id}
                  gift={g}
                  onEdit={() => { setEditingGift(g); setShowForm(false); }}
                  onDelete={() => handleDelete(g.id)}
                  onMarkAsPaid={() => handleMarkAsPaid(g)}
                  onCancelReserve={() => handleCancelReserve(g)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : contributions.length === 0 ? (
        <p className="text-navy/40 text-sm">Nenhuma contribuição registrada ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b-2 border-navy/10 text-left">
                <th className="py-2 pr-3 text-[10px] uppercase tracking-widest text-navy/40">Nome</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-widest text-navy/40">E-mail</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-widest text-navy/40">Presente</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-widest text-navy/40">Entrega</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-widest text-navy/40">Status Presente</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-widest text-navy/40">Qtd.</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-widest text-navy/40">Valor</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-widest text-navy/40">Data</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c) => (
                <tr key={c.id} className="border-b border-navy/5">
                  <td className="py-2 pr-3 text-sm text-navy/80">{c.contributor_name}</td>
                  <td className="py-2 pr-3 text-xs text-navy/60">{displayContributionEmail(c.contributor_email)}</td>
                  <td className="py-2 pr-3 text-xs text-navy/70">{c.gift?.name ?? c.gift_id}</td>
                  <td className="py-2 pr-3 text-xs text-navy/60">{deliveryLabel[c.contribution_type]}</td>
                  <td className="py-2 pr-3 text-xs text-navy/60">
                    {contributionGiftStatus(c)}
                  </td>
                  <td className="py-2 pr-3 text-xs text-navy/60">{c.quantity}</td>
                  <td className="py-2 pr-3 text-xs text-navy/60">
                    {c.amount !== null
                      ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(c.amount)
                      : "-"}
                  </td>
                  <td className="py-2 pr-3 text-xs text-navy/50">
                    {new Date(c.created_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
