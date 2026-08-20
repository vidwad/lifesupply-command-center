/**
 * Capability matrix for the OpenAI image-edit models Product Studio can use.
 *
 * The two capabilities this workflow cares about are in direct tension, and no
 * current model offers both:
 *
 *   input_fidelity: "high"  — preserves the exact physical item and its visible
 *     condition. This is the core promise of Product Studio; without it the
 *     model drifts toward a generic product of the same name, which the image
 *     QA pass is specifically built to reject.
 *     Supported by gpt-image-1 / gpt-image-1.5. REJECTED by gpt-image-2 with
 *     `400 image_generation_user_error`.
 *
 *   arbitrary WIDTHxHEIGHT sizes — only gpt-image-2 and its dated snapshots.
 *     Everything else is limited to an enumerated set, of which 1024x1024 is
 *     the largest square.
 *
 * Sending an unsupported parameter is a hard 400, not a silently ignored field,
 * so the request has to be built per model rather than as one fixed object.
 */

/** Largest square supported by models without arbitrary sizing. */
export const ENUMERATED_MAX_SQUARE = "1024x1024";
/** Preferred square when the model supports arbitrary resolutions. */
export const ARBITRARY_SQUARE = "2048x2048";

/**
 * Default favours identity fidelity over resolution. A faithful 1024px image is
 * worth more here than a 2048px one that drifts off the real item — drift costs
 * a QA rejection and a paid regeneration. Override with OPENAI_IMAGE_MODEL.
 */
export const DEFAULT_IMAGE_MODEL = "gpt-image-1.5";

const GPT_IMAGE_2 = /^gpt-image-2(\b|-)/;

export type ImageModelCapabilities = {
  model: string;
  supportsInputFidelity: boolean;
  supportsArbitrarySize: boolean;
  size: string;
};

export function imageModelCapabilities(rawModel?: string | null): ImageModelCapabilities {
  const model = rawModel?.trim() || DEFAULT_IMAGE_MODEL;
  const isGptImage2 = GPT_IMAGE_2.test(model);
  return {
    model,
    supportsInputFidelity: !isGptImage2,
    supportsArbitrarySize: isGptImage2,
    size: isGptImage2 ? ARBITRARY_SQUARE : ENUMERATED_MAX_SQUARE,
  };
}
