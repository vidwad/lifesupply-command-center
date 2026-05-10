import { Prisma, type PrismaClient } from "@prisma/client";

const SEED_SOURCE = "seed";

// -----------------------------------------------------------------------------
// Divisions & stores — docs/04 §4
// -----------------------------------------------------------------------------

const DIVISIONS = [
  { code: "LSC", name: "LifeSupply Canada", type: "operating", jurisdiction: "CA" },
  { code: "WMM", name: "Wellmart Medical", type: "operating", jurisdiction: "CA" },
  { code: "LSU", name: "LifeSupply U.S.", type: "operating", jurisdiction: "US" },
  { code: "CONS", name: "Consolidated", type: "consolidated", jurisdiction: "GLOBAL" },
] as const;

const STORES = [
  {
    externalStoreId: "lifesupply-ca",
    name: "LifeSupply.ca",
    platform: "bigcommerce",
    url: "https://www.lifesupply.ca",
    divisionCode: "LSC",
  },
  {
    externalStoreId: "wellmartmedical-com",
    name: "WellmartMedical.com",
    platform: "bigcommerce",
    url: "https://www.wellmartmedical.com",
    divisionCode: "WMM",
  },
  {
    externalStoreId: "amazon-us",
    name: "Amazon US",
    platform: "amazon",
    url: "https://www.amazon.com",
    divisionCode: "LSU",
  },
] as const;

// -----------------------------------------------------------------------------
// Suppliers — docs/04 §6
// -----------------------------------------------------------------------------

const SUPPLIERS = [
  {
    code: "BBM01",
    name: "Best Buy Medical",
    type: "distributor",
    portalUrl: "https://portal.bestbuymedical.example",
    apiAvailable: false,
    automationAvailable: true,
    primaryContactName: "Dispatch Team",
    primaryContactEmail: "orders@bestbuymedical.example",
    notes: "Wellmart's primary dropship supplier. Portal-only; automation candidate.",
  },
  {
    code: "MEDD01",
    name: "MedDirect Distribution",
    type: "distributor",
    portalUrl: "https://orders.meddirect.example",
    apiAvailable: true,
    automationAvailable: false,
    primaryContactName: "Sales Desk",
    primaryContactEmail: "sales@meddirect.example",
    notes: "API-available secondary supplier for clinical PPE.",
  },
  {
    code: "HSI01",
    name: "Halton Surgical Inc.",
    type: "manufacturer",
    portalUrl: "https://halton-surgical.example",
    apiAvailable: false,
    automationAvailable: false,
    primaryContactName: "Account Mgr.",
    primaryContactEmail: "accounts@halton-surgical.example",
    notes: "Manufacturer for select wound-care SKUs.",
  },
] as const;

// -----------------------------------------------------------------------------
// Categories
// -----------------------------------------------------------------------------

type CategorySeed = {
  sourceId: string;
  name: string;
  storeKey: (typeof STORES)[number]["externalStoreId"];
  parentSourceId?: string;
};

const CATEGORIES: CategorySeed[] = [
  { sourceId: "ls-ppe", name: "Personal Protective Equipment", storeKey: "lifesupply-ca" },
  {
    sourceId: "ls-ppe-gloves",
    name: "Gloves",
    storeKey: "lifesupply-ca",
    parentSourceId: "ls-ppe",
  },
  { sourceId: "ls-ppe-masks", name: "Masks", storeKey: "lifesupply-ca", parentSourceId: "ls-ppe" },
  { sourceId: "ls-ppe-gowns", name: "Gowns", storeKey: "lifesupply-ca", parentSourceId: "ls-ppe" },
  { sourceId: "ls-wound-care", name: "Wound Care", storeKey: "lifesupply-ca" },
  { sourceId: "ls-diagnostics", name: "Diagnostics", storeKey: "lifesupply-ca" },
  { sourceId: "ls-mobility", name: "Mobility & Aids", storeKey: "lifesupply-ca" },
  { sourceId: "wm-ppe", name: "PPE", storeKey: "wellmartmedical-com" },
  { sourceId: "wm-home-care", name: "Home Care", storeKey: "wellmartmedical-com" },
  { sourceId: "wm-diagnostics", name: "Home Diagnostics", storeKey: "wellmartmedical-com" },
];

