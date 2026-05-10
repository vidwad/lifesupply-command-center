# 04 — Database Schema

**Project:** LifeSupply Command Center  
**Document status:** Initial database model specification  
**Prepared:** May 9, 2026

---

## 1. Database Design Principles

The Command Center database should act as the normalized management data hub. It should not replace BigCommerce, QuickBooks, Mailchimp, or GA4 as source systems. Instead, it should import, normalize, map, enrich, analyze, and report on data from those systems.

Key principles:

- Use PostgreSQL.
- Use Prisma as ORM.
- Use UUID/CUID primary keys.
- Include audit fields.
- Track external source systems.
- Preserve source record IDs.
- Use soft deletes where appropriate.
- Support multiple divisions and stores.
- Separate raw imports from normalized business records where needed.
- Track sync logs and import versions.
- Protect sensitive financial/customer/investor data through permissions.

---

## 2. Common Fields

Most tables should include:

```text
id
createdAt
updatedAt
deletedAt, where appropriate
createdById, where appropriate
updatedById, where appropriate
sourceSystem, where imported
sourceId, where imported
metadata JSONB, where useful
```

---

## 3. Core System Tables

## 3.1 users

Purpose: Application user accounts.

Suggested fields:

- id
- email
- name
- status
- title
- department
- lastLoginAt
- createdAt
- updatedAt

## 3.2 roles

Purpose: Role definitions.

Suggested fields:

- id
- name
- description
- isSystemRole
- createdAt
- updatedAt

Default roles:

- Super Admin
- Executive / Owner
- Finance Manager
- Operations Manager
- Marketing Manager
- Product Manager
- Customer Service
- Investor Relations
- External Advisor
- Developer / Technical Admin

## 3.3 permissions

Purpose: Granular permission definitions.

Suggested fields:

- id
- key
- description
- module
- action

Example permission keys:

- dashboard.view
- orders.view
- orders.update
- financials.view
- financials.export
- integrations.manage
- ai.use
- ai.view_logs
- campaigns.prepare
- campaigns.approve
- supplier_automation.run
- supplier_automation.approve
- reports.generate
- reports.approve
- admin.manage_users

## 3.4 user_roles

Purpose: Many-to-many user-role mapping.

Fields:

- id
- userId
- roleId
- createdAt

## 3.5 role_permissions

Purpose: Many-to-many role-permission mapping.

Fields:

- id
- roleId
- permissionId
- createdAt

## 3.6 audit_logs

Purpose: Record material user/system actions.

Fields:

- id
- actorUserId
- action
- entityType
- entityId
- beforeData JSONB
- afterData JSONB
- ipAddress
- userAgent
- createdAt

---

## 4. Business Structure Tables

## 4.1 divisions

Purpose: Business divisions/entities/geographic units.

Examples:

- LifeSupply Canada
- Wellmart Medical
- LifeSupply U.S.
- Balkowitsch / U.S. operations
- Consolidated

Fields:

- id
- name
- code
- type
- jurisdiction
- parentDivisionId
- isActive
- createdAt
- updatedAt

## 4.2 stores

Purpose: E-commerce stores or sales channels.

Fields:

- id
- divisionId
- name
- platform
- url
- sourceSystem
- externalStoreId
- status
- createdAt
- updatedAt

Examples:

- LifeSupply.ca
- WellmartMedical.com
- Amazon channel
- U.S. sales channel

## 4.3 departments

Purpose: Internal functional departments.

Fields:

- id
- name
- description
- createdAt
- updatedAt

Examples:

- Finance
- Operations
- Marketing
- Product
- Customer Service
- Investor Relations
- Technology

---

## 5. E-Commerce Tables

## 5.1 customers

Purpose: Unified customer records.

Fields:

- id
- storeId
- divisionId
- sourceSystem
- sourceId
- email
- firstName
- lastName
- companyName
- customerType
- phone
- billingAddress JSONB
- shippingAddress JSONB
- consentStatus
- mailchimpStatus
- lifetimeValue
- orderCount
- firstOrderAt
- lastOrderAt
- reactivationScore
- notes
- metadata JSONB
- createdAt
- updatedAt

Customer types:

- retail
- b2b
- clinic
- institutional
- supplier
- investor
- unknown

## 5.2 customer_segments

Purpose: Segments for reactivation and reporting.

Fields:

