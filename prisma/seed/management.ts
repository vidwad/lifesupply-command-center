import { Prisma, type PrismaClient } from "@prisma/client";

const SEED_SOURCE = "seed";

// =============================================================================
// Financial periods & summaries — docs/04 §7
// =============================================================================

type DivisionFinancial = {
  divisionCode: string;
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  cash?: number;
  accountsReceivable?: number;
  accountsPayable?: number;
};

type PeriodSeed = {
  name: string;
  periodType: "month" | "quarter" | "year";
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;
  status: "open" | "imported" | "under_review" | "approved" | "closed";
  approvalStatus: "pending" | "approved" | "rejected" | "withdrawn" | "not_required";
  summaries: DivisionFinancial[];
};

const PERIODS: PeriodSeed[] = [
  {
    name: "2026-02",
    periodType: "month",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    status: "closed",
    approvalStatus: "approved",
    summaries: [
      {
        divisionCode: "LSC",
        revenue: 232400,
        cogs: 167328,
        operatingExpenses: 48500,
        cash: 142000,
        accountsReceivable: 78400,
        accountsPayable: 41200,
      },
      {
        divisionCode: "WMM",
        revenue: 94800,
        cogs: 64464,
        operatingExpenses: 24200,
        cash: 38100,
        accountsReceivable: 12200,
        accountsPayable: 18900,
      },
      {
        divisionCode: "LSU",
        revenue: 51200,
        cogs: 38400,
        operatingExpenses: 15600,
        cash: 22400,
        accountsReceivable: 8800,
        accountsPayable: 10100,
      },
    ],
  },
  {
    name: "2026-03",
    periodType: "month",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    status: "closed",
    approvalStatus: "approved",
    summaries: [
      {
        divisionCode: "LSC",
        revenue: 254100,
        cogs: 182952,
        operatingExpenses: 49100,
        cash: 158400,
        accountsReceivable: 81000,
        accountsPayable: 43500,
      },
      {
        divisionCode: "WMM",
        revenue: 108200,
        cogs: 73576,
        operatingExpenses: 24800,
        cash: 41800,
        accountsReceivable: 13400,
        accountsPayable: 20100,
      },
      {
        divisionCode: "LSU",
        revenue: 58400,
        cogs: 43800,
        operatingExpenses: 16100,
        cash: 25100,
        accountsReceivable: 9600,
        accountsPayable: 11000,
      },
    ],
  },
  {
    name: "2026-04",
    periodType: "month",
    startDate: "2026-04-01",
    endDate: "2026-04-30",
    status: "approved",
    approvalStatus: "approved",
    summaries: [
      {
        divisionCode: "LSC",
        revenue: 268900,
        cogs: 193608,
        operatingExpenses: 50200,
        cash: 174900,
        accountsReceivable: 84200,
        accountsPayable: 45800,
      },
      {
        divisionCode: "WMM",
        revenue: 121400,
        cogs: 82552,
        operatingExpenses: 25600,
        cash: 46200,
        accountsReceivable: 14800,
        accountsPayable: 21800,
      },
      {
        divisionCode: "LSU",
        revenue: 62800,
        cogs: 47100,
        operatingExpenses: 16400,
        cash: 27800,
        accountsReceivable: 10100,
        accountsPayable: 11800,
      },
    ],
  },
  {
    name: "2026-05 MTD",
    periodType: "month",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    status: "open",
    approvalStatus: "pending",
    summaries: [
      {
        divisionCode: "LSC",
        revenue: 91300,
        cogs: 65736,
        operatingExpenses: 16700,
        cash: 181200,
        accountsReceivable: 86400,
        accountsPayable: 47100,
      },
      {
        divisionCode: "WMM",
        revenue: 42500,
        cogs: 28900,
        operatingExpenses: 8500,
        cash: 48600,
        accountsReceivable: 15200,
        accountsPayable: 22600,
      },
      {
        divisionCode: "LSU",
        revenue: 21100,
        cogs: 15825,
        operatingExpenses: 5500,
        cash: 28900,
        accountsReceivable: 10400,
        accountsPayable: 12200,
      },
    ],
  },
];

