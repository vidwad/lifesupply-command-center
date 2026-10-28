/**
 * Linking a standalone project to a catalogue product (2026-10-28).
 *
 * Why this exists: five August projects reached an unattended run with
 * approved images and could not publish, because each had been created
 * through the intake form without a product and so had no store listing to
 * write to. Nothing unlinks a project after creation; the link was simply
 * never there. Until now the only remedy was a new project from the product
 * page, redoing the research and the images.
 *
 * Linking is a one-way, one-time act on an unlinked project. A linked project
 * is never re-pointed here: the publish history, the store price and the
 * research all describe one listing, and moving them to another would make
 * that record lie. Linking spends nothing and queues nothing; it only tells
 * the publish service where the drafts belong.
 */
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

import { assertNotUnderAutopilot, ProductStudioInputError } from "./index";
import { resolvePublishTarget } from "./publish-eligibility";

export const MAX_LINK_MATCHES = 8;

export type LinkCandidate = {
  id: string;
  name: string;
  sku: string | null;
  storeName: string | null;
  /** Null when the product can be published to; otherwise why not. */
  unpublishableReason: string | null;
  /** How many live projects already point at this product. */
  liveProjects: number;
};

/**
 * Catalogue products matching a name or SKU fragment, for the link panel.
 * Each carries whether the publish service could write to it, so the
 * operator is not offered a link that will be refused later.
 */
export async function searchLinkCandidates(query: string): Promise<LinkCandidate[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      sku: true,
      storeId: true,
      sourceSystem: true,
      sourceId: true,
      store: { select: { name: true } },
      _count: {
        select: { studioProjects: { where: { status: { notIn: ["failed", "archived"] } } } },
      },
    },
    orderBy: [{ name: "asc" }],
    take: MAX_LINK_MATCHES,
  });
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    storeName: product.store?.name ?? null,
    unpublishableReason: resolvePublishTarget(product).reason,
    liveProjects: product._count.studioProjects,
  }));
}

/** Points an unlinked project at a catalogue product. Audited; never repeated. */
export async function linkProjectToProduct(args: {
  projectId: string;
  productId: string;
  actorUserId: string;
}): Promise<void> {
  const project = await prisma.productStudioProject.findUnique({
    where: { id: args.projectId },
    select: {
      id: true,
      title: true,
      confirmedTitle: true,
      productId: true,
      autopilotRunId: true,
      product: { select: { name: true } },
    },
  });
  if (!project) throw new ProductStudioInputError("This project no longer exists.");
  if (project.productId) {
    throw new ProductStudioInputError(
      'This project is already linked to "' +
        (project.product?.name ?? project.productId) +
        '". A link is not changed once made; start a new project from the other product instead.',
    );
  }
  await assertNotUnderAutopilot(project, "Linking");

  const productId = args.productId.trim();
  if (!productId) throw new ProductStudioInputError("Choose a catalogue product to link.");
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true, name: true, sku: true, storeId: true, sourceSystem: true, sourceId: true },
  });
  if (!product) throw new ProductStudioInputError("That catalogue product no longer exists.");

  await prisma.productStudioProject.update({
    where: { id: project.id },
    data: { productId: product.id },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.project_linked",
    entityType: "ProductStudioProject",
    entityId: project.id,
    beforeData: { productId: null },
    afterData: {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      publishable: resolvePublishTarget(product).reason == null,
      title: project.confirmedTitle ?? project.title,
    },
  });
}
