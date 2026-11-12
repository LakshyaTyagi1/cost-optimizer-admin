# Cost Optimizer: system architecture, walkthrough and handover

Status: pointer
Last verified: 2026-11-12

The full document covers all three Cost Optimizer apps (customer app, this admin app and the backend): diagrams, step-by-step walkthroughs of the customer and admin journeys, the Master Inventory flow, the technology stack contract, the API map, open items and a handover checklist.

It lives in the customer app repository, next to the rest of the project documentation:

`docs/guides/system-architecture-walkthrough-and-handover.md` in `cost-optimization-platform`.

For this app, read section 4 (the admin journey) and section 5 (the Master Inventory integration) first. The repository guide is `AGENTS.md`.

When you add or change an admin screen, an endpoint it calls, or a route's capability status, update that document and `AGENTS.md` in the same pull request.
