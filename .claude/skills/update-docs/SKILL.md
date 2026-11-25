---
name: update-docs
description: Decide whether a code change needs a documentation update, and which document. Use after changing a route or its capability status, an API call, session storage, caches, currency or Data Dictionary rules, commands, or env vars. Skip for refactors, styling and wording no document quotes.
---

Follow `docs/optimizer-docs/security/AI_AGENT_SECURITY.md`: no secrets, `.env` values, real URLs or customer data in docs.

Document rules are in `docs/optimizer-docs/README.md`. The rule for when to update is in `AGENTS.md` (Change discipline).

## Workflow

1. Read the final diff. Ask: did a fact a reader relies on change (a route or its capability status, an API shape, session storage, query keys or invalidation, a currency or destructive-operation rule, a command or env var, agent rules)?
2. Check, do not assume: `grep -rn "<route, key, endpoint or phrase>" docs AGENTS.md CLAUDE.md`. A hit that is now false means update it. No hit and no changed rule means no update.
3. Skip behavior-preserving refactors, styling, wording no document quotes, bug fixes that restore documented behavior, and dependency or lint-only changes.
4. The home for a fact: route status, ownership, API and auth rules and invariants live in `AGENTS.md`. The full system walkthrough lives in the customer app repo (`docs/optimizer-docs/guides/system-architecture-walkthrough-and-handover.md` in `cost-optimization-platform`). State a fact once and link to it.
5. Edit in place and describe current behavior only, with no change log. Set `Last verified` only on a document re-checked against the code. Use `git mv` for moves and fix links. Never edit `history/`.
6. Changes to agent rules (`AGENTS.md`, `CLAUDE.md`, rules, skills, the security policy) are reviewed by a person.

## Output

Name the documents changed and the fact each now states, or write "No documentation update needed" and why. Never call a document current unless compared with the code.
