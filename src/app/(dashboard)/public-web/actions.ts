"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { PermissionDeniedError, requirePermission } from "@/server/permissions";
import { TRANSITIONS, type PublicFamily, type TransitionName } from "@/server/public-web/families";
import {
  ConflictError,
  ValidationError,
  WorkflowError,
  createDocumentDraft,
  createDraft,
  saveDocument,
  saveDraft,
  transitionContent,
  transitionDocument,
} from "@/server/public-web/workflow";

export type PublicWebActionState =
  | { ok: string; id?: string }
  | { error: string; issues?: { path: string; message: string }[] }
  | undefined;

const FAMILIES: readonly PublicFamily[] = ["news", "resource"];
const TRANSITION_NAMES = Object.keys(TRANSITIONS) as TransitionName[];
const DONE: Record<TransitionName, string> = {
  submit: "submitted for review",
  reject: "returned to draft",
  approve: "approved",
  publish: "published",
  unpublish: "withdrawn",
  archive: "archived",
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullable(formData: FormData, key: string) {
  const value = text(formData, key);
  return value === "" ? null : value;
}

function lines(formData: FormData, key: string) {
  return text(formData, key)
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** Local datetime input → ISO with the server's offset; blank stays null. */
function datetime(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function expectedUpdatedAt(formData: FormData) {
  const value = text(formData, "expectedUpdatedAt");
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new ConflictError("Missing concurrency token.");
  return date;
}

function draftInput(family: PublicFamily, formData: FormData) {
  const payload =
    family === "news"
      ? {
          date: text(formData, "date"),
          body: lines(formData, "body"),
          source:
            nullable(formData, "sourceLabel") || nullable(formData, "sourceHref")
              ? { label: text(formData, "sourceLabel"), href: text(formData, "sourceHref") }
              : null,
          related: [],
        }
      : {
          body: lines(formData, "body"),
          author: text(formData, "author"),
          reviewer: text(formData, "reviewer"),
          published: text(formData, "published"),
          reviewed: text(formData, "reviewed"),
          action: text(formData, "action"),
        };
  return {
    slug: text(formData, "slug"),
    title: text(formData, "title"),
    summary: text(formData, "summary"),
    sourceReference: nullable(formData, "sourceReference"),
    effectiveAt: datetime(formData, "effectiveAt"),
    expiresAt: datetime(formData, "expiresAt"),
    payload,
  };
}

function documentInput(formData: FormData) {
  return {
    title: text(formData, "title"),
    documentType: text(formData, "documentType"),
    periodLabel: nullable(formData, "periodLabel"),
    publicUrl: nullable(formData, "publicUrl"),
    disclosureText: nullable(formData, "disclosureText"),
    sourceReference: nullable(formData, "sourceReference"),
  };
}

function failure(error: unknown): PublicWebActionState {
  if (error instanceof ValidationError)
    return { error: "Please correct the fields below.", issues: error.issues };
  if (error instanceof ConflictError || error instanceof WorkflowError)
    return { error: error.message };
  if (error instanceof PermissionDeniedError)
    return { error: "You do not have permission for that action." };
  return { error: "The action could not be completed." };
}

function refresh(id?: string) {
  revalidatePath("/public-web");
  revalidatePath("/public-web/content");
  revalidatePath("/public-web/documents");
  if (id) {
    revalidatePath(`/public-web/content/${id}`);
    revalidatePath(`/public-web/documents/${id}`);
  }
}

export async function createContentAction(
  _prev: PublicWebActionState,
  formData: FormData,
): Promise<PublicWebActionState> {
  try {
    const actor = await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);
    const family = text(formData, "family") as PublicFamily;
    if (!FAMILIES.includes(family)) return { error: "Unknown content family." };
    const created = await createDraft(actor, family, draftInput(family, formData));
    refresh(created.id);
    return { ok: "Draft created.", id: created.id };
  } catch (error) {
    return failure(error);
  }
}

export async function saveContentAction(
  _prev: PublicWebActionState,
  formData: FormData,
): Promise<PublicWebActionState> {
  try {
    const actor = await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);
    const family = text(formData, "family") as PublicFamily;
    if (!FAMILIES.includes(family)) return { error: "Unknown content family." };
    const id = text(formData, "id");
    await saveDraft(actor, id, draftInput(family, formData), expectedUpdatedAt(formData));
    refresh(id);
    return { ok: "Draft saved.", id };
  } catch (error) {
    return failure(error);
  }
}

export async function transitionContentAction(
  _prev: PublicWebActionState,
  formData: FormData,
): Promise<PublicWebActionState> {
  try {
    const transition = text(formData, "transition") as TransitionName;
    if (!TRANSITION_NAMES.includes(transition)) return { error: "Unknown transition." };
    const actor = await requirePermission(
      transition === "submit" ? PERMISSIONS.PUBLIC_WEB_EDIT : PERMISSIONS.PUBLIC_WEB_APPROVE,
    );
    const id = text(formData, "id");
    await transitionContent(
      actor,
      id,
      transition,
      expectedUpdatedAt(formData),
      nullable(formData, "reason"),
    );
    refresh(id);
    return { ok: `Record ${DONE[transition]}.`, id };
  } catch (error) {
    return failure(error);
  }
}

export async function createDocumentAction(
  _prev: PublicWebActionState,
  formData: FormData,
): Promise<PublicWebActionState> {
  try {
    const actor = await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);
    const created = await createDocumentDraft(actor, documentInput(formData));
    refresh(created.id);
    return { ok: "Document record created.", id: created.id };
  } catch (error) {
    return failure(error);
  }
}

export async function saveDocumentAction(
  _prev: PublicWebActionState,
  formData: FormData,
): Promise<PublicWebActionState> {
  try {
    const actor = await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);
    const id = text(formData, "id");
    await saveDocument(actor, id, documentInput(formData), expectedUpdatedAt(formData));
    refresh(id);
    return { ok: "Document record saved.", id };
  } catch (error) {
    return failure(error);
  }
}

export async function transitionDocumentAction(
  _prev: PublicWebActionState,
  formData: FormData,
): Promise<PublicWebActionState> {
  try {
    const transition = text(formData, "transition") as TransitionName;
    if (!TRANSITION_NAMES.includes(transition)) return { error: "Unknown transition." };
    const actor = await requirePermission(
      transition === "submit" ? PERMISSIONS.PUBLIC_WEB_EDIT : PERMISSIONS.PUBLIC_WEB_APPROVE,
    );
    const id = text(formData, "id");
    await transitionDocument(
      actor,
      id,
      transition,
      expectedUpdatedAt(formData),
      nullable(formData, "reason"),
    );
    refresh(id);
    return { ok: "Document updated.", id };
  } catch (error) {
    return failure(error);
  }
}
