# Self-hosted web fonts

The four families the application uses, as variable WOFF2 files for the Latin
subset, loaded through `next/font/local` in `src/app/layout.tsx`.

They were served by `next/font/google` until November 10, 2026. That downloads
the same files from Google Fonts during every build, and the build fails when
the download does (the "Production build" CI check failed that way on PR #282,
and a Vercel preview on PR #275). Shipping the files with the repository makes
the build deterministic and independent of the network; the rendered type is
identical, since `next/font/google` only ever self-hosted these same files.

| File                          | Family           | Axes       | Source (Google Fonts, retrieved 2026-11-10)                                                     | Licence            |
| ----------------------------- | ---------------- | ---------- | ----------------------------------------------------------------------------------------------- | ------------------ |
| `inter-latin.woff2`           | Inter            | wght 100–900 | `https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2`             | SIL Open Font 1.1  |
| `jetbrains-mono-latin.woff2`  | JetBrains Mono   | wght 100–800 | `https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbV2o-flEEny0FZhsfKu5WU4xD7OwE.woff2`          | SIL Open Font 1.1  |
| `roboto-latin.woff2`          | Roboto           | wght 100–900 | `https://fonts.gstatic.com/s/roboto/v51/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA.woff2`           | SIL Open Font 1.1  |
| `roboto-condensed-latin.woff2`| Roboto Condensed | wght 100–900 | `https://fonts.gstatic.com/s/robotocondensed/v31/ieVl2ZhZI2eCN5jzbjEETS9weq8-19K7DQ.woff2`      | SIL Open Font 1.1  |

Each is the file Google Fonts serves to a current Chrome for the `latin`
block of its CSS, which is also the subset the previous configuration
requested (`subsets: ["latin"]`). No italics were requested before and none
are shipped.

To refresh a family, request its CSS from `https://fonts.googleapis.com/css2`
with a desktop browser User-Agent, take the `latin` block's `url(...)`, and
replace the file; the weight range in `layout.tsx` must match the block's
`font-weight`.