// -----------------------------------------------------------------------------
// Products & variants
// -----------------------------------------------------------------------------

type ProductSeed = {
  sourceId: string;
  name: string;
  sku: string;
  brand?: string;
  description: string;
  storeKey: (typeof STORES)[number]["externalStoreId"];
  categorySourceId: string;
  imageStatus: "missing" | "present" | "needs_review" | "validated";
  descriptionStatus: "missing" | "present" | "needs_review" | "validated";
  isFeatured?: boolean;
  isRockstarCandidate?: boolean;
  variants: {
    sku: string;
    optionSummary?: string;
    price: number;
    costPrice: number;
    stockLevel?: number;
  }[];
  suppliers: { supplierCode: string; supplierSku: string; cost: number; isPreferred?: boolean }[];
};

const PRODUCTS: ProductSeed[] = [
  {
    sourceId: "p-nitrile-gloves-bx100",
    name: "Nitrile Examination Gloves (BX 100)",
    sku: "LS-GLV-NIT-100",
    brand: "MedSafe",
    description: "Powder-free nitrile examination gloves, latex-free, 4 mil thickness.",
    storeKey: "lifesupply-ca",
    categorySourceId: "ls-ppe-gloves",
    imageStatus: "validated",
    descriptionStatus: "present",
    isFeatured: true,
    isRockstarCandidate: true,
    variants: [
      {
        sku: "LS-GLV-NIT-100-S",
        optionSummary: "Small",
        price: 18.95,
        costPrice: 9.5,
        stockLevel: 320,
      },
      {
        sku: "LS-GLV-NIT-100-M",
        optionSummary: "Medium",
        price: 18.95,
        costPrice: 9.5,
        stockLevel: 410,
      },
      {
        sku: "LS-GLV-NIT-100-L",
        optionSummary: "Large",
        price: 18.95,
        costPrice: 9.5,
        stockLevel: 285,
      },
      {
        sku: "LS-GLV-NIT-100-XL",
        optionSummary: "X-Large",
        price: 18.95,
        costPrice: 9.5,
        stockLevel: 140,
      },
    ],
    suppliers: [
      { supplierCode: "MEDD01", supplierSku: "MD-NIT-100", cost: 9.5, isPreferred: true },
      { supplierCode: "BBM01", supplierSku: "BBM-NTL-100", cost: 9.85 },
    ],
  },
  {
    sourceId: "p-3ply-masks-bx50",
    name: "3-Ply Surgical Masks (BX 50)",
    sku: "LS-MSK-3PLY-50",
    brand: "MedSafe",
    description: "ASTM Level 1 disposable 3-ply surgical masks with ear loops.",
    storeKey: "lifesupply-ca",
    categorySourceId: "ls-ppe-masks",
    imageStatus: "validated",
    descriptionStatus: "present",
    variants: [{ sku: "LS-MSK-3PLY-50-STD", price: 12.5, costPrice: 4.2, stockLevel: 920 }],
    suppliers: [
      { supplierCode: "MEDD01", supplierSku: "MD-3PLY-50", cost: 4.2, isPreferred: true },
    ],
  },
  {
    sourceId: "p-n95-bx20",
    name: "N95 Respirator Masks (BX 20)",
    sku: "LS-MSK-N95-20",
    brand: "Halton",
    description: "NIOSH-certified N95 particulate respirator, headband style.",
    storeKey: "lifesupply-ca",
    categorySourceId: "ls-ppe-masks",
    imageStatus: "present",
    descriptionStatus: "needs_review",
    variants: [{ sku: "LS-MSK-N95-20-STD", price: 38.95, costPrice: 22.5, stockLevel: 78 }],
    suppliers: [
      { supplierCode: "HSI01", supplierSku: "HSI-N95-20", cost: 22.5, isPreferred: true },
    ],
  },
  {
    sourceId: "p-iso-gowns-cs50",
    name: "Disposable Isolation Gowns (CS 50)",
    sku: "LS-GWN-ISO-50",
    description: "AAMI Level 2 disposable isolation gowns, knit cuffs, ties at neck and waist.",
    storeKey: "lifesupply-ca",
    categorySourceId: "ls-ppe-gowns",
    imageStatus: "missing",
    descriptionStatus: "present",
    variants: [{ sku: "LS-GWN-ISO-50-STD", price: 89.0, costPrice: 52.0, stockLevel: 45 }],
    suppliers: [
      { supplierCode: "MEDD01", supplierSku: "MD-GWN-50", cost: 52.0, isPreferred: true },
    ],
  },
  {
    sourceId: "p-hydrocolloid",
    name: "Hydrocolloid Wound Dressings (10 pk)",
    sku: "LS-WC-HC-10",
    brand: "Halton",
    description: "Self-adhesive hydrocolloid dressings for moderate-exuding wounds.",
    storeKey: "lifesupply-ca",
    categorySourceId: "ls-wound-care",
    imageStatus: "validated",
    descriptionStatus: "present",
    variants: [{ sku: "LS-WC-HC-10-STD", price: 24.95, costPrice: 11.4, stockLevel: 210 }],
    suppliers: [{ supplierCode: "HSI01", supplierSku: "HSI-HC-10", cost: 11.4, isPreferred: true }],
  },
  {
    sourceId: "p-bandages-variety",
    name: "Adhesive Bandages — Variety Pack (300)",
    sku: "LS-WC-BND-VAR",
    description: "Assorted sizes and shapes of fabric and plastic adhesive bandages.",
    storeKey: "lifesupply-ca",
    categorySourceId: "ls-wound-care",
    imageStatus: "present",
    descriptionStatus: "present",
    variants: [{ sku: "LS-WC-BND-VAR-STD", price: 9.5, costPrice: 3.1, stockLevel: 540 }],
    suppliers: [
      { supplierCode: "MEDD01", supplierSku: "MD-BND-VAR", cost: 3.1, isPreferred: true },
    ],
  },
  {
    sourceId: "p-thermometer-digital",
    name: "Digital Thermometer (Oral / Underarm)",
    sku: "LS-DX-THERM-DIG",
    brand: "Halton",
    description: "30-second digital thermometer with fever alert.",
    storeKey: "lifesupply-ca",
    categorySourceId: "ls-diagnostics",
    imageStatus: "validated",
    descriptionStatus: "validated",
    isFeatured: true,
    variants: [{ sku: "LS-DX-THERM-DIG-STD", price: 14.95, costPrice: 6.4, stockLevel: 310 }],
    suppliers: [{ supplierCode: "HSI01", supplierSku: "HSI-THERM", cost: 6.4, isPreferred: true }],
  },
  {
    sourceId: "p-pulse-ox",
    name: "Pulse Oximeter — Fingertip",
    sku: "LS-DX-PULSEOX",
    brand: "Halton",
    description: "OLED display fingertip pulse oximeter, SpO2 and heart rate.",
    storeKey: "lifesupply-ca",
    categorySourceId: "ls-diagnostics",
    imageStatus: "validated",
    descriptionStatus: "present",
    variants: [{ sku: "LS-DX-PULSEOX-STD", price: 39.95, costPrice: 18.0, stockLevel: 95 }],
    suppliers: [
      { supplierCode: "HSI01", supplierSku: "HSI-PULSEOX", cost: 18.0, isPreferred: true },
    ],
  },
  {
    sourceId: "p-bp-monitor",
    name: "Blood Pressure Monitor — Upper Arm",
    sku: "LS-DX-BPM",
    brand: "Halton",
    description: "Automatic upper-arm blood pressure monitor with memory for 2 users.",
    storeKey: "lifesupply-ca",
    categorySourceId: "ls-diagnostics",
    imageStatus: "present",
    descriptionStatus: "needs_review",
    variants: [{ sku: "LS-DX-BPM-STD", price: 79.95, costPrice: 41.0, stockLevel: 28 }],
    suppliers: [{ supplierCode: "HSI01", supplierSku: "HSI-BPM", cost: 41.0, isPreferred: true }],
  },
  {
    sourceId: "p-cane-adjustable",
    name: "Walking Cane — Adjustable Aluminum",
    sku: "LS-MOB-CANE-ADJ",
    description: "Lightweight aluminum walking cane, height adjustable, T-handle.",
    storeKey: "lifesupply-ca",
    categorySourceId: "ls-mobility",
    imageStatus: "needs_review",
    descriptionStatus: "missing",
    variants: [{ sku: "LS-MOB-CANE-ADJ-STD", price: 22.5, costPrice: 14.0, stockLevel: 55 }],
    suppliers: [
      { supplierCode: "MEDD01", supplierSku: "MD-CANE-ADJ", cost: 14.0, isPreferred: true },
    ],
  },
  {
    sourceId: "p-wm-nitrile-bx100",
    name: "Nitrile Gloves — Box of 100",
    sku: "WM-GLV-NIT-100",
    description: "Powder-free nitrile gloves for everyday home and workplace use.",
    storeKey: "wellmartmedical-com",
    categorySourceId: "wm-ppe",
    imageStatus: "validated",
    descriptionStatus: "present",
    isFeatured: true,
    variants: [
      {
        sku: "WM-GLV-NIT-100-M",
        optionSummary: "Medium",
        price: 14.99,
        costPrice: 8.95,
        stockLevel: 0,
      },
      {
        sku: "WM-GLV-NIT-100-L",
        optionSummary: "Large",
        price: 14.99,
        costPrice: 8.95,
        stockLevel: 0,
      },
    ],
    suppliers: [
      { supplierCode: "BBM01", supplierSku: "BBM-NTL-100", cost: 8.95, isPreferred: true },
    ],
  },
  {
    sourceId: "p-wm-thermometer",
    name: "Family Digital Thermometer",
    sku: "WM-DX-THERM",
    description: "30-second digital thermometer for the whole family.",
    storeKey: "wellmartmedical-com",
    categorySourceId: "wm-diagnostics",
    imageStatus: "validated",
    descriptionStatus: "validated",
    variants: [{ sku: "WM-DX-THERM-STD", price: 12.99, costPrice: 5.5, stockLevel: 0 }],
    suppliers: [{ supplierCode: "BBM01", supplierSku: "BBM-THERM", cost: 5.5, isPreferred: true }],
  },
  {
    sourceId: "p-wm-pulse-ox",
    name: "Fingertip Pulse Oximeter",
    sku: "WM-DX-PULSEOX",
    description: "Easy-to-read fingertip pulse oximeter.",
    storeKey: "wellmartmedical-com",
    categorySourceId: "wm-diagnostics",
    imageStatus: "missing",
    descriptionStatus: "needs_review",
    variants: [{ sku: "WM-DX-PULSEOX-STD", price: 29.99, costPrice: 14.5, stockLevel: 0 }],
    suppliers: [
      { supplierCode: "BBM01", supplierSku: "BBM-PULSEOX", cost: 14.5, isPreferred: true },
    ],
  },
  {
    sourceId: "p-wm-bandages",
    name: "Family Adhesive Bandages — 200 Count",
    sku: "WM-WC-BND-200",
    description: "Assorted adhesive bandages for everyday cuts and scrapes.",
    storeKey: "wellmartmedical-com",
    categorySourceId: "wm-home-care",
    imageStatus: "present",
    descriptionStatus: "present",
    variants: [{ sku: "WM-WC-BND-200-STD", price: 7.99, costPrice: 2.85, stockLevel: 0 }],
    suppliers: [
      { supplierCode: "BBM01", supplierSku: "BBM-BND-200", cost: 2.85, isPreferred: true },
    ],
  },
];