async function seedFinancials(prisma: PrismaClient) {
  console.log("→ Financial periods & summaries");
  let summaryCount = 0;

  for (const p of PERIODS) {
    const period = await prisma.financialPeriod.upsert({
      where: { name: p.name },
      create: {
        name: p.name,
        periodType: p.periodType,
        startDate: new Date(p.startDate),
        endDate: new Date(p.endDate),
        status: p.status,
      },
      update: {
        periodType: p.periodType,
        startDate: new Date(p.startDate),
        endDate: new Date(p.endDate),
        status: p.status,
      },
    });

    // Per-division summaries
    for (const s of p.summaries) {
      const division = await prisma.division.findUniqueOrThrow({
        where: { code: s.divisionCode },
      });

      const grossProfit = s.revenue - s.cogs;
      const operatingIncome = grossProfit - s.operatingExpenses;
      // Simplified EBITDA = operating income (no D&A in MVP)
      const ebitda = operatingIncome;
      const grossMargin = s.revenue > 0 ? grossProfit / s.revenue : null;
      const workingCapital =
        s.accountsReceivable != null && s.accountsPayable != null && s.cash != null
          ? s.cash + s.accountsReceivable - s.accountsPayable
          : null;

      const data = {
        revenue: new Prisma.Decimal(s.revenue),
        cogs: new Prisma.Decimal(s.cogs),
        grossProfit: new Prisma.Decimal(grossProfit),
        grossMargin: grossMargin != null ? new Prisma.Decimal(grossMargin.toFixed(4)) : null,
        operatingExpenses: new Prisma.Decimal(s.operatingExpenses),
        operatingIncome: new Prisma.Decimal(operatingIncome),
        ebitda: new Prisma.Decimal(ebitda),
        adjustedEbitda: new Prisma.Decimal(ebitda),
        cash: s.cash != null ? new Prisma.Decimal(s.cash) : null,
        accountsReceivable:
          s.accountsReceivable != null ? new Prisma.Decimal(s.accountsReceivable) : null,
        accountsPayable: s.accountsPayable != null ? new Prisma.Decimal(s.accountsPayable) : null,
        workingCapital: workingCapital != null ? new Prisma.Decimal(workingCapital) : null,
        currency: "CAD",
        sourceSystem: SEED_SOURCE,
        approvalStatus: p.approvalStatus,
        notes:
          p.status === "open"
            ? "Period in progress; figures are management estimates pending close."
            : null,
      };

      await prisma.financialSummary.upsert({
        where: {
          financialPeriodId_divisionId: {
            financialPeriodId: period.id,
            divisionId: division.id,
          },
        },
        create: { ...data, financialPeriodId: period.id, divisionId: division.id },
        update: data,
      });
      summaryCount += 1;
    }

    // Consolidated row (sum across operating divisions)
    const consolidatedDivision = await prisma.division.findUniqueOrThrow({
      where: { code: "CONS" },
    });
    const total = p.summaries.reduce(
      (acc, s) => ({
        revenue: acc.revenue + s.revenue,
        cogs: acc.cogs + s.cogs,
        operatingExpenses: acc.operatingExpenses + s.operatingExpenses,
        cash: (acc.cash ?? 0) + (s.cash ?? 0),
        accountsReceivable: (acc.accountsReceivable ?? 0) + (s.accountsReceivable ?? 0),
        accountsPayable: (acc.accountsPayable ?? 0) + (s.accountsPayable ?? 0),
      }),
      {
        revenue: 0,
        cogs: 0,
        operatingExpenses: 0,
        cash: 0,
        accountsReceivable: 0,
        accountsPayable: 0,
      },
    );
    const cgp = total.revenue - total.cogs;
    const coi = cgp - total.operatingExpenses;
    const cwc = total.cash + total.accountsReceivable - total.accountsPayable;

    const consolidatedData = {
      revenue: new Prisma.Decimal(total.revenue),
      cogs: new Prisma.Decimal(total.cogs),
      grossProfit: new Prisma.Decimal(cgp),
      grossMargin: total.revenue > 0 ? new Prisma.Decimal((cgp / total.revenue).toFixed(4)) : null,
      operatingExpenses: new Prisma.Decimal(total.operatingExpenses),
      operatingIncome: new Prisma.Decimal(coi),
      ebitda: new Prisma.Decimal(coi),
      adjustedEbitda: new Prisma.Decimal(coi),
      cash: new Prisma.Decimal(total.cash),
      accountsReceivable: new Prisma.Decimal(total.accountsReceivable),
      accountsPayable: new Prisma.Decimal(total.accountsPayable),
      workingCapital: new Prisma.Decimal(cwc),
      currency: "CAD",
      sourceSystem: SEED_SOURCE,
      approvalStatus: p.approvalStatus,
    };
    await prisma.financialSummary.upsert({
      where: {
        financialPeriodId_divisionId: {
          financialPeriodId: period.id,
          divisionId: consolidatedDivision.id,
        },
      },
      create: {
        ...consolidatedData,
        financialPeriodId: period.id,
        divisionId: consolidatedDivision.id,
      },
      update: consolidatedData,
    });
    summaryCount += 1;
  }

  console.log(`  • ${PERIODS.length} periods, ${summaryCount} summaries`);
}

