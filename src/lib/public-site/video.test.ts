import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ABOUT_VIDEO, youtubeEmbedUrl, youtubeWatchUrl } from "./video";

const ROOT = join(__dirname, "../../..");

describe("embedded company video", () => {
  it("holds its poster locally at the declared size, under 100 KB", () => {
    const rel = `public${ABOUT_VIDEO.poster.src}`;
    expect(ABOUT_VIDEO.poster.src).toMatch(/^\/lsh\/video\/[a-z-]+\.jpg$/);
    expect(existsSync(join(ROOT, rel))).toBe(true);
    expect(readFileSync(join(ROOT, rel)).length).toBeLessThan(100 * 1024);
    expect(ABOUT_VIDEO.poster).toMatchObject({ width: 1280, height: 720 });
    expect(ABOUT_VIDEO.poster.alt).toContain("Abdul Ladha");
  });

  it("names the video and starts where the owner asked", () => {
    expect(ABOUT_VIDEO.id).toMatch(/^[\w-]{11}$/);
    expect(ABOUT_VIDEO.start).toBe(12);
    expect(ABOUT_VIDEO.title).toContain("Who we are");
    expect(ABOUT_VIDEO.provenance).toContain("S-156");
  });

  it("builds the privacy-enhanced player address and the public watch address", () => {
    expect(youtubeEmbedUrl(ABOUT_VIDEO)).toBe(
      "https://www.youtube-nocookie.com/embed/Jb3m3Nt3S50?start=12&autoplay=1&rel=0",
    );
    expect(youtubeWatchUrl(ABOUT_VIDEO)).toBe("https://www.youtube.com/watch?v=Jb3m3Nt3S50&t=12s");
    // Only the privacy-enhanced host ever appears in the embed address.
    expect(youtubeEmbedUrl(ABOUT_VIDEO)).not.toContain("www.youtube.com");
  });
});
