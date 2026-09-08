# Claude Code kickoff — Stage 1 only

Paste the following into Claude Code from the local checkout of `vidwad/lifesupply-command-center`. The instruction package is saved on branch `docs/lifesupply-website-staged-development`; after its PR is merged, the same files are on main. Read the branch copy if needed; do not assume a nested CLAUDE.md loads itself.

```text
Work in the existing repository vidwad/lifesupply-command-center.

Begin Stage 1 only of the LifeSupply corporate website and operating-site integration plan. Do not begin Stage 2 or implement website runtime changes in this session.

FIRST LOCATE THE INSTRUCTIONS
1. Inspect git status and preserve unrelated/uncommitted work. Verify the origin repository and fetch origin without changing the current worktree.
2. Read the root CLAUDE.md and these files:
   - docs/website-development/CLAUDE.md
   - docs/website-development/STATUS.md
   - docs/website-development/KICKOFF_PROMPT.md
3. If these files are not yet on origin/main, the instruction package is on origin/docs/lifesupply-website-staged-development. Read it with git show, for example:
   git show origin/docs/lifesupply-website-staged-development:docs/website-development/CLAUDE.md
   Read the root CLAUDE.md and STATUS.md from that branch as well. Use the guide as this task's brief without merging the instructions PR or modifying the current worktree just to read it.
4. Read the guide's required repository documents, especially the Phase 11 controls, public-site consolidation/cutover/handoff, tooling, and brand audit. The existing Command Center controls remain in force.

OBJECTIVE
Prepare the development foundation for LifeSupplyHealth.com and its connections to:
- https://www.lifesupplyclinics.com/
- https://lifesupply.ca/
- https://wellmartmedical.com/
- https://balkowitsch.com/

LifeSupply Clinics concerns clinic development, construction/fit-outs and equipment, not an assumed network of patient-care clinics. Preserve the red/black/white corporate identity, existing public website foundation, storefront checkout/accounts, and external protected Render Command Center login. Metabolic kits are configurable supply pathways; distinguish starter equipment, consumable refills, clinic procurement and proposed contracted services.

EXECUTE STAGE 1
Create claude/website-stage-01-baseline from current origin/main in a clean branch or isolated worktree. Do not overwrite unrelated work. Since Stage 1 writes evidence only, it may use the unmerged instruction branch as a read-only task reference; report that dependency in the PR. Do not merge or deploy anything.

Audit current routes, templates, source content, assets, public-host protection, publication/inquiry implementation, scripts, deployment configuration and relevant open PRs. Read the public sites and approved business sources where accessible. Record missing sources and contradictory facts precisely.

Produce:
- docs/website-development/BASELINE_AUDIT.md
- docs/website-development/SOURCE_REGISTER.md
- docs/website-development/ROUTE_AND_ACTION_MAP.md
- docs/website-development/IMPLEMENTATION_BACKLOG.md
- An updated docs/website-development/STATUS.md (initialize from the instruction branch's tracker if it is not yet on main; preserve any newer status evidence).

Map every route and all four brands specified in the guide, with audience, template, source/status, primary action, destination, stage, dependencies and acceptance criteria. Identify current versus proposed services, document restrictions, financial/metric conflicts, kit readiness, contact owners and external-site access needs. Do not invent missing facts or copy unverified current-role claims from legacy pages.

Use the repository-pinned Node/pnpm versions. Run the existing baseline format, type, lint, unit, public-build, normal-build and public-browser checks where prerequisites permit. Report pass/fail/blocked/not-run honestly. Record baseline defects and reproductions; do not make unrelated runtime or infrastructure fixes during this documentation stage. Finish all unblocked documentation before asking about a concrete blocker.

DELIVERY AND STOP
Validate the documentation and diff. Commit only Stage 1 files, push the branch, and open a PR against main if possible. Explain any dependency on the instruction PR. Do not merge, alter live sites, apply migrations, send external messages, or start Stage 2.

Return the stage summary, branch, commit, PR, evidence files, actual check results, unresolved decisions and a proposed Stage 2 prompt. Update the status to Ready for Review only when the Stage 1 deliverables are complete; distinguish blocked validation. Stop after this handoff.
```

## Later stage prompt template

Use after the prior stage is reviewed and its required changes are available on main:

```text
Continue the LifeSupply website workstream in vidwad/lifesupply-command-center.
Read root CLAUDE.md, docs/website-development/CLAUDE.md, STATUS.md and the prior stage evidence. Inspect current main and relevant PRs; preserve unrelated work.

Execute Stage [N] only: [stage title]. Follow its allowed scope, dependencies, acceptance criteria and existing release controls. Do not repeat completed stages. Complete all unblocked implementation and verification; document any specific remaining blocker or required decision.

Create a dedicated branch from current origin/main, implement the stage, run required checks and relevant browser review, update STATUS.md and STAGE_[NN]_EVIDENCE.md, commit, push and open a review PR. Do not merge, launch, or enable external actions without their existing required authorization. Report exactly what was implemented versus proposed, tested, deployed or externally blocked.

Finish with the structured handoff and the next stage's suggested prompt. Stop; do not automatically begin another stage.
```
