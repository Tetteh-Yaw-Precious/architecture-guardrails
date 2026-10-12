# architecture-guardrails

> **In plain terms:** Every team agrees on rules about how their code should be written, and every
> team forgets them, because the next person to touch the code wasn't in the conversation where the
> rule was agreed. That's even more true when the next person is an AI assistant with no memory of
> last week. This skill turns a rule into something that physically breaks when you get it wrong.
> It's the difference between putting up a sign that says "mind the step" and rebuilding the step.

The rest of this page explains how it works and the two ideas worth taking even if you never
install it. You don't need to already know the tools to follow along.

## What am I looking at?

This is a **skill for AI coding agents** like Claude Code, Cursor, Codex, and Gemini CLI, the tools
that write code alongside you. A skill is a set of written instructions the agent reads and
follows. You install it once, and when a bug comes back for the third time, or a change gets
through every test and still breaks something, the agent uses this to turn that into a check that
can't be skipped.

## The problem it fixes

A codebase isn't really threatened by people not knowing things. It's threatened by **a long series
of forgetful sessions**, human or AI, each with no memory of what the last one decided.

A rule written down in a document is read once and then not again. A rule attached to something
that fails is unavoidable. So the skill has exactly one admission rule, and it's strict:

> **Nothing becomes a rule without a check that fails.**

A guardrail is three things bound together: a **contract** (what must be true, in one sentence),
**enforcement** (code that breaks when it isn't), and a **canonical example** (the exact file to
copy). Missing the middle one and it isn't a guardrail, it's a wish. Wishes are allowed, but they
get labelled as debt rather than dressed up as standards.

And every single one has to cite a **scar**: the actual thing that went wrong. If it hasn't hurt
yet, it isn't a rule yet. That's what keeps the whole set small enough that people still read it,
because a folder full of rules invented just in case is a folder nobody opens.

## Always take the strongest option you can afford

There are four ways to enforce something, and they are not equal.

| How strong | What it means | Use it when |
|---|---|---|
| **Impossible** | The wrong version doesn't exist to write. It won't even start up. | You can change the shape of the code so the mistake can't be expressed |
| **Breaks the build** | An automatic check refuses the change | You can write a check that fails |
| **Mentions it as you work** | Something nudges you in the moment | A human has to judge it, so a nudge is all you get |
| **Written down only** | **Debt.** A rule with nothing behind it | You genuinely can't automate it, so you say that plainly instead of pretending |

The first one beats the second every time. A check that guards the way a function is called is
really a placeholder for a function that couldn't be called wrongly in the first place. So when you
do write a check, the skill asks you to also write down the change that would make the check
unnecessary.

## The two ideas worth stealing even if you never install this

**A check sitting at zero problems looks exactly like a broken check.** You cannot tell them apart
by looking. So you test the check by breaking it on purpose: put the original bug back, watch the
check's own tests fail, then undo it and watch them pass. A count of zero means nothing until
you've seen the thing catch something.

**Documents rot, so the rule has to apply to the rulebook too.** An entry will happily go on saying
"enforced by `scripts/check-x`" for a year after that file was renamed or deleted, and now your
standards document is lying to everybody who reads it. The answer is a check on the folder itself,
which fails if an entry claims a check that doesn't exist, or is listed but missing, or two of them
share a number. The folder that enforces honesty has to be held honest.

## Start where the violations already are

If a rule is broken in forty places today, you don't need a cleanup project before you can adopt
it. Record the forty, and only refuse the forty-first. The number is allowed to go down on
somebody else's schedule and it is never allowed to go up. That's what lets a rule start working
this afternoon rather than after a sprint nobody will fund.

## What's in the box

There's a `templates/` folder with working code you copy, not pseudo-code you adapt:

| File | What it is |
|---|---|
| `README.md` | The rulebook's own front page, with the admission rule and the four strengths. Drop it in your docs folder. |
| `GR-EXAMPLE-tenant-ownership.md` | One complete worked example: making sure a request can only change a record that belongs to the customer making it. Being allowed to edit *a* thing is not the same as that thing being yours, and this is the near-universal first rule for any product serving more than one customer. |
| `checker.mjs` and its test | A skeleton check that counts problems, remembers today's number, and refuses to let it grow. Swap in your own rule. |
| `lint-guardrails-honest.mjs` and its test | The check on the rulebook. Add it the moment you have more than one rule. |

Both test suites run with nothing installed:

```bash
node templates/checker.test.mjs
node templates/lint-guardrails-honest.test.mjs
```

**Don't start from the templates.** Start from something that actually went wrong on your project.
If your product serves more than one customer, the ownership example is a safe first rule, because
that scar is nearly universal.

## Keeping the set alive

Every so often the skill asks you an awkward question: which of these rules actually fired this
quarter? A check that never fires is either ready to become impossible-by-design (make the mistake
unwritable, delete the words) or it's dead and should go. Keeping the list capped at six or eight
lines forces that choice instead of letting it grow quietly.

The richest source of new rules is an incident where **everything passed and the thing still
broke**. That names a blind spot, and a blind spot is the next check. These rules check structure,
not behaviour: passing them is necessary and never sufficient.

## Requirements

- An AI coding agent that supports the Agent Skills standard: Claude Code, Cursor (2.4+), Codex,
  Gemini CLI, or GitHub Copilot CLI.
- [Node](https://nodejs.org) if you want to run the included templates as-is. The ideas and the
  skill itself don't care what language your project uses.

## Install

| Agent | Where skills live |
|-------|-------------------|
| Claude Code | `~/.claude/skills/` (your home folder, used by every project) |
| Codex | `~/.agents/skills/` |
| Gemini CLI | `~/.agents/skills/` |
| GitHub Copilot CLI | `~/.agents/skills/` |
| Cursor (2.4+) | `.cursor/skills/` **inside the project** you want to use it in |

```bash
# Claude Code
git clone https://github.com/Tetteh-Yaw-Precious/architecture-guardrails.git \
  ~/.claude/skills/architecture-guardrails

# Codex, Gemini CLI, or Copilot CLI
git clone https://github.com/Tetteh-Yaw-Precious/architecture-guardrails.git \
  ~/.agents/skills/architecture-guardrails
```

Then say "we keep hitting this bug" or "add a guardrail for this" and it runs the loop.

## Companion skills

| Skill | How it relates |
|---|---|
| [`vertical-slice-matrix`](https://github.com/Tetteh-Yaw-Precious/vertical-slice-matrix) | Leaves you holding a count of how many copies of something exist. This skill is how you stop that count growing. |
| [`feature-cycle`](https://github.com/Tetteh-Yaw-Precious/feature-cycle) | The build loop. It calls this skill at its review step, when a rule that only lives in somebody's head deserves a check instead. |
| [`lifecycle-feature`](https://github.com/Tetteh-Yaw-Precious/lifecycle-feature) | Asks for two checks of exactly this kind: that nothing outside the one approved path changes a status, and that no status name is typed loose in a screen. |

## License

MIT.
