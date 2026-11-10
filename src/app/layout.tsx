import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { ThemeProvider } from "@/components/theme/theme-provider";
import "@/styles/globals.css";

// Screen-optimized typography for a long-session management UI.
//
// Inter — high x-height + wide letter spacing keeps small body text legible;
// reading SKUs, order numbers, and dollar figures back-to-back is the
// dominant task in this app. Inter's character variants disambiguate
// 1/i/l, 0/O, single-storey a, and curved-tail letters — turned on via
// font-feature-settings in globals.css.
//
// JetBrains Mono — slashed zero, distinct 1/l, generous letter spacing for
// the mono spans used in audit logs, automation steps, and IDs.
//
// `display: swap` shows the system fallback during the (brief) font fetch
// so users never see invisible text. `variable` exposes each family as a
// CSS variable that tailwind.config.ts already references.
//
// The files ship with the repository (src/app/fonts, see its README) rather
// than being downloaded from Google Fonts at build time: that download made
// every build depend on the network and failed the CI build check when it
// did (2026-11-10). They are the same variable Latin files Google serves, so
// nothing about the rendered type changes. A local font's family name is its
// identifier, so these are named for the families; every stylesheet reads
// the CSS variables, never the names.
const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  weight: "100 800",
  display: "swap",
  variable: "--font-mono",
});

// The public LifeSupply experience preserves the type families used by the
// legacy corporate site. They are exposed only as variables; the authenticated
// Command Center continues to use the Inter/JetBrains system above.
const roboto = localFont({
  src: "./fonts/roboto-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-lsh-body",
});

const robotoCondensed = localFont({
  src: "./fonts/roboto-condensed-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-lsh-display",
});

/**
 * `viewport-fit=cover` lets the phone's bottom key bar pad itself above the
 * home indicator with `env(safe-area-inset-bottom)` (2026-11-03).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // The standalone app's status bar and the browser's address bar colour.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020817" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "LifeSupply Health",
    template: "%s | LifeSupply Health",
  },
  description:
    "Corporate information, operations, leadership, and investor context from LifeSupply Health.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${roboto.variable} ${robotoCondensed.variable}`}
    >
      {/* `min-h-dvh` is the phone's visible height; `min-h-screen` (100vh) is the
          taller address-bar-hidden height, which let the document scroll by the
          difference and carry the dashboard's top bar off the screen
          (2026-11-04). The first stays as the fallback. */}
      <body className="min-h-dvh min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
