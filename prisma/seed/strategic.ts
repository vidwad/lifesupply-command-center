import { Prisma, type PrismaClient } from "@prisma/client";

// -----------------------------------------------------------------------------
// Investors
// -----------------------------------------------------------------------------

const INVESTORS = [
  {
    key: "halton-capital",
    name: "Halton Capital Partners",
    organization: "Halton Capital Partners",
    email: "deals@haltoncapital.example",
    investorType: "vc",
    status: "engaged",
    notes:
      "Focus on Canadian healthtech / medical supply distribution. Interested in our Wellmart retail growth.",
  },
  {
    key: "wadhwani-fo",
    name: "Wadhwani Family Office",
    organization: "Wadhwani Family Office",
    email: "office@wadhwani-fo.example",
    investorType: "family_office",
    status: "prospect",
    notes: "Existing relationship. Possible follow-on after Q2 close.",
  },
  {
    key: "pacific-nw",
    name: "Pacific Northwest Health Fund",
    organization: "PNW Health Fund",
    email: "intro@pnwhealth.example",
    investorType: "vc",
    status: "prospect",
    notes: "First touch via warm intro; needs Q1 financials before continuing.",
  },
  {
    key: "westside-bank",
    name: "Westside Bank — Commercial Lending",
    organization: "Westside Bank",
    email: "commercial@westsidebank.example",
    investorType: "lender",
    status: "committed",
    notes: "Existing $500k operating line of credit. Annual review in Q3.",
  },
];

const INTERACTIONS = [
  {
    investorKey: "halton-capital",
    interactionType: "meeting",
    daysAgo: 14,
    summary: "Walkthrough of LifeSupply Canada B2B funnel + April financials. Strong interest.",
    nextAction: "Send 3-year forecast + Wellmart unit economics deck.",
  },
  {
    investorKey: "westside-bank",
    interactionType: "document_shared",
    daysAgo: 30,
    summary: "Shared Q1 reviewed financials and LOC utilization summary. No issues.",
    nextAction: "Annual review meeting in late Q3.",
  },
  {
    investorKey: "pacific-nw",
    interactionType: "call",
    daysAgo: 7,
    summary:
      "Intro call. They want Canadian healthtech exposure but are early in their fund cycle.",
    nextAction: "Follow-up after Q1 financials are finalized.",
  },
];

// -----------------------------------------------------------------------------
// Opportunities
// -----------------------------------------------------------------------------

const OPPORTUNITIES = [
  {
    key: "opp-bbm01-acquihire",
    title: "Acquire BBM01 product line + supplier relationships",
    opportunityType: "acquisition",
    status: "evaluating",
    strategicRationale:
      "BBM01 fulfills ~80% of Wellmart orders. Bringing the product line in-house would eliminate the dropship margin haircut and de-risk concentration.",
    estimatedRevenueImpact: 480000,
    estimatedMarginImpact: 0.08,
    estimatedCost: 1200000,
    riskRating: "high",
    priority: "high",
    nextAction: "Initial valuation conversation with BBM01 ownership.",
    dueDateDaysFromNow: 21,
    acquisitionTarget: {
      companyName: "Best Buy Medical Inc.",
      website: "https://bestbuymedical.example",
      geography: "Ontario, CA",
      revenueEstimate: 3200000,
      ebitdaEstimate: 420000,
      strategicFit: "High — direct vertical integration of Wellmart's primary supplier.",
      integrationComplexity: "medium",
      valuationNotes:
        "Industry comp range ~3.5–4.5x EBITDA. Owner-operator; succession motivation may compress valuation.",
      diligenceStatus: "not_started",
    },
  },
  {
    key: "opp-direct-manufacturer-nitrile",
    title: "Direct manufacturer relationship for nitrile gloves",
    opportunityType: "supplier",
    status: "identified",
    strategicRationale:
      "Nitrile gloves are our highest-volume SKU. Cutting MEDD01 out for our top sizes could lift gross margin by ~6–8 points on that line.",
    estimatedRevenueImpact: 0,
    estimatedMarginImpact: 0.07,
    estimatedCost: 80000,
    riskRating: "medium",
    priority: "medium",
    nextAction: "Reach out to two SE Asian manufacturers for samples + quotes.",
    dueDateDaysFromNow: 60,
  },
  {
    key: "opp-shipping-consolidation",
    title: "Consolidate shipping carriers across both stores",
    opportunityType: "cost_reduction",
    status: "in_progress",
    strategicRationale:
      "Currently using 3 carriers across LifeSupply.ca + Wellmart. Single-carrier negotiation could save $1.50–$2.50 per shipment at our volume.",
    estimatedRevenueImpact: 0,
    estimatedMarginImpact: 0.015,
    estimatedCost: 0,
    riskRating: "low",
    priority: "medium",
    nextAction: "Finalize Canpar volume RFQ; compare to Purolator current rates.",
    dueDateDaysFromNow: 14,
  },
  {
    key: "opp-q3-reactivation-expansion",
    title: "Expand Q3 reactivation campaign to U.S. operations",
    opportunityType: "marketing",
    status: "identified",
    strategicRationale:
      "Spring Reactivation worked on Wellmart Canada. Apply the same playbook to U.S. lapsed customers heading into Q3.",
    estimatedRevenueImpact: 35000,
    estimatedMarginImpact: 0.32,
    estimatedCost: 4500,
    riskRating: "low",
    priority: "low",
    nextAction: "Build U.S. lapsed segment; draft subject-line A/B test.",
    dueDateDaysFromNow: 45,
  },
];

