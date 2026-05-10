# 01 — Project Overview

**Project:** LifeSupply Command Center  
**Document status:** Initial project overview  
**Prepared:** May 9, 2026

---

## 1. Executive Summary

The LifeSupply Command Center is a proposed secure, web-based desktop application that will operate as a centralized management information and operations control platform for LifeSupply and related divisions.

The platform will aggregate operating, financial, e-commerce, customer, supplier, marketing, analytics, AI, investor, and strategic opportunity data into one structured environment. It will allow management to review daily activity, identify exceptions, assign tasks, monitor financial performance, prepare reports, optimize product and customer strategies, automate repetitive supplier workflows, and plan for growth opportunities including financing, acquisitions, and strategic partnerships.

The system should be designed as a practical management tool, not merely a dashboard. Its purpose is to reduce manual administrative burden, increase management visibility, preserve institutional knowledge, and help management make better decisions with fewer resources.

---

## 2. Business Context

LifeSupply operates in the medical supply, e-commerce, distribution, B2B, and retail health supply environment. The business platform involves multiple operating channels and data sources, including:

- LifeSupply.ca
- WellmartMedical.com
- Canadian operations
- U.S. operations
- Supplier/distributor relationships
- Historical customer databases
- BigCommerce store data
- QuickBooks financial data
- Mailchimp marketing data
- Google Analytics data
- Supplier portals
- Investor and strategic growth materials

The business has a complex information environment. Relevant information currently lives across e-commerce systems, accounting platforms, supplier portals, spreadsheets, email systems, analytics platforms, marketing platforms, internal reports, and management knowledge.

The Command Center should convert that fragmented information environment into a unified management operating system.

---

## 3. Operating Divisions and Channels

### 3.1 LifeSupply.ca

LifeSupply.ca should be treated as the B2B, clinic, institutional, or professional-facing channel. It may support:

- Clinics
- Professional buyers
- Institutional purchasers
- Repeat procurement relationships
- Quote-based workflows
- Larger orders
- Multi-supplier fulfillment
- Account-based customer relationships

### 3.2 WellmartMedical.com

WellmartMedical.com should be treated as the retail, consumer, dropship, and product discovery channel. It may support:

- Direct-to-consumer sales
- Retail catalog browsing
- Dropship fulfillment
- Category-first product discovery
- Marketing campaigns
- Product testing
- Customer reactivation
- Search and ad-driven sales

Initial Wellmart workflows may involve Best Buy Medical / BBM01 as a primary supplier.

### 3.3 U.S. Operations

U.S. operations may include Balkowitsch-related operations, Amazon/e-commerce activity, and future U.S. growth opportunities. The Command Center should support geographic reporting, including Canada/U.S. comparison, channel-level analysis, and consolidated reporting.

### 3.4 Supplier Relationships

Suppliers may include large distributors and product vendors. Some suppliers may provide APIs, but others may only provide web portals. For non-API suppliers, the platform should support browser automation through Playwright, with human approval controls.

---

## 4. Management Problem

The current management challenge is not simply the absence of data. The problem is that the data is fragmented, difficult to interpret quickly, and not fully connected to workflows, reports, or strategic decision-making.

Common pain points include:

- Manual review of BigCommerce orders, products, and customers.
- Manual supplier order placement and portal checking.
- Incomplete or inconsistent product data.
- Large historical customer database that requires segmentation and reactivation.
- Financial reporting spread across QuickBooks, spreadsheets, and management-prepared reports.
- Difficulty quickly preparing board, investor, or lender reporting.
- Limited ability to connect marketing activity to revenue and customer behaviour.
- Difficulty identifying exceptions, low-margin SKUs, stalled orders, or supplier problems.
- Repeated manual report writing.
- Difficulty leveraging management experience consistently across a lean team.

---

## 5. Strategic Purpose

The strategic purpose of the LifeSupply Command Center is to maximize management capability and shareholder value while reducing the amount of manual operating effort required.

The platform should help management:

- Review daily operations.
- Investigate exceptions.
- Track product, customer, supplier, and margin performance.
- Improve customer reactivation.
- Optimize marketing campaigns.
- Improve financial reporting discipline.
- Produce high-quality reports.
- Identify operational risks and opportunities.
- Support capital raising and investor relations.
- Evaluate acquisition and partnership opportunities.
- Use AI to convert raw data into usable management insight.

---

## 6. Core Management Questions

The Command Center should help answer:

### Operations

- What orders came in today?
- Which orders are delayed?
- Which orders need supplier action?
- Which orders need human intervention?
- Which suppliers are causing fulfillment issues?
- What operational tasks are overdue?

### Product and Catalog

- Which products are selling?
- Which products have low or negative margins?
- Which products have missing images or poor descriptions?
- Which products should be featured?
- Which products should be removed, repriced, or improved?
- Which supplier costs have changed?

### Customers and Marketing

- Which customers are active, lapsed, or high-value?
- Which customers can be safely reactivated?
- Which campaigns are producing clicks, conversions, or sales?
- Which customer segments should be targeted next?
- What is the status of Mailchimp audiences, tags, and campaigns?

### Financial Management

- What is revenue by division, geography, channel, and period?
- What is gross profit and gross margin?
- What is operating income, EBITDA, or adjusted EBITDA?
- What is the cash position?
- What is accounts receivable and accounts payable?
- What are the major variances compared with prior period or budget?
- What should be included in monthly management reporting?

### Strategy

- What opportunities should management pursue?
- Which acquisition targets or supplier relationships are worth reviewing?
- What information is required for capital raising?
- What reporting should be prepared for investors or lenders?

---

## 7. Platform Vision

The long-term vision is a management operating system with the following characteristics:

- **Centralized:** One secure application for management information.
- **Granular:** Detailed product, customer, order, supplier, financial, marketing, and task data.
- **Integrated:** Connected to BigCommerce, QuickBooks, Mailchimp, GA4, supplier portals, OpenAI, and Claude.
- **Actionable:** Every insight can become a task, workflow, report, campaign, or management decision.
- **AI-assisted:** AI helps summarize, analyze, draft, and recommend.
- **Auditable:** Key actions, imports, AI outputs, approvals, and automation runs are logged.
- **Scalable:** The platform can grow from MVP dashboards into supplier automation, forecasting, investor reporting, and M&A workflows.
- **Secure:** Role-based access protects customer, financial, supplier, investor, and system data.

---

## 8. Success Criteria

The platform should be considered successful if it materially improves management’s ability to:

- Understand daily business performance.
- Reduce manual order and supplier processing effort.
- Improve reporting speed and quality.
- Identify revenue and margin opportunities.
- Reactivate customers in a controlled, compliant manner.
- Improve product data quality.
- Track tasks and accountability.
- Prepare better investor/lender/board materials.
- Use AI productively and safely.
- Scale management capability without a proportional increase in headcount.

---

## 9. Initial MVP Success Definition

The first MVP should prove the concept by delivering:

- Secure login.
- Role-based navigation.
- Executive dashboard.
- Normalized database.
- BigCommerce order/product/customer data structure.
- QuickBooks financial reporting structure.
- Task and exception management.
- AI daily management briefing.
- Mailchimp/customer reactivation dashboard.
- GA4 analytics dashboard.
- Basic report export.

The MVP does not need to fully automate supplier ordering, send campaigns, or push data back to external systems. Those features should be added after the platform has a stable data, permissions, and approval foundation.

