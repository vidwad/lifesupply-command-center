"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * App-wide theme provider. Wraps next-themes so the dashboard can flip
 * between light + dark via the `class="dark"` toggle that Tailwind already
 * watches (see `darkMode: ["class"]` in tailwind.config.ts).
 *
 * - `attribute="class"` adds/removes the `dark` class on <html>
 * - `defaultTheme="system"` honors the OS setting on first visit
 * - `enableSystem` keeps the system option available in the toggle
 * - `disableTransitionOnChange` prevents the brief flash of mismatched
 *   colors when toggling on dense table pages
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
