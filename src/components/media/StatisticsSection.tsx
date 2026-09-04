"use client";

import { useEffect, useRef, useState } from "react";
import { SITE_STATS, type SiteStat } from "@/lib/stats";

function Counter({ stat }: { stat: SiteStat }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Defensive fallback: if IntersectionObserver isn't available, or the
    // element is already visible with no further layout/scroll changes to
    // trigger a callback, just show the final value rather than risk it
    // being stuck at 0.
    if (typeof IntersectionObserver === "undefined") {
      setDisplay(stat.value);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 900;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setDisplay(Math.round(progress * stat.value));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [stat.value]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
        {display}
        {stat.suffix}
      </p>
      <p className="mt-2 text-sm text-zinc-400">{stat.label}</p>
    </div>
  );
}

export default function StatisticsSection() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-6">
      {SITE_STATS.map((stat) => (
        <Counter key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
