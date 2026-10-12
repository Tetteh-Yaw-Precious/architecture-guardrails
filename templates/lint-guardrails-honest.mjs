#!/usr/bin/env node
/**
 * GR-010: the guardrails folder tells the truth.
 *
 * CONTRACT  Every index row links a real entry file, every entry file is in the
 *           index, IDs are unique, and every enforcer a guardrail CLAIMS (a
 *           script/hook path in its "Enforced by" cell) actually exists in the
 *           repo. A guardrail may not advertise a check that isn't there.
 *
 * SCAR      The guardrails folder is subject to the exact disease it cures: a
 *           document drifting from reality. A renamed or deleted checker leaves a
 *           GR-*.md claiming "Tier 2, enforced by X" while X is gone: a Tier-4
 *           wish wearing a Tier-2 badge. This check turns the admission rule back
 *           on the folder itself.
 *
 * ESCAPE    None meaningful, because a lie about enforcement is never intended. Fix the
 *           doc or restore the enforcer.
 *
 * LIMIT     Verifies file-shaped enforcers exist; cannot judge whether a make
 *           target or "boot panics" prose is real (those are skipped), and does
 *           not (yet) assert the enforcer is wired into a gate. Pairs with the
 *           human prune loop for staleness.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const DIR = 'Docs/guardrails'

// A backticked enforcer token points at a file if it has a path separator or a
// script extension. `make swagger-check`, `pnpm lint`, `typecheck:ratchet` do not.
const isFileLike = t => t.includes('/') || /\.(mjs|py|sh|go|ya?ml)$/.test(t)

export function analyze({ rows, entryFiles, trackedPaths }) {
  const problems = []
  const paths = trackedPaths.join('\n')
  const idOf = f => (f.match(/^(GR-\d+)/) || [])[1]

  const seen = new Set()
  const linked = new Set()
  for (const r of rows) {
    if (seen.has(r.id)) problems.push(`duplicate index id ${r.id}`)
    seen.add(r.id)
    if (!entryFiles.includes(r.linkFile))
      problems.push(`${r.id}: index links ${r.linkFile}, which does not exist`)
    else linked.add(r.linkFile)
    for (const e of r.enforcers.filter(isFileLike)) {
      // A tracked path must END WITH the token (so `lint-x.mjs` matches
      // `scripts/lint-x.mjs`, `cmd/lint-y` matches `packages/api/cmd/lint-y/...`).
      const ok = new RegExp(`(^|/)${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/|$)`, 'm').test(paths)
      if (!ok) problems.push(`${r.id}: claims enforcer \`${e}\` , no such file in the repo`)
    }
  }
  for (const f of entryFiles) {
    if (!linked.has(f)) problems.push(`entry ${f} is not listed in the index`)
  }
  return problems
}

function parseRows(readme) {
  const rows = []
  for (const line of readme.split('\n')) {
    if (!/^\|\s*\[GR-\d+\]/.test(line)) continue
    const id = line.match(/GR-\d+/)[0]
    const linkFile = (line.match(/\]\(([^)]+)\)/) || [])[1]
    const cells = line.split('|').map(c => c.trim()).filter(Boolean)
    const enforcers = [...cells[cells.length - 1].matchAll(/`([^`]+)`/g)].map(m => m[1])
    rows.push({ id, linkFile, enforcers })
  }
  return rows
}

function main() {
  const readme = readFileSync(`${DIR}/README.md`, 'utf8')
  const rows = parseRows(readme)
  const entryFiles = readdirSync(DIR).filter(f => /^GR-\d+.*\.md$/.test(f))
  // Tracked + untracked-not-ignored, so a brand-new checker (not yet committed)
  // still counts as existing.
  const trackedPaths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)

  const problems = analyze({ rows, entryFiles, trackedPaths })
  console.log(`GR-010  guardrails honesty: ${rows.length} indexed, ${entryFiles.length} entries`)
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`)
    for (const p of problems) console.error(`  ${p}`)
    console.error('\nFix the doc, restore the enforcer, or delete the dead entry.')
    return 1
  }
  console.log('  ok: index, entries, and enforcers all line up')
  return 0
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) process.exit(main())
