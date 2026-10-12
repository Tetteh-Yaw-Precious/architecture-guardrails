---
name: architecture-guardrails
description: Use when a bug recurs, when a green build shipped broken code, or when someone wants to stop a class of mistake from returning, to turn a scar into an enforced check (a "guardrail"), or to review, extend, or prune a Docs/guardrails/ set. Triggers on "add a guardrail", "we keep hitting this bug", "how do we stop this happening again", "make this impossible", "enforce X", "audit our guardrails". Portable across projects and languages.
---

# Architecture Guardrails

A guardrail protects a codebase from the thing that actually threatens it: **many
amnesiac sessions (human or AI), each with no memory of what the last one
decided.** A rule in a doc is forgotten. A rule bound to a check that *fails* is
not.

## The admission rule (never violate this)

> **Nothing enters the standard without a check that fails.**

A guardrail is three things bound together:

1. **Contract**: what must be true, in one sentence.
2. **Enforcement**: code that fails when it isn't.
3. **Canonical example**: the exact file to copy.

Missing #2? It is a wish, not a guardrail. Wishes are debt; put them in Tier 4
(written-only) and label them as debt, or delete them. **Never write a
speculative rule**: every guardrail cites a *scar*: the real incident or PR that
caused it. If it hasn't hurt yet, it isn't a guardrail yet.

## Enforcement tiers: always reach for the highest you can afford

| Tier | Means | Prefer when |
| --- | --- | --- |
| **1: Impossible** | The wrong version does not compile or does not exist to call | You can change a type / require an argument / panic at boot |
| **2: Fails the gate** | A lint/check blocks the merge (CI, or a pre-push hook if CI can't block) | You can write a checker that fails |
| **3: Prompted locally** | A hook surfaces it in the dev loop | Judgement is needed; only a nudge is possible |
| **4: Written only** | **Debt.** A doc rule with no check | You cannot automate it, so say so plainly; don't fake it |

Tier 1 beats a linter every time: a linter guarding a signature is a placeholder
for a signature that can't be called wrong. When you build a Tier-2 lint, note the
Tier-1 that would retire it.

## Adding a guardrail: the loop an agent runs

Run this when you spot a scar. Create one todo per step.

1. **Confirm the scar.** Find the recurrence: the same fix in ≥2 places (`git log`
   / grep), a repeated review finding, or a "green build, broken behaviour"
   incident. One occurrence is a fix; the third is a guardrail. Cite it.
2. **Write the contract** in one sentence. If you can't, the rule isn't sharp
   enough to enforce.
3. **Pick the tier.** Can the wrong version not compile (Tier 1)? Do that and
   stop, no words needed. Else write the smallest **check that fails** on the
   wrong version (Tier 2/3). If nothing can fail, it's Tier 4, so write the note and
   mark it debt.
4. **Baseline, don't big-bang.** If violations already exist, record them
   (`--update` writes a baseline file) and gate only *new* ones. Counts move one
   way. This lets the rule adopt today and shrink on someone else's schedule.
5. **Test the checker itself: by mutation.** A check sitting at "0 violations" is
   indistinguishable from a broken check. Reintroduce the bug into the checker and
   watch its test suite fail; restore and watch it pass. Ship fixtures that pin
   both what it must catch and what it must not.
6. **Escape hatch with a written reason.** A greppable inline comment
   (`// gr-XXX-ok: <reason>`), so exceptions stay visible instead of someone
   deleting the rule.
7. **Document + index.** One entry doc (contract, scar, enforcement, escape hatch,
   the Tier-1 that would retire it). Add one line to the index. Keep the index to
   ~6–8 lines; if it grows, promote something to Tier 1 (needs no words) or delete
   a dead one.
8. **Wire it in.** Add to the local gate (pre-push) and CI, and to the one-command
   `verify`. Add the checker's own test to the test-of-checkers suite.

## How AI improves this system, itself

This skill is the memory: any future session, in any project, invokes it on a
scar and runs the loop above. Beyond that, an agent actively *improves* the set:

- **Mine scars from signal, not opinion.** New guardrails come from evidence:
  `git log` showing one fix copied across modules, a reviewer flagging the same
  shape twice, CI going red on the same rule, or an incident where every gate
  passed and the thing still broke. That last one is the richest: it names a
  **blind spot**, which becomes a new check or an honest Tier-4 note.
- **Promote and prune: the set must stay small and live.** Periodically audit:
  which guardrails *fired* this quarter? A Tier-2 lint that never fires is either
  ready to become Tier-1 (make it impossible, delete the words) or dead (delete
  it). A blind spot revealed by an incident is the next entry. The cap forces the
  choice.
- **Distrust green.** Guardrails enforce *structure* (types, scoping, naming,
  spec freshness). They do not verify *behaviour*. When a change passes every gate,
  that is necessary, not sufficient, so an agent still runs it against real data
  (integration tests, a real DB, a golden-path click-through). Every "green but
  broken" is a lesson the set should absorb.
- **Keep the checkers honest.** Re-mutation-test a checker after any edit; a count
  of zero means nothing until you've watched it catch something.
- **Guard the guardrails.** The folder is prose, and prose rots: an entry keeps
  claiming "enforced by X" after X is renamed or deleted. So apply the admission
  rule to the folder itself: a **meta-guardrail** (`lint-guardrails-honest`) that
  fails when an index row has no entry file, an entry isn't indexed, an ID
  repeats, or a claimed file-enforcer doesn't exist. It cannot judge staleness,
  that's the prune loop's job, but it kills the worst rot (a doc lying about a
  check that's gone). The folder that enforces honesty must be enforced for it.

The system compounds because each scar the project survives becomes a check the
next session cannot skip, and the skill teaches every session to add the next one
the same way.

## Templates (copy these)

In this skill's `templates/` directory:

- `README.md`: the guardrails index + tier table + admission rule. Drop into
  `Docs/guardrails/README.md`.
- `GR-EXAMPLE-tenant-ownership.md`: a complete, fill-in-the-blanks guardrail (the
  cross-tenant ownership check: a handler must confirm an entity belongs to the
  caller's tenant *before* mutating it: route permission proves "may edit X in
  tenant A", not "this X is in tenant A"). The canonical first guardrail for any
  multi-tenant app.
- `checker.mjs` + `checker.test.mjs`: a baseline-ratcheted checker skeleton and
  its mutation-style self-test. Adapt the `findViolations` predicate.
- `lint-guardrails-honest.mjs` + `.test.mjs`: the **meta-guardrail** that keeps
  the folder from rotting: verifies the index, entries, and claimed enforcers all
  line up. Wire it in the moment you have more than one guardrail.

Start a new project's set with the tenant-ownership guardrail if it's
multi-tenant; otherwise start from whatever scar you actually have. Never start
from the templates alone, because a guardrail with no scar is a wish.
