# Stage 1 — Source Register

**Prepared:** September 8, 2026. Access timestamps are UTC. Nothing in this register is publication approval; it records what each source says, what class of statement it is, and how the website must treat it until the responsible owner resolves it.

## Statement classes

| Class | Meaning | Default public treatment |
| --- | --- | --- |
| **O** Observed public statement | Text currently displayed on a public site, quoted as found | May be cited as "the site states"; not repeated as a corporate fact without approval |
| **A** Approved current fact | In the repository's governed content model or explicitly approved in the guide | Publishable in its existing wording and qualification |
| **H** Historical fact | Dated record (press release, legacy page, 2022 materials) | Publishable only with its date and source label |
| **P** Planning assumption | From the development guide or product-owner instructions, not yet evidenced publicly | Drives layout and information architecture; never rendered as a claim |
| **U** Unresolved claim | Conflicting, unsourced, or unverifiable | Omit from public copy; track under the WEB-xx decision it belongs to |

Where the same fact appears in several sources with different values, the row is marked **U** and the conflict is spelled out.

---

## 1. Canonical domains and surfaces (seeded from the guide; verified live)

| ID | Key | Destination | HTTP (2026-09-08) | Platform | Class | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| S-01 | `corporate` | `https://lifesupplyhealth.com/` | 200 | WordPress (legacy) | A (destination) | The custom domain still points at the legacy site. The unified site is at the Vercel production alias only. |
| S-02 | `lifesupply` | `https://lifesupply.ca/` | 200 | BigCommerce | A | Also referenced as `Lifesupply.com` on its About page (not verified). |
| S-03 | `wellmart` | `https://wellmartmedical.com/` | 200 | BigCommerce | A | |
| S-04 | `clinics` | `https://www.lifesupplyclinics.com/` | 200 | WordPress | A | Canonical host uses `www.`; the bare host was not tested. |
| S-05 | `balkowitsch` | `https://balkowitsch.com/` | 200 | BigCommerce | A | |
| S-06 | `command_center` | `https://lifesupply-cc-web.onrender.com/login?redirectTo=/dashboard` | 200 (login) | Render | A | The only login destination the public UI may render. |
| S-07 | unified public site | `https://lifesupply-command-center-vidwads-projects.vercel.app/` | 200, `noindex` | Vercel | A (interim) | Production alias; no custom domain attached. |

`srsltid` parameters were not present on any observed navigation link; the rule to strip them stands for any inbound link captured later.

---

## 2. Legal entities, registrations, and brand relationships

| ID | Statement | Source | Class | Conflict / treatment |
| --- | --- | --- | --- | --- |
| S-10 | "Lifesupply.ca and Lifesupply.com are operated by Wellmart Health Supplies Ltd. … a division of Lifesupply Health Supplies Inc. (MDEL 13295)." | lifesupply.ca `/about-us/` | O | Supports S-13/S-14 but note S-11. |
| S-11 | "Wellmart Health Supplies Ltd. DBA Lifesupply — A division of Lifesupply Health Inc. (MDEL 13295)" | lifesupply.ca `/contact/` | O | **U:** "Lifesupply Health Inc." vs "Lifesupply Health Supplies Inc." on the same store. Use the repository's approved name (S-13) and do not quote the variant. |
| S-12 | "Wellmart Medical. DBA Lifesupply — A division of Lifesupply Health Supplies Inc. (MDEL 13295)" | wellmartmedical.com `/contact-us/` | O | Suggests Wellmart Medical trades under the same entity as lifesupply.ca; the store labels differ ("Wellmart Medical" vs "Wellmart Health Supplies Ltd."). **U** under WEB-01. |
| S-13 | Corporate name "LifeSupply Health Supplies Inc."; subsidiaries "Wellmart Health Supplies Ltd. DBA Lifesupply", "MedDirect Distribution Corporation", "Dexton Medical Corporation" | `lifesupply-content.ts` `contact.subsidiaries`; legacy `/contact-2/` | A / H | Approved as already published; **U** whether MedDirect and Dexton remain operating entities today (WEB-01). **Resolved 2026-09-08:** the product owner states both are no longer operational; they are removed from every public page, the directory, and the assets. |
| S-14 | MDEL 13295 (Medical Device Establishment Licence) | S-10, S-11, S-12 | O | Consistent across three store pages; publishable only after the owner confirms the licence holder and status (WEB-01). Not in the repository content. |
| S-15 | "Balkowitsch Enterprises Inc" (page title on contact page); "Balkowitsch Worldwide" (brand) | balkowitsch.com `/contact-us/`, header | O | Legal relationship to LifeSupply Health Supplies Inc. is **not stated anywhere observed**. The root CLAUDE.md (May 2026) calls it "Balkowitsch-related U.S. operations". **U** under WEB-01: do not assert subsidiary status. |
| S-16 | "Life Supply Clinics" (privacy policy), "Life Supply" (page titles), "Lifesupply and its core partners" (homepage) | lifesupplyclinics.com | O | Legal entity behind the Clinics site is not named. **U** under WEB-01/WEB-03. |
| S-17 | Legacy About page: "Flagship Retail Store, Pharmacy & Medical Clinic"; legacy Operations page: a division "to acquire pharmacies and manage online prescriptions"; a "Flagship bricks and mortar retail facility" | lifesupplyhealth.com | H (2021 copy) | Not evidence of current pharmacy, retail, or clinic operations. The repository already qualifies "Pharmaceutical" as "subject to current regulatory, operational, and partner confirmation". Keep that qualification; do not upgrade. |
| S-18 | Dexton Medical described as "Flagship retail, pharmacy, and medical-clinic brand in the current public portfolio"; `https://dexton.com` | `lifesupply-content.ts` `about.brands` | A (as worded) | `dexton.com` and `meddirect.ca` were **not** fetched in this session; verify they resolve to LifeSupply properties before Stage 3 links them as operating brands (WEB-01). |

