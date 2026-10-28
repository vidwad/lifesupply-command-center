import { Link2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchLinkCandidates } from "@/server/services/product-studio/link";

import { linkProductAction } from "../actions";
import { StudioActionForm } from "../studio-action-form";

/**
 * Shown on a project with no catalogue product (2026-10-28). Search is a plain
 * GET so the page stays a server component and works without JavaScript; the
 * link itself is the audited action. Candidates the publish service would
 * refuse are listed with the reason and cannot be chosen.
 */
export async function LinkProductPanel({
  projectId,
  query,
}: {
  projectId: string;
  query: string;
}): Promise<React.JSX.Element> {
  const candidates = query.trim().length >= 2 ? await searchLinkCandidates(query) : [];
  return (
    <div className="px-4 pt-4 md:px-6 md:pt-6">
      <div className="space-y-3 rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Link2 className="h-4 w-4 shrink-0" />
          <p>
            <span className="font-medium">Not linked to a catalogue product.</span>{" "}
            <span className="text-muted-foreground">
              Approved images and the description cannot be published until this project points at
              the store listing they belong to. Linking spends nothing and keeps the work done here.
            </span>
          </p>
        </div>
        <form method="get" action={`/products/studio/${projectId}`} className="flex gap-2">
          <Input
            name="link"
            defaultValue={query}
            placeholder="Search the catalogue by name or SKU"
            aria-label="Search the catalogue by name or SKU"
            className="bg-background"
          />
          <Button type="submit" variant="outline" size="sm" className="h-10 shrink-0">
            <Search /> Search
          </Button>
        </form>
        {query.trim().length >= 2 ? (
          candidates.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No catalogue product matches &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <ul className="divide-y rounded-md border bg-card">
              {candidates.map((candidate) => (
                <li
                  key={candidate.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{candidate.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[candidate.sku, candidate.storeName].filter(Boolean).join(" · ") || "No SKU"}
                      {candidate.liveProjects > 0
                        ? ` · already has ${String(candidate.liveProjects)} project${
                            candidate.liveProjects === 1 ? "" : "s"
                          }`
                        : ""}
                    </p>
                    {candidate.unpublishableReason ? (
                      <p className="text-xs text-destructive">{candidate.unpublishableReason}</p>
                    ) : null}
                  </div>
                  <StudioActionForm action={linkProductAction}>
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="productId" value={candidate.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      disabled={candidate.unpublishableReason != null}
                    >
                      <Link2 /> Link
                    </Button>
                  </StudioActionForm>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </div>
  );
}
