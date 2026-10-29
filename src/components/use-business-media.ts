"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { resolveBusinessMediaUrls } from "@/lib/business-media";

/** Keep expiring display URLs separate from the durable database references. */
export function useBusinessMedia(values: readonly string[], revision = 0) {
  const db = getSupabase();
  const signature = JSON.stringify([...new Set(values.filter(Boolean))].sort());
  const [resolved, setResolved] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!db) return;
    let active = true;
    let latest = 0;
    const references = JSON.parse(signature) as string[];
    setResolved({});
    const refresh = async () => {
      if (document.hidden) return;
      const request = ++latest;
      const urls = await resolveBusinessMediaUrls(db, references);
      if (active && request === latest) setResolved(urls);
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 45_000);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [db, signature, revision]);
  return (reference: string | undefined) => reference ? resolved[reference] || "" : "";
}
