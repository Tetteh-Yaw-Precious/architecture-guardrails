# Architecture Guardrails

Rules that protect this codebase from the thing that actually threatens it:
**many amnesiac sessions, each with no memory of what the last one decided.**

## The admission rule

> **Nothing enters this standard without a check that fails.**

A guardrail is three things bound together:

1. **Contract**: what must be true, in one sentence
2. **Enforcement**: the code that fails when it isn't
3. **Canonical example**: the exact file to copy

Missing #2? It is a wish, not a guardrail. Wishes go in the backlog (Tier 4) or
get deleted.

## Enforcement tiers

| Tier                     | Means                                                        |
| ------------------------ | ------------------------------------------------------------ |
| **1: Impossible**       | The wrong version does not compile or does not exist to call |
| **2: Fails the gate**   | A lint rule blocks the merge (CI or pre-push)                |
| **3: Prompted locally** | A hook or script surfaces it in the dev loop                 |
| **4: Written only**     | **Debt.** Promote it or delete it.                           |

## Rules for this folder

- **Every guardrail has a scar.** Cite the incident or PR that caused it. No
  speculative rules.
- **Cap: ~6–8 entries.** If the list grows, something gets promoted to Tier 1
  (and needs no words) or deleted.
- **This file is the index.** One line per entry. Content lives in the entries.
- **Every enforcement has an escape hatch** that requires a written reason, so
  exceptions stay greppable instead of causing someone to delete the rule.
- **Structural gates are necessary, not sufficient.** They enforce types,
  scoping, naming, not behaviour. A change touching auth, tenancy, money, or a
  user-facing flow is not done until it has been run against real data.

## Index

| ID     | Contract                                                              | Tier | Enforced by                          |
| ------ | -------------------------------------------------------------------- | ---- | ------------------------------------ |
| GR-001 | _(your first guardrail, start from a scar, not this template)_       | ?    | `scripts/lint-...`                   |

<!-- Copy a row per guardrail. Start with tenant-ownership if this app is
     multi-tenant (see GR-EXAMPLE-tenant-ownership.md). -->
