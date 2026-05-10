# 05 — Integration Map

**Project:** LifeSupply Command Center  
**Document status:** Initial integration map  
**Prepared:** May 9, 2026

---

## 1. Integration Strategy

The LifeSupply Command Center should function as a normalized management data hub that connects to external systems, imports or synchronizes data, validates and maps that data, and makes it available for dashboards, reports, workflows, AI analysis, and management decision-making.

The application should not attempt to replace source systems. Instead, it should connect to them and create a management intelligence layer above them.

---

## 2. Source-of-Truth Rules

| Area | Source of Truth | Command Center Role |
|---|---|---|
| E-commerce orders | BigCommerce | Import, normalize, monitor, analyze, task, report |
| Product catalog | BigCommerce initially; enriched in Command Center | Data quality, supplier mapping, margin analysis, recommendations |
| Customer purchase history | BigCommerce | Unified customer profile, segmentation, reactivation |
| Accounting records | QuickBooks | Management reporting, variance analysis, dashboards, reports |
| Email subscription/campaign status | Mailchimp | Segmentation, campaign analytics, reactivation planning |
| Website analytics | GA4 | Dashboarding, campaign and funnel analysis |
| Supplier portal data | Supplier portals | Price/stock/order confirmation capture through API or browser automation |
| AI outputs | Command Center | Summaries, drafts, recommendations, reports, logged and reviewable |
| Tasks/workflows | Command Center | Accountability and internal execution |
| Investor/M&A records | Command Center | Strategic growth workflow and reporting |

---

## 3. Integration Principles

Each integration should have:

- A clearly defined source system.
- A documented purpose.
- A sync/import method.
- A sync frequency.
- Field mappings.
- Error handling.
- Retry logic.
- Sync logs.
- Permission controls.
- Manual fallback.
- Data validation.
- Audit trail.

No integration should silently fail. Failed imports, API errors, authentication issues, or mapping errors must be visible in the Automation Center.

---

## 4. BigCommerce Integration

## 4.1 Purpose

Import and monitor e-commerce data from LifeSupply and Wellmart stores.

## 4.2 Data to Import

- Stores
- Customers
- Products
- Product variants/SKUs
- Categories
- Product images
- Orders
- Order items
- Fulfillment status
- Discounts
- Coupons/promotions where needed
- Shipping information
- Tax information
- Payment status
- Customer addresses

## 4.3 MVP Scope

- Configure one or more BigCommerce store connections.
- Import/mock products, customers, and orders.
- Store source IDs.
- Display imported data in dashboards and tables.
- Do not push updates back to BigCommerce during MVP unless specifically approved.

## 4.4 Future Scope

- Webhooks for new/updated orders.
- Product update pushes.
- Fulfillment update pushes.
- Product image validation.
- Featured product updates.
- Price update workflow.
- Product cleanup workflow.
- Sync error dashboard.

## 4.5 Key Business Notes

- LifeSupply.ca may be treated as B2B/institutional.
- WellmartMedical.com may be treated as retail/dropship.
- Wellmart may initially rely heavily on BBM01 / Best Buy Medical.
- Catalog cleanup, image validation, category hierarchy, and product description improvement are important product intelligence features.

---

## 5. QuickBooks Integration

## 5.1 Purpose

Support financial management, consolidated reporting, divisional reporting, variance analysis, and investor/board/lender reporting.

## 5.2 Source-of-Truth Rule

QuickBooks is the accounting source of truth. The Command Center should not overwrite or alter QuickBooks accounting records unless an explicit, controlled, approved future workflow is created.

## 5.3 Data to Import or Sync

- Profit and loss
- Balance sheet
- Trial balance
- General ledger detail where appropriate
- Accounts receivable aging
- Accounts payable aging
- Sales by customer
- Sales by product/service where available
- Expense categories
- Cash balances
- Vendor information
- Customer information where useful
- Class/division/location reporting if configured

## 5.4 Import Paths

### Path A — Controlled File Upload

Use this when direct API integration is not yet configured.

Files may include:

- P&L by entity/division
- Balance sheet
- Trial balance
- A/R aging
- A/P aging
- Sales by customer
- Sales by product/service
- General ledger exports

Requirements:

- File upload.
- Template validation.
- Account mapping.
- Import versioning.
- Review step.
- Approval step before publishing to dashboards.

### Path B — QuickBooks Online API

Use this when credentials and OAuth are available.

Requirements:

- Secure OAuth.
- Report sync.
- Account sync.
- Transaction sync if needed.
- Sync logs.
- Error handling.
- Manual re-auth workflow.

## 5.5 MVP Scope

- Build financial data model.
- Support manual import or mock data.
- Display revenue, gross profit, gross margin, EBITDA/adjusted EBITDA, cash, AR/AP, and period comparison.
- Support period/division filtering.
- Include approval status for financial data.

---

## 6. Mailchimp Integration

## 6.1 Purpose

Support customer reactivation, campaign planning, segmentation, marketing analytics, and email performance reporting.

## 6.2 Data to Import

- Audiences
- Contacts
- Subscription status
- Tags
- Segments
- Campaigns
- Campaign metrics
- Opens
- Clicks
- Bounces
- Unsubscribes
- Revenue attribution where available

## 6.3 Compliance Requirement

The application must visibly track consent and subscription status. Customer reactivation should be handled in a controlled and compliant manner. Do not treat all historical emails as freely marketable.

## 6.4 MVP Scope

- Import/mock audience and campaign metrics.
- Display customer reactivation dashboard.
- Show contact statuses.
- Allow planning of campaign segments.
- Do not send campaigns automatically.