// -----------------------------------------------------------------------------
// Customers — docs/04 §5.1
// -----------------------------------------------------------------------------

type CustomerSeed = {
  sourceId: string;
  storeKey: (typeof STORES)[number]["externalStoreId"];
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  customerType: "retail" | "b2b" | "clinic" | "institutional" | "supplier" | "investor" | "unknown";
  phone?: string;
  consentStatus:
    | "subscribed"
    | "unsubscribed"
    | "cleaned"
    | "transactional"
    | "pending"
    | "unknown";
  reactivationScore?: number;
  lifetimeValue: number;
  orderCount: number;
  firstOrderAtDaysAgo?: number;
  lastOrderAtDaysAgo?: number;
  notes?: string;
};

const CUSTOMERS: CustomerSeed[] = [
  {
    sourceId: "c-calgary-family",
    storeKey: "lifesupply-ca",
    email: "orders@calgaryfamilyclinic.ca",
    companyName: "Calgary Family Clinic",
    customerType: "clinic",
    consentStatus: "transactional",
    lifetimeValue: 18420.55,
    orderCount: 14,
    firstOrderAtDaysAgo: 480,
    lastOrderAtDaysAgo: 6,
    notes: "Quarterly PPE refresh + monthly diagnostics top-up.",
  },
  {
    sourceId: "c-halton-health",
    storeKey: "lifesupply-ca",
    email: "purchasing@haltonhealth.ca",
    companyName: "Halton Health Centre",
    customerType: "institutional",
    consentStatus: "transactional",
    lifetimeValue: 47200.18,
    orderCount: 32,
    firstOrderAtDaysAgo: 720,
    lastOrderAtDaysAgo: 11,
  },
  {
    sourceId: "c-westside-dental",
    storeKey: "lifesupply-ca",
    email: "office@westsidedental.ca",
    companyName: "Westside Dental Group",
    customerType: "b2b",
    consentStatus: "subscribed",
    lifetimeValue: 7245.0,
    orderCount: 9,
    firstOrderAtDaysAgo: 280,
    lastOrderAtDaysAgo: 38,
  },
  {
    sourceId: "c-kingston-ltc",
    storeKey: "lifesupply-ca",
    email: "supplies@kingstonltc.ca",
    companyName: "Kingston Long-Term Care",
    customerType: "institutional",
    consentStatus: "transactional",
    lifetimeValue: 62810.4,
    orderCount: 41,
    firstOrderAtDaysAgo: 920,
    lastOrderAtDaysAgo: 3,
  },
  {
    sourceId: "c-vancouver-wellness",
    storeKey: "lifesupply-ca",
    email: "hello@vancouverwellness.co",
    companyName: "Vancouver Wellness Co.",
    customerType: "b2b",
    consentStatus: "subscribed",
    lifetimeValue: 4120.6,
    orderCount: 6,
    firstOrderAtDaysAgo: 200,
    lastOrderAtDaysAgo: 95,
  },
  {
    sourceId: "c-sarah-chen",
    storeKey: "wellmartmedical-com",
    email: "sarah.chen@example.com",
    firstName: "Sarah",
    lastName: "Chen",
    customerType: "retail",
    consentStatus: "subscribed",
    reactivationScore: 78,
    lifetimeValue: 412.85,
    orderCount: 5,
    firstOrderAtDaysAgo: 540,
    lastOrderAtDaysAgo: 220,
    notes: "High reactivation score; previously bought masks + thermometer.",
  },
  {
    sourceId: "c-john-patel",
    storeKey: "wellmartmedical-com",
    email: "john.patel@example.com",
    firstName: "John",
    lastName: "Patel",
    customerType: "retail",
    consentStatus: "subscribed",
    lifetimeValue: 285.4,
    orderCount: 4,
    firstOrderAtDaysAgo: 95,
    lastOrderAtDaysAgo: 9,
  },
  {
    sourceId: "c-maria-rodriguez",
    storeKey: "wellmartmedical-com",
    email: "maria.r@example.com",
    firstName: "Maria",
    lastName: "Rodriguez",
    customerType: "retail",
    consentStatus: "subscribed",
    lifetimeValue: 1240.95,
    orderCount: 11,
    firstOrderAtDaysAgo: 360,
    lastOrderAtDaysAgo: 18,
    notes: "Repeat buyer of family-size diagnostics.",
  },
  {
    sourceId: "c-emily-wong",
    storeKey: "wellmartmedical-com",
    email: "emily.wong@example.com",
    firstName: "Emily",
    lastName: "Wong",
    customerType: "retail",
    consentStatus: "subscribed",
    lifetimeValue: 49.99,
    orderCount: 1,
    firstOrderAtDaysAgo: 4,
    lastOrderAtDaysAgo: 4,
    notes: "First-time buyer.",
  },
  {
    sourceId: "c-david-kim",
    storeKey: "wellmartmedical-com",
    email: "dkim@example.com",
    firstName: "David",
    lastName: "Kim",
    customerType: "retail",
    consentStatus: "unsubscribed",
    reactivationScore: 22,
    lifetimeValue: 168.4,
    orderCount: 3,
    firstOrderAtDaysAgo: 760,
    lastOrderAtDaysAgo: 410,
    notes: "Unsubscribed; do not include in marketing reactivation lists.",
  },
];

