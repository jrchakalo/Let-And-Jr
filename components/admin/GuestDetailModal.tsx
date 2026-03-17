"use client";

import { useState } from "react";
import { Guest } from "@/lib/types";

interface GuestDetailModalProps {
  guest: Guest | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (guestId: string, newStatus: "CONFIRMED" | "DECLINED") => Promise<void>;
}

export function GuestDetailModal({
  guest,
  isOpen,
  onClose,
  onStatusChange,
}: GuestDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"CONFIRMED" | "DECLINED" | null>(null);

  if (!isOpen || !guest) return null;

  const statusBadgeClass = {
    PENDING: "bg-navy/10 text-navy/50",
    CONFIRMED: "bg-green-100 text-green-700",
    DECLINED: "bg-red-100 text-red-600",
  };

  const statusLabel = {
    PENDING: "Aguardando resposta",
    CONFIRMED: "Presença confirmada",
    DECLINED: "Não comparecerá",
  };

  const handleStatusClick = (newStatus: "CONFIRMED" | "DECLINED") => {
    // Se PENDING, permitir mudança direta
    if (guest.rsvp_status === "PENDING") {
      handleConfirmStatus(newStatus);
    } else {
      // Se já respondeu, mostrar modal de confirmação
      setPendingStatus(newStatus);
      setShowConfirmModal(true);
    }
  };

  const handleConfirmStatus = async (status: "CONFIRMED" | "DECLINED") => {
    setLoading(true);
    setError(null);

    try {
      await onStatusChange(guest.id, status);
      setShowConfirmModal(false);
      setPendingStatus(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar status");
    } finally {
      setLoading(false);
    }
  };

  const getConfirmMessage = (): string => {
    if (guest.rsvp_status === "CONFIRMED") {
      return "Esta presença já estava confirmada. Deseja marcar como \"Não poderá ir\"?";
    } else if (guest.rsvp_status === "DECLINED") {
      return "Esta presença já estava marcada como \"Não poderá ir\". Deseja confirmar presença?";
    }
    return "Deseja alterar o status?";
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 bg-navy/60 flex items-center justify-center px-4">
        <div className="bg-cream border border-navy/15 rounded p-6 w-full max-w-md">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-navy">Detalhes do Convidado</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-navy/50 hover:text-navy disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <div className="mb-4">
              <p className="text-sm text-navy/60 font-semibold">NOME</p>
              <p className="text-lg text-navy font-medium">{guest.name}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-navy/60 font-semibold">STATUS</p>
              <span className={`inline-block px-3 py-1 rounded text-sm ${statusBadgeClass[guest.rsvp_status]}`}>
                {statusLabel[guest.rsvp_status]}
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {guest.rsvp_status !== "CONFIRMED" && (
              <button
                onClick={() => handleStatusClick("CONFIRMED")}
                disabled={loading}
                className="flex-1 bg-navy text-cream px-4 py-2 rounded font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors"
              >
                {loading && pendingStatus === "CONFIRMED" ? "Salvando..." : "Confirmar Presença"}
              </button>
            )}

            {guest.rsvp_status !== "DECLINED" && (
              <button
                onClick={() => handleStatusClick("DECLINED")}
                disabled={loading}
                className="flex-1 border border-navy/30 text-navy px-4 py-2 rounded font-medium hover:bg-navy/5 disabled:opacity-50 transition-colors"
              >
                {loading && pendingStatus === "DECLINED" ? "Salvando..." : "Não poderei ir"}
              </button>
            )}

            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-navy/50 hover:text-navy disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] bg-navy/60 flex items-center justify-center px-4">
          <div className="bg-cream border border-navy/15 rounded p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-navy mb-4">Mudar Resposta?</h3>
            <p className="text-navy/70 text-sm mb-6">{getConfirmMessage()}</p>

            <div className="flex gap-3">
              <button
                onClick={() => handleConfirmStatus(pendingStatus!)}
                disabled={loading}
                className="flex-1 bg-navy text-cream px-4 py-2 rounded font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Salvando..." : "Sim, alterar"}
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingStatus(null);
                }}
                disabled={loading}
                className="flex-1 border border-navy/30 text-navy px-4 py-2 rounded font-medium hover:bg-navy/5 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