---

## 3. Addresses, telephone numbers, and email

| ID | Value | Where observed | Class | Treatment |
| --- | --- | --- | --- | --- |
| S-20 | 6911 King George Highway, Surrey, British Columbia V3W 5A1, Canada | repository `brand.address`, `contact.subsidiaries` (all three); legacy site footer | A / H | Approved in the content model; **U** whether it is still the operating address given S-21. |
| S-21 | Unit 206 – 15300 54a Avenue, Surrey, British Columbia V3S 5X7 | lifesupplyclinics.com (`/about/`, `/contact-us/`); wellmartmedical.com `/contact-us/`; lifesupply.ca `/contact/` ("Office location", "We do NOT have a store location") | O | Three current operating sites agree on this address; none shows King George Highway. WEB-01 must decide the corporate office address. |
| S-22 | Mailing address: Unit 545 – 1489 Marine Drive, West Vancouver, BC V7T 1B8 | lifesupply.ca `/contact/` | O | Mailing only; not a corporate office claim. |
| S-23 | Suite 300 – 1008 Homer Street, Vancouver, BC V6B 2X1 | legacy `/shop/` page footer | H | Stale; do not carry forward. |
| S-24 | 1900 Commerce Drive Unit 201, Bismarck, ND 58501, USA; toll-free (800) 355-2956; international (701) 223-9936; `sales@balkowitsch.com`; support 8 AM – 4 PM | balkowitsch.com | O | Publishable as Balkowitsch's own published contact once WEB-01 confirms the relationship. |
| S-25 | 1-855-755-5433 (toll-free) and 604-551-9538 | lifesupply.ca, wellmartmedical.com, lifesupplyclinics.com; repository `contact.subsidiaries` and `contact.channels` ("Online sales & product lines" → Ben Hastibakhsh 604-551-9538) | O / A | Consistent. The same two numbers serve three brands; a per-brand support boundary must be described honestly (Stage 3). |
| S-26 | 604-677-4146 (Investor Relations and "Mergers & acquisitions"); 604-503-9389 (showroom & distribution centre, `mike@dexton.com`) | repository `contact.channels` | A | Not observed on any external site; approved as already published. |
| S-27 | `info@lifesupply.com` (corporate), `invest@lifesupply.com`, `ben@lifesupply.com`, `abdul@lifesupply.com`, `mike@dexton.com` | repository | A | |
| S-28 | `info@lifesupplyclinics.com` | lifesupplyclinics.com | O | Verified destination for clinic inquiries pending WEB-07. |
| S-29 | `info@wellmartmedical.com`; support hours 9–5 PM PST | wellmartmedical.com | O | |
| S-30 | `info@lifesupply.com`; hours M–F 9 AM – 5 PM PST | lifesupply.ca `/contact/` | O | Matches S-27. |

