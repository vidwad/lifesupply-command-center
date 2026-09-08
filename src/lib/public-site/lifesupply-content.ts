/**
 * Governed public content — the single source every public sentence renders
 * from (or, later, a published DTO). Components receive it as props and add
 * only imperative UI labels of their own ("Visit brand", "Skip to content").
 *
 * Stage 2 split the model into focused modules under `./content/` by
 * content family; this barrel keeps the import path and the shape stable.
 * Provenance notes live beside each block in the modules. Brands, routes,
 * and actions have their own typed registries (`brands.ts`, `routes.ts`,
 * `actions.ts`), which is where every destination is resolved.
 */
import { about } from "@/lib/public-site/content/about";
import { brand } from "@/lib/public-site/content/brand";
import { contact } from "@/lib/public-site/content/contact";
import { homepage } from "@/lib/public-site/content/home";
import { investorRelations } from "@/lib/public-site/content/investors";
import { news } from "@/lib/public-site/content/news";
import { operations, operationsTimeline } from "@/lib/public-site/content/operations";
import { team } from "@/lib/public-site/content/team";

export { LIFE_SUPPLY_NAVIGATION, LIFE_SUPPLY_ROUTES } from "@/lib/public-site/routes";

export const LIFE_SUPPLY_CONTENT = {
  brand,
  homepage,
  about,
  operations,
  team,
  investorRelations,
  news,
  contact,
  operationsTimeline,
} as const;
