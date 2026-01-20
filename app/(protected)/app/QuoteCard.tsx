"use client";

import { useEffect, useMemo, useState } from "react";

type Quote = {
  text: string;
  author?: string;
};

const FALLBACK_QUOTE: Quote = {
  text: "Small, steady steps shape a life you love.",
  author: "Unknown",
};

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function QuoteCard() {
  const todayKey = useMemo(getTodayKey, []);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const storageKey = `quote-${todayKey}`;

    const setAndStore = (value: Quote) => {
      if (!cancelled) {
        setQuote(value);
        setLoading(false);
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        // Ignore storage errors
      }
    };

    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Quote;
        if (parsed?.text) {
          setAndStore(parsed);
          return;
        }
      }
    } catch {
      // Ignore cache parse errors
    }

    async function loadQuote() {
      try {
        const response = await fetch("https://zenquotes.io/api/random");
        if (!response.ok) {
          throw new Error("Request failed");
        }

        const payload = await response.json();
        const first = Array.isArray(payload) ? payload[0] : null;
        const text = first?.q;
        const author = first?.a;

        if (typeof text === "string") {
          setAndStore({
            text,
            author: typeof author === "string" ? author : undefined,
          });
          return;
        }

        setAndStore(FALLBACK_QUOTE);
      } catch {
        setAndStore(FALLBACK_QUOTE);
      }
    }

    loadQuote();

    return () => {
      cancelled = true;
    };
  }, [todayKey]);

  return (
    <div className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white/70 p-8 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
        Quote of the day
      </p>
      {loading || !quote ? (
        <p className="mt-4 text-neutral-500">Loading...</p>
      ) : (
        <div className="mt-4 space-y-2 text-left">
          <p className="text-lg leading-relaxed text-neutral-900">"{quote.text}"</p>
          {quote.author ? (
            <p className="text-sm text-neutral-600">- {quote.author}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
