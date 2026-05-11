# 09 - AI Features and Guardrails

**Project:** LifeSupply Command Center  
**Document status:** Batch 2 post-MVP requirements  
**Prepared:** May 10, 2026  
**Primary audience:** Claude Code, developers, AI workflow designers, product owner

---

## 1. Purpose

This document defines how artificial intelligence should be used inside the LifeSupply Command Center after the MVP stage. The platform is expected to use both OpenAI and Anthropic Claude APIs, but AI must be used in a controlled, auditable, business-oriented manner.

The AI layer should increase management leverage by helping the team analyze data, draft reports, identify exceptions, create recommendations, improve product and marketing content, and prepare strategic materials. It must not become an uncontrolled action engine.

The central principle is:

> AI may analyze, summarize, draft, recommend, classify, and explain. Sensitive actions require human approval, permission checks, and audit logs.

---

## 2. AI Strategy

The LifeSupply Command Center should include a secure AI layer that sits above the normalized data model and approved integrations.

AI should support:

- Executive decision-making.
- Daily operations review.
- Financial analysis.
- Product and catalog optimization.
- Customer segmentation and reactivation.
- Marketing campaign drafting.
- Supplier performance review.
- Report generation.
- Investor and board communications.
- M&A and strategic opportunity analysis.

AI should not be treated as a replacement for accounting systems, CRM systems, e-commerce platforms, or management approval. It is an analytical and drafting layer.

---

## 3. AI Capability Categories

### 3.1 Summarization

AI should summarize:

- Daily operating activity.
- Order exceptions.
- Supplier issues.
- Monthly financial performance.
- Product category trends.
- Marketing campaign results.
- Customer segment performance.
- Open management tasks.
- Investor communications.
- Uploaded documents and reports.

### 3.2 Classification

AI should classify:

- Customer types.
- Support issues.
- Supplier exceptions.
- Product listing quality.
- Strategic opportunities.
- M&A target fit.
- Campaign themes.
- Financial variance explanations.

### 3.3 Drafting

AI should draft:

- Daily management briefings.
- Weekly operating reports.
- Monthly financial commentary.
- Board updates.
- Investor emails.
- Supplier follow-up emails.
- Customer reactivation campaigns.
- Product descriptions.
- Social media posts.
- Internal memos.
- M&A target summaries.

### 3.4 Recommendation

AI should recommend:

- Priority tasks.
- Orders requiring escalation.
- Products to feature.
- Products requiring cleanup.
- Customer segments to reactivate.
- Supplier issues to investigate.
- Pricing review candidates.
- Campaign ideas.
- Financial analysis questions.
- Strategic opportunities.

### 3.5 Structured Extraction

AI should extract structured data from:

- Supplier PDFs.
- Price lists.
- Product files.
- Invoices.
- Emails manually uploaded to the platform.
- Board materials.
- Financing documents.
- Acquisition target documents.

All structured extraction must include confidence scores and review status where the extracted data is used for operational or financial decisions.

---

## 4. Model Routing Principles

The platform may use both OpenAI and Claude. The implementation should support model routing so the application can choose the best model for each task.

### 4.1 OpenAI Use Cases

Use OpenAI where the task benefits from structured outputs, tool calling, classification, fast summarization, JSON generation, or large-scale operational workflows.

Examples:

- Daily operating summary.
- Product description cleanup.
- Customer segmentation labels.
- JSON extraction from supplier files.
- Task generation.
- Support issue classification.
- Campaign subject line variants.
- Data quality scoring.
- AI analyst queries over structured data.

### 4.2 Claude Use Cases

Use Claude where the task benefits from longer-form reasoning, document analysis, business memo drafting, strategic synthesis, or nuanced financial/management analysis.

Examples:

- Board reports.
- Investor updates.
- M&A opportunity memos.
- Strategic planning reports.
- Complex financial commentary.
- Acquisition target analysis.
- Supplier negotiation memos.
- Long-form business planning.
- Deep document review.

### 4.3 Model Abstraction Requirement

Do not hardcode application logic around one provider. Create a server-side AI service layer with a common interface.

Suggested abstraction:

```text
AIRequest
  -> task_type
  -> user_id
  -> role_context
  -> source_data_refs
  -> prompt_template_id
  -> model_preference
  -> output_schema
  -> approval_required

AIResponse
  -> output_text
  -> output_json
  -> model_used
  -> token_usage
  -> confidence
  -> source_refs
  -> assumptions
  -> warnings
  -> created_at
```

---

## 5. AI Analyst Module

The AI Analyst should be a secure natural-language interface for management. It should answer questions using internal data, not generic internet-style responses.

### 5.1 Example User Questions

The AI Analyst should eventually answer questions such as:

- What are the biggest operating issues today?
- Which orders require manual intervention?
- Which suppliers caused the most delays this month?
- Which products have the lowest gross margin?
- Which products should we feature next week?
- Which customer segment should we reactivate first?
- Why did revenue decline this month?
- Why did gross margin improve or decline?
- What is the monthly management summary?
- Prepare a board update based on the latest operating and financial data.
- Draft an investor update using current KPIs.
- Summarize all open M&A opportunities.
- Which acquisition targets are most aligned with our current product categories?

### 5.2 AI Analyst Constraints

The AI Analyst must:

- Respect user role permissions.
- Only access data the user is allowed to see.
- Identify the source data used.
- Distinguish facts from assumptions.
- Avoid presenting estimates as audited figures.
- Use management-approved definitions for EBITDA, adjusted EBITDA, and normalized earnings.
- Flag missing or stale data.
- Recommend next steps rather than pretending certainty where data is incomplete.

---

## 6. Daily Management Briefing

The Daily Management Briefing should be one of the first advanced AI features after MVP stabilization.

### 6.1 Purpose

Provide ownership and management with a plain-English summary of the business each day.

### 6.2 Inputs

- Prior day orders.
- Month-to-date orders.
- Open order exceptions.
- Delayed orders.
- Supplier issues.
- Product margin alerts.
- Website traffic.
- Campaign results.
- Cash and receivables highlights, if available.
- Open urgent tasks.

### 6.3 Output Sections

The briefing should include:

1. Executive summary.
2. Sales and order activity.
3. Fulfillment and supplier exceptions.
4. Product and margin issues.
5. Marketing and website activity.
6. Financial highlights, where available.
7. Recommended priorities for today.
8. Data limitations or items requiring review.

### 6.4 Approval and Delivery

The briefing may be auto-generated, but distribution rules should be configurable.

Default approach:

- Generate draft automatically.
- Store in Command Center.
- Notify authorized users.
- Do not email externally unless approved.

---

## 7. Financial Commentary Generation

AI-generated financial commentary must be carefully controlled.

### 7.1 Permitted Use

AI may draft:

- Monthly variance commentary.
- Budget vs actual explanations.
- Revenue trend summaries.
- Gross margin commentary.
- Working capital observations.
- Management-adjusted EBITDA commentary.
- Investor update draft language.

### 7.2 Required Guardrails

AI financial outputs must:

- Identify whether data is unaudited, management prepared, or sourced from QuickBooks.
- Avoid representing management-adjusted figures as GAAP/IFRS/accounting figures unless approved.
- Show calculation assumptions where relevant.
- Highlight missing periods, incomplete imports, or unreconciled source data.
- Require Finance Manager or Executive approval before being included in board, investor, lender, or financing materials.

### 7.3 Prohibited AI Financial Actions

AI must not:

- Create journal entries.
- Modify QuickBooks data.
- Reclassify transactions.
- Approve adjustments.
- Decide tax, accounting, or audit treatment.
- Produce final investor-facing financial conclusions without human review.

---

## 8. Product and Catalog AI

AI should help improve the product catalog and identify commercial opportunities.

### 8.1 Product Listing Improvement

AI may draft:

- Product titles.
- Short descriptions.
- Long descriptions.
- SEO meta descriptions.
- Product bullet points.
- Category descriptions.
- Comparison summaries.
- Product use-case explanations.

### 8.2 Product Quality Scoring

AI may score product listings based on:

- Missing image.
- Weak title.
- Poor description.
- Missing category.
- Missing supplier mapping.
- Missing cost.
- Missing margin.
- Missing SEO fields.
- Low conversion despite traffic.

