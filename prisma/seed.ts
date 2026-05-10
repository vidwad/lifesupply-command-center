import { hash } from "bcryptjs";

import { PrismaClient } from "@prisma/client";

import { ALL_PERMISSION_KEYS, PERMISSIONS, type PermissionKey } from "../src/lib/permissions";

const prisma = new PrismaClient();

// -----------------------------------------------------------------------------
// Roles — docs/06_SECURITY_AND_PERMISSIONS.md §4
// -----------------------------------------------------------------------------

const ROLE_DEFINITIONS = [
  {
    name: "Super Admin",
    description: "Full access to all modules, data, settings, and audit logs.",
  },
  {
    name: "Executive",
    description:
      "Owner-level access to dashboards, financial summaries, AI analyst, reports, and strategy.",
  },
  {
    name: "Finance Manager",
    description: "Financial imports, summaries, reports, variance analysis, monthly close.",
  },
  {
    name: "Operations Manager",
    description: "Orders, fulfillment, supplier workflows, operational tasks.",
  },
  {
    name: "Marketing Manager",
    description: "Customers, segments, Mailchimp, campaigns, GA4, AI campaign drafting.",
  },
  {
    name: "Product Manager",
    description: "Products, catalog, supplier mapping, pricing, images, margin.",
  },
  {
    name: "Customer Service",
    description: "Customer profiles, orders, support tasks, customer notes.",
  },
  {
    name: "Investor Relations",
    description: "Approved financials, investor records, reports, financing updates.",
  },
  {
    name: "External Advisor",
    description: "Limited read-only access to selected reports and dashboards.",
  },
  {
    name: "Developer / Technical Admin",
    description: "Integration health, technical logs, API configuration, diagnostics.",
  },
] as const;

type RoleName = (typeof ROLE_DEFINITIONS)[number]["name"];

// -----------------------------------------------------------------------------
// Role → Permissions mapping — initial Phase 1 baseline.
// Refines docs/06 §12 matrix. Tune granularity in later phases.
// -----------------------------------------------------------------------------

const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  "Super Admin": ALL_PERMISSION_KEYS,

  Executive: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_EXECUTIVE_VIEW,
    PERMISSIONS.DASHBOARD_FINANCIAL_VIEW,
    PERMISSIONS.DASHBOARD_OPERATIONS_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW_CONSENT,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.FINANCIALS_VIEW_SUMMARY,
    PERMISSIONS.FINANCIALS_VIEW_DETAIL,
    PERMISSIONS.FINANCIALS_APPROVE,
    PERMISSIONS.FINANCIALS_EXPORT,
    PERMISSIONS.MARKETING_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AI_USE,
    PERMISSIONS.AI_USE_FINANCIAL_CONTEXT,
    PERMISSIONS.AI_USE_CUSTOMER_CONTEXT,
    PERMISSIONS.AI_USE_INVESTOR_CONTEXT,
    PERMISSIONS.AI_VIEW_LOGS,
    PERMISSIONS.AI_APPROVE_OUTPUT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_APPROVE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TASKS_COMPLETE,
    PERMISSIONS.INVESTORS_VIEW,
    PERMISSIONS.INVESTORS_UPDATE,
    PERMISSIONS.INVESTORS_APPROVE_MATERIALS,
    PERMISSIONS.OPPORTUNITIES_VIEW,
    PERMISSIONS.OPPORTUNITIES_UPDATE,
    PERMISSIONS.OPPORTUNITIES_AI_ANALYZE,
  ],

  "Finance Manager": [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_FINANCIAL_VIEW,
    PERMISSIONS.FINANCIALS_VIEW_SUMMARY,
    PERMISSIONS.FINANCIALS_VIEW_DETAIL,
    PERMISSIONS.FINANCIALS_IMPORT,
    PERMISSIONS.FINANCIALS_REVIEW,
    PERMISSIONS.FINANCIALS_APPROVE,
    PERMISSIONS.FINANCIALS_EXPORT,
    PERMISSIONS.FINANCIALS_MANAGE_ADJUSTMENTS,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.AI_USE,
    PERMISSIONS.AI_USE_FINANCIAL_CONTEXT,
    PERMISSIONS.AI_VIEW_LOGS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_APPROVE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TASKS_COMPLETE,
  ],

  "Operations Manager": [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_OPERATIONS_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_EXPORT,
    PERMISSIONS.ORDERS_MANAGE_EXCEPTIONS,
    PERMISSIONS.ORDERS_APPROVE_EXTERNAL_UPDATE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_UPDATE,
    PERMISSIONS.SUPPLIERS_MANAGE_PORTAL_SETTINGS,
    PERMISSIONS.SUPPLIERS_RUN_AUTOMATION,
    PERMISSIONS.SUPPLIERS_APPROVE_ORDER_AUTOMATION,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AI_USE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TASKS_COMPLETE,
  ],

  "Marketing Manager": [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_EXPORT,
    PERMISSIONS.CUSTOMERS_VIEW_CONSENT,
    PERMISSIONS.CUSTOMERS_MANAGE_SEGMENTS,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.MARKETING_VIEW,
    PERMISSIONS.MARKETING_MANAGE_SEGMENTS,
    PERMISSIONS.MARKETING_DRAFT_CAMPAIGN,
    PERMISSIONS.MARKETING_EXPORT_CONTACTS,
    PERMISSIONS.MARKETING_SYNC_MAILCHIMP,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.AI_USE,
    PERMISSIONS.AI_USE_CUSTOMER_CONTEXT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TASKS_COMPLETE,
  ],

  "Product Manager": [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_EXPORT,
    PERMISSIONS.PRODUCTS_MANAGE_SUPPLIER_MAPPING,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_UPDATE,
    PERMISSIONS.AI_USE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TASKS_COMPLETE,
  ],

  "Customer Service": [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_VIEW_CONSENT,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TASKS_COMPLETE,
  ],

  "Investor Relations": [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.FINANCIALS_VIEW_SUMMARY,
    PERMISSIONS.INVESTORS_VIEW,
    PERMISSIONS.INVESTORS_UPDATE,
    PERMISSIONS.INVESTORS_EXPORT,
    PERMISSIONS.INVESTORS_GENERATE_UPDATE,
    PERMISSIONS.INVESTORS_APPROVE_MATERIALS,
    PERMISSIONS.OPPORTUNITIES_VIEW,
    PERMISSIONS.AI_USE,
    PERMISSIONS.AI_USE_INVESTOR_CONTEXT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TASKS_COMPLETE,
  ],

  "External Advisor": [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.OPPORTUNITIES_VIEW,
  ],

  "Developer / Technical Admin": [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS,
    PERMISSIONS.ADMIN_VIEW_AUDIT_LOGS,
    PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS,
    PERMISSIONS.AI_VIEW_LOGS,
  ],
};

