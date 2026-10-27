"use client";

/** Re-renders a live run page every few seconds, without a full reload. */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ seconds }: { seconds: number }): null {
  const router = useRouter();
  useEffect(() => {
    const handle = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(handle);
  }, [router, seconds]);
  return null;
}
