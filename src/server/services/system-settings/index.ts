import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

export type SettingKey =
  | "ai.default_model"
  | "ai.max_output_tokens"
  | "ai.temperature"
  /** OpenAI text model for Product Studio research, QA and reformatting (2026-10-26). Empty = fall back. */
  | "ai.openai_model"
  /** OpenAI image model for Product Studio generation (2026-10-26). Empty = built-in default. */
  | "ai.openai_image_model";

export const SETTING_DEFAULTS: Record<SettingKey, string> = {
  "ai.default_model": "gpt-5-mini",
  "ai.max_output_tokens": "4096",
  "ai.temperature": "0.3",
  "ai.openai_model": "",
  "ai.openai_image_model": "",
};

export async function getSetting<T extends SettingKey>(key: T): Promise<string> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? SETTING_DEFAULTS[key];
}

export async function getSettings(keys: SettingKey[]): Promise<Record<string, string>> {
  const rows = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const result: Record<string, string> = {};
  for (const key of keys) result[key] = SETTING_DEFAULTS[key];
  for (const row of rows) result[row.key] = row.value;
  return result;
}

export async function setSetting(
  key: SettingKey,
  value: string,
  description: string | null,
  actor: { id: string },
): Promise<void> {
  const before = await prisma.systemSetting.findUnique({ where: { key } });
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value, description, updatedById: actor.id },
    update: { value, description, updatedById: actor.id },
  });
  await writeAudit({
    actorUserId: actor.id,
    action: "system_setting.updated",
    entityType: "system_setting",
    entityId: key,
    beforeData: before ? { value: before.value } : null,
    afterData: { value },
  });
}