- id
- name
- description
- segmentType
- criteria JSONB
- sourceSystem
- isActive
- createdAt
- updatedAt

## 5.3 customer_segment_members

Fields:

- id
- customerId
- segmentId
- addedAt
- removedAt

## 5.4 categories

Purpose: Product categories.

Fields:

- id
- storeId
- sourceSystem
- sourceId
- name
- path
- parentCategoryId
- sortOrder
- isActive
- createdAt
- updatedAt

## 5.5 products

Purpose: Master product records.

Fields:

- id
- storeId
- divisionId
- sourceSystem
- sourceId
- name
- sku
- brand
- categoryId
- description
- url
- imageStatus
- descriptionStatus
- status
- productType
- isFeatured
- isRockstarCandidate
- metadata JSONB
- createdAt
- updatedAt

## 5.6 product_variants

Purpose: SKU-level product details. Even if initial catalogs are simple, the schema should support variants.

Fields:

- id
- productId
- sku
- optionSummary
- price
- salePrice
- costPrice
- inventoryTrackingType
- stockLevel
- status
- sourceSystem
- sourceId
- createdAt
- updatedAt

## 5.7 product_images

Purpose: Product image tracking.

Fields:

- id
- productId
- sourceUrl
- storedUrl
- altText
- sortOrder
- status
- validationStatus
- createdAt
- updatedAt

## 5.8 orders

Purpose: Normalized order header records.

Fields:

- id
- storeId
- divisionId
- customerId
- sourceSystem
- sourceId
- orderNumber
- status
- paymentStatus
- fulfillmentStatus
- orderDate
- subtotal
- discountTotal
- shippingTotal
- taxTotal
- grandTotal
- currency
- estimatedGrossProfit
- estimatedGrossMargin
- supplierStatus
- automationStatus
- exceptionStatus
- metadata JSONB
- createdAt
- updatedAt

## 5.9 order_items

Purpose: SKU-level order records.

Fields:

- id
- orderId
- productId
- productVariantId
- sku
- productName
- quantity
- unitPrice
- unitCost
- lineSubtotal
- lineTax
- lineTotal
- estimatedGrossProfit
- estimatedGrossMargin
- supplierId
- supplierProductId
- createdAt
- updatedAt

## 5.10 fulfillment_events

Purpose: Order fulfillment history.

Fields:

- id
- orderId
- supplierId
- eventType
- status
- trackingNumber
- carrier
- confirmationNumber
- notes
- evidenceFileId
- occurredAt
- createdAt

---

## 6. Supplier Tables

## 6.1 suppliers

Purpose: Supplier/vendor records.

Fields:

- id
- name
- code
- type
- websiteUrl
- portalUrl
- apiAvailable
- automationAvailable
- status
- primaryContactName
- primaryContactEmail
- notes
- createdAt
- updatedAt

Example supplier codes:

- BBM01

## 6.2 supplier_products

Purpose: Supplier-specific SKU and cost mapping.

Fields:

- id
- supplierId
- productId
- productVariantId
- supplierSku
- supplierProductName
- supplierUrl
- cost
- currency
- availabilityStatus
- lastCheckedAt
- isPreferred
- metadata JSONB
- createdAt
- updatedAt

## 6.3 supplier_price_history

Purpose: Track supplier cost changes.

Fields:

- id
- supplierProductId
- oldCost
- newCost
- currency
- sourceSystem
- detectedAt
- createdAt

## 6.4 supplier_inventory_snapshots

Purpose: Track stock availability snapshots.

Fields:

- id
- supplierProductId
- availabilityStatus
- quantityAvailable
- sourceSystem
- checkedAt
- createdAt

## 6.5 supplier_portal_credentials

Purpose: Store secure credential references, not raw secrets.

Fields:

- id
- supplierId
- credentialReference
- usernameLabel
- status
- lastVerifiedAt
- notes
- createdAt
- updatedAt

Never store raw passwords in plain text.

---

## 7. Financial Tables

## 7.1 financial_periods

Purpose: Monthly/quarterly/annual reporting periods.

Fields:

- id
- name
- periodType
- startDate
- endDate
- status
- createdAt
- updatedAt

Statuses:

- open
- imported
- under_review
- approved
- closed

## 7.2 financial_accounts

Purpose: Chart of accounts mapping.

Fields:

