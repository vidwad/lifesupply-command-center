"use server";

import { PERMISSIONS } from "@/lib/permissions";
import { askAiAnalyst, AiNotConfiguredError } from "@/server/services/ai";
import { requirePermission } from "@/server/permissions";

export type AnalystState =
  | { status: "idle" }
  | { status: "ok"; question: string; answer: string; createdAt: string; modelName: string }
  | { status: "error"; message: string }
  | undefined;

export async function askAnalystAction(
  _prev: AnalystState,
  formData: FormData,
): Promise<AnalystState> {
  const user = await requirePermission(PERMISSIONS.AI_USE);
  const question = String(formData.get("question") ?? "").trim();
  if (!question) return { status: "error", message: "Question is required." };

  try {
    const result = await askAiAnalyst({ question, userId: user.id });
    return {
      status: "ok",
      question,
      answer: result.output,
      createdAt: result.createdAt.toISOString(),
      modelName: result.modelName,
    };
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return { status: "error", message: err.message };
    }
    console.error("[ai-analyst] askAnalystAction failed", err);
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Failed to query the AI analyst.",
    };
  }
}
