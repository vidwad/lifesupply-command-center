/**
 * Icon registry for the public site. Content modules name an icon by key;
 * components resolve it here, so the content stays free of React imports
 * and a typo cannot render a missing glyph (the fallback is a neutral dot).
 * All icons are lucide, already a dependency.
 */
import { createElement, type ReactElement } from "react";
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
} satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICONS;

/** Render a registered icon, or nothing for an unknown key. */
export function renderIcon(
  key: string | undefined,
  props: { size?: number; strokeWidth?: number; className?: string } = {},
): ReactElement | null {
  const Icon = iconFor(key);
  return Icon ? createElement(Icon, props) : null;
}

export function iconFor(key: string | undefined): LucideIcon | null {
  if (!key) return null;
  return (ICONS as Record<string, LucideIcon>)[key] ?? null;
}