### 8.3 Approval Rules

AI-generated product content should not be pushed to BigCommerce automatically unless:

- A user with Product Manager or Executive role approves it.
- The change is logged.
- The original text is preserved.
- The external update workflow has been tested.

---

## 9. Customer Reactivation AI

AI should help identify and re-engage customers, but must respect consent, privacy, and marketing approval rules.

### 9.1 Permitted Use

AI may:

- Segment customers.
- Identify lapsed customers.
- Rank reactivation priority.
- Draft campaign themes.
- Draft subject lines and email copy.
- Suggest products based on purchase history.
- Summarize campaign results.
- Recommend follow-up campaigns.

### 9.2 Required Inputs

- Customer purchase history.
- Last order date.
- Product categories purchased.
- Customer lifetime value.
- Email subscription status.
- Consent classification.
- Campaign engagement history.
- Unsubscribe status.

### 9.3 Approval and Compliance Rules

AI must not send emails directly. Customer campaigns must be approved by an authorized user and checked against consent rules before export or Mailchimp synchronization.

---

## 10. Supplier and Operations AI

AI should help operations teams identify problems and prioritize work.

### 10.1 Permitted Use

AI may:

- Summarize supplier performance.
- Classify order exceptions.
- Identify recurring supplier issues.
- Recommend escalation priorities.
- Draft supplier follow-up emails.
- Suggest changes to automation rules.
- Compare expected and actual fulfillment costs.

### 10.2 Supplier Issue Categories

AI should classify supplier issues into categories such as:

- Stock unavailable.
- Price mismatch.
- SKU mismatch.
- Shipping issue.
- Delayed confirmation.
- Portal login failure.
- Tax or fee mismatch.
- Product discontinued.
- Address validation issue.
- Human approval required.

---

## 11. Investor Relations and M&A AI

AI may support investor and M&A workflows, but should be treated as draft support only.

### 11.1 Investor Use Cases

AI may draft:

- Investor updates.
- Board summaries.
- Financing overview language.
- KPI summaries.
- Operational progress updates.
- Risk summaries.
- Data room cover notes.

### 11.2 M&A Use Cases

AI may draft:

- Acquisition target summaries.
- Strategic fit analyses.
- Initial diligence checklists.
- Valuation discussion outlines.
- Integration risk summaries.
- Outreach email drafts.

### 11.3 Required Controls

Investor and M&A outputs must be marked as drafts until approved by authorized management.

---

## 12. AI Data Grounding

AI outputs should be grounded in stored data wherever possible.

### 12.1 Source References

For important outputs, store references to:

- Database tables and records used.
- Imported reports used.
- Time period analyzed.
- Integration sync timestamp.
- Uploaded files used.
- User-provided instructions.

### 12.2 Data Freshness Warnings

AI should warn users when:

- BigCommerce sync is stale.
- QuickBooks data is not current.
- Mailchimp campaign metrics are incomplete.
- GA4 data is delayed or missing.
- Supplier automation logs are unavailable.
- Financial periods are not closed.

### 12.3 Output Reliability Tags

AI outputs should support reliability tags such as:

- Draft.
- Needs review.
- Source data incomplete.
- Based on unaudited management data.
- Based on imported source data.
- Approved.
- Superseded.

---

## 13. Prompt Template Library

Prompts should be stored as versioned templates rather than hardcoded strings inside random components.

Suggested prompt template table:

```text
prompt_templates
  id
  name
  task_type
  system_prompt
  user_prompt_template
  required_inputs
  output_schema
  default_model
  approval_required
  version
  is_active
  created_at
  updated_at
```

### 13.1 Required Prompt Templates

Create prompt templates for:

- Daily management briefing.
- Order exception classification.
- Supplier issue summary.
- Monthly financial commentary.
- Product listing improvement.
- Product margin explanation.
- Customer reactivation campaign.
- Campaign performance summary.
- Board update draft.
- Investor update draft.
- M&A target summary.
- Strategic opportunity ranking.

---

## 14. Structured Output Requirements

Where AI outputs are used in workflows, require JSON output validated against a schema.

Example output schema for order exception classification:

```json
{
  "exception_category": "price_mismatch | stock_unavailable | sku_mismatch | shipping_issue | portal_error | manual_review",
  "severity": "low | medium | high | urgent",
  "summary": "string",
  "recommended_action": "string",
  "approval_required": true,
  "confidence": 0.0,
  "data_limitations": ["string"]
}
```

Do not rely on unstructured AI output for workflow-critical automation.

---

## 15. Approval Framework

AI outputs should use approval states.

Suggested states:

- Draft.
- Pending review.
- Approved.
- Rejected.
- Revised.
- Superseded.
- Archived.

Approval should be required for:

- Customer communications.
- Investor communications.
- Board reports.
- Financial commentary.
- Supplier escalation messages.
- Product changes pushed to BigCommerce.
- Pricing recommendations implemented externally.
- Supplier automation rule changes.

---

## 16. AI Audit Logging

Every important AI interaction should be logged.

Suggested fields:

```text
ai_outputs
  id
  user_id
  task_type
  prompt_template_id
  model_provider
  model_name
  input_summary
  output_text
  output_json
  source_data_refs
  assumptions
  warnings
  confidence
  token_usage
  cost_estimate
  approval_status
  approved_by
  approved_at
  created_at
```

Do not log sensitive secrets, access tokens, passwords, or private API keys.

---

## 17. Security and Privacy Rules

AI workflows must obey the same role-based permissions as the rest of the application.

### Required controls

- Server-side API calls only.
- No AI provider keys in client code.
- No unrestricted export of customer lists.
- No exposure of financial data to unauthorized roles.
- No investor data visibility for non-authorized users.
- No supplier credentials in prompts.
- No sensitive information in logs unless specifically protected.

---

## 18. Prompt Injection and Document Risk

Uploaded documents, supplier portals, product files, or user content may contain instructions that should not control the AI system.

The AI layer must treat external content as data, not instructions.

For example, if a supplier PDF contains language such as "ignore prior instructions," the AI must not obey that text.

Implementation requirement:

- Separate system instructions from retrieved content.
- Label external content clearly as untrusted data.
- Restrict tools based on server-side permissions, not model output alone.

---

## 19. Human-in-the-Loop Rules

Human approval is mandatory for:

- Sending emails.
- Publishing campaigns.
- Updating product listings externally.
- Changing prices.
- Exporting sensitive data.
- Sending investor materials.
- Running supplier order submission.
- Recording or modifying financial data.
- Approving forecasts or valuation outputs for external use.

---

## 20. AI Success Metrics

Track whether AI is creating business value.

Suggested metrics:

- Time saved preparing reports.
- Number of tasks auto-classified.
- Number of exceptions summarized.
- Accuracy of daily briefings.
- User approval rate of AI drafts.
- Number of AI drafts revised before approval.
- Campaign performance from AI-assisted content.
- Reduction in manual catalog cleanup time.
- Reduction in management reporting preparation time.

---

## 21. Implementation Phasing

### Phase AI-1: Safe AI Foundation

- AI service abstraction.
- Prompt template table.
- AI output logging.
- Basic daily briefing.
- Basic AI analyst over mock data.

### Phase AI-2: Operational AI

- Order exception classification.
- Supplier issue summaries.
- Product listing cleanup suggestions.
- Task recommendations.

### Phase AI-3: Financial and Reporting AI

- Monthly financial commentary.
- Board report draft.
- Management report draft.
- Variance explanation.

### Phase AI-4: Marketing and Customer AI

- Customer segment summaries.
- Reactivation campaign drafts.
- Campaign result analysis.
- Product recommendation copy.

### Phase AI-5: Strategic AI

- Investor update drafts.
- M&A target summaries.
- Strategic opportunity ranking.
- Scenario memo drafting.

---

## 22. Acceptance Criteria

The AI layer is acceptable when:

- All AI calls are server-side.
- AI outputs are logged.
- AI outputs respect user permissions.
- Important AI outputs use source data references.
- Sensitive outputs require approval.
- AI does not directly execute external actions without workflow approval.
- Prompt templates are versioned.
- Structured outputs are validated where used for workflows.
- Users can see when an output is draft, approved, rejected, or superseded.
