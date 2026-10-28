"use client";

/**
 * Refreshes the page while a seller-image search runs on the worker. Mounted
 * only while the search is queued or running, so unmounting is what stops
 * it; the same polling approach as the workflow progress card, for the same
 * reasons (no realtime transport; a refresh is one cached RSC request).
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 4_000;

export function SearchPoller(): null {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
