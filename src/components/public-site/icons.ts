/**
 * Icon registry for the public site. Content modules name an icon by key;
 * components resolve it here, so the content stays free of React imports
 * and a typo cannot render a missing glyph (the fallback is a neutral dot).
 * All icons are lucide, already a dependency.
 */
import { createElement, type ComponentType, type ReactElement } from "react";
import {
  Activity,
  BadgeCheck,
  Banknote,
  Boxes,
  Briefcase,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Compass,
  FileText,
  FlaskConical,
  Globe2,
  HandCoins,
  Handshake,
  HeartPulse,
  Landmark,
  LayoutGrid,
  LineChart,
  Mail,
  MapPin,
  Microscope,
  Package,
  PackageCheck,
  Pill,
  Play,
  Repeat,
  Ruler,
  ScrollText,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Syringe,
  Thermometer,
  Truck,
  Users,
  Warehouse,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import {
  InvestorInformation,
  OperatingBusinesses,
  PartnershipOpportunities,
} from "@/components/public-site/custom-icons";

export const ICONS = {
  activity: Activity,
  badge: BadgeCheck,
  banknote: Banknote,
  boxes: Boxes,
  briefcase: Briefcase,
  building: Building2,
  clipboardCheck: ClipboardCheck,
  clipboardList: ClipboardList,
  compass: Compass,
  file: FileText,
  flask: FlaskConical,
  globe: Globe2,
  handCoins: HandCoins,
  handshake: Handshake,
  heart: HeartPulse,
  landmark: Landmark,
  layout: LayoutGrid,
  chart: LineChart,
  mail: Mail,
  pin: MapPin,
  microscope: Microscope,
  package: Package,
  packageCheck: PackageCheck,
  pill: Pill,
  play: Play,
  repeat: Repeat,
  ruler: Ruler,
  scroll: ScrollText,
  search: Search,
  settings: Settings2,
  shield: ShieldCheck,
  cart: ShoppingCart,
  stethoscope: Stethoscope,
  syringe: Syringe,
  thermometer: Thermometer,
  truck: Truck,
  users: Users,
  warehouse: Warehouse,
  workflow: Workflow,
  // Drawn for this site where lucide had no equivalent that said the right
  // thing; same 24-unit grid and stroke, so they sit beside the stock set.
  operatingBusinesses: OperatingBusinesses,
  partnershipOpportunities: PartnershipOpportunities,
  investorInformation: InvestorInformation,
} satisfies Record<string, SiteIcon>;

export type IconKey = keyof typeof ICONS;

/**
 * Any icon this site can render: a lucide glyph or one of the three drawn
 * for it. Both take the same size, stroke and class props.
 */
type SiteIcon = LucideIcon | ComponentType<IconProps>;
type IconProps = { size?: number; strokeWidth?: number; className?: string };

/** Render a registered icon, or nothing for an unknown key. */
export function renderIcon(key: string | undefined, props: IconProps = {}): ReactElement | null {
  const Icon = iconFor(key);
  return Icon ? createElement(Icon, props) : null;
}

export function iconFor(key: string | undefined): SiteIcon | null {
  if (!key) return null;
  return (ICONS as Record<string, SiteIcon>)[key] ?? null;
}