---

## 4. Scale, customer, product, and tenure figures (the conflict table)

| ID | Figure | Source | Class | Conflict |
| --- | --- | --- | --- | --- |
| S-40 | "25+ years of operations cited in the 2025 annual report" | repository `homepage.publicMetrics` | A (qualified) | |
| S-41 | "50K+ products cited in the 2025 annual report" | repository | A (qualified) | |
| S-42 | "1M+ customers served cited in the 2025 annual report" | repository | A (qualified) | Cumulative, as stated. |
| S-43 | "an online retailer of over 55,000 medical products with an estimated customer base of over 46,000 Canadians since inception" | legacy home `<title>` | H (2021) | |
| S-44 | "over 55,000 medical products … over 45,000 Canadians since inception" | legacy home body | H | **U:** 45,000 vs 46,000 on the same page. |
| S-45 | "Providing 55,000 medical products to over 30,000 customers on various online sites" | legacy `/our-operations/` | H | **U:** 30,000 vs 45–46,000. |
| S-46 | "Online Retail Sales of 50,000 Medical Products" | legacy `/about-us/` | H | **U:** 50,000 vs 55,000. |
| S-47 | "50,000 MEDICAL PRODUCTS / OVER 45,000 CUSTOMERS" (burned-in caption) | legacy hero video | H | Excluded from the unified hero cut for this reason. |
| S-48 | "We also distribute over 40,000 medical products from over 200 manufacturers"; "With three decades of experience delivering 40,000 medical products, laboratory and office fit-outs" | lifesupplyclinics.com `/about/`, home | O | **U:** 40,000 vs 50K+/55,000; "three decades" vs "25+ years" vs "a decade" (S-49). |
| S-49 | "We have a decade of experience in the medical supplies industry" | legacy `/about-us/` (2021) | H | Conflicts with S-40/S-48. |
| S-50 | "With 25 years of experience, servicing over 1 million customers since inception" | wellmartmedical.com and balkowitsch.com `/about-us/` (identical copy); Balkowitsch badges "Over 1 Million Customers", "25 Years in Business" | O | Consistent with S-40/S-42 in magnitude; whether the 1 million is group-wide, per store, or Balkowitsch's own history is **U** (WEB-02). |
| S-51 | "access to over 180 distributors, manufacturers and suppliers" | legacy `/our-operations/` | H | **U** vs "over 200 manufacturers" (S-48). The repository wording ("access to distributors, manufacturers, and suppliers") already omits the number; keep it omitted. |
| S-52 | Free shipping thresholds: lifesupply.ca $99 (Canada); wellmartmedical.com $100 (Canada); balkowitsch.com $200 (USA) | store headers | O | Store facts; cite only as "see store for current terms" (Stage 3), never hard-code. |

**Treatment for WEB-02:** publish only the three qualified 2025-annual-report figures already approved (S-40–S-42). Do not average, reconcile, or restate any legacy count; do not combine store-level and group-level customer counts.

---

## 5. Financial and investor material

| ID | Statement | Source | Class | Treatment |
| --- | --- | --- | --- | --- |
| S-60 | Year ended December 31, 2025 (unaudited consolidated): Net sales $6.75M; Gross profit $2.20M; Net income $284K | repository `investorRelations.currentReport` | A (qualified) | Publishable with period, "unaudited", and entity scope. The DTO metric model (period, basis, disclosure text) is the right home in Stage 6. |
| S-61 | Expansion context: "A supplied financing presentation outlines proposed metabolic-health and therapeutics expansion themes, subject to …" dated August 25, 2026 | repository `investorRelations.expansionContext` | A (qualified) | |
| S-62 | `LifeSupply_Business_Plan_Complete_18pg.pdf.pdf` and `LifeSupply_Metabolic_Health_Supply_Services_Division_Business_Plan_September_2026.pdf` (Integrated Model v12) | guide §2 | P | **Not in the repository and not supplied to this session.** Their figures are unavailable; nothing from them is quoted here. |
| S-63 | $4.2 million financing target; CPC / TSXV / CSE as potential structures; FendX discussions | guide §2 | P | Never hard-coded; potential structures only where a current approved narrative calls for them; FendX is not a partnership claim. |
| S-64 | "Lifesupply-Investor-Presentation.pdf" (May 2022, 21.9 MB) | legacy `/investor-relations/` | H | Historical document; the repository's `investor-presentation-preview.png` appears to be a capture of a deck. Whether it is this 2022 deck or the 2026 financing presentation is **U**; Stage 5 must label it by date or remove it. |
| S-65 | `CDNX` header button on the legacy site | legacy screenshot | H | Destination not captured (the anchor is script-driven). Do not reintroduce a listing link without an approved destination (docs/41 §7). |
| S-66 | Market-size statistics with asterisks ("Canadian Medical Equipment*", "USA Medical Supplies Market*") | legacy `/investor-relations/` | H | Values and footnote sources not captured in text; excluded. |

