import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { ReportSnapshot } from "./index";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 2,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6,
  },
  meta: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 9,
    color: "#6b7280",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 8,
    lineHeight: 1.45,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 4,
  },
  rowHead: {
    flexDirection: "row",
    paddingVertical: 4,
    fontSize: 8,
    color: "#6b7280",
    letterSpacing: 1,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  cellLabel: { flex: 2 },
  cellValue: { flex: 1, textAlign: "right" },
  bullet: {
    fontSize: 10,
    marginLeft: 12,
    marginBottom: 2,
  },
  twoCol: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  twoColItem: {
    width: "50%",
    fontSize: 10,
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    fontSize: 8,
    color: "#6b7280",
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 48,
    fontSize: 8,
    color: "#9ca3af",
  },
});

const fmtCurrency = (n: number, currency = "CAD") =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

const fmtPercent = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n);

type Props = {
  title: string;
  status: string;
  preparedBy: string;
  generatedAt: Date;
  summary: string | null;
  snapshot: ReportSnapshot | null;
};

export function ReportPdfDocument({
  title,
  status,
  preparedBy,
  generatedAt,
  summary,
  snapshot,
}: Props) {
  return (
    <Document title={title} author={preparedBy}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>LifeSupply Command Center</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          Generated {generatedAt.toLocaleString("en-CA")} by {preparedBy} • Status:{" "}
          {status.replace(/_/g, " ")}
        </Text>

        {summary && (
          <View>
            <Text style={styles.sectionTitle}>Executive summary</Text>
            <Text style={styles.paragraph}>{summary}</Text>
          </View>
        )}

        {snapshot && <SnapshotBody snapshot={snapshot} />}

        <Text style={styles.footer}>
          Source of truth for accounting figures: QuickBooks. This report is the management view,
          generated from the LifeSupply Command Center.
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

function SnapshotBody({ snapshot }: { snapshot: ReportSnapshot }) {
  const f = snapshot.financial;
  const p = snapshot.prevFinancial;
  return (
    <>
      <Text style={styles.sectionTitle}>Financials — {snapshot.division.name}</Text>
      <View style={styles.table}>
        <View style={styles.rowHead}>
          <Text style={styles.cellLabel}>Metric</Text>
          <Text style={styles.cellValue}>{snapshot.period.name}</Text>
          <Text style={styles.cellValue}>{snapshot.prevPeriod?.name ?? "Prior"}</Text>
        </View>
        <FinRow label="Revenue" cur={f.revenue} prev={p?.revenue ?? null} />
        <FinRow label="COGS" cur={f.cogs} prev={p?.cogs ?? null} />
        <FinRow label="Gross profit" cur={f.grossProfit} prev={p?.grossProfit ?? null} />
        <View style={styles.row}>
          <Text style={styles.cellLabel}>Gross margin</Text>
          <Text style={styles.cellValue}>
            {f.grossMargin != null ? fmtPercent(f.grossMargin) : "—"}
          </Text>
          <Text style={styles.cellValue}>
            {p?.grossMargin != null ? fmtPercent(p.grossMargin) : "—"}
          </Text>
        </View>
        <FinRow
          label="Operating expenses"
          cur={f.operatingExpenses}
          prev={p?.operatingExpenses ?? null}
        />
        <FinRow
          label="Operating income"
          cur={f.operatingIncome}
          prev={p?.operatingIncome ?? null}
        />
        {f.cash != null && <FinRow label="Cash" cur={f.cash} prev={p?.cash ?? null} />}
        {f.workingCapital != null && (
          <FinRow
            label="Working capital"
            cur={f.workingCapital}
            prev={p?.workingCapital ?? null}
          />
        )}
      </View>

      <Text style={styles.sectionTitle}>Operations</Text>
      <View style={styles.twoCol}>
        <Text style={styles.twoColItem}>Total orders: {snapshot.operations.totalOrders}</Text>
        <Text style={styles.twoColItem}>Completed: {snapshot.operations.completedOrders}</Text>
        <Text style={styles.twoColItem}>Cancelled: {snapshot.operations.cancelledOrders}</Text>
        <Text style={styles.twoColItem}>
          Awaiting supplier: {snapshot.operations.awaitingSupplier}
        </Text>
        <Text style={styles.twoColItem}>
          Open exceptions: {snapshot.operations.exceptionsOpen}
        </Text>
        <Text style={styles.twoColItem}>
          Order revenue: {fmtCurrency(snapshot.operations.grossOrderRevenue)}
        </Text>
      </View>

      {snapshot.topProducts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Top products</Text>
          {snapshot.topProducts.map((tp, i) => (
            <Text key={tp.id} style={styles.bullet}>
              {i + 1}. {tp.name} — {fmtCurrency(tp.revenue)} ({tp.quantity} units)
            </Text>
          ))}
        </>
      )}

      {snapshot.marketing.sentCampaigns > 0 && (
        <>
          <Text style={styles.sectionTitle}>Marketing</Text>
          <View style={styles.twoCol}>
            <Text style={styles.twoColItem}>
              Campaigns sent: {snapshot.marketing.sentCampaigns}
            </Text>
            <Text style={styles.twoColItem}>
              Contacts reached: {snapshot.marketing.totalSent.toLocaleString()}
            </Text>
            <Text style={styles.twoColItem}>
              Opens: {snapshot.marketing.totalOpens.toLocaleString()}
            </Text>
            <Text style={styles.twoColItem}>
              Conversions: {snapshot.marketing.totalConversions.toLocaleString()}
            </Text>
            <Text style={styles.twoColItem}>
              Attributed revenue: {fmtCurrency(snapshot.marketing.attributedRevenue)}
            </Text>
          </View>
        </>
      )}

      {snapshot.priorityTasks.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Priority tasks at report time</Text>
          {snapshot.priorityTasks.map((t) => (
            <Text key={t.id} style={styles.bullet}>
              • [{t.priority}] {t.title} ({t.status.replace(/_/g, " ")})
            </Text>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Source</Text>
      <Text style={styles.paragraph}>
        Period: {snapshot.period.name} ({snapshot.period.startDate} – {snapshot.period.endDate},
        status: {snapshot.period.status})
      </Text>
      <Text style={styles.paragraph}>
        Division: {snapshot.division.name} ({snapshot.division.code})
      </Text>
    </>
  );
}

function FinRow({ label, cur, prev }: { label: string; cur: number; prev: number | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{fmtCurrency(cur)}</Text>
      <Text style={styles.cellValue}>{prev != null ? fmtCurrency(prev) : "—"}</Text>
    </View>
  );
}
