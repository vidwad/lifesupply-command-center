# Public website consolidation — master plan

**Opened:** September 10, 2026. **Coordinator:** Claude Code. **Contributor:** Codex, for bounded rewriting and independent review.

This is the owner's consolidated instruction for the public-site consolidation. It supersedes every earlier recommendation and prompt about reducing the public page count. The rounds that preceded it (`docs/website-round-two-*`, `-three-*`, `-four-*`) delivered content, accuracy and design work that this plan **preserves**; it does not replay them.

## 1. Objective

A clearer corporate website that explains the operating businesses, presents the expansion opportunities accurately, routes visitors to the right store, service, page or person, and consolidates overlapping pages without losing useful information. Current operations, programs in development and opportunities under evaluation stay distinct throughout.

## 2. Baseline

| | |
| --- | --- |
| Established | September 10, 2026 |
| Repository | `vidwad/lifesupply-command-center`, public, default branch `main` |
| Main at start | `3e0c687` — "Website round four: record the verified deployment (#143)" |
| Working tree | Clean |
| CI | Nothing running; the two most recent runs on `main` succeeded |
| Open pull requests | One, #58, an unrelated Command Center calculation. Untouched throughout |
| Audit snapshot referenced by the brief | `e9d34e8` — historical context only; this work starts from current `main` |

The audit's count of 41 public content pages **reconciles exactly** against current `main`, so no page was added or removed between the snapshot and this baseline. See `INVENTORY.md`.

## 3. Target

| | Count |
| --- | --- |
| Public content pages today | 41 |
| Retired and redirected | 20 |
| **Retained** | **21** |

Counts exclude legacy redirects already in place, authenticated Command Center screens, APIs, and the dynamic `news/[slug]` and `resources/[slug]` publication templates.

## 4. Final navigation

`About | Medical Supplies | Solutions | Investors | Contact`

- The logo links to Home.
- **Shop Stores** stays a separate utility action to `/medical-supply-solutions#stores`.
- The duplicate Contact link leaves the utility strip; Contact becomes the last primary item, a direct link to `/contact`, with no dropdown.
- **Solutions** is a menu of exactly three: Clinic Solutions, Pharmacy Solutions, Metabolic Health Solutions. **No `/solutions` landing page is created.**
- **Partners** is retired as a primary category and its hub page retired with it.
- Clinic, Pharmacy and Metabolic stop being top-level categories.
- Desktop and mobile share the information architecture. Menus work by keyboard and touch and never depend on hover.

Group contents are listed in `CONTENT-OWNERSHIP.md`.

Suppliers & Manufacturers stays a dedicated page, linked prominently from Medical Supplies and the footer, without its own primary category.

## 5. Stages

| Stage | Scope | Branch |
| --- | --- | --- |
| 0 | Baseline, inventory, redirect map, documents | `claude/wc-0-baseline` |
| 1 | Shop into Medical Supplies; Equipment and Ongoing Supplies into Clinic Solutions | `claude/wc-1-clinic` |
| 2 | Pharmacy Partnerships into Pharmacy Solutions; Care Kits, eight pathways and Refills into Metabolic Health | `claude/wc-2-metabolic` |
| 3 | Final five-item navigation; Partners retirement | `claude/wc-3-navigation` |
| 4 | Team merge; About, Home, News, Contact refinement | `claude/wc-4-corporate` |
| 5 | Design, Codex review, final verification | `claude/wc-5-verify` |

Each stage: implement, run the gates, commit, push, open a pull request, satisfy the required checks, squash-merge, verify the production deployment, continue.

## 6. Standing constraints carried forward

These come from the earlier rounds and remain in force.

- **Publication boundary.** The annual report and the August 25, 2026 expansion materials are confidential accredited-investor documents, and this repository is public. Only the facts in the round-three claim register may be used. A canary sweeps every content file for financing terms, projections, acquisition targets and listing plans.
- **Verified operating destinations**, and only these: `https://lifesupply.ca/`, `https://wellmartmedical.com/`, `https://balkowitsch.com/`, `https://www.lifesupplyclinics.com/`.
- **Voice.** Forward-facing business language, not a compliance file. Provenance and publication reasoning live in these documents, never on a page.
- **No new** analytics, forms, subscriptions, payments, cookies, CMS systems or external accounts.
- **Separation preserved** between the Vercel public site and the Command Center on Render. No database migrations for this task.

## 7. Method rules

Three, each recorded because it produced a wrong finding before it existed.

1. **Expand accordions, disclosures, tabs and menus before judging their content.** The GLP-1 compatibility answer was once reported missing because it was read collapsed. It is correct as written.
2. **Test the hero with JavaScript disabled**, or an entrance animation is indistinguishable from a rendering failure.
3. **Await a navigation alongside the click or keypress, and target a visible link.** A catalogue that renders a table and cards from the same data puts a hidden link first in the DOM.

A fourth applies to this task specifically: **transfer content before retiring the page that holds it**, and record where each piece went in `CONTENT-OWNERSHIP.md`.

## 8. Companion documents

| Document | Holds |
| --- | --- |
| `INVENTORY.md` | Every public route today, its treatment, and the reconciliation to 41 and 21 |
| `REDIRECTS.md` | The 20 new redirects, the legacy redirects preserved, and chain checks |
| `CONTENT-OWNERSHIP.md` | Where each retired page's content moved, and the final navigation groups |
| `STATUS.md` | Stage-by-stage delivery record: PR, merge commit, deployment |
| `QA.md` | Verification actually performed, with outcomes |
