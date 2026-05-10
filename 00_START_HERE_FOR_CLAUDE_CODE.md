# 00 — Start Here for Claude Code

**Purpose:** Initial prompt to use inside Claude Code after placing this document package in the repository root.

---

## Initial Claude Code Prompt

Please read the root `CLAUDE.md`, `README.md`, and every document in `/docs`.

After reading, do not start coding immediately. First provide:

1. A concise summary of your understanding of the LifeSupply Command Center project.
2. The proposed application architecture.
3. The proposed repo structure.
4. Any major technical assumptions that need to be locked before coding.
5. A step-by-step implementation plan for Phase 0 and Phase 1 only.
6. The first safe coding tasks you recommend.

Important constraints:

- Build a desktop-first web application.
- Use Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, and Prisma unless you identify a clear reason to modify the stack.
- Build role-based access from the beginning.
- Treat QuickBooks as the accounting source of truth.
- Treat BigCommerce as a source system for e-commerce data.
- Treat the Command Center as the normalized management reporting, workflow, and AI intelligence layer.
- Do not hardcode credentials.
- Do not build supplier automation before the base platform and approval workflows exist.
- Do not create destructive database migrations without review.
- Start with a clean, professional management dashboard shell and mock data before live integrations.

After the summary and plan are approved, scaffold the project and build Phase 0.