// =============================================================================
// Marketing campaigns — docs/04 §8
// =============================================================================

type CampaignSeed = {
  sourceId: string;
  name: string;
  campaignType: string;
  status: "draft" | "scheduled" | "sent" | "paused" | "cancelled";
  subject?: string;
  audienceSummary?: string;
  scheduledAtDaysAgo?: number; // negative => future
  sentAtDaysAgo?: number;
  metrics?: {
    sentCount: number;
    openCount: number;
    clickCount: number;
    conversionCount: number;
    attributedRevenue: number;
    unsubscribeCount: number;
    bounceCount: number;
    measuredAtDaysAgo: number;
  };
};

const CAMPAIGNS: CampaignSeed[] = [
  {
    sourceId: "cmp-spring-reactivation",
    name: "Spring Reactivation",
    campaignType: "email",
    status: "sent",
    subject: "We've missed you — 15% off your next Wellmart order",
    audienceSummary: "Wellmart retail customers — high LTV, lapsed >90d (412 contacts)",
    sentAtDaysAgo: 25,
    metrics: {
      sentCount: 412,
      openCount: 168,
      clickCount: 47,
      conversionCount: 11,
      attributedRevenue: 642.85,
      unsubscribeCount: 4,
      bounceCount: 7,
      measuredAtDaysAgo: 24,
    },
  },
  {
    sourceId: "cmp-may-clinic-promo",
    name: "May Clinic Promo",
    campaignType: "email",
    status: "sent",
    subject: "Clinic supplies refresh — May volume pricing",
    audienceSummary: "LifeSupply.ca — clinic + B2B segments (148 contacts)",
    sentAtDaysAgo: 9,
    metrics: {
      sentCount: 148,
      openCount: 94,
      clickCount: 31,
      conversionCount: 8,
      attributedRevenue: 4128.4,
      unsubscribeCount: 1,
      bounceCount: 2,
      measuredAtDaysAgo: 8,
    },
  },
  {
    sourceId: "cmp-ppe-restock-alert",
    name: "PPE Restock Alert",
    campaignType: "email",
    status: "scheduled",
    subject: "Your favourite PPE is back in stock",
    audienceSummary: "Wellmart retail — PPE buyers (last 12 months, 287 contacts)",
    scheduledAtDaysAgo: -2, // future
  },
  {
    sourceId: "cmp-loyalty-q2",
    name: "Customer Loyalty Q2 Update",
    campaignType: "email",
    status: "draft",
    audienceSummary: "TBD — Marketing Manager to define",
  },
  {
    sourceId: "cmp-q2-product-spotlight",
    name: "Q2 Product Spotlight",
    campaignType: "email",
    status: "sent",
    subject: "Featured this quarter: Halton diagnostics",
    audienceSummary: "LifeSupply + Wellmart subscribers (520 contacts)",
    sentAtDaysAgo: 39,
    metrics: {
      sentCount: 520,
      openCount: 198,
      clickCount: 62,
      conversionCount: 19,
      attributedRevenue: 2840.6,
      unsubscribeCount: 6,
      bounceCount: 9,
      measuredAtDaysAgo: 38,
    },
  },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seedMarketing(prisma: PrismaClient) {
  console.log("→ Campaigns & metrics");
  let metricCount = 0;

  for (const c of CAMPAIGNS) {
    const data = {
      name: c.name,
      campaignType: c.campaignType,
      status: c.status,
      subject: c.subject,
      audienceSummary: c.audienceSummary,
      scheduledAt: c.scheduledAtDaysAgo != null ? daysAgo(c.scheduledAtDaysAgo) : null,
      sentAt: c.sentAtDaysAgo != null ? daysAgo(c.sentAtDaysAgo) : null,
    };

    const campaign = await prisma.campaign.upsert({
      where: { sourceSystem_sourceId: { sourceSystem: SEED_SOURCE, sourceId: c.sourceId } },
      create: { ...data, sourceSystem: SEED_SOURCE, sourceId: c.sourceId },
      update: data,
    });

    if (c.metrics) {
      // Replace existing metrics for idempotency
      await prisma.campaignMetrics.deleteMany({ where: { campaignId: campaign.id } });
      await prisma.campaignMetrics.create({
        data: {
          campaignId: campaign.id,
          sentCount: c.metrics.sentCount,
          openCount: c.metrics.openCount,
          clickCount: c.metrics.clickCount,
          conversionCount: c.metrics.conversionCount,
          attributedRevenue: new Prisma.Decimal(c.metrics.attributedRevenue),
          unsubscribeCount: c.metrics.unsubscribeCount,
          bounceCount: c.metrics.bounceCount,
          measuredAt: daysAgo(c.metrics.measuredAtDaysAgo),
        },
      });
      metricCount += 1;
    }
  }

  console.log(`  • ${CAMPAIGNS.length} campaigns, ${metricCount} metric snapshots`);
}

// =============================================================================
// Website metrics — docs/04 §8.4
// =============================================================================

async function seedAnalytics(prisma: PrismaClient) {
  console.log("→ Website metrics (last 30 days × 2 stores)");
  const stores = await prisma.store.findMany({
    where: { externalStoreId: { in: ["lifesupply-ca", "wellmartmedical-com"] } },
  });

  // Deterministic pseudo-random based on (storeKey, dayIndex) so reruns match.
  function pseudo(seed: number) {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x); // 0..1
  }

  let rowCount = 0;
  for (const store of stores) {
    const isLifeSupply = store.externalStoreId === "lifesupply-ca";
    for (let d = 1; d <= 30; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      const seedNum = (isLifeSupply ? 1000 : 2000) + d;
      const noise = pseudo(seedNum); // 0..1

      const baseUsers = isLifeSupply ? 380 : 1240;
      const baseSessions = isLifeSupply ? 510 : 1640;
      const basePageViews = isLifeSupply ? 1820 : 5600;
      const basePurchases = isLifeSupply ? 14 : 22;
      const baseRevenue = isLifeSupply ? 4200 : 1980;

      const users = Math.round(baseUsers * (0.85 + noise * 0.3));
      const sessions = Math.round(baseSessions * (0.85 + noise * 0.3));
      const engagedSessions = Math.round(sessions * (0.55 + noise * 0.15));
      const pageViews = Math.round(basePageViews * (0.85 + noise * 0.3));
      const productViews = Math.round(pageViews * 0.35);
      const addToCarts = Math.round(productViews * 0.18);
      const checkouts = Math.round(addToCarts * 0.42);
      const purchases = Math.max(0, Math.round(basePurchases * (0.7 + noise * 0.6)));
      const revenue = Math.round(baseRevenue * (0.8 + noise * 0.5) * 100) / 100;
      const conversionRate = sessions > 0 ? purchases / sessions : 0;

      await prisma.websiteMetric.upsert({
        where: { storeId_date: { storeId: store.id, date } },
        create: {
          storeId: store.id,
          date,
          sourceSystem: "ga4",
          users,
          sessions,
          engagedSessions,
          pageViews,
          productViews,
          addToCarts,
          checkouts,
          purchases,
          revenue: new Prisma.Decimal(revenue),
          conversionRate: new Prisma.Decimal(conversionRate.toFixed(4)),
        },
        update: {
          users,
          sessions,
          engagedSessions,
          pageViews,
          productViews,
          addToCarts,
          checkouts,
          purchases,
          revenue: new Prisma.Decimal(revenue),
          conversionRate: new Prisma.Decimal(conversionRate.toFixed(4)),
        },
      });
      rowCount += 1;
    }
  }

  console.log(`  • ${rowCount} website metric rows`);
}