// -----------------------------------------------------------------------------
// Customer segments (reactivation lists, etc.)
// -----------------------------------------------------------------------------

const SEGMENTS = [
  {
    name: "Wellmart — High-value lapsed",
    segmentType: "reactivation",
    description: "Wellmart retail customers with LTV > $300 and last order > 90 days ago.",
    criteria: { storeKey: "wellmartmedical-com", minLifetimeValue: 300, lapsedDays: 90 },
    members: ["c-sarah-chen"],
  },
  {
    name: "LifeSupply — Active B2B clinics",
    segmentType: "b2b",
    description: "Clinic and institutional customers with at least 1 order in the last 90 days.",
    criteria: {
      storeKey: "lifesupply-ca",
      customerTypes: ["clinic", "institutional", "b2b"],
      lapsedDays: 90,
    },
    members: ["c-calgary-family", "c-halton-health", "c-kingston-ltc"],
  },
];

// -----------------------------------------------------------------------------

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seedDivisionsAndStores(prisma: PrismaClient) {
  for (const d of DIVISIONS) {
    await prisma.division.upsert({
      where: { code: d.code },
      create: d,
      update: { name: d.name, type: d.type, jurisdiction: d.jurisdiction, isActive: true },
    });
  }

  for (const s of STORES) {
    const division = await prisma.division.findUniqueOrThrow({ where: { code: s.divisionCode } });
    await prisma.store.upsert({
      where: {
        sourceSystem_externalStoreId: {
          sourceSystem: SEED_SOURCE,
          externalStoreId: s.externalStoreId,
        },
      },
      create: {
        divisionId: division.id,
        name: s.name,
        platform: s.platform,
        url: s.url,
        sourceSystem: SEED_SOURCE,
        externalStoreId: s.externalStoreId,
        status: "active",
      },
      update: {
        divisionId: division.id,
        name: s.name,
        platform: s.platform,
        url: s.url,
        status: "active",
      },
    });
  }

  console.log(`  • ${DIVISIONS.length} divisions, ${STORES.length} stores`);
}

