import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { ProductStudioReport, ProjectReport, ReportImage } from "./report";
import { describeStorePrice } from "./store-price";

/**
 * The Product Studio summary report (2026-10-26): a cover, then one section
 * per project that starts on a new page and runs on if it needs to. Same
 * type and palette as the management report PDF.
 */
const styles = StyleSheet.create({
  page: { padding: 40, paddingBottom: 56, fontSize: 9, fontFamily: "Helvetica", color: "#1f2937" },
  eyebrow: {
    fontSize: 7,
    letterSpacing: 2,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#6b7280", marginBottom: 10 },
  sectionTitle: {
    fontSize: 7.5,
    color: "#6b7280",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 2,
  },
  paragraph: { fontSize: 9, lineHeight: 1.4, marginBottom: 4 },
  bullet: { fontSize: 9, lineHeight: 1.4, marginLeft: 10, marginBottom: 1.5 },
  blockTitle: { fontSize: 9, fontWeight: 700, marginTop: 4, marginBottom: 2 },
  row: { flexDirection: "row", gap: 8 },
  col: { flex: 1 },
  kv: { flexDirection: "row", marginBottom: 2 },
  k: { width: 92, color: "#6b7280" },
  v: { flex: 1 },
  photoRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  // Square frames with the whole image fitted inside, as the project page
  // shows them (2026-10-26): a light field, a hairline border, no cropping
  // and no stretching whatever the image's own proportions.
  photoFrame: {
    width: 104,
    height: 104,
    backgroundColor: "#f3f4f6",
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    padding: 3,
  },
  photo: { width: 96, height: 96, objectFit: "contain" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: { width: 256, borderWidth: 0.5, borderColor: "#e5e7eb", padding: 6, marginBottom: 6 },
  cardFrame: {
    width: 242,
    height: 242,
    backgroundColor: "#f3f4f6",
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    padding: 4,
    marginBottom: 4,
  },
  cardImage: { width: 232, height: 232, objectFit: "contain" },
  cardTitle: { fontSize: 9, fontWeight: 700 },
  small: { fontSize: 8, color: "#6b7280", lineHeight: 1.35 },
  tableHead: {
    flexDirection: "row",
    fontSize: 7.5,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 2,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 2,
    borderBottomWidth: 0.25,
    borderBottomColor: "#f3f4f6",
  },
  warning: { fontSize: 8.5, color: "#92400e", marginBottom: 2 },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: "#9ca3af",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
  coverStat: { fontSize: 9, marginBottom: 3 },
});

const money = (n: number | null, currency: string) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(n);
const when = (d: Date | null) => (d ? d.toLocaleString("en-CA") : "—");
const words = (s: string) => s.replaceAll("_", " ");

type ImageStyle = React.ComponentProps<typeof Image>["style"];

function Pic({ image, style }: { image: ReportImage; style: ImageStyle }) {
  // The PDF renderer's Image, not an HTML img: it has no alt attribute.
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image style={style} src={{ data: Buffer.from(image.data), format: image.format }} />;
}

function Footer({ generatedAt }: { generatedAt: Date }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        LifeSupply Command Center · Product Studio summary · generated{" "}
        {generatedAt.toLocaleString("en-CA")}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function ProjectPage({ project, generatedAt }: { project: ProjectReport; generatedAt: Date }) {
  const { market } = project;
  return (
    <Page size="LETTER" style={styles.page} wrap>
      <Text style={styles.eyebrow}>Product Studio · {words(project.status)}</Text>
      <Text style={styles.title}>{project.title}</Text>
      <Text style={styles.subtitle}>
        {project.product
          ? `${project.product.name}${project.product.sku ? ` · SKU ${project.product.sku}` : ""}${
              project.product.store ? ` · ${project.product.store}` : ""
            }${project.product.bigCommerceId ? ` · BigCommerce #${project.product.bigCommerceId}` : ""}`
          : "Standalone project, not linked to a catalogue product"}
        {" · "}created {when(project.createdAt)}
        {project.createdBy ? ` by ${project.createdBy}` : ""} · updated {when(project.updatedAt)}
      </Text>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Identity</Text>
          <View style={styles.kv}>
            <Text style={styles.k}>Brand</Text>
            <Text style={styles.v}>{project.identity.brand ?? "—"}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Model</Text>
            <Text style={styles.v}>{project.identity.model ?? "—"}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Identifiers</Text>
            <Text style={styles.v}>{project.identity.identifiers.join(", ") || "—"}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Condition</Text>
            <Text style={styles.v}>{project.identity.conditionNotes.join("; ") || "—"}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Mode</Text>
            <Text style={styles.v}>
              {project.identity.mode ? words(project.identity.mode) : "—"}
            </Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Confidence</Text>
            <Text style={styles.v}>
              {project.identity.confidence != null
                ? `${Math.round(project.identity.confidence * 100)}%`
                : "—"}
            </Text>
          </View>
        </View>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Market range</Text>
          <View style={styles.kv}>
            <Text style={styles.k}>Low / high</Text>
            <Text style={styles.v}>
              {money(market.low, market.currency)} – {money(market.high, market.currency)}
            </Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Median</Text>
            <Text style={styles.v}>{money(market.median, market.currency)}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Observations</Text>
            <Text style={styles.v}>
              {market.observationCount} · {project.sources.length} sources
            </Text>
          </View>
          {market.basis ? <Text style={styles.small}>{market.basis}</Text> : null}
          {/* The store's own listing against the range (2026-10-26). */}
          {market.store ? (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.blockTitle}>{market.store.storeName ?? "Our store"} today</Text>
              <View style={styles.kv}>
                <Text style={styles.k}>Listed price</Text>
                <Text style={styles.v}>{money(market.store.price, market.store.currency)}</Text>
              </View>
              <View style={styles.kv}>
                <Text style={styles.k}>Cost</Text>
                <Text style={styles.v}>
                  {market.store.cost != null
                    ? money(market.store.cost, market.store.currency)
                    : "not known"}
                </Text>
              </View>
              <View style={styles.kv}>
                <Text style={styles.k}>Margin</Text>
                <Text style={styles.v}>
                  {market.store.margin != null
                    ? `${Math.round(market.store.margin * 1000) / 10}%`
                    : "—"}
                </Text>
              </View>
              <Text style={styles.small}>{describeStorePrice(market.store)}</Text>
            </View>
          ) : project.product ? (
            <Text style={styles.small}>No listed price on the catalogue product.</Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Authoritative photographs ({project.sourcePhotoCount})
      </Text>
      {project.sourcePhotos.length > 0 ? (
        <View style={styles.photoRow}>
          {project.sourcePhotos.map((image, i) => (
            <View key={i} style={styles.photoFrame}>
              <Pic image={image} style={styles.photo} />
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.small}>
          {project.sourcePhotoCount === 0
            ? "No photograph on record."
            : "Photographs are in a format this report cannot embed."}
        </Text>
      )}

      <Text style={styles.sectionTitle}>Listing copy</Text>
      <Text style={styles.paragraph}>{project.shortDescription}</Text>
      {project.description.map((block, i) =>
        block.type === "title" ? (
          <Text key={i} style={styles.blockTitle}>
            {block.text}
          </Text>
        ) : block.type === "list" ? (
          <View key={i}>
            {block.items.map((item, j) => (
              <Text key={j} style={styles.bullet}>
                • {item}
              </Text>
            ))}
          </View>
        ) : (
          <Text key={i} style={styles.paragraph}>
            {block.lines.join("\n")}
          </Text>
        ),
      )}
      {project.keyDetails.length > 0 ? (
        <View>
          <Text style={styles.blockTitle}>Key details</Text>
          {project.keyDetails.map((item, i) => (
            <Text key={i} style={styles.bullet}>
              • {item}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Compositions</Text>
      {project.compositions.length === 0 ? (
        <Text style={styles.small}>Research has not run; no compositions yet.</Text>
      ) : (
        <View style={styles.grid}>
          {project.compositions.map((composition) => (
            <View key={composition.slot} style={styles.card} wrap={false}>
              {composition.image ? (
                <View style={styles.cardFrame}>
                  <Pic image={composition.image} style={styles.cardImage} />
                </View>
              ) : (
                <Text style={styles.small}>No image generated.</Text>
              )}
              <Text style={styles.cardTitle}>
                {composition.slot}. {composition.name}
                {composition.revision != null && composition.revision > 1
                  ? ` (r${composition.revision})`
                  : ""}
              </Text>
              {composition.purpose ? <Text style={styles.small}>{composition.purpose}</Text> : null}
              <Text style={styles.small}>
                Review: {words(composition.reviewStatus)}
                {composition.qaVerdict ? ` · QA ${composition.qaVerdict}` : ""}
                {composition.qaConfidence != null
                  ? ` (${Math.round(composition.qaConfidence * 100)}%)`
                  : ""}
              </Text>
              <Text style={styles.small}>
                {composition.publishedAt
                  ? `On the store as image #${composition.bigCommerceImageId ?? "?"} since ${when(composition.publishedAt)}`
                  : composition.uploadApproved
                    ? "Approved for upload, not yet published"
                    : "Not marked for upload"}
                {composition.isMainImage ? " · chosen as main image" : ""}
              </Text>
              {composition.requiredCorrections.length > 0 ? (
                <Text style={styles.small}>
                  Corrections: {composition.requiredCorrections.join("; ")}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {market.observations.length > 0 ? (
        <View>
          <Text style={styles.sectionTitle}>Price observations (lowest first)</Text>
          <View style={styles.tableHead}>
            <Text style={{ flex: 3 }}>Seller</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>Price</Text>
            <Text style={{ flex: 2, textAlign: "right" }}>Condition</Text>
          </View>
          {market.observations.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ flex: 3 }}>{item.seller}</Text>
              <Text style={{ flex: 1, textAlign: "right" }}>
                {money(item.price, item.currency)}
              </Text>
              <Text style={{ flex: 2, textAlign: "right" }}>{item.condition ?? "—"}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Publishing</Text>
      <Text style={styles.small}>
        {project.counts.approvedSlots} of 4 compositions approved · {project.counts.publishedSlots}{" "}
        on the store · description{" "}
        {project.publishing.descriptionPublishedAt
          ? `published ${when(project.publishing.descriptionPublishedAt)}`
          : project.publishing.descriptionUploadApproved
            ? "approved for upload"
            : "not marked"}
      </Text>
      {project.publishing.history.map((item, i) => (
        <Text key={i} style={styles.small}>
          {when(item.at)} · {item.label} · {item.status}
          {item.error ? ` · ${item.error}` : ""}
        </Text>
      ))}

      {project.warnings.length > 0 ? (
        <View>
          <Text style={styles.sectionTitle}>Warnings</Text>
          {project.warnings.map((warning, i) => (
            <Text key={i} style={styles.warning}>
              • {warning}
            </Text>
          ))}
        </View>
      ) : null}

      {project.sources.length > 0 ? (
        <View>
          <Text style={styles.sectionTitle}>Research sources</Text>
          {project.sources.slice(0, 10).map((source, i) => (
            <Text key={i} style={styles.small}>
              {source.seller}
              {source.title ? ` · ${source.title}` : ""} · {source.url}
            </Text>
          ))}
        </View>
      ) : null}

      <Footer generatedAt={generatedAt} />
    </Page>
  );
}

export function ProductStudioReportDocument({ report }: { report: ProductStudioReport }) {
  const counts = report.projects.reduce(
    (acc, project) => ({
      approved: acc.approved + (project.status === "approved" ? 1 : 0),
      published: acc.published + (project.counts.publishedSlots > 0 ? 1 : 0),
    }),
    { approved: 0, published: 0 },
  );
  return (
    <Document title="Product Studio summary" author={report.preparedBy}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>LifeSupply Command Center</Text>
        <Text style={styles.title}>Product Studio summary</Text>
        <Text style={styles.subtitle}>
          Generated {report.generatedAt.toLocaleString("en-CA")} by {report.preparedBy}
        </Text>
        <Text style={styles.coverStat}>
          {report.projects.length} project{report.projects.length === 1 ? "" : "s"} in this report.
        </Text>
        <Text style={styles.coverStat}>
          {counts.approved} with all four compositions approved · {counts.published} with at least
          one image on the store.
        </Text>
        {report.missing.length > 0 ? (
          <Text style={styles.warning}>
            {report.missing.length} requested project(s) were not found and are omitted.
          </Text>
        ) : null}
        <Text style={styles.sectionTitle}>Contents</Text>
        {report.projects.map((project, i) => (
          <Text key={project.id} style={styles.paragraph}>
            {i + 1}. {project.title}
            {project.product?.sku ? ` · ${project.product.sku}` : ""} · {words(project.status)}
          </Text>
        ))}
        <Text style={[styles.small, { marginTop: 10 }]}>
          Internal working document. Market figures are asking prices observed during research, not
          an appraisal. Generated images are review drafts unless shown as on the store.
        </Text>
        <Footer generatedAt={report.generatedAt} />
      </Page>
      {report.projects.map((project) => (
        <ProjectPage key={project.id} project={project} generatedAt={report.generatedAt} />
      ))}
    </Document>
  );
}