// =============================================================================
// Tasks & approvals — docs/04 §10
// =============================================================================

type TaskSeed = {
  externalKey: string; // sourceType + sourceId pair
  title: string;
  description?: string;
  status: "open" | "in_progress" | "blocked" | "awaiting_approval" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDateDaysFromNow?: number;
  relatedOrderNumber?: string;
  notes?: string;
};

const TASKS: TaskSeed[] = [
  {
    externalKey: "exception::LS-1032",
    title: "Reroute LS-1032 to BBM01 — confirm pricing",
    description:
      "Primary supplier MEDD01 is short on Large nitrile gloves. Confirm BBM01 cost and approve the supplier swap before placing the order.",
    status: "open",
    priority: "urgent",
    dueDateDaysFromNow: 1,
    relatedOrderNumber: "LS-1032",
  },
  {
    externalKey: "exception::LS-1035",
    title: "Investigate margin drop on N95 — order LS-1035",
    description:
      "HSI01 cost on N95 increased from $22.50 to $24.10. Review margin impact and decide whether to reprice, switch supplier, or accept.",
    status: "in_progress",
    priority: "high",
    dueDateDaysFromNow: 2,
    relatedOrderNumber: "LS-1035",
  },
  {
    externalKey: "approval::cmp-spring-reactivation-followup",
    title: "Approve Spring Reactivation follow-up send",
    description: "Marketing has drafted a follow-up to non-openers. Approve or revise.",
    status: "awaiting_approval",
    priority: "medium",
    dueDateDaysFromNow: 3,
  },
  {
    externalKey: "manual::reactivate-sarah-chen",
    title: "Personal outreach to Sarah Chen",
    description:
      "High reactivation score (78). Send a personalized note offering a complimentary thermometer with next order.",
    status: "open",
    priority: "low",
    dueDateDaysFromNow: 7,
  },
  {
    externalKey: "manual::product-images-cane",
    title: "Add product images and description for Walking Cane",
    description: "LS-MOB-CANE-ADJ has needs_review images and missing description.",
    status: "open",
    priority: "medium",
    dueDateDaysFromNow: 5,
  },
  {
    externalKey: "manual::quickbooks-april-reconcile",
    title: "Reconcile QuickBooks April 2026",
    description: "Verify April financial summary matches QuickBooks reports before close.",
    status: "completed",
    priority: "high",
    dueDateDaysFromNow: -5,
  },
  {
    externalKey: "manual::wm-sku-coverage",
    title: "Review Wellmart SKU coverage by BBM01",
    description:
      "BBM01 is ~80% of Wellmart fulfillment. Identify SKUs missing alternate supplier mapping.",
    status: "open",
    priority: "medium",
    dueDateDaysFromNow: 14,
  },
  {
    externalKey: "manual::board-prep-may",
    title: "Prepare May board update",
    description:
      "Pull approved April financials, key operating exceptions, and Spring Reactivation results.",
    status: "open",
    priority: "medium",
    dueDateDaysFromNow: 14,
  },
  {
    externalKey: "ai::reactivation-list-review",
    title: "Review AI reactivation candidates",
    description:
      "AI proposed 47 candidates for May reactivation campaign. Review and approve before campaign build.",
    status: "open",
    priority: "medium",
    dueDateDaysFromNow: 4,
  },
  {
    externalKey: "manual::supplier-contract-bbm",
    title: "Renew BBM01 supply agreement",
    description: "Current agreement expires 2026-07-01. Begin renewal discussions.",
    status: "open",
    priority: "low",
    dueDateDaysFromNow: 30,
  },
];

