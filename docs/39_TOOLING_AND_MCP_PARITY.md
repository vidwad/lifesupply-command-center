# LifeSupply Tooling and MCP Parity

## Purpose

The unified Command Center repository now provides the compatible development and quality-assurance foundations requested for parity with the LLD Recovery Academy workflow. MCP servers are **developer-agent integrations**, not production website dependencies: they must stay in user-local agent configuration and must never be deployed with the public website, embedded in browser code, or committed with credentials.

## What was reviewed

The LLD implementation carries a strong content-provenance and quality gate pattern, uses 21st.dev-inspired interface components, and depends on TypeScript, formatting, Vitest, responsive visual review, and production-build checks. It does not contain a committed Playwright configuration or a committed 21st MCP credential. Therefore, the unified repository ports the reusable standards and test capability rather than copying a non-portable secret or unverified local connector configuration.

| Capability | Unified Command Center status | Owner action |
|---|---|---|
| Unit and contract tests | Available through `pnpm test` | Run for every functional change. |
| Type and lint checks | Available through `pnpm typecheck` and `pnpm lint` | Run before review or pull request. |
| Playwright public smoke tests | Added under `tests/e2e/` | Install browser binaries locally, then run against local or Vercel preview URLs. |
| Responsive visual review | Available through Playwright screenshots and the public preview | Review desktop and mobile before release. |
| 21st MCP | Credential-free template in `mcp/21st.mcp.json.example` | Add a personal/current 21st API key only to local agent config. |
| Vercel MCP | Task-level integration; never a deployed-site dependency | Use for deployment status, project settings, and logs. |
| Playwright MCP | Task-level integration; never a deployed-site dependency | Use for interactive browser verification or accessibility inspection. |

## Playwright

The project includes `playwright.config.ts` and public-site smoke tests. It intentionally does not auto-start a local web server because the Render Command Center needs database and authentication configuration. Run against either a fully configured local public mode or the Vercel preview.

```bash
# Install the repository's committed dependencies
pnpm install --frozen-lockfile

# One-time local developer browser setup; do not commit browser binaries
pnpm exec playwright install chromium

# Public Vercel smoke coverage
PUBLIC_SITE_BASE_URL=https://lifesupply-command-center-2ks6r71qy-vidwads-projects.vercel.app \
  pnpm test:public-e2e

# Target one viewport
PUBLIC_SITE_BASE_URL=https://lifesupply-command-center-2ks6r71qy-vidwads-projects.vercel.app \
  pnpm test:public-e2e --project=mobile-chrome
```

The smoke suite verifies that the corporate homepage renders, that the external Command Center login points to Render rather than the public Vercel host, and that principal corporate routes return successfully. It does not attempt to authenticate, submit a contact form, access internal dashboard data, or exercise database mutations.

## 21st MCP for Claude Code

21st’s current MCP is an HTTP server at `https://21st.dev/api/mcp` and requires a current personal or team API key. The official migration notes explain that the older Magic MCP was replaced by the unified 21st MCP and legacy Magic keys no longer work.[1]

For Claude Code, copy the template into a **user-local** MCP configuration location supported by the local Claude installation, add `API_KEY_21ST` only to the local shell or credential store, and never commit the resulting configured file.

```json
{
  "mcpServers": {
    "21st": {
      "url": "https://21st.dev/api/mcp",
      "headers": {
        "x-api-key": "${API_KEY_21ST}"
      }
    }
  }
}
```

Use 21st for component discovery, reference exploration, and generating isolated design alternatives. Before accepting generated output, reconcile it with the LifeSupply public design system, corporate disclosure rules, accessibility requirements, bundled approved assets, and the Render/Vercel deployment boundaries.

## Guardrails

> **Do not give an MCP server direct database access, production Render secrets, Vercel deployment tokens, or browser-visible credentials.**

Use the Command Center’s existing pull-request and approval process for code changes. Keep external MCP keys in local developer configuration. When a new provider is introduced, document its purpose, access scope, owner, rotation process, and whether it can affect production data.

## Claude Code quality gate

```bash
nvm use 24
pnpm install --frozen-lockfile
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
pnpm public-web:build
PUBLIC_SITE_BASE_URL=<Vercel-preview-URL> pnpm test:public-e2e
```

The Node 24 restoration-pass validation completed formatting, type checking, linting, and the full Vitest suite successfully, with 81 passing test files and 1,059 passing tests. The current `pnpm public-web:build` compiles successfully but fails when Next prerenders the pre-existing `/_global-error` route with a null `useContext` error. Treat that as a separate build-baseline defect to resolve before merge; do not bypass it by weakening the Vercel public build or moving database credentials to Vercel.

## Reference

[1] [21st MCP / Magic MCP migration and official setup](https://github.com/21st-dev/magic-mcp)
