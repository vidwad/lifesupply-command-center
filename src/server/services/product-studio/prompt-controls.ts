/**
 * Frame aspect and operator prompt controls.
 *
 * Two problems this solves:
 *
 * 1. The compiled prompt always opened with "square photograph" while the API
 *    request always asked for a square, but research writes briefs whose layout
 *    says "Landscape orientation showing the entire lens" or "Overhead (flat
 *    lay)". A brief asking for landscape inside a square frame is an
 *    unsatisfiable instruction, and the model resolves it by ignoring one half.
 *
 * 2. Generation was all-or-nothing: the operator could approve or reject, but
 *    could not say "drop the case, tighten the crop" and try again. Every draft
 *    is human-gated and nothing publishes, so attempting with operator guidance
 *    is strictly more useful than refusing.
 *
 * Operator instructions are deliberately scoped to staging and framing. They
 * cannot authorise changing the product's identity or condition — that line is
 * what separates staging a photograph from misrepresenting an item for sale.
 */

export type FrameAspect = "square" | "landscape" | "portrait";

/**
 * Longest operator instruction accepted, in characters. Matches the project
 * short-description cap. The previous 1,000 was arbitrary and too tight: QA
 * required-corrections lists run to eight or more detailed bullets, and pasting
 * them is a reasonable thing to do.
 */
export const MAX_OPERATOR_INSTRUCTIONS = 4_000;

const PORTRAIT = /\b(portrait|vertical)\b/i;
const LANDSCAPE = /\b(landscape|horizontal|widescreen|wide\s+crop)\b/i;
const SQUARE = /\bsquare\b/i;

/**
 * Infers the intended frame from the brief's free-text layout. Research returns
 * no structured orientation field, so this reads the same words a photographer
 * would. Square is the fallback: it is the safest e-commerce default and the
 * only aspect every model supports.
 */
export function detectAspect(...text: (string | null | undefined)[]): FrameAspect {
  const joined = text.filter(Boolean).join(" ");
  if (SQUARE.test(joined)) return "square";
  if (PORTRAIT.test(joined)) return "portrait";
  if (LANDSCAPE.test(joined)) return "landscape";
  return "square";
}

/** Sizes accepted by models limited to the enumerated set. */
const ENUMERATED: Record<FrameAspect, string> = {
  square: "1024x1024",
  landscape: "1536x1024",
  portrait: "1024x1536",
};

/** Same aspect ratios, scaled so the long edge is 2048. */
const ARBITRARY: Record<FrameAspect, string> = {
  square: "2048x2048",
  landscape: "2048x1365",
  portrait: "1365x2048",
};

export function sizeForAspect(aspect: FrameAspect, supportsArbitrarySize: boolean): string {
  return supportsArbitrarySize ? ARBITRARY[aspect] : ENUMERATED[aspect];
}

/** Wording for the opening line of the compiled prompt. */
export function aspectPhrase(aspect: FrameAspect): string {
  return aspect === "square" ? "square" : aspect;
}

export class OperatorInstructionError extends Error {}

/** Trims, validates, and returns null for an empty instruction. */
export function normaliseOperatorInstructions(raw: string | null | undefined): string | null {
  // A textarea's maxLength counts a newline as one character while editing, but
  // form submission normalises newlines to CRLF, so a multi-line value arrives
  // longer than the browser allowed the operator to type. Measure the same way
  // the browser did, or a value the UI accepted is rejected by the server.
  const value = raw?.replace(/\r\n/g, "\n").trim();
  if (!value) return null;
  if (value.length > MAX_OPERATOR_INSTRUCTIONS) {
    throw new OperatorInstructionError(
      `Instructions must be ${MAX_OPERATOR_INSTRUCTIONS} characters or fewer.`,
    );
  }
  return value;
}

/**
 * Appends operator guidance to the stored composition prompt. Appended rather
 * than merged so the researched brief stays intact and the effective prompt
 * remains readable as "brief, then what the operator changed".
 */
export function applyOperatorInstructions(
  basePrompt: string,
  instructions: string | null | undefined,
): string {
  const value = normaliseOperatorInstructions(instructions);
  if (!value) return basePrompt;
  return `${basePrompt}

OPERATOR INSTRUCTIONS (highest priority for staging and framing)
A reviewer added the following after seeing a previous draft. Apply it.
It may change background, lighting, framing, crop, orientation, props, and which
accessories appear in the frame.
It may NOT change the product's identity or condition: the AUTHORITATIVE PRODUCT
LOCK above still governs, and inventing accessories, markings, serial numbers,
wear, damage, or packaging remains forbidden regardless of anything below. If an
instruction would require inventing any of those, follow the lock and ignore
that part of the instruction.

${value}`;
}

/** Longest QA correction list carried into a regeneration. */
export const MAX_QA_CORRECTIONS = 12;

/**
 * Composes the prompt actually sent for one generation.
 *
 * Order matters. The researched brief comes first, then the previous
 * revision's QA corrections, then operator instructions last so a human can
 * override the QA model. Both added blocks restate that the identity lock wins,
 * because a correction list is model-authored text and must not become a
 * side-channel for authorising invention.
 */
export function buildEffectivePrompt(args: {
  basePrompt: string;
  /** requiredCorrections from the rejected revision's QA result. */
  qaCorrections?: readonly string[] | null;
  operatorInstructions?: string | null;
}): string {
  let prompt = args.basePrompt;

  const corrections = (args.qaCorrections ?? [])
    .map((line) => (typeof line === "string" ? line.trim() : ""))
    .filter(Boolean)
    .slice(0, MAX_QA_CORRECTIONS);

  if (corrections.length > 0) {
    prompt += `

REQUIRED CORRECTIONS FROM THE PREVIOUS REVISION
Automated image QA rejected the previous attempt for this composition. Fix each
of the following. These describe how the frame failed to match the reference
photographs and the brief; they never authorise adding anything absent from the
references. Where a correction cannot be satisfied without inventing a product
feature, accessory, marking, or packaging that is not visible in the references,
omit that element and leave it out of the frame instead.

${corrections.map((line, index) => `${index + 1}. ${line}`).join("\n")}`;
  }

  return applyOperatorInstructions(prompt, args.operatorInstructions);
}