async function seedTasksAndApprovals(prisma: PrismaClient) {
  console.log("→ Tasks & approvals");
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@lifesupply.local" } });

  for (const t of TASKS) {
    const [sourceType, sourceId] = t.externalKey.split("::");
    let relatedEntityType: string | undefined;
    let relatedEntityId: string | undefined;
    if (t.relatedOrderNumber) {
      const order = await prisma.order.findFirst({ where: { orderNumber: t.relatedOrderNumber } });
      if (order) {
        relatedEntityType = "Order";
        relatedEntityId = order.id;
      }
    }

    const dueDate = t.dueDateDaysFromNow != null ? daysAgo(-t.dueDateDaysFromNow) : null;
    const completedAt = t.status === "completed" ? daysAgo(2) : null;

    // Find existing by source key (idempotent reseed)
    const existing = await prisma.task.findFirst({
      where: { sourceType: sourceType, sourceId: sourceId },
    });

    const data = {
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignedToId: admin.id,
      createdById: admin.id,
      dueDate,
      completedAt,
      relatedEntityType,
      relatedEntityId,
      sourceType: sourceType ?? "manual",
      sourceId: sourceId ?? null,
    };

    if (existing) {
      await prisma.task.update({ where: { id: existing.id }, data });
    } else {
      await prisma.task.create({ data });
    }
  }
  console.log(`  • ${TASKS.length} tasks`);

  // One sample approval — Spring Reactivation follow-up campaign
  const followupTask = await prisma.task.findFirst({
    where: { sourceId: "cmp-spring-reactivation-followup" },
  });
  await prisma.approval.deleteMany({ where: { relatedEntityType: "Campaign" } });
  await prisma.approval.create({
    data: {
      approvalType: "campaign",
      status: "pending",
      requestedById: admin.id,
      relatedEntityType: "Campaign",
      relatedEntityId: followupTask?.id ?? null,
      requestSummary: "Follow-up send to Spring Reactivation non-openers (244 contacts).",
      requestedAt: daysAgo(1),
    },
  });

  // Approved approval — April financial summary
  const aprilPeriod = await prisma.financialPeriod.findUniqueOrThrow({
    where: { name: "2026-04" },
  });
  await prisma.approval.create({
    data: {
      approvalType: "financial_summary",
      status: "approved",
      requestedById: admin.id,
      approverId: admin.id,
      relatedEntityType: "FinancialPeriod",
      relatedEntityId: aprilPeriod.id,
      requestSummary: "April 2026 management financials approved for monthly close.",
      decisionNotes: "Reviewed against QuickBooks; approved by Owner.",
      requestedAt: daysAgo(7),
      decidedAt: daysAgo(6),
    },
  });
  console.log("  • 2 approvals (1 pending, 1 approved)");
}

