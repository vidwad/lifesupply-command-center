import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";

export type AutomationDashboard = {
  integrations: {
    id: string;
    integrationType: string;
    name: string;
    status: string;
    lastSyncAt: string | null;
    lastSuccessfulSyncAt: string | null;
    notes: string | null;
    syncCount24h: number;
    failedCount24h: number;
  }[];

  recentSyncs: {
    id: string;
    integrationName: string;
    integrationType: string;
    syncType: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    recordsProcessed: number;
    recordsFailed: number;
    errorSummary: string | null;
  }[];

  recentAiRuns: {
    id: string;
    module: string | null;
    modelProvider: string;
    modelName: string;
    status: string;
    createdAt: string;
    actorName: string | null;
    promptPreview: string;
    inputTokens: number | null;
    outputTokens: number | null;
  }[];

  totals: {
    integrationCount: number;
    configuredCount: number;
    errorCount: number;
    failedSyncCount24h: number;
    aiRunCount24h: number;
  };
};

const num = (n: unknown): number | null => {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  return null;
};

export async function getAutomationDashboard(): Promise<AutomationDashboard> {
  const since = new Date();
  since.setHours(since.getHours() - 24);

  const integrationRecords = await prisma.integrationConnection.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          syncLogs: { where: { startedAt: { gte: since } } },
        },
      },
    },
  });

  const failedByIntegration = await prisma.integrationSyncLog.groupBy({
    by: ["integrationConnectionId"],
    where: { status: "failed", startedAt: { gte: since } },
    _count: { _all: true },
  });
  const failedMap = new Map(
    failedByIntegration.map((f) => [f.integrationConnectionId, f._count._all]),
  );

  const integrations = integrationRecords.map((i) => ({
    id: i.id,
    integrationType: i.integrationType,
    name: i.name,
    status: i.status,
    lastSyncAt: i.lastSyncAt?.toISOString() ?? null,
    lastSuccessfulSyncAt: i.lastSuccessfulSyncAt?.toISOString() ?? null,
    notes: i.notes,
    syncCount24h: i._count.syncLogs,
    failedCount24h: failedMap.get(i.id) ?? 0,
  }));

  const recentSyncRecords = await prisma.integrationSyncLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
    include: {
      integrationConnection: { select: { name: true, integrationType: true } },
    },
  });
  const recentSyncs = recentSyncRecords.map((s) => ({
    id: s.id,
    integrationName: s.integrationConnection.name,
    integrationType: s.integrationConnection.integrationType,
    syncType: s.syncType,
    status: s.status,
    startedAt: s.startedAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
    recordsProcessed: s.recordsProcessed,
    recordsFailed: s.recordsFailed,
    errorSummary: s.errorSummary,
  }));

  const recentAiRecords = await prisma.aiOutput.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { name: true, email: true } } },
  });
  const recentAiRuns = recentAiRecords.map((a) => {
    const usage = a.tokenUsage as Prisma.JsonObject | null;
    return {
      id: a.id,
      module: a.module,
      modelProvider: a.modelProvider,
      modelName: a.modelName,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      actorName: a.user?.name ?? a.user?.email ?? null,
      promptPreview: a.prompt.slice(0, 140) + (a.prompt.length > 140 ? "…" : ""),
      inputTokens: num(usage?.inputTokens),
      outputTokens: num(usage?.outputTokens),
    };
  });

  const totals = {
    integrationCount: integrations.length,
    configuredCount: integrations.filter((i) => i.status === "configured").length,
    errorCount: integrations.filter((i) => i.status === "error").length,
    failedSyncCount24h: recentSyncs.filter((s) => s.status === "failed").length,
    aiRunCount24h: recentAiRecords.filter((a) => a.createdAt >= since).length,
  };

  return { integrations, recentSyncs, recentAiRuns, totals };
}