---

## 6. LifeSupply Clinics (clinic development, not patient care)

| ID | Statement | Source | Class | Treatment |
| --- | --- | --- | --- | --- |
| S-70 | Services: planning (site evaluation, feasibility, space planning, compliance, budgeting, equipment/utilities coordination); design (interior/layout, 3D renderings, finishes, infection-control, accessibility/ergonomics); construction (full builds and turnkey, renovations/expansions, MEP, on-site project management); project management (permits, inspections, contractor coordination, budget tracking, walkthroughs) | `/our-services/` | O | Usable as the description of what the Clinics site offers, attributed to that site, pending WEB-03 on who performs the work. |
| S-71 | Specialties: dental clinics, medical offices, med spas & aesthetic clinics, physiotherapy and rehab centres, surgical suites (non-hospital) | `/our-services/` | O | |
| S-72 | Six project pages: medical clinic construction in Burnaby; oral surgery clinic in Squamish; oral surgery in White Rock; ENT clinic construction in Abbotsford; physio clinic construction in Vancouver; medical clinic design-build in Vancouver | home `/portfolio/*` links | O | Geography observed: Lower Mainland and Sea-to-Sky, British Columbia. Project copy says "we were proud to support the construction"; the homepage says "Lifesupply and its core partners". **Attribution and imagery rights are U (WEB-03).** Client names are not shown. |
| S-73 | "Book a Free Consultation" → `/contact-us/` (form); "Purchase Clinic Equipment" → `/buy-clinic-equipment/` (quote form, "call you within 24 hours"); `/clinic-equipments/` says "Select from over 40,000 products" | home, equipment pages | O | These are the verified consultation and equipment-quote destinations for the route map. No equipment catalogue is browsable on the Clinics site; the store catalogue is on lifesupply.ca (S-80). |
| S-74 | "100% Canadian" badge | home | O | |
| S-75 | Privacy policy present; 180-day revision notice | `/privacy-policy/` | O | Relevant to Stage 7 cross-brand inquiry routing. |

The guide's rule stands: present Clinics as clinic development, construction/fit-outs, and equipment services within verified delivery arrangements, never as an owned patient-care clinic network. Nothing observed contradicts that; nothing observed proves who the "core partners" are.

---

## 7. Storefront facts relevant to Shop & Services and the eight pathways

Verified category URLs (HTTP 200 links present in the store homepages on 2026-09-08). Only these may be linked in Stage 3–4 until re-verified; no other category URL was guessed.