async function seedSuppliers(prisma: PrismaClient) {
  for (const s of SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { code: s.code },
      create: { ...s, status: "active" },
      update: { ...s, status: "active" },
    });
  }
  console.log(`  • ${SUPPLIERS.length} suppliers`);
}

async function seedCategories(prisma: PrismaClient) {
  // Two passes: first create all categories without parent, then set parents.
  for (const c of CATEGORIES) {
    const store = await prisma.store.findUniqueOrThrow({
      where: {
        sourceSystem_externalStoreId: {
          sourceSystem: SEED_SOURCE,
          externalStoreId: c.storeKey,
        },
      },
    });
    await prisma.category.upsert({
      where: { sourceSystem_sourceId: { sourceSystem: SEED_SOURCE, sourceId: c.sourceId } },
      create: {
        storeId: store.id,
        sourceSystem: SEED_SOURCE,
        sourceId: c.sourceId,
        name: c.name,
        isActive: true,
      },
      update: { name: c.name, storeId: store.id, isActive: true },
    });
  }

  for (const c of CATEGORIES) {
    if (!c.parentSourceId) continue;
    const parent = await prisma.category.findUnique({
      where: {
        sourceSystem_sourceId: { sourceSystem: SEED_SOURCE, sourceId: c.parentSourceId },
      },
    });
    if (!parent) continue;
    await prisma.category.update({
      where: { sourceSystem_sourceId: { sourceSystem: SEED_SOURCE, sourceId: c.sourceId } },
      data: { parentCategoryId: parent.id },
    });
  }

  console.log(`  • ${CATEGORIES.length} categories`);
}

