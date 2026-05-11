# Start Here for Claude Code - Batch 2

**Project:** LifeSupply Command Center  
**Document status:** Post-MVP / advanced buildout documentation package  
**Prepared:** May 10, 2026  
**Primary audience:** Claude Code, developers, technical leads, product owner

---

## Purpose of This Batch

This Batch 2 package extends the original MVP documentation set for the LifeSupply Command Center. It is intended to be added to the same repository after the first documentation package has been installed.

Batch 1 established the business context, product requirements, architecture, database schema, integrations, security model, MVP plan, and UI/UX direction.

Batch 2 defines the advanced buildout after the MVP stage, including:

- AI features and guardrails.
- Supplier browser automation and human-in-the-loop workflows.
- Management, financial, board, investor, and operating reports.
- Deeper financial management requirements.
- Data governance and audit logging.
- Development standards.
- Testing and QA.
- Deployment and environment operations.
- Phase 2 automation roadmap.
- Phase 3 strategic growth, investor relations, capital raising, and M&A roadmap.

---

## Installation Instructions

Copy the contents of this package into the project root so that the new documents sit inside the existing `/docs` folder.

Expected structure after installation:

```text
lifesupply-command-center/
  CLAUDE.md
  README.md
  docs/
    01_PROJECT_OVERVIEW.md
    02_PRODUCT_REQUIREMENTS_DOCUMENT.md
    03_TECHNICAL_ARCHITECTURE.md
    04_DATABASE_SCHEMA.md
    05_INTEGRATION_MAP.md
    06_SECURITY_AND_PERMISSIONS.md
    07_MVP_IMPLEMENTATION_PLAN.md
    08_UI_UX_SPECIFICATION.md
    09_AI_FEATURES_AND_GUARDRAILS.md
    10_BROWSER_AUTOMATION_AND_SUPPLIER_WORKFLOWS.md
    11_REPORTING_REQUIREMENTS.md
    12_FINANCIAL_MANAGEMENT_REQUIREMENTS.md
    13_DATA_GOVERNANCE_AND_AUDIT_LOGGING.md
    14_DEVELOPMENT_STANDARDS.md
    15_TESTING_AND_QA_PLAN.md
    16_DEPLOYMENT_AND_ENVIRONMENT.md
    17_PHASE_2_AUTOMATION_PLAN.md
    18_PHASE_3_STRATEGIC_GROWTH_PLAN.md
```

Also review `CLAUDE_APPENDIX_BATCH_2.md`. It contains text that can be appended to the existing root `CLAUDE.md` file once the MVP is complete and the project is ready for post-MVP work.

---

## Claude Code Prompt to Use After Installing Batch 2

Paste the following into Claude Code after copying these files into the repo:

```text
Please read the existing project documentation and the new Batch 2 documentation before making any code changes.

Start by reading:
- CLAUDE.md
- README.md
- docs/01_PROJECT_OVERVIEW.md through docs/08_UI_UX_SPECIFICATION.md
- docs/09_AI_FEATURES_AND_GUARDRAILS.md through docs/18_PHASE_3_STRATEGIC_GROWTH_PLAN.md

Then provide:
1. A concise summary of your understanding of the current MVP scope and post-MVP roadmap.
2. A list of assumptions that need confirmation before implementing Phase 2.
3. A recommended post-MVP implementation sequence.
4. The first 5 technical tickets you would implement after MVP stabilization.
5. Any conflicts, gaps, or inconsistencies you see in the documentation.

Do not write code yet. Do not modify files until I approve the Phase 2 plan.
```

---

## Important Instruction

Do not use Batch 2 as permission to build everything immediately. Batch 2 is the roadmap for what happens after the MVP is validated, stabilized, and reconciled against source systems.

The correct progression is:

```text
MVP build
  -> MVP stabilization
  -> data quality and governance
  -> Phase 2 controlled automation and advanced reporting
  -> Phase 3 strategic growth, investor, and M&A features
```

Supplier automation, AI action workflows, investor reports, M&A modules, and external write-backs must remain controlled, logged, and approval-based.