| ID | Store | Verified URL | Relevant pathway(s) |
| --- | --- | --- | --- |
| S-80 | lifesupply.ca | `/clinic-supplies/`, `/dental-clinic-supplies/` | clinic procurement (K07, Clinic Solutions) |
| S-81 | lifesupply.ca | `/needles-syringes/` | K01, K02, K07 |
| S-82 | lifesupply.ca | `/diabetic/`, `/blood-glucose-meters/`, `/diabetic-sock/` | K06 |
| S-83 | lifesupply.ca | `/biometric-monitors/`, `/medical-thermometers/`, `/contact-less-thermometers/`, `/digital-thermometer/`, `/ear-thermometer/` | K05 |
| S-84 | lifesupply.ca | `/emergency-care-first-aid/`, `/first-aid/`, `/first-aid-adhesive-bandages/` | K04 (travel) |
| S-85 | wellmartmedical.com | `/needles-and-syringes/`, `/needles-syringes/` | K01, K02 |
| S-86 | wellmartmedical.com | `/diabetic/`, `/health-monitors/` | K05, K06 |
| S-87 | wellmartmedical.com | `/incontinence/`, `/ostomy/`, `/skin-and-wound/` | home-care emphasis |
| S-88 | balkowitsch.com | `/categories/health.html`, `/categories/digital-measuring-devices.html`, `/categories/wound-care.html` | K05 (U.S.) |
| S-89 | none | **No sharps-container category URL was observed on any store homepage.** | K03 blocked until a real URL or SKU is supplied |
| S-90 | none | No "travel kit", "GLP-1", "injection safety", or "pharmacy" collection exists on any store | K01–K04, K08 have no approved configuration to link |

Store commercial facts observed: lifesupply.ca CAD, free shipping over $99, "standard delivery time 7–12 business days"; wellmartmedical.com CAD, free shipping over $100; balkowitsch.com USD, free shipping over $200, "worldwide shipping available". All three run separate accounts and checkouts.

---

## 8. Leadership and board

| ID | Statement | Source | Class | Treatment |
| --- | --- | --- | --- | --- |
| S-100 | Management (7): Abdul Ladha (Chairman & CEO), Ben Hastibakhsh, Gary Li, Craig Loverock, Mike Gill, Chris Ishola, Ross Jelveh; Board (6): Abdul Ladha, Keith Dolo, Barrett Sleeman, Dr. David Vogt, Dr. Margaret Clarke, Dr. Dedeshya Holowenko | repository `team` | A (as "historical, review before update") | The Team page already states profiles "preserve publicly sourced historical information". **Resolved 2026-09-08:** the product owner states everyone other than Abdul Ladha is no longer involved; the team page lists him alone, the board list is withdrawn, and the other profiles redirect. |
| S-101 | Legacy profile roles differ from the repository's card roles: Craig Loverock "Chief Financial Officer" (legacy profile) vs "Finance"; Mike Gill "Manager, Warehouse Dropship Centre" vs "Retail Operations"; Christopher Ishola "Systems & Operations" vs "Finance"; Ross Jelveh "VP Technology" vs "Integration" | repository `legacyProfiles` vs `management` | U | WEB-06: current titles need the owner's confirmation; until then the dated legacy title is the safer public label. |
| S-102 | John Anderson (Director, Stikeman Elliott) exists as a legacy profile page and in the legacy sitemap but is **not** in the repository's board list | repository, legacy sitemap | U | WEB-06: confirm whether he is a current director before listing or omitting. |
| S-103 | Legacy Team page duplicates Barrett Sleeman and Dr. David Vogt entries | legacy `/our-team/` | H | Duplicate in the source, not in the repository; ignore. |
| S-104 | Only one portrait is bundled (Abdul Ladha) | `public/lsh/` | A | Other cards use initials; approved portraits needed for Stage 5 (WEB-06). |

---

## 9. News and dated records

| ID | Item | Source | Class |
| --- | --- | --- | --- |
| S-110 | June 14, 2022 — Mothers Choice Products distribution partnership (Newswire) | repository `news`; legacy | H |
| S-111 | May 11, 2022 — Ortho Active distribution partnership expansion (Newswire) | repository; legacy | H |
| S-112 | April 21, 2022 — Dr. Margaret Clarke appointed to the board (Yahoo Finance) | repository; legacy | H |
| S-113 | April 5, 2022 — Smart Move Medical asset acquisition (Yahoo News) | repository; legacy | H |
| S-114 | "Growth & Technology roadmap … proposed 2022 growth and expansion strategy" | legacy `/news/` only | H, not in repository; do not add without the source link and date |

No company news later than June 2022 exists in either source. Stage 5 must not fabricate newer items; the newsroom will be explicitly historical until Stage 6 publishing produces new records.

---

## 10. Planning assumptions carried from the guide (P), and who resolves them