// -----------------------------------------------------------------------------

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function findInvestorByEmail(prisma: PrismaClient, email: string) {
  return prisma.investor.findFirst({ where: { email } });
}

async function seedInvestors(prisma: PrismaClient) {
  console.log("→ Investors & interactions");
  let count = 0;
  for (const i of INVESTORS) {
    const existing = await findInvestorByEmail(prisma, i.email);
    const data = {
      name: i.name,
      organization: i.organization,
      email: i.email,
      investorType: i.investorType,
      status: i.status,
      notes: i.notes,
    };
    if (existing) {
      await prisma.investor.update({ where: { id: existing.id }, data });
    } else {
      await prisma.investor.create({ data });
    }
    count += 1;
  }

  // Replace interactions for idempotency
  await prisma.investorInteraction.deleteMany({});

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@lifesupply.local" } });
  let interactionCount = 0;
  for (const it of INTERACTIONS) {
    const investorRecord = INVESTORS.find((i) => i.key === it.investorKey);
    if (!investorRecord) continue;
    const investor = await findInvestorByEmail(prisma, investorRecord.email);
    if (!investor) continue;
    await prisma.investorInteraction.create({
      data: {
        investorId: investor.id,
        interactionType: it.interactionType,
        interactionDate: daysAgo(it.daysAgo),
        summary: it.summary,
        nextAction: it.nextAction,
        createdById: admin.id,
      },
    });
    interactionCount += 1;
  }
  console.log(`  • ${count} investors, ${interactionCount} interactions`);
}

async function seedOpportunities(prisma: PrismaClient) {
  console.log("→ Opportunities & acquisition targets");
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@lifesupply.local" } });

  // Replace opportunities to keep idempotency simple (cascades to acquisitionTargets).
  await prisma.opportunity.deleteMany({});

  for (const o of OPPORTUNITIES) {
    const opportunity = await prisma.opportunity.create({
      data: {
        title: o.title,
        opportunityType: o.opportunityType,
        status: o.status,
        strategicRationale: o.strategicRationale,
        estimatedRevenueImpact:
          o.estimatedRevenueImpact != null ? new Prisma.Decimal(o.estimatedRevenueImpact) : null,
        estimatedMarginImpact:
          o.estimatedMarginImpact != null
            ? new Prisma.Decimal(o.estimatedMarginImpact.toFixed(4))
            : null,
        estimatedCost: o.estimatedCost != null ? new Prisma.Decimal(o.estimatedCost) : null,
        riskRating: o.riskRating,
        priority: o.priority,
        ownerId: admin.id,
        nextAction: o.nextAction,
        dueDate: o.dueDateDaysFromNow != null ? daysAgo(-o.dueDateDaysFromNow) : null,
      },
    });

    if (o.acquisitionTarget) {
      const t = o.acquisitionTarget;
      await prisma.acquisitionTarget.create({
        data: {
          opportunityId: opportunity.id,
          companyName: t.companyName,
          website: t.website,
          geography: t.geography,
          revenueEstimate: t.revenueEstimate != null ? new Prisma.Decimal(t.revenueEstimate) : null,
          ebitdaEstimate: t.ebitdaEstimate != null ? new Prisma.Decimal(t.ebitdaEstimate) : null,
          strategicFit: t.strategicFit,
          integrationComplexity: t.integrationComplexity,
          valuationNotes: t.valuationNotes,
          diligenceStatus: t.diligenceStatus,
        },
      });
    }
  }
  console.log(`  • ${OPPORTUNITIES.length} opportunities`);
}

export async function seedStrategic(prisma: PrismaClient) {
  console.log("→ Strategic growth data");
  await seedInvestors(prisma);
  await seedOpportunities(prisma);
}
