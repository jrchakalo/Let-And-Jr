"use client";

import { useState } from "react";

const EVENT = {
  title: "Casamento Letícia & Júnior",
  description: "Você está convidado para o casamento de Letícia e Júnior!",
  location: "https://maps.app.goo.gl/svMZqRdS9tzEdzyx5",
  // 2026-06-04 15:30 BRT (UTC-3) = 18:30 UTC
  startUtc: "20260604T180000Z",
  endUtc: "20260605T023000Z",
  startLocal: "20260604T150000",
  endLocal: "20260604T230000",
};

function buildGoogleUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT.title,
    dates: `${EVENT.startUtc}/${EVENT.endUtc}`,
    details: EVENT.description,
    location: EVENT.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadIcs() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Leticia e Junior Casamento//PT",
    "BEGIN:VEVENT",
    `DTSTART;TZID=America/Sao_Paulo:${EVENT.startLocal}`,
    `DTEND;TZID=America/Sao_Paulo:${EVENT.endLocal}`,
    `SUMMARY:${EVENT.title}`,
    `DESCRIPTION:${EVENT.description}`,
    `LOCATION:${EVENT.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "casamento-leticia-junior.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function AddToCalendarButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="border border-navy/40 px-5 py-2 text-[10px] uppercase tracking-widest text-navy hover:bg-navy hover:text-cream transition-colors duration-200"
      >
        Marque em seu calendário!
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute left-1/2 -translate-x-1/2 mt-1 z-20 bg-cream border border-navy/15 shadow-lg min-w-[200px] flex flex-col">
            <a
              href={buildGoogleUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="px-4 py-3 text-[11px] uppercase tracking-widest text-navy hover:bg-navy/5 transition-colors text-left"
            >
              Google Calendar
            </a>
            <button
              onClick={() => {
                downloadIcs();
                setOpen(false);
              }}
              className="px-4 py-3 text-[11px] uppercase tracking-widest text-navy hover:bg-navy/5 transition-colors text-left border-t border-navy/10"
            >
              Apple / Outros
            </button>
          </div>
        </>
      )}
    </div>
  );
}
