/**
 * Custom error types raised by the AI service + aiCall. Kept in their own
 * file so both can import without a circular dependency.
 */

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "AI provider is not configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in the environment, or add a credential at /admin/integrations.",
    );
    this.name = "AiNotConfiguredError";
  }
}

export class AiProviderNotConfiguredError extends Error {
  constructor(public readonly provider: "anthropic" | "openai") {
    super(
      `AI provider "${provider}" is not configured. Add a credential at /admin/integrations or switch the template's provider.`,
    );
    this.name = "AiProviderNotConfiguredError";
  }
}

export class AiOutputValidationError extends Error {
  constructor(
    public readonly templateKey: string,
    public readonly issues: string[],
  ) {
    super(
      `AI output for template "${templateKey}" failed schema validation: ${issues.join(", ")}`,
    );
    this.name = "AiOutputValidationError";
  }
}

export class AiActionPermissionError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = "AiActionPermissionError";
  }
}
