# Architecture Guardrails

A skill for turning a scar into a check that fails.

A codebase is not threatened by ignorance. It is threatened by **many amnesiac
sessions, human or AI, each with no memory of what the last one decided.** A rule
written in a doc is forgotten by the next session. A rule bound to a check that
fails is not.

## The admission rule

> **Nothing enters the standard without a check that fails.**

A guardrail is three things bound together, and two of them are not optional:

1. **Contract**: what must be true, in one sentence.
2. **Enforcement**: code that fails when it isn't.
3. **Canonical example**: the exact file to copy.

Missing the second one? It is a wish, not a guardrail. Wishes are debt. Label
them as debt or delete them.

And every guardrail cites a **scar**: the real incident or PR that caused it. If
it has not hurt yet, it is not a guardrail yet. This is the rule that keeps the
set small enough to stay alive, because a folder of speculative rules is a folder
nobody reads.

## Reach for the highest tier you can afford

| Tier | Means | Prefer when |
| --- | --- | --- |
| **1: Impossible** | The wrong version does not compile or does not exist to call | You can change a type, require an argument, or panic at boot |
| **2: Fails the gate** | A lint or check blocks the merge | You can write a checker that fails |
| **3: Prompted locally** | A hook surfaces it in the dev loop | Judgement is needed and only a nudge is possible |
| **4: Written only** | **Debt.** A doc rule with no check | You cannot automate it, so say so plainly rather than faking it |

Tier 1 beats a linter every time: a linter guarding a function signature is a
placeholder for a signature that cannot be called wrong. When you do build a
Tier 2 lint, write down the Tier 1 that would retire it.

## The two ideas worth stealing even if you never install this

**A check sitting at zero violations is indistinguishable from a broken check.**
So test the checker by mutation: reintroduce the bug into the checker itself and
watch its own test suite fail, then restore it and watch it pass. Ship fixtures
that pin both what it must catch and what it must not. A count of zero means
nothing until you have watched the thing catch something.

**Prose rots, so the folder needs the rule applied to itself.** An entry goes on
claiming "enforced by `scripts/check-x.mjs`" long after that file was renamed or
deleted, and now your standards document is lying to every session that reads it.
The fix is a **meta-guardrail** that fails when an index row has no entry file,
an entry is not indexed, an ID repeats, or a claimed enforcer does not exist. It
cannot judge staleness, but it kills the worst rot. The folder that enforces
honesty has to be enforced itself.

## Baseline, do not big-bang

If violations already exist, record them and gate only *new* ones. Counts move
one way. This is what lets a rule adopt today and shrink on somebody else's
schedule, instead of waiting for a cleanup sprint that never gets funded.

## Install

```bash
git clone https://github.com/Tetteh-Yaw-Precious/architecture-guardrails \
  ~/.claude/skills/architecture-guardrails     # personal, every project

git clone https://github.com/Tetteh-Yaw-Precious/architecture-guardrails \
  .claude/skills/architecture-guardrails       # project scope, shared with the team
```

For [Claude Code](https://claude.com/claude-code) and any harness that reads the
same format. No dependencies. The templates are plain Node with no packages, and
`SKILL.md` is language-agnostic.

## What is in `templates/`

| File | What it is |
| --- | --- |
| `README.md` | The guardrails index, tier table and admission rule. Drop it at `Docs/guardrails/README.md`. |
| `GR-EXAMPLE-tenant-ownership.md` | A complete worked guardrail: a handler must confirm a row belongs to the caller's tenant **before** mutating it, because route permission proves "may edit X in tenant A", not "this X is in tenant A". The right first guardrail for any multi-tenant app. |
| `checker.mjs` + `checker.test.mjs` | A baseline-ratcheted checker skeleton and its mutation-style self-test. Swap the `findViolations` predicate. |
| `lint-guardrails-honest.mjs` + `.test.mjs` | The meta-guardrail. Wire it in the moment you have more than one guardrail. |

Both test suites run with no install:

```bash
node templates/checker.test.mjs
node templates/lint-guardrails-honest.test.mjs
```

**Do not start from the templates alone.** Start from a scar you actually have.
If the project is multi-tenant, the tenant-ownership one is a safe first entry
because the scar is near-universal.

## Keeping the set alive

The skill tells an agent to audit periodically and ask which guardrails actually
**fired** this quarter. A Tier 2 lint that never fires is either ready to become
Tier 1 (make it impossible, delete the words) or dead (delete it). Cap the index
at six to eight lines so the choice is forced.

The richest source of new entries is an incident where **every gate passed and
the thing still broke**. That names a blind spot, and a blind spot is the next
check. Guardrails enforce structure: types, scoping, naming, spec freshness. They
do not verify behaviour. Green is necessary, never sufficient.

## Pairs with

[vertical-slice-matrix](https://github.com/Tetteh-Yaw-Precious/vertical-slice-matrix)
leaves you holding a count of duplicate implementations and a `Done when` clause
that reads `guardrail ratcheted`. This skill owns the mechanics of that ratchet,
so the count cannot get worse while nobody is looking.

## License

MIT.