// =============================================================================
// AI outputs (sample briefings) — docs/04 §9.2
// =============================================================================

const AI_OUTPUTS = [
  {
    module: "dashboard_briefing",
    prompt: "Summarize today's operating performance and recommend 3 management actions.",
    output: `Today's brief — 2026-05-09

OBSERVATIONS
- Two LifeSupply orders need attention: LS-1032 (urgent supplier swap) and LS-1035 (margin review on N95 due to a $1.60 supplier cost increase).
- Spring Reactivation campaign (Wellmart) closed at 40.8% open and 11 conversions, attributing $642.85 in revenue.
- May MTD revenue across operating divisions is tracking ~$155k vs. April pace of ~$453k.

RECOMMENDED ACTIONS
1. Approve the BBM01 reroute for LS-1032 to avoid a 24h+ delay to Kingston LTC.
2. Decide on N95 pricing or supplier mix this week — current margin is ~38% vs. 42% baseline.
3. Schedule the PPE Restock Alert for May 12 to capture the post-reactivation Wellmart audience.`,
    sourceReferences: { orders: ["LS-1032", "LS-1035"], campaigns: ["cmp-spring-reactivation"] },
  },
  {
    module: "financial_commentary",
    prompt: "Generate financial commentary for the April 2026 close.",
    output: `April 2026 financial commentary

Consolidated revenue of $453.1k was up 5.2% over March, driven primarily by LifeSupply Canada (+5.8%) and Wellmart Medical (+12.2%). Wellmart's growth reflects continued benefit from the Q2 product spotlight email send.

Gross margin held at 28.0% consolidated (vs. 27.9% in March). Operating income improved to $69.2k from $63.9k.

Cash position improved to $248.9k consolidated, with working capital of $266.9k (current ratio comfortable). AR aging is concentrated in two clinic accounts (Halton Health, Calgary Family) — both reliable historical payers.

Recommended areas of focus for May:
- Wellmart sourcing concentration on BBM01 (~80%); diversify before peak season.
- LifeSupply N95 margin pressure at HSI01 — already in review.`,
    sourceReferences: { periods: ["2026-04", "2026-03"] },
  },
  {
    module: "reactivation_summary",
    prompt: "Identify the top reactivation candidates for Wellmart.",
    output: `Top Wellmart reactivation candidates (May 2026)

Tier 1 — high LTV, > 90 days since last order, still subscribed:
1. Sarah Chen (LTV $412.85, last order 220d ago, score 78)

Tier 2 — moderate LTV, 60–180 days lapsed:
- Approximately 47 customers identified via segment criteria.

Excluded: David Kim (unsubscribed), all transactional-only consent contacts.

Recommendation: Personal outreach for Tier 1, segment-based campaign for Tier 2 with subject line A/B test (utility vs. discount framing).`,
    sourceReferences: { customers: ["c-sarah-chen", "c-david-kim"] },
  },
  {
    module: "supplier_exception_summary",
    prompt: "Summarize current supplier exceptions and recommend next actions.",
    output: `Supplier exceptions — week of 2026-05-04

1. MEDD01 / Nitrile Large — out of stock for LS-1032 (Kingston LTC, 10 boxes).
   Recommended: place on BBM01 (cost $9.85 vs. $9.50, margin impact ~3.7%).

2. HSI01 / N95 — cost increased from $22.50 to $24.10 (+7.1%) on LS-1035.
   Options: (a) absorb to keep customer pricing, (b) increase customer price to $40.95 to maintain margin, or (c) explore alternate manufacturer.

3. BBM01 / Wellmart — concentration risk. ~80% of Wellmart fulfillment runs through BBM01. No active exceptions, but a contingency supplier should be onboarded before Q3.`,
    sourceReferences: { orders: ["LS-1032", "LS-1035"], suppliers: ["MEDD01", "HSI01", "BBM01"] },
  },
];

