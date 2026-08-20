import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { isFeatureOn } from "@/server/services/feature-flags";
import { getProductById } from "@/server/services/products";

import { ProductStudioIntakeForm } from "./intake-form";

export const metadata = { title: "New Product Studio project" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ productId?: string }> };

export default async function NewProductStudioPage({ searchParams }: Props) {
  await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  await requirePermission(PERMISSIONS.AI_USE);
  const { productId } = await searchParams;
  const [enabled, product] = await Promise.all([
    isFeatureOn(FEATURE_FLAGS.PRODUCT_STUDIO),
    productId ? getProductById(productId) : Promise.resolve(null),
  ]);

  return (
    <div>
      <PageHeader
        title="New Product Studio project"
        description="Turn truthful source photos into researched, review-only listing and image drafts."
        breadcrumb={
          <Link href="/products/studio" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Product Studio
          </Link>
        }
      />
      <div className="mx-auto grid max-w-5xl gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Product intake</CardTitle>
            <CardDescription>
              Research and generation run after the project is created, one controlled step at a time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enabled ? (
              <ProductStudioIntakeForm
                productId={product?.id}
                defaultTitle={product?.name}
                defaultDescription={product?.description ?? undefined}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Product Studio is off. An administrator must enable {FEATURE_FLAGS.PRODUCT_STUDIO}{" "}
                after reviewing provider credentials, worker capacity, and data retention.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" /> Truth and approval controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Retailer pages provide market evidence and composition patterns, not product identity.</p>
            <p>Each price remains attached to its seller URL, currency, condition, and observation time.</p>
            <p>All four images require human review. Nothing is published to BigCommerce or social channels.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
