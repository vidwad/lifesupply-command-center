"use client";

/**
 * BigCommerce publishing panel for one Product Studio project.
 *
 * The only controls in Product Studio that change something a customer can
 * see. Rendered for Super Admin only (the page checks the permission before
 * mounting it), and the copy says plainly what each button does, because an
 * operator should never have to infer from a label that this card is
 * different from the approve buttons in the compositions beside it.
 *
 * Two kinds of control live here:
 *   - "Approve for upload" / "Withdraw" mark an approved draft, or the full
 *     description, as selected for the store. Internal state only.
 *   - "Publish" sends every marked, unpublished item. The one destructive
 *     action, and it renders disabled whenever a gate is closed.
 */
import { useActionState } from "react";
import { CheckCircle2, Loader2, Upload, Undo2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
  publishProjectAction,
  setAssetUploadMarkAction,
  setDescriptionUploadMarkAction,
  type PublishActionState,
} from "../publish-actions";

export type PublishPanelImage = {
  assetId: string;
  slot: number;
  name: string;
  revision: number;
  /** The review status: only "approved" drafts can be marked. */
  status: string;
  uploadApproved: boolean;
  publishedAt: string | null;
  bigCommerceImageId: number | null;
};

export type PublishPanelLog = {
  id: string;
  label: string;
  status: string;
  who: string | null;
  at: string;
  error: string | null;
};

type MarkAction = (previous: PublishActionState, formData: FormData) => Promise<PublishActionState>;