// -----------------------------------------------------------------------------
// Seeding
// -----------------------------------------------------------------------------

async function seedPermissions() {
  console.log(`Seeding ${ALL_PERMISSION_KEYS.length} permissions...`);
  for (const key of ALL_PERMISSION_KEYS) {
    const [moduleName, action] = key.split(".");
    await prisma.permission.upsert({
      where: { key },
      create: {
        key,
        module: moduleName ?? "unknown",
        action: action ?? "unknown",
      },
      update: {},
    });
  }
}

async function seedRoles() {
  console.log(`Seeding ${ROLE_DEFINITIONS.length} roles...`);
  for (const def of ROLE_DEFINITIONS) {
    await prisma.role.upsert({
      where: { name: def.name },
      create: { name: def.name, description: def.description, isSystemRole: true },
      update: { description: def.description, isSystemRole: true },
    });
  }
}

async function seedRolePermissions() {
  console.log("Mapping permissions to roles...");
  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });

    // Replace strategy: clear existing then insert. Idempotent across reruns.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
    });

    if (permissions.length === 0) continue;

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });

    console.log(`  ${roleName}: ${permissions.length} permissions`);
  }
}

async function seedSuperAdmin() {
  const email = (process.env.DEV_ADMIN_EMAIL ?? "admin@lifesupply.local").toLowerCase();
  const password = process.env.DEV_ADMIN_PASSWORD ?? "DevAdmin!2026";

  console.log(`Seeding Super Admin (${email})...`);

  const passwordHash = await hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Vid Wadhwani",
      title: "Owner",
      passwordHash,
      status: "active",
    },
    update: {
      passwordHash,
      status: "active",
    },
  });

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Super Admin" } });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdminRole.id } },
    create: { userId: user.id, roleId: superAdminRole.id },
    update: {},
  });

  console.log("\nSuper Admin login (development only):");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log("  Override with DEV_ADMIN_EMAIL and DEV_ADMIN_PASSWORD env vars.\n");
}

async function main() {
  await seedPermissions();
  await seedRoles();
  await seedRolePermissions();
  await seedSuperAdmin();
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