- id
- sourceSystem
- sourceId
- accountNumber
- accountName
- accountType
- parentAccountId
- divisionId
- isActive
- createdAt
- updatedAt

## 7.3 financial_summaries

Purpose: High-level financial summary by period/division.

Fields:

- id
- financialPeriodId
- divisionId
- revenue
- cogs
- grossProfit
- grossMargin
- operatingExpenses
- operatingIncome
- ebitda
- adjustedEbitda
- cash
- accountsReceivable
- accountsPayable
- workingCapital
- currency
- sourceSystem
- sourceImportId
- approvalStatus
- createdAt
- updatedAt

## 7.4 financial_transactions

Purpose: Transaction-level or summary-level accounting data where imported.

Fields:

- id
- financialPeriodId
- divisionId
- financialAccountId
- sourceSystem
- sourceId
- transactionDate
- transactionType
- description
- amount
- currency
- customerId
- supplierId
- metadata JSONB
- createdAt
- updatedAt

## 7.5 financial_adjustments

Purpose: Management adjustments and normalization entries.

Fields:

- id
- financialPeriodId
- divisionId
- adjustmentType
- description
- amount
- currency
- reason
- preparedById
- approvedById
- approvalStatus
- createdAt
- updatedAt

## 7.6 financial_imports

Purpose: Track QuickBooks uploads/imports/API syncs.

Fields:

- id
- sourceSystem
- importType
- fileId
- periodStart
- periodEnd
- divisionId
- status
- importedById
- reviewedById
- approvedById
- errorSummary
- createdAt
- updatedAt

---

## 8. Marketing and Analytics Tables

## 8.1 marketing_contacts

Purpose: Mailchimp/contact marketing records.

Fields:

- id
- customerId
- sourceSystem
- sourceId
- email
- status
- consentStatus
- tags JSONB
- lastCampaignSentAt
- lastOpenedAt
- lastClickedAt
- createdAt
- updatedAt

## 8.2 campaigns

Purpose: Marketing campaign records.

Fields:

- id
- name
- campaignType
- sourceSystem
- sourceId
- status
- subject
- audienceSummary
- scheduledAt
- sentAt
- createdById
- approvedById
- createdAt
- updatedAt

## 8.3 campaign_metrics

Purpose: Campaign performance.

Fields:

- id
- campaignId
- sentCount
- openCount
- clickCount
- conversionCount
- attributedRevenue
- unsubscribeCount
- bounceCount
- measuredAt
- createdAt

## 8.4 website_metrics

Purpose: GA4 summary metrics.

Fields:

- id
- storeId
- date
- sourceSystem
- users
- sessions
- engagedSessions
- pageViews
- productViews
- addToCarts
- checkouts
- purchases
- revenue
- conversionRate
- metadata JSONB
- createdAt

## 8.5 traffic_sources

Purpose: Source/medium breakdown.

Fields:

- id
- storeId
- date
- source
- medium
- campaign
- users
- sessions
- conversions
- revenue
- createdAt

---

## 9. AI Tables

## 9.1 ai_sessions

Purpose: User AI conversation sessions.

Fields:

- id
- userId
- title
- module
- createdAt
- updatedAt

## 9.2 ai_outputs

Purpose: Log AI prompts and outputs.

Fields:

- id
- aiSessionId
- userId
- modelProvider
- modelName
- prompt
- output
- structuredOutput JSONB
- sourceReferences JSONB
- tokenUsage JSONB
- status
- createdAt

## 9.3 ai_recommendations

Purpose: Store AI-generated recommendations that may become tasks.

Fields:

- id
- recommendationType
- title
- summary
- rationale
- confidenceLevel
- sourceReferences JSONB
- status
- assignedToId
- relatedEntityType
- relatedEntityId
- createdAt
- updatedAt

## 9.4 ai_report_generations

Purpose: Track AI-assisted report drafts.

Fields:

- id
- reportId
- modelProvider
- modelName
- promptSummary
- outputSummary
- approvalStatus
- createdById
- approvedById
- createdAt
- updatedAt

---

## 10. Task and Workflow Tables

## 10.1 tasks

Purpose: Action items and accountability.

Fields:

- id
- title
- description
- status
- priority
- assignedToId
- createdById
- dueDate
- completedAt
- relatedEntityType
- relatedEntityId
- sourceType
- sourceId
- createdAt
- updatedAt

