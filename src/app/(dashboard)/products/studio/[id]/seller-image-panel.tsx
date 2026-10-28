import Image from "next/image";
import { ExternalLink, Globe, ImageOff, Loader2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { latestImageSearch } from "@/server/services/product-studio/competitor-images";

import { queueImageSearchAction, selectSellerImageAction } from "../actions";
import { StudioActionForm } from "../studio-action-form";
import { SearchPoller } from "./search-poller";

const SOURCE_LABEL: Record<string, string> = {
  manufacturer: "Manufacturer",
  distributor: "Distributor",
  retailer: "Retailer",
  marketplace: "Marketplace",
};

const KIND_LABEL: Record<string, string> = {
  packshot: "packshot",
  packaging: "packaging",
  lifestyle: "lifestyle photo",
  other: "other image",
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

/**
 * Shown in the source photographs card while a project has no photograph
 * and its photographs may still change (product owner, 2026-10-28). Offers
 * the seller-image search, shows one thumbnail per seller found, and lets
 * the operator choose one as the authoritative photograph. The search runs
 * on the worker; the poller refreshes the page until it finishes.
 */
export async function SellerImagePanel({
  projectId,
  enabled,
}: {
  projectId: string;
  enabled: boolean;
}): Promise<React.JSX.Element> {
  const search = await latestImageSearch(projectId);
  const busy = search?.status === "queued" || search?.status === "running";
  const candidates = search?.status === "succeeded" ? search.candidates : [];
  return (
    <div className="space-y-3 rounded-md border p-3" data-testid="seller-image-panel">
      <div className="flex items-start gap-2">
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">
            No photograph of your own? Use a seller&rsquo;s image.
          </p>
          <p className="text-xs text-muted-foreground">
            Searches other sellers of the same product for their listing image and shows one per
            seller. Choosing one makes it this project&rsquo;s authoritative photograph, with the
            seller and page recorded, and research is told it is a listing image rather than a
            photograph of your stock. A manufacturer&rsquo;s packshot is the best choice; a
            seller&rsquo;s styled photograph carries that seller&rsquo;s creative work.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StudioActionForm action={queueImageSearchAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <Button type="submit" size="sm" variant="outline" disabled={!enabled || busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Search />}
            {busy
              ? "Searching sellers…"
              : search
                ? "Search sellers again"
                : "Search sellers for a product image"}
          </Button>
        </StudioActionForm>
        {busy ? (
          <>
            <SearchPoller />
            <p className="text-xs text-muted-foreground">
              Running on the background worker. This page updates itself.
            </p>
          </>
        ) : null}
        {!enabled ? (
          <p className="text-xs text-muted-foreground">Product Studio is switched off.</p>
        ) : null}
      </div>

      {search?.status === "failed" ? (
        <p role="alert" className="text-xs text-destructive">
          The search stopped: {search.errorMessage ?? "unknown error"}
        </p>
      ) : null}

      {search?.status === "succeeded" && candidates.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No seller listing of this exact product could be verified. Add a photograph instead, or
          search again with a fuller title and description.
        </p>
      ) : null}

      {candidates.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-4" aria-label="Seller images found">
          {candidates.map((candidate) => {
            const usable = candidate.fetchError == null && candidate.assetId == null;
            return (
              <li key={candidate.id} className="flex flex-col gap-2 rounded-md border p-2">
                <div className="relative aspect-square overflow-hidden rounded bg-muted">
                  {candidate.fetchError ? (
                    <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center text-[11px] text-muted-foreground">
                      <ImageOff className="h-5 w-5" aria-hidden />
                      <span>Image could not be fetched</span>
                    </div>
                  ) : (
                    <Image
                      src={`/api/product-studio/image-candidates/${candidate.id}`}
                      alt={`${candidate.sellerName}: product image from ${hostOf(candidate.pageUrl)}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 220px"
                      className="object-contain"
                      unoptimized
                    />
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium" title={candidate.sellerName}>
                    {candidate.sellerName}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {SOURCE_LABEL[candidate.sourceType ?? ""] ?? "Seller"}
                    </Badge>
                    <span>{KIND_LABEL[candidate.imageKind ?? ""] ?? "image"}</span>
                    {candidate.width && candidate.height ? (
                      <span>
                        · {candidate.width}×{candidate.height}
                      </span>
                    ) : null}
                  </div>
                  {candidate.notes ? (
                    <p
                      className="line-clamp-3 text-xs text-muted-foreground"
                      title={candidate.notes}
                    >
                      {candidate.notes}
                    </p>
                  ) : null}
                  {candidate.fetchError ? (
                    <p className="break-words text-xs text-destructive">{candidate.fetchError}</p>
                  ) : null}
                  <a
                    href={candidate.pageUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                  >
                    {hostOf(candidate.pageUrl)} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <StudioActionForm action={selectSellerImageAction} className="mt-auto">
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="candidateId" value={candidate.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant={candidate.assetId ? "secondary" : "default"}
                    className="h-auto w-full whitespace-normal"
                    disabled={!enabled || !usable}
                  >
                    {candidate.assetId ? "Chosen" : "Use this image"}
                  </Button>
                </StudioActionForm>
              </li>
            );
          })}
        </ul>
      ) : null}

      {search?.status === "succeeded" && search.warnings.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {search.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
