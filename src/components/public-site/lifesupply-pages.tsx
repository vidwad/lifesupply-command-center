/*
 * Every visible sentence below is a prop from LIFE_SUPPLY_CONTENT. The only
 * strings authored in this file are imperative UI labels on links.
 *
 * Each page renders exactly one PublicHero, which is the route's single h1.
 *
 * Page families live in `./pages/` and are re-exported here so the route
 * files keep one import: Home and About (Stage 2); Our Businesses, the four
 * brand pages, Technology & fulfilment, Clinic Solutions, Shop & Services,
 * and Contact (Stage 3); Metabolic Health, the care-kit hub, the kit pages,
 * and Refills (Stage 4); Partners, the investor pages, Team and profiles,
 * News and resources, and the policy pages (Stage 5).
 */
export { AboutPage } from "@/components/public-site/pages/about";
export {
  ClinicsBrandPage,
  StoreBrandPage,
  TechnologyFulfilmentPage,
} from "@/components/public-site/pages/brands";
export {
  ClinicSolutionsPage,
  DesignBuildPage,
  EquipmentPage,
  OngoingSuppliesPage,
} from "@/components/public-site/pages/clinic-solutions";
export { ContactPage } from "@/components/public-site/pages/contact";
export { LifeSupplyHome } from "@/components/public-site/pages/home";
export {
  CareKitPage,
  CareKitsPage,
  MetabolicHealthPage,
  RefillsPage,
} from "@/components/public-site/pages/metabolic";
export {
  AdvancedTherapeuticsPage,
  DisclosuresPage,
  GrowthStrategyPage,
  InvestorDocumentsPage,
  InvestorRelationsPage,
  ShareholderServicesPage,
} from "@/components/public-site/pages/investors";
export { NewsItemPage, NewsPage, ResourcePage } from "@/components/public-site/pages/news";
export { OperationsPage } from "@/components/public-site/pages/operations";
export {
  PartnerAcquisitionsPage,
  PartnerClinicsPage,
  PartnerPharmaciesPage,
  PartnersPage,
  PartnerSuppliersPage,
} from "@/components/public-site/pages/partners";
export { PolicyPage } from "@/components/public-site/pages/policies";
export { ShopServicesPage } from "@/components/public-site/pages/shop";
export { LegacyProfilePage, TeamPage } from "@/components/public-site/pages/team";