| ID | Assumption | Resolves under |
| --- | --- | --- |
| S-120 | Positioning statement: "LifeSupply connects medical-supply commerce, clinic development, equipment sourcing, and ongoing supply services across its Canadian and U.S. businesses…" | product owner review before Stage 2 copy |
| S-121 | lifesupply.ca emphasis on clinic procurement; wellmartmedical.com emphasis on home care; neither excludes the other audience | marketing direction, WEB-01 |
| S-122 | Metabolic kits are configurable supply entry points; starter durables are not repeated; consumables, clinic procurement, contracted services are distinct streams | WEB-04 |
| S-123 | Eight pathways K01–K08 with the stated compatibility and exclusion rules | WEB-04; no contents, SKUs, prices, or discount validated |
| S-124 | Inquiry intent types (11) and the routing rules | WEB-07 |
| S-125 | Reciprocal links on the four external sites require separate access | WEB-08 |

---

## 11. Assets and their provenance

| ID | Asset | Class | Constraint |
| --- | --- | --- | --- |
| S-130 | LifeSupply mark (661×93, official, product owner 2026-09-08) | A | dark field only |
| S-131 | Portfolio lockup (LifeSupply / Dexton / MEDdirect) | H, **withdrawn 2026-09-08** | Dexton and MedDirect are no longer operational (product owner); file moved to `legacy-assets/`, no longer served |
| S-132 | Hero footage (2021 legacy video, caption-free cut) | A | no captions from the source may return (S-47) |
| S-133 | Operations timeline graphic (2018–2023 milestones incl. revenue and financing text as pixels) | H, **withdrawn 2026-09-08** | names MedDirect as pixels; file moved to `legacy-assets/`, no longer served; never a source for metrics |
| S-134 | Investor deck capture | U (date) | see S-64 |
| S-135 | Wellmart, Balkowitsch, Clinics, MedDirect, Dexton marks | not held | obtain authentic files and usage records before Stage 3 (WEB-08 owners) |
| S-136 | Conceptual graphic `supplies-flatlay.jpg` (unbranded supplies still life) | A (generated) | Gamma photo mode, 2026-09-08, monochrome brief, ffmpeg grayscale-plus-red at 1600×900; conceptual, never presented as operational photography; caption required (`DESIGN_PASS_EVIDENCE.md` §4) |
| S-137 | Conceptual graphic `exam-room.jpg` (empty examination room) | A (generated) | Gamma photo mode, 2026-09-08, monochrome brief, ffmpeg grayscale-plus-red at 1600×900; conceptual, never presented as operational photography; caption required (`DESIGN_PASS_EVIDENCE.md` §4) |
| S-138 | Conceptual graphic `equipment.jpg` (instrument trolley and crate) | A (generated) | Gamma photo mode, 2026-09-08, monochrome brief, ffmpeg grayscale-plus-red at 1600×900; conceptual, never presented as operational photography; caption required (`DESIGN_PASS_EVIDENCE.md` §4) |
| S-139 | Conceptual graphic `warehouse.jpg` (fulfilment aisle) | A (generated) | Gamma photo mode, 2026-09-08, monochrome brief, ffmpeg grayscale-plus-red at 1600×900; conceptual, never presented as operational photography; caption required (`DESIGN_PASS_EVIDENCE.md` §4) |
| S-140 | Conceptual graphic `metabolic-supplies.jpg` (monitoring and injection supplies) | A (generated) | Gamma photo mode, 2026-09-08, monochrome brief, ffmpeg grayscale-plus-red at 1600×900; conceptual, never presented as operational photography; caption required (`DESIGN_PASS_EVIDENCE.md` §4) |
| S-141 | Conceptual graphic `pharmacy.jpg` (pharmacy back-shelf) | A (generated) | Gamma photo mode, 2026-09-08, monochrome brief, ffmpeg grayscale-plus-red at 1600×900; conceptual, never presented as operational photography; caption required (`DESIGN_PASS_EVIDENCE.md` §4) |
| S-142 | Conceptual graphic `boardroom.jpg` (empty boardroom) | A (generated) | Gamma photo mode, 2026-09-08, monochrome brief, ffmpeg grayscale-plus-red at 1600×900; conceptual, never presented as operational photography; caption required (`DESIGN_PASS_EVIDENCE.md` §4) |
| S-143 | Conceptual graphic `shipping.jpg` (cartons on a pallet) | A (generated) | Gamma photo mode, 2026-09-08, monochrome brief, ffmpeg grayscale-plus-red at 1600×900; conceptual, never presented as operational photography; caption required (`DESIGN_PASS_EVIDENCE.md` §4) |
| S-144 | Conceptual graphic `facade.jpg` (glass office facade) | A (generated) | Gamma photo mode, 2026-09-08, monochrome brief, ffmpeg grayscale-plus-red at 1600×900; conceptual, never presented as operational photography; caption required (`DESIGN_PASS_EVIDENCE.md` §4) |
| S-145 | Brand photograph `lifesupply-greyscale-v1` (supplies and monitor on a counter) | A (supplied, generated) | Product owner, PR #86, 2026-09-08; PNG master retained, JPEG derivative served; neutral greyscale; conceptual, never operational photography; caption required |
| S-146 | Brand photograph `wellmart-medical-greyscale-v1` (rollator in a home interior) | A (supplied, generated) | Product owner, PR #86, 2026-09-08; PNG master retained, JPEG derivative served; neutral greyscale; conceptual, never operational photography; caption required |
| S-147 | Brand photograph `balkowitsch-greyscale-v1` (person packing a carton at a warehouse bench) | A (supplied, generated) | Product owner, PR #86, 2026-09-08; PNG master retained, JPEG derivative served; neutral greyscale; conceptual, never operational photography; synthetic person, never an employee or customer |
| S-148 | Brand photograph `lifesupply-clinics-greyscale-v1` (clinic reception and corridor) | A (supplied, generated) | Product owner, PR #86, 2026-09-08; PNG master retained, JPEG derivative served; neutral greyscale; conceptual, never operational photography; not an owned clinic or a completed project |
| S-149 | Store home-page screen `lifesupply-home-laptop.jpg` (lifesupply.ca) | O (dated screenshot) | Captured 2026-09-09 at 1440×900, promotional overlays hidden, composed on a laptop frame at 1600×1000; a real screen, dated in its caption; refresh when the storefront changes |
| S-150 | Store home-page screen `wellmart-medical-home-laptop.jpg` (wellmartmedical.com) | O (dated screenshot) | Captured 2026-09-09 at 1440×900, promotional overlays hidden, composed on a laptop frame at 1600×1000; a real screen, dated in its caption; refresh when the storefront changes |
| S-151 | Store home-page screen `balkowitsch-home-laptop.jpg` (balkowitsch.com) | O (dated screenshot) | Captured 2026-09-09 at 1440×900, promotional overlays hidden, composed on a laptop frame at 1600×1000; a real screen, dated in its caption; refresh when the storefront changes |
| S-152 | Store home-page screen `lifesupply-clinics-home-laptop.jpg` (lifesupplyclinics.com) | O (dated screenshot) | Captured 2026-09-09 at 1440×900, overlays hidden, composed on a laptop frame at 1600×1000; a real screen, dated in its caption; refresh when the site changes |

