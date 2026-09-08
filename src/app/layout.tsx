import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Roboto, Roboto_Condensed } from "next/font/google";

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
const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

// The public LifeSupply experience preserves the type families used by the
// legacy corporate site. They are exposed only as variables; the authenticated
// Command Center continues to use the Inter/JetBrains system above.
const lifeSupplyBody = Roboto({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lsh-body",
  weight: ["400", "500", "700"],
});

const lifeSupplyDisplay = Roboto_Condensed({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lsh-display",
  weight: ["400", "500", "600", "700"],
});

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
      className={`${sans.variable} ${mono.variable} ${lifeSupplyBody.variable} ${lifeSupplyDisplay.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