async function seedAiOutputs(prisma: PrismaClient) {
  console.log("→ Sample AI outputs");
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@lifesupply.local" } });

  // Replace existing seeded outputs for idempotency (only those tagged with seed metadata)
  await prisma.aiOutput.deleteMany({
    where: { module: { in: AI_OUTPUTS.map((a) => a.module) }, userId: admin.id },
  });

  for (const a of AI_OUTPUTS) {
    await prisma.aiOutput.create({
      data: {
        userId: admin.id,
        modelProvider: "anthropic",
        modelName: "claude-opus-4-7",
        module: a.module,
        prompt: a.prompt,
        output: a.output,
        sourceReferences: a.sourceReferences,
        status: "reviewed",
      },
    });
  }
  console.log(`  • ${AI_OUTPUTS.length} AI outputs`);
}

// =============================================================================
// Reports — docs/04 §11
// =============================================================================

const REPORTS = [
  {
    title: "Monthly Management Report — April 2026",
    reportType: "monthly_management",
    periodStart: "2026-04-01",
    periodEnd: "2026-04-30",
    status: "approved" as const,
    summary:
      "Consolidated revenue $453.1k (+5.2% MoM), GM 28.0%, OI $69.2k. Includes divisional breakdown and AI-generated commentary.",
  },
  {
    title: "Daily Operating Brief — 2026-05-09",
    reportType: "daily_brief",
    periodStart: "2026-05-09",
    periodEnd: "2026-05-09",
    status: "generated" as const,
    summary:
      "Open orders, exceptions on LS-1032 and LS-1035, Spring Reactivation campaign closure, priority tasks.",
  },
  {
    title: "Customer Reactivation Analysis — May 2026",
    reportType: "customer_reactivation",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    status: "draft" as const,
    summary: "Tier 1 + Tier 2 candidate list, segment criteria, subject-line A/B test plan.",
  },
  {
    title: "Q1 2026 Board Update",
    reportType: "board",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
    status: "approved" as const,
    summary:
      "Quarterly revenue, GM, EBITDA across operating divisions. Strategic initiatives status. Approved by Owner.",
  },
];

async function seedReports(prisma: PrismaClient) {
  console.log("→ Reports");
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@lifesupply.local" } });

  for (const r of REPORTS) {
    const existing = await prisma.report.findFirst({ where: { title: r.title } });
    const data = {
      title: r.title,
      reportType: r.reportType,
      periodStart: new Date(r.periodStart),
      periodEnd: new Date(r.periodEnd),
      status: r.status,
      preparedById: admin.id,
      approvedById: r.status === "approved" ? admin.id : null,
      summary: r.summary,
    };
    if (existing) {
      await prisma.report.update({ where: { id: existing.id }, data });
    } else {
      await prisma.report.create({ data });
    }
  }
  console.log(`  • ${REPORTS.length} reports`);
}

// =============================================================================
// Integration connections & sync logs — docs/04 §13
// =============================================================================

type IntegrationSeed = {
  type:
    | "bigcommerce"
    | "quickbooks"
    | "mailchimp"
    | "ga4"
    | "openai"
    | "anthropic"
    | "supplier_portal"
    | "manual_import";
  name: string;
  status: "configured" | "not_configured" | "error" | "disabled";
  notes?: string;
  lastSuccessfulSyncDaysAgo?: number;
  syncs?: {
    syncType: string;
    status: "success" | "failed" | "partial";
    daysAgo: number;
    recordsProcessed?: number;
    errorSummary?: string;
  }[];
};

