"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Countdown({
  targetDate,
  className,
}: {
  targetDate: string;
  className?: string;
}) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className={cn("flex gap-4 md:gap-8 text-center text-navy", className)}>
      <div className="flex flex-col items-center">
        <span className="text-3xl md:text-5xl font-serif">{timeLeft.days}</span>
        <span className="text-xs uppercase tracking-widest mt-2 opacity-70">
          Dias
        </span>
      </div>
      <span className="text-3xl md:text-5xl font-serif opacity-50">:</span>
      <div className="flex flex-col items-center">
        <span className="text-3xl md:text-5xl font-serif">
          {timeLeft.hours.toString().padStart(2, "0")}
        </span>
        <span className="text-xs uppercase tracking-widest mt-2 opacity-70">
          Horas
        </span>
      </div>
      <span className="text-3xl md:text-5xl font-serif opacity-50">:</span>
      <div className="flex flex-col items-center">
        <span className="text-3xl md:text-5xl font-serif">
          {timeLeft.minutes.toString().padStart(2, "0")}
        </span>
        <span className="text-xs uppercase tracking-widest mt-2 opacity-70">
          Min
        </span>
      </div>
      <span className="text-3xl md:text-5xl font-serif opacity-50">:</span>
      <div className="flex flex-col items-center">
        <span className="text-3xl md:text-5xl font-serif">
          {timeLeft.seconds.toString().padStart(2, "0")}
        </span>
        <span className="text-xs uppercase tracking-widest mt-2 opacity-70">
          Seg
        </span>
      </div>
    </div>
  );
}
