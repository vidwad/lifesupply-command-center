import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

export type StoreRow = {
  id: string;
  name: string;
  platform: string;
  url: string | null;
  sourceSystem: string | null;
  externalStoreId: string | null;
  status: string;
  divisionId: string;
  divisionName: string;
};

const STORE_PLATFORMS = ["bigcommerce", "amazon", "manual", "other"] as const;
const STORE_STATUSES = ["active", "inactive", "archived"] as const;
export const STORE_PLATFORM_OPTIONS = STORE_PLATFORMS;
export const STORE_STATUS_OPTIONS = STORE_STATUSES;

export async function listStores(): Promise<StoreRow[]> {
  const stores = await prisma.store.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: { division: { select: { name: true } } },
  });
  return stores.map((s) => ({
    id: s.id,
    name: s.name,
    platform: s.platform,
    url: s.url,
    sourceSystem: s.sourceSystem,
    externalStoreId: s.externalStoreId,
    status: s.status,
    divisionId: s.divisionId,
    divisionName: s.division.name,
  }));
}

export type StoreInput = {
  name: string;
  divisionId: string;
  platform: string;
  url?: string | null;
  sourceSystem?: string | null;
  externalStoreId?: string | null;
  status: string;
};

export async function createStore(input: StoreInput, actor: { id: string }) {
  const data = normalize(input);
  const created = await prisma.store.create({ data });
  await writeAudit({
    actorUserId: actor.id,
    action: "store.created",
    entityType: "store",
    entityId: created.id,
    afterData: data,
  });
  return created;
}

export async function updateStore(id: string, input: StoreInput, actor: { id: string }) {
  const before = await prisma.store.findUniqueOrThrow({
    where: { id },
    select: {
      name: true,
      divisionId: true,
      platform: true,
      url: true,
      sourceSystem: true,
      externalStoreId: true,
      status: true,
    },
  });
  const data = normalize(input);
  await prisma.store.update({ where: { id }, data });
  await writeAudit({
    actorUserId: actor.id,
    action: "store.updated",
    entityType: "store",
    entityId: id,
    beforeData: before,
    afterData: data,
  });
}

function normalize(input: StoreInput) {
  return {
    name: input.name.trim(),
    divisionId: input.divisionId,
    platform: input.platform,
    url: input.url?.trim() || null,
    sourceSystem: input.sourceSystem?.trim() || null,
    externalStoreId: input.externalStoreId?.trim() || null,
    status: input.status,
  };
}