const INTEGRATIONS: IntegrationSeed[] = [
  {
    type: "bigcommerce",
    name: "BigCommerce — LifeSupply.ca",
    status: "configured",
    lastSuccessfulSyncDaysAgo: 0,
    syncs: [
      { syncType: "orders", status: "success", daysAgo: 0, recordsProcessed: 12 },
      { syncType: "products", status: "success", daysAgo: 1, recordsProcessed: 42 },
    ],
  },
  {
    type: "bigcommerce",
    name: "BigCommerce — WellmartMedical.com",
    status: "configured",
    lastSuccessfulSyncDaysAgo: 0,
    syncs: [
      { syncType: "orders", status: "success", daysAgo: 0, recordsProcessed: 5 },
      { syncType: "customers", status: "success", daysAgo: 1, recordsProcessed: 18 },
    ],
  },
  {
    type: "quickbooks",
    name: "QuickBooks Online",
    status: "not_configured",
    notes: "Awaiting OAuth setup. Manual file import available in the meantime.",
  },
  {
    type: "mailchimp",
    name: "Mailchimp",
    status: "configured",
    lastSuccessfulSyncDaysAgo: 1,
    syncs: [
      { syncType: "campaigns", status: "success", daysAgo: 1, recordsProcessed: 3 },
      {
        syncType: "contacts",
        status: "failed",
        daysAgo: 2,
        errorSummary: "API rate limit exceeded after 4,800/5,000 contacts. Retry scheduled.",
      },
    ],
  },
  { type: "ga4", name: "GA4 — LifeSupply.ca", status: "configured", lastSuccessfulSyncDaysAgo: 0 },
  {
    type: "ga4",
    name: "GA4 — WellmartMedical.com",
    status: "configured",
    lastSuccessfulSyncDaysAgo: 0,
  },
  { type: "openai", name: "OpenAI API", status: "configured" },
  { type: "anthropic", name: "Anthropic Claude API", status: "configured" },
  {
    type: "supplier_portal",
    name: "BBM01 — Best Buy Medical Portal",
    status: "configured",
    notes: "Credentials stored. Automation scripts in development; manual mode only.",
  },
];

async function seedIntegrations(prisma: PrismaClient) {
  console.log("→ Integration connections & sync logs");
  let syncCount = 0;
  for (const i of INTEGRATIONS) {
    const conn = await prisma.integrationConnection.upsert({
      where: { integrationType_name: { integrationType: i.type, name: i.name } },
      create: {
        integrationType: i.type,
        name: i.name,
        status: i.status,
        notes: i.notes,
        lastSuccessfulSyncAt:
          i.lastSuccessfulSyncDaysAgo != null ? daysAgo(i.lastSuccessfulSyncDaysAgo) : null,
        lastSyncAt:
          i.lastSuccessfulSyncDaysAgo != null ? daysAgo(i.lastSuccessfulSyncDaysAgo) : null,
      },
      update: {
        status: i.status,
        notes: i.notes,
        lastSuccessfulSyncAt:
          i.lastSuccessfulSyncDaysAgo != null ? daysAgo(i.lastSuccessfulSyncDaysAgo) : null,
        lastSyncAt:
          i.lastSuccessfulSyncDaysAgo != null ? daysAgo(i.lastSuccessfulSyncDaysAgo) : null,
      },
    });

    if (i.syncs && i.syncs.length > 0) {
      // Replace logs for idempotency
      await prisma.integrationSyncLog.deleteMany({
        where: { integrationConnectionId: conn.id },
      });
      for (const s of i.syncs) {
        const startedAt = daysAgo(s.daysAgo);
        const completedAt = new Date(startedAt.getTime() + 60 * 1000);
        await prisma.integrationSyncLog.create({
          data: {
            integrationConnectionId: conn.id,
            syncType: s.syncType,
            status: s.status,
            startedAt,
            completedAt,
            recordsProcessed: s.recordsProcessed ?? 0,
            recordsCreated:
              s.status === "success" ? Math.floor((s.recordsProcessed ?? 0) * 0.4) : 0,
            recordsUpdated:
              s.status === "success" ? Math.floor((s.recordsProcessed ?? 0) * 0.6) : 0,
            recordsFailed: s.status === "failed" ? (s.recordsProcessed ?? 0) : 0,
            errorSummary: s.errorSummary,
          },
        });
        syncCount += 1;
      }
    }
  }
  console.log(`  • ${INTEGRATIONS.length} integrations, ${syncCount} sync logs`);
}

// =============================================================================
// Orchestrator
// =============================================================================

export async function seedManagement(prisma: PrismaClient) {
  console.log("→ Management & analytics data");
  await seedFinancials(prisma);
  await seedMarketing(prisma);
  await seedAnalytics(prisma);
  await seedTasksAndApprovals(prisma);
  await seedAiOutputs(prisma);
  await seedReports(prisma);
  await seedIntegrations(prisma);
}