function MarkForm({
  action,
  fields,
  marked,
  disabledReason,
}: {
  action: MarkAction;
  fields: Record<string, string>;
  marked: boolean;
  disabledReason: string | null;
}): React.JSX.Element {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="hidden" name="marked" value={marked ? "0" : "1"} />
      <Button
        type="submit"
        size="sm"
        variant={marked ? "ghost" : "outline"}
        disabled={pending || disabledReason != null}
        title={disabledReason ?? undefined}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : marked ? (
          <Undo2 className="h-3.5 w-3.5" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        {marked ? "Withdraw" : "Approve for upload"}
      </Button>
      {state?.error ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function PublishedBadge({ at, imageId }: { at: string; imageId?: number | null }) {
  return (
    <Badge variant="secondary" title={at}>
      Published{imageId != null ? ` · image #${imageId}` : ""}
    </Badge>
  );
}

export function PublishPanel({
  projectId,
  target,
  targetReason,
  disabledFlags,
  busy,
  images,
  description,
  pendingCount,
  logs,
}: {
  projectId: string;
  target: {
    storeName: string | null;
    productName: string;
    sku: string | null;
    sourceProductId: string;
  } | null;
  targetReason: string | null;
  disabledFlags: string[];
  busy: boolean;
  images: PublishPanelImage[];
  description: {
    present: boolean;
    preview: string;
    uploadApproved: boolean;
    publishedAt: string | null;
  };
  /** Marked and not yet published: what the publish button will send. */
  pendingCount: number;
  logs: PublishPanelLog[];
}): React.JSX.Element {
  const [state, publishAction, pending] = useActionState(publishProjectAction, undefined);
  const blockedByFlags = disabledFlags.length > 0;
  const noTarget = target == null;
  const canPublishNow = !blockedByFlags && !noTarget && !busy && pendingCount > 0;
  const markDisabled = noTarget ? (targetReason ?? "No BigCommerce product is linked.") : null;

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-base">BigCommerce publishing</CardTitle>
        <CardDescription>
          Super Admin only. Sends upload-approved images and the full description to the live store
          listing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Target listing
          </p>
          {target ? (
            <p>
              <span className="font-medium">{target.productName}</span>
              {target.sku ? (
                <span className="text-muted-foreground"> · SKU {target.sku}</span>
              ) : null}
              <br />
              <span className="text-xs text-muted-foreground">
                {target.storeName ?? "BigCommerce store"} · product id {target.sourceProductId}
              </span>
            </p>
          ) : (
            <p className="text-xs text-destructive">{targetReason}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Images
          </p>
          {images.length === 0 ? (
            <p className="text-xs text-muted-foreground">No generated drafts yet.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {images.map((image) => {
                const notApproved = image.status !== "approved";
                return (
                  <li key={image.assetId} className="flex items-center gap-3 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- authenticated internal route; next/image adds nothing here */}
                    <img
                      src={`/api/product-studio/assets/${image.assetId}`}
                      alt=""
                      className="h-12 w-12 flex-none rounded border object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        Composition {image.slot}
                        <span className="text-muted-foreground"> · {image.name}</span>
                        {image.revision > 1 ? (
                          <span className="text-muted-foreground"> · r{image.revision}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notApproved
                          ? "Approve in review first"
                          : image.uploadApproved
                            ? "Approved for upload"
                            : "Approved in review"}
                      </p>
                    </div>
                    {image.publishedAt ? (
                      <PublishedBadge at={image.publishedAt} imageId={image.bigCommerceImageId} />
                    ) : (
                      <MarkForm
                        action={setAssetUploadMarkAction}
                        fields={{ projectId, assetId: image.assetId }}
                        marked={image.uploadApproved}
                        disabledReason={
                          markDisabled ??
                          (notApproved ? "Approve the draft in review before marking it." : null)
                        }
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Full description
          </p>
          <div className="flex items-start gap-3 rounded-md border p-2">
            <div className="min-w-0 flex-1">
              {description.present ? (
                <>
                  <p className="line-clamp-3 text-xs text-muted-foreground">
                    {description.preview}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {description.uploadApproved ? "Approved for upload" : "Not marked"} · replaces
                    the listing&apos;s current description
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No full description yet. Run research to produce one.
                </p>
              )}
            </div>
            {description.publishedAt ? (
              <PublishedBadge at={description.publishedAt} />
            ) : (
              <MarkForm
                action={setDescriptionUploadMarkAction}
                fields={{ projectId }}
                marked={description.uploadApproved}
                disabledReason={
                  markDisabled ?? (description.present ? null : "There is no description to mark.")
                }
              />
            )}
          </div>
        </div>

        <form action={publishAction} className="space-y-3 border-t pt-4">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="text-destructive">
              <strong>
                This changes the live BigCommerce listing. Images are added to the product and the
                full description replaces the one on the store.
              </strong>
            </p>
            <p>
              Requires product_studio.enabled, product_studio.publish, external.writebacks and the
              products.approve_bigcommerce_update permission. The current description and image list
              are read and recorded first, and every attempt is logged and audited.
            </p>
            <p>
              Not touched: name, price, SKU, inventory, visibility, the thumbnail and existing
              images. Each item is sent once; the run stops at the first failure.
            </p>
          </div>
          {blockedByFlags ? (
            <p className="text-xs text-destructive">
              Publishing is currently disabled. These flags are off: {disabledFlags.join(", ")}.
              Enable them in /admin/feature-flags. If the kill switch was tripped, that is why.
            </p>
          ) : null}
          {busy ? (
            <p className="text-xs text-muted-foreground">
              The worker is processing this project. Publish once it is idle.
            </p>
          ) : null}
          {state?.error ? (
            <p role="alert" className="text-xs text-destructive">
              {state.error}
            </p>
          ) : null}
          {state?.ok ? <p className="text-xs text-muted-foreground">{state.ok}</p> : null}
          {state?.items && state.items.length > 0 ? (
            <ul className="space-y-1 text-xs">
              {state.items.map((item) => (
                <li key={item.logId} className={item.status === "failed" ? "text-destructive" : ""}>
                  {item.label}: {item.message}
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            type="submit"
            variant="destructive"
            className="w-full"
            disabled={pending || !canPublishNow}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Upload />}
            {pendingCount > 0
              ? `Publish ${pendingCount} approved item${pendingCount === 1 ? "" : "s"} to BigCommerce`
              : "Nothing marked for upload"}
          </Button>
        </form>

        {logs.length > 0 ? (
          <div className="space-y-1 border-t pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              History
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.status === "failed" ? "text-destructive" : ""}>
                    {log.status}
                  </span>{" "}
                  · {log.label} · {log.at}
                  {log.who ? ` · ${log.who}` : ""}
                  {log.error ? ` · ${log.error}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