---

## 12. Decision map

| Decision | Register rows that feed it | Interim treatment in force |
| --- | --- | --- |
| WEB-01 entities, relationships, addresses | S-10–S-18, S-20–S-24 | Use repository names and King George Highway as published; do not add MDEL, Balkowitsch, or Clinics legal assertions |
| WEB-02 metrics | S-40–S-52 | Only the three qualified 2025 figures |
| WEB-03 clinic partners, projects, imagery | S-70–S-75 | Describe services as the Clinics site does; link to its verified consultation and quote pages; no project imagery |
| WEB-04 metabolic programme status, kit contents | S-80–S-90, S-122–S-123 | Information pages with inquiry actions; no purchasable placeholders |
| WEB-05 financing narrative and documents | S-60–S-66 | Qualified 2025 context and the verified investor contact only |
| WEB-06 leadership roster | S-100–S-104 | Dated historical labels; no invented directors |
| WEB-07 inquiry owners and consent | S-25–S-30, S-124 | Directory only until Stage 7 |
| WEB-08 external-site access | S-01–S-05, S-135 | Handoff briefs only |
| WEB-09 deployment behaviour and defects | BASELINE_AUDIT §5–§7 | Evidence recorded; no infrastructure change |
| WEB-10 publication, migration, cutover approvals | BASELINE_AUDIT §3 (D-09) | Reviewable code and runbooks only |