async function seedProducts(prisma: PrismaClient) {
  let variantCount = 0;
  let supplierLinkCount = 0;

  for (const p of PRODUCTS) {
    const store = await prisma.store.findUniqueOrThrow({
      where: {
        sourceSystem_externalStoreId: {
          sourceSystem: SEED_SOURCE,
          externalStoreId: p.storeKey,
        },
      },
    });
    const category = await prisma.category.findUniqueOrThrow({
      where: { sourceSystem_sourceId: { sourceSystem: SEED_SOURCE, sourceId: p.categorySourceId } },
    });

    const product = await prisma.product.upsert({
      where: { sourceSystem_sourceId: { sourceSystem: SEED_SOURCE, sourceId: p.sourceId } },
      create: {
        storeId: store.id,
        divisionId: store.divisionId,
        categoryId: category.id,
        sourceSystem: SEED_SOURCE,
        sourceId: p.sourceId,
        name: p.name,
        sku: p.sku,
        brand: p.brand,
        description: p.description,
        imageStatus: p.imageStatus,
        descriptionStatus: p.descriptionStatus,
        status: "active",
        isFeatured: p.isFeatured ?? false,
        isRockstarCandidate: p.isRockstarCandidate ?? false,
      },
      update: {
        name: p.name,
        sku: p.sku,
        brand: p.brand,
        description: p.description,
        imageStatus: p.imageStatus,
        descriptionStatus: p.descriptionStatus,
        isFeatured: p.isFeatured ?? false,
        isRockstarCandidate: p.isRockstarCandidate ?? false,
        storeId: store.id,
        categoryId: category.id,
      },
    });

    for (const v of p.variants) {
      await prisma.productVariant.upsert({
        where: {
          sourceSystem_sourceId: {
            sourceSystem: SEED_SOURCE,
            sourceId: `${p.sourceId}::${v.sku}`,
          },
        },
        create: {
          productId: product.id,
          sku: v.sku,
          optionSummary: v.optionSummary,
          price: new Prisma.Decimal(v.price),
          costPrice: new Prisma.Decimal(v.costPrice),
          stockLevel: v.stockLevel,
          inventoryTrackingType: v.stockLevel != null ? "bigcommerce" : "supplier",
          status: "active",
          sourceSystem: SEED_SOURCE,
          sourceId: `${p.sourceId}::${v.sku}`,
        },
        update: {
          sku: v.sku,
          optionSummary: v.optionSummary,
          price: new Prisma.Decimal(v.price),
          costPrice: new Prisma.Decimal(v.costPrice),
          stockLevel: v.stockLevel,
          status: "active",
        },
      });
      variantCount += 1;
    }

    for (const link of p.suppliers) {
      const supplier = await prisma.supplier.findUniqueOrThrow({
        where: { code: link.supplierCode },
      });
      await prisma.supplierProduct.upsert({
        where: {
          supplierId_supplierSku: { supplierId: supplier.id, supplierSku: link.supplierSku },
        },
        create: {
          supplierId: supplier.id,
          productId: product.id,
          supplierSku: link.supplierSku,
          supplierProductName: p.name,
          cost: new Prisma.Decimal(link.cost),
          currency: "CAD",
          availabilityStatus: "in_stock",
          isPreferred: link.isPreferred ?? false,
          lastCheckedAt: daysAgo(2),
        },
        update: {
          productId: product.id,
          cost: new Prisma.Decimal(link.cost),
          availabilityStatus: "in_stock",
          isPreferred: link.isPreferred ?? false,
          lastCheckedAt: daysAgo(2),
        },
      });
      supplierLinkCount += 1;
    }
  }

  console.log(
    `  • ${PRODUCTS.length} products, ${variantCount} variants, ${supplierLinkCount} supplier mappings`,
  );
}

