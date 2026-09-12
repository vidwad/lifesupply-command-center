import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GraphicBackdrop } from "./graphic-backdrop";

describe("GraphicBackdrop", () => {
  it("keeps a conceptual hero image decorative while adding the shared depth accent", () => {
    const markup = renderToStaticMarkup(<GraphicBackdrop graphic="suppliesFlatlay" />);

    expect(markup).toContain('data-hero-graphic="suppliesFlatlay"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('alt=""');
    expect(markup).toContain("lsh-graphic-backdrop-accent");
  });
});
