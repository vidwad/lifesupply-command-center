"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const PERIOD_PARAM = "period";
export const DIVISION_PARAM = "division";

export type ContextOption = { value: string; label: string };

/**
 * The division and period context live in the address, so every page reads
 * them the same way and a shared link carries them. Both selectors, the top
 * bar's and the drawer's, change them through this one hook.
 */
export function useContextParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return {
    selectedDivision: searchParams.get(DIVISION_PARAM) ?? "",
    selectedPeriod: searchParams.get(PERIOD_PARAM) ?? "",
    setDivision: (value: string) => updateParam(DIVISION_PARAM, value),
    setPeriod: (value: string) => updateParam(PERIOD_PARAM, value),
  };
}