async function seedCustomers(prisma: PrismaClient) {
  for (const c of CUSTOMERS) {
    const store = await prisma.store.findUniqueOrThrow({
      where: {
        sourceSystem_externalStoreId: {
          sourceSystem: SEED_SOURCE,
          externalStoreId: c.storeKey,
        },
      },
    });

    const data = {
      storeId: store.id,
      divisionId: store.divisionId,
      email: c.email.toLowerCase(),
      firstName: c.firstName,
      lastName: c.lastName,
      companyName: c.companyName,
      customerType: c.customerType,
      phone: c.phone,
      consentStatus: c.consentStatus,
      lifetimeValue: new Prisma.Decimal(c.lifetimeValue),
      orderCount: c.orderCount,
      firstOrderAt: c.firstOrderAtDaysAgo != null ? daysAgo(c.firstOrderAtDaysAgo) : null,
      lastOrderAt: c.lastOrderAtDaysAgo != null ? daysAgo(c.lastOrderAtDaysAgo) : null,
      reactivationScore: c.reactivationScore,
      notes: c.notes,
    };

    const customer = await prisma.customer.upsert({
      where: { sourceSystem_sourceId: { sourceSystem: SEED_SOURCE, sourceId: c.sourceId } },
      create: { ...data, sourceSystem: SEED_SOURCE, sourceId: c.sourceId },
      update: data,
    });

    // Marketing contact mirror — for retail consenting customers
    if (c.customerType === "retail" || c.consentStatus === "subscribed") {
      await prisma.marketingContact.upsert({
        where: {
          sourceSystem_sourceId: { sourceSystem: SEED_SOURCE, sourceId: `mc-${c.sourceId}` },
        },
        create: {
          customerId: customer.id,
          sourceSystem: SEED_SOURCE,
          sourceId: `mc-${c.sourceId}`,
          email: data.email,
          status: c.consentStatus === "unsubscribed" ? "unsubscribed" : "subscribed",
          consentStatus: c.consentStatus,
        },
        update: {
          customerId: customer.id,
          email: data.email,
          status: c.consentStatus === "unsubscribed" ? "unsubscribed" : "subscribed",
          consentStatus: c.consentStatus,
        },
      });
    }
  }

  console.log(`  • ${CUSTOMERS.length} customers (+ marketing contact mirrors)`);
}

