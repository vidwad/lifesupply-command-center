/**
 * Shop & Services (`/shop/`) copy for Stage 3. The page keeps its URL and
 * the visible title "Shop & Services". It sells nothing: it routes to the
 * four operating destinations with their geography, currency, and support
 * boundary. Store terms are never restated (guide §5 commerce contract).
 */
export const shop = {
  eyebrow: "Shop & Services",
  title: "Choose the right store or service.",
  intro:
    "This corporate site does not sell products or take orders. Each destination below has its own catalogue, accounts, currency, prices, and customer support.",
  geography: {
    title: "Geography and currency",
    text: "The Canadian stores price in Canadian dollars and ship within Canada. Balkowitsch Worldwide prices in U.S. dollars and ships from the United States. Shipping thresholds, delivery times, and returns are published on each store.",
  },
  support: {
    title: "Support boundary",
    text: "For an existing order, contact the store that took it. This site cannot see or change store orders. For clinic projects, equipment quotes, and supply programs, use the Contact page's intent routing.",
  },
  choices: [
    {
      brand: "lifesupply",
      role: "Medical, health, and home-care supplies; clinic supplies for professional buyers.",
      action: "shop_lifesupply",
    },
    {
      brand: "wellmart",
      role: "Home medical equipment and supplies.",
      action: "shop_wellmart",
    },
    {
      brand: "clinics",
      role: "Clinic planning, design, construction, and equipment inquiries.",
      action: "shop_clinics",
    },
    {
      brand: "balkowitsch",
      role: "U.S. medical, health, wellness, and related categories.",
      action: "shop_balkowitsch",
    },
  ],
} as const;