Statuses:

- open
- in_progress
- blocked
- awaiting_approval
- completed
- cancelled

## 10.2 workflow_templates

Purpose: Repeatable workflows.

Fields:

- id
- name
- description
- module
- steps JSONB
- isActive
- createdAt
- updatedAt

## 10.3 workflow_runs

Purpose: Specific workflow instances.

Fields:

- id
- workflowTemplateId
- status
- startedById
- currentStep
- relatedEntityType
- relatedEntityId
- startedAt
- completedAt
- createdAt
- updatedAt

## 10.4 approvals

Purpose: Approval workflow records.

Fields:

- id
- approvalType
- status
- requestedById
- approverId
- relatedEntityType
- relatedEntityId
- requestSummary
- decisionNotes
- requestedAt
- decidedAt
- createdAt
- updatedAt

---

## 11. Reporting Tables

## 11.1 reports

Purpose: Generated reports.

Fields:

- id
- title
- reportType
- periodStart
- periodEnd
- status
- preparedById
- approvedById
- fileId
- summary
- metadata JSONB
- createdAt
- updatedAt

## 11.2 report_sections

Purpose: Report section content.

Fields:

- id
- reportId
- sectionTitle
- sectionOrder
- content
- dataReferences JSONB
- createdAt
- updatedAt

## 11.3 files

Purpose: Uploaded and generated files.

Fields:

- id
- fileName
- fileType
- mimeType
- sizeBytes
- storageProvider
- storageKey
- uploadedById
- createdAt

---

## 12. Strategic Growth Tables

## 12.1 investors

Purpose: Investor and capital raising contact records.

Fields:

- id
- name
- organization
- email
- phone
- investorType
- status
- notes
- createdAt
- updatedAt

## 12.2 investor_interactions

Purpose: Investor communication history.

Fields:

- id
- investorId
- interactionType
- interactionDate
- summary
- nextAction
- createdById
- createdAt
- updatedAt

## 12.3 opportunities

Purpose: Strategic opportunity tracking.

Fields:

- id
- title
- opportunityType
- status
- strategicRationale
- estimatedRevenueImpact
- estimatedMarginImpact
- estimatedCost
- riskRating
- priority
- ownerId
- nextAction
- dueDate
- metadata JSONB
- createdAt
- updatedAt

Opportunity types:

- acquisition
- supplier
- financing
- marketing
- product
- operational
- technology
- partnership
- cost_reduction

## 12.4 acquisition_targets

Purpose: M&A target records.

Fields:

- id
- opportunityId
- companyName
- website
- geography
- revenueEstimate
- ebitdaEstimate
- strategicFit
- integrationComplexity
- valuationNotes
- diligenceStatus
- createdAt
- updatedAt

---

## 13. Integration and Automation Tables

## 13.1 integration_connections

Purpose: Integration configuration records.

Fields:

- id
- integrationType
- name
- status
- credentialReference
- lastSyncAt
- lastSuccessfulSyncAt
- createdAt
- updatedAt

Integration types:

- bigcommerce
- quickbooks
- mailchimp
- ga4
- openai
- anthropic
- supplier_portal
- manual_import

## 13.2 integration_sync_logs

Purpose: Sync history.

Fields:

- id
- integrationConnectionId
- syncType
- status
- startedAt
- completedAt
- recordsProcessed
- recordsCreated
- recordsUpdated
- recordsFailed
- errorSummary
- metadata JSONB
- createdAt

## 13.3 automation_runs

Purpose: Browser automation and workflow automation logs.

Fields:

- id
- automationType
- supplierId
- status
- startedById
- startedAt
- completedAt
- relatedEntityType
- relatedEntityId
- evidenceFileId
- errorSummary
- metadata JSONB
- createdAt

---

## 14. Initial Prisma Implementation Guidance

Start with these core MVP tables:

- users
- roles
- permissions
- user_roles
- role_permissions
- audit_logs
- divisions
- stores
- customers
- categories
- products
- product_variants
- product_images
- orders
- order_items
- suppliers
- supplier_products
- financial_periods
- financial_summaries
- financial_imports
- marketing_contacts
- campaigns
- campaign_metrics
- website_metrics
- tasks
- approvals
- reports
- ai_outputs
- integration_connections
- integration_sync_logs

Add more tables as features mature.

