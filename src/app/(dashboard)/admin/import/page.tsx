import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { listStores } from "@/server/services/stores";
import { requireUser, userHasAnyPermission } from "@/server/permissions";

import {
  importCustomersAction,
  importOrdersAction,
  importPnlAction,
  importProductsAction,
} from "./actions";
import { ImportForm } from "./import-form";

export const metadata = { title: "Data import" };
export const dynamic = "force-dynamic";

const ANY_IMPORT_PERMS = [
  PERMISSIONS.CUSTOMERS_UPDATE,
  PERMISSIONS.PRODUCTS_UPDATE,
  PERMISSIONS.ORDERS_UPDATE,
  PERMISSIONS.FINANCIALS_IMPORT,
] as const;

export default async function ImportPage() {
  const user = await requireUser();
  if (!userHasAnyPermission(user, [...ANY_IMPORT_PERMS])) {
    const { requirePermission } = await import("@/server/permissions");
    await requirePermission(PERMISSIONS.FINANCIALS_IMPORT);
  }
  const stores = await listStores();
  const storeChoices = stores
    .filter((s) => s.status === "active")
    .map((s) => ({ id: s.id, name: s.name }));

  const canCustomers = user.permissions.includes(PERMISSIONS.CUSTOMERS_UPDATE);
  const canProducts = user.permissions.includes(PERMISSIONS.PRODUCTS_UPDATE);
  const canOrders = user.permissions.includes(PERMISSIONS.ORDERS_UPDATE);
  const canPnl = user.permissions.includes(PERMISSIONS.FINANCIALS_IMPORT);

  return (
    <div>
      <PageHeader
        title="Data import"
        description="Upload BigCommerce and QuickBooks exports until live integrations are wired."
        breadcrumb={
          <Link href="/admin" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        {canCustomers && (
          <ImportForm
            title="BigCommerce — Customers"
            description="Upsert customers by source ID, falling back to email when source ID is absent. Each row updates lifetime value, order count, and last-order date."
            expectedColumns={[
              "customer_id",
              "email",
              "first_name",
              "last_name",
              "company",
              "phone",
              "first_order_at",
              "last_order_at",
              "order_count",
              "lifetime_value",
            ]}
            showStoreSelect
            stores={storeChoices}
            action={importCustomersAction}
          />
        )}

        {canProducts && (
          <ImportForm
            title="BigCommerce — Products"
            description="Upsert products by source ID, falling back to (store, sku). Variants are not handled in CSV mode — use the API sync once configured."
            expectedColumns={["product_id", "sku", "name", "brand", "description", "url"]}
            showStoreSelect
            stores={storeChoices}
            action={importProductsAction}
          />
        )}

        {canOrders && (
          <ImportForm
            title="BigCommerce — Order headers"
            description="Upsert order headers (no line items). Useful to backfill historical orders before BigCommerce API sync is online."
            expectedColumns={[
              "order_id",
              "order_number",
              "order_date",
              "subtotal",
              "discount_total",
              "shipping_total",
              "tax_total",
              "grand_total",
              "currency",
            ]}
            showStoreSelect
            stores={storeChoices}
            action={importOrdersAction}
          />
        )}

        {canPnl && (
          <ImportForm
            title="QuickBooks — P&L summary"
            description="One row per (period, division). Period names must already exist (e.g. 2026-04). Division code is optional but must match an existing division code if provided."
            expectedColumns={[
              "period",
              "division",
              "revenue",
              "cogs",
              "gross_profit",
              "operating_expenses",
              "operating_income",
              "ebitda",
              "adjusted_ebitda",
              "cash",
              "accounts_receivable",
              "accounts_payable",
              "working_capital",
              "currency",
            ]}
            action={importPnlAction}
          />
        )}
      </div>
    </div>
  );
}