## 6.5 Future Scope

- Push segment tags to Mailchimp.
- Draft campaigns with AI.
- Send to Mailchimp for approval.
- Campaign calendar.
- Revenue attribution.
- Lifecycle campaigns.

---

## 7. Google Analytics 4 Integration

## 7.1 Purpose

Provide website traffic, engagement, conversion, and campaign attribution reporting.

## 7.2 Data to Import

- Users
- Sessions
- Engaged sessions
- Page views
- Landing pages
- Source/medium
- Campaigns
- Events
- Product views
- Add-to-carts
- Checkouts
- Purchases
- Revenue
- Conversion rate

## 7.3 MVP Scope

- Build analytics data model.
- Display mock or initial GA4 dashboard.
- Support date range filtering.
- Connect analytics to marketing and store performance views.

## 7.4 Future Scope

- Real-time dashboard.
- Funnel analysis.
- Product-level conversion.
- Campaign attribution.
- Search Console integration.
- SEO/content performance.

---

## 8. Supplier Portal Integration and Browser Automation

## 8.1 Purpose

Automate or assist supplier workflows where suppliers do not provide APIs.

Potential workflows:

- Log into supplier portal.
- Search supplier SKU.
- Check stock.
- Check price.
- Prepare order.
- Place order after approval.
- Capture confirmation.
- Capture screenshots.
- Update Command Center status.
- Later update BigCommerce fulfillment status where approved.

## 8.2 Automation Tool

Use Playwright.

## 8.3 Safety Rules

- Start with human-in-the-loop automation.
- Pause for price mismatches.
- Pause for insufficient stock.
- Pause for SKU/product mismatch.
- Pause for address mismatch.
- Pause for unexpected shipping/tax.
- Capture evidence.
- Log every automation run.
- Do not bypass CAPTCHA/MFA rules improperly.
- Test in staging or sandbox mode where possible.

## 8.4 MVP Scope

- Do not build full supplier automation in MVP.
- Build the data model and automation logging foundation.
- Prepare the architecture for future Playwright workers.

---

## 9. OpenAI API Integration

## 9.1 Purpose

Use OpenAI for structured analysis, summaries, report drafting, customer segmentation assistance, product cleanup, campaign drafting, and management commentary.

## 9.2 Initial Use Cases

- Daily management briefing.
- Financial variance commentary.
- Product description improvement.
- Campaign draft generation.
- Customer segment summary.
- Task summary.
- Report narrative generation.
- Data extraction from uploaded documents.

## 9.3 Requirements

- Server-side API wrapper.
- Environment variable for API key.
- Prompt/output logging.
- Role-based context access.
- Structured outputs where needed.
- Clear distinction between facts and recommendations.

---

## 10. Anthropic Claude API Integration

## 10.1 Purpose

Use Claude for long-form analysis, business reporting, strategic memos, investor reporting, M&A summaries, complex document analysis, and larger-context reasoning.

## 10.2 Initial Use Cases

- Board report draft.
- Investor update draft.
- Acquisition target summary.
- Strategic opportunity analysis.
- Supplier issue narrative.
- Longer management reports.
- Document-based Q&A.

## 10.3 Requirements

- Server-side API wrapper.
- Environment variable for API key.
- Prompt/output logging.
- Model routing rules.
- Structured output support where appropriate.
- User permission checks before including sensitive data.

---

## 11. Social Media Integration

## 11.1 Purpose

Support marketing planning, content creation, social media campaigns, and product promotion.

## 11.2 MVP Scope

- Content planning and AI draft generation only.
- No direct posting automation in MVP.

## 11.3 Future Scope

- Scheduling integration.
- Performance tracking.
- Social campaign calendar.
- Approval workflow.
- Post export.

---

## 12. Manual Uploads

Manual uploads are important for early-stage functionality and source systems that are not yet API-connected.

Supported upload types:

- QuickBooks exports
- Product CSVs
- Supplier price files
- Supplier inventory files
- Financial statements
- Campaign reports
- Investor documents
- Board reports
- PDF/Excel supporting files

Requirements:

- File storage.
- Metadata.
- Import type.
- Validation.
- Versioning.
- Review status.
- Approval status.

---

## 13. Integration Error Handling

Every integration should log:

- Start time.
- End time.
- Status.
- Number of records processed.
- Number created.
- Number updated.
- Number failed.
- Error message.
- Retry status.
- User who triggered the sync, if manual.

Errors must be visible in the Automation Center.

---

## 14. Sync Frequency Guidelines

| Integration | MVP Frequency | Future Frequency |
|---|---:|---:|
| BigCommerce orders | Manual/daily | Near real-time/webhooks |
| BigCommerce products | Manual/daily | Scheduled/daily |
| Customers | Daily/weekly | Scheduled/daily |
| QuickBooks | Monthly/manual | Daily/weekly API, monthly approved close |
| Mailchimp | Daily/weekly | Scheduled/daily |
| GA4 | Daily | Daily/near real-time selected |
| Supplier portals | Manual | Scheduled/human-approved automation |
| AI briefing | Manual/daily | Scheduled daily |

---

## 15. Admin Settings Required

The Admin Settings module should eventually include:

- BigCommerce connection settings.
- QuickBooks connection/import settings.
- Mailchimp connection settings.
- GA4 property settings.
- OpenAI API key reference.
- Claude API key reference.
- Supplier portal settings.
- Sync schedule settings.
- Report settings.
- Role and permission settings.

Secrets must not be exposed in the browser.

