# Legacy URL and asset map — keep / redirect / archive

**Prepared:** September 8, 2026 (Stage 9). **Source:** the legacy WordPress site's own sitemap at `https://lifesupplyhealth.com/wp-sitemap.xml` (served with an HTTP 404 status but a valid body, as Stage 1 recorded), its page sitemap `wp-sitemap-posts-page-1.xml` (21 URLs), its `robots.txt`, and the homepage's internal links, all fetched live in this stage. No WordPress export was supplied (decision placeholder unfilled); the live sitemap is the authoritative list of public pages and matches Stage 1's inventory exactly.

**Trailing-slash behaviour (confirmed):** the unified site leaves Next's default in place. A request with a trailing slash answers `308` to the unslashed path; canonical URLs are therefore unslashed (`seo.ts`). The legacy site used slashed URLs throughout, so every legacy address below reaches its target through one 308 hop at most, which is acceptable for search engines and preserves link equity.

## Pages (21 legacy URLs)

| Legacy URL | Decision | Target on the unified site | Notes |
| --- | --- | --- | --- |
| `/` | keep | `/` | Same address. |
| `/about-us/` | keep | `/about-us` | Same address. |
| `/our-operations/` | keep | `/our-operations` | Same address; now a portfolio map with children. |
| `/our-team/` | keep | `/our-team` | Same address. |
| `/investor-relations/` | keep | `/investor-relations` | Same address; now a hub with children. |
| `/news/` | keep | `/news` | Same address. |
| `/shop/` | keep | `/shop` | Same address; visible title "Shop & Services". |
| `/contact-2/` | **redirect 308** | `/contact` | `next.config.ts` permanent redirect; the legacy `/contact/` already 301'd to `/contact-2/`, so both legacy forms land on `/contact`. |
| `/abdul-ladha/` | keep | `/abdul-ladha` | Retained profile address, pre-rendered. |
| `/ben-hastibakhsh/` | keep | `/ben-hastibakhsh` | |
| `/gary-li/` | keep | `/gary-li` | |
| `/craig-loverock/` | keep | `/craig-loverock` | |
| `/mike-gill/` | keep | `/mike-gill` | |
| `/christopher-ishola/` | keep | `/christopher-ishola` | |
| `/ross-jelveh-2/` | keep | `/ross-jelveh-2` | The legacy `/ross-jelveh/` 301'd here; `next.config.ts` preserves that redirect. |
| `/keith-dolo-2/` | keep | `/keith-dolo-2` | |
| `/barrett-e-g-sleeman/` | keep | `/barrett-e-g-sleeman` | |
| `/david-vogt/` | keep | `/david-vogt` | |
| `/dr-margaret-clarke-2/` | keep | `/dr-margaret-clarke-2` | |
| `/dr-dedeshya-holowenko/` | keep | `/dr-dedeshya-holowenko` | |
| `/john-anderson-2/` | keep | `/john-anderson-2` | Profile retained; not listed on the board (S-102). |

Legacy addresses that 404 on the old site as well (`/privacy/`, `/terms/`) now exist on the unified site; no redirect is needed.

## Machine endpoints and feeds

| Legacy URL | Decision | Notes |
| --- | --- | --- |
| `/feed/`, `/comments/feed/` | archive | No feed on the unified site; company news is governed content with its own page. Returns 404 after cutover. |
| `/wp-json/*`, `/xmlrpc.php` | archive | WordPress APIs; none exist on the unified site. 404 after cutover. |
| `/wp-sitemap.xml`, `/wp-sitemap-*.xml` | replace | The unified site serves `/sitemap.xml` and `/robots.txt` (Stage 9). |
| `/wp-admin/*`, `/wp-login.php` | archive | 404 after cutover; the Command Center login is on a different host. |

## Assets

| Legacy asset | Decision | Notes |
| --- | --- | --- |
| `/wp-content/uploads/2021/10/LSHomeVid.mp4` | replaced | Re-cut, caption-free, grayscale loop shipped as `/lsh/hero/hero-loop.{webm,mp4}` with a poster (PR #63). The legacy file is not linked. |
| `/wp-content/uploads/2021/04/standard-logo*.png` | replaced | Official mark and lockup shipped as `/lsh/lifesupply-mark.png` and `/lsh/lifesupply-portfolio-lockup.png` (PR #61). |
| Leadership portrait (Abdul Ladha) | kept | `/lsh/abdul-ladha.jpg`. Other portraits were never bundled (S-104). |
| `Lifesupply-Investor-Presentation.pdf` (May 2022, 21.9 MB) | archive, on request | Listed as a historical document in the investor documents index with no hosted file (S-64). |
| Remaining `wp-content/uploads` images (Stage 1 counted 49 references) | archive | Elementor layout imagery and the legacy timeline graphic; not carried forward (S-133). Any that must survive can be added to `public/lsh/` with provenance. |

## After cutover

Search engines will request the legacy machine endpoints for a while; the unified site answers 404 with the recovery page and no redirect, which is the correct signal. The Stage 10 record should re-run this table's targets against the custom domain and attach the results.
