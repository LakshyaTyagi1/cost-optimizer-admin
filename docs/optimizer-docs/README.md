# Documentation Index

Status: current
Last verified: 2026-11-25

Documentation for the Cost Optimizer **admin** application. It follows the same layout as the customer app (`cost-optimization-platform`, `docs/optimizer-docs/`). The repository guide is [`AGENTS.md`](../../AGENTS.md). When a document and the code disagree, the code wins.

## Where things live

| Folder      | What it holds                                                                                       | Kept up to date? |
| ----------- | --------------------------------------------------------------------------------------------------- | ---------------- |
| `security/` | The mandatory AI agent security policy.                                                             | Yes              |
| `guides/`   | Pointer to the system architecture, walkthrough and handover, which lives in the customer app repo. | Yes              |
| `history/`  | Finished plans, kept for context only.                                                              | No, historical   |

The customer app also has `architecture/`, `features/`, `reference/` and `qa/` folders, and a `docs/others/` folder with the handover and project status. This repo creates a folder when its first real document is written, so none are empty placeholders.

## Documents

- [AI Agent Security Policy](security/AI_AGENT_SECURITY.md): mandatory security rules for every AI agent and workflow. Imported by `CLAUDE.md`.
- [System architecture, walkthrough and handover](guides/system-architecture-walkthrough-and-handover.md): pointer to the full document in the customer app. Read its section 4 (the admin journey) and section 5 (the Master Inventory integration) first.
- [Scalable structure task plan](history/cost-optimizer-admin-scalable-structure-task-plan.md): the phased refactor plan (historical).

## Keeping them healthy

1. When to update a document is in `AGENTS.md` (Change discipline). The customer app's `docs/optimizer-docs/README.md` has the full change-to-document table and document rules.
2. Every document starts with a `Status:` line (`current`, `implemented`, `plan`, `pointer`, `historical`) and a `Last verified:` or `Last updated:` date. Change the date only after re-checking the content against the code.
3. Finished plans move to `history/` with `git mv` and are marked `historical`. Fix links in the same change.
4. Name files in lowercase kebab-case inside a topic folder, not in the `docs/optimizer-docs/` root. State each fact in one place and link to it.
5. Never put secrets, tokens, real URLs or user data in a document.