async function seedSegments(prisma: PrismaClient) {
  for (const s of SEGMENTS) {
    const segment = await prisma.customerSegment.upsert({
      where: { name: s.name },
      create: {
        name: s.name,
        segmentType: s.segmentType,
        description: s.description,
        criteria: s.criteria,
        sourceSystem: SEED_SOURCE,
        isActive: true,
      },
      update: {
        segmentType: s.segmentType,
        description: s.description,
        criteria: s.criteria,
        isActive: true,
      },
    });

    // Replace members
    await prisma.customerSegmentMember.deleteMany({ where: { segmentId: segment.id } });
    for (const sourceId of s.members) {
      const customer = await prisma.customer.findUnique({
        where: { sourceSystem_sourceId: { sourceSystem: SEED_SOURCE, sourceId } },
      });
      if (!customer) continue;
      await prisma.customerSegmentMember.create({
        data: { segmentId: segment.id, customerId: customer.id },
      });
    }
  }
  console.log(`  • ${SEGMENTS.length} customer segments`);
}

export async function seedOperating(prisma: PrismaClient) {
  console.log("→ Operating data");
  await seedDivisionsAndStores(prisma);
  await seedSuppliers(prisma);
  await seedCategories(prisma);
  await seedProducts(prisma);
  await seedCustomers(prisma);
  await seedSegments(prisma);
}
