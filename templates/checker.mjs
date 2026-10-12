#!/usr/bin/env node
/**
 * GR-00X: <one-line contract>.
 *
 * CONTRACT  <what must be true, one sentence>
 * SCAR      <the real incident/PR; no scar, no guardrail>
 * ESCAPE    `// gr-XXX-ok: <reason>` on the line above the offending code.
 * TIER 1    <the change that would make the wrong version impossible, retiring
 *            this linter, e.g. "require the tenant id in the repo signature">
 *
 * Baseline-ratcheted: records today's known violations so the rule adopts without
 * a big-bang cleanup, and fails only on NEW ones. Counts move one way.
 *
 *   node checker.mjs <root>            check (fails on anything new)
 *   node checker.mjs <root> --update   re-record after fixing some
 */
import { readdirSync, readFileSync, existsSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ESCAPE = /gr-XXX-ok:/

// THE ONE THING YOU WRITE per guardrail: return the violations in one file.
// Pure and exported so the self-test can mutation-test it without touching the fs.
// A violation is { file, line, key }; key is what the baseline is keyed by:
// stable across unrelated edits (e.g. `${file}::${symbol}`, never a line number).
export function findViolations(file, text) {
  const out = []
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    // EXAMPLE predicate: replace with your rule. Here: a TODO with no owner.
    if (/TODO(?!\()/.test(line) && !ESCAPE.test(lines[i - 1] ?? '')) {
      out.push({ file, line: i + 1, key: `${file}:TODO` })
    }
  })
  return out
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'vendor'].includes(name)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (/\.(ts|tsx|go|py|rb)$/.test(p)) yield p
  }
}

function main() {
  const root = process.argv[2] ?? '.'
  const update = process.argv.includes('--update')
  const BASELINE = new URL('./checker-baseline.json', import.meta.url).pathname

  const found = []
  for (const f of walk(root)) found.push(...findViolations(f, readFileSync(f, 'utf8')))
  const current = [...new Set(found.map(v => v.key))].sort()

  if (update) {
    writeFileSync(BASELINE, JSON.stringify({ keys: current }, null, 2) + '\n')
    console.log(`baseline recorded: ${current.length} known violation(s)`)
    return 0
  }
  if (!existsSync(BASELINE)) {
    console.log(`no baseline, record one with:  node ${process.argv[1]} ${root} --update`)
    return 0
  }

  const base = new Set(JSON.parse(readFileSync(BASELINE, 'utf8')).keys)
  const added = current.filter(k => !base.has(k))
  if (added.length) {
    console.error(`\n${added.length} NEW violation(s):`)
    for (const v of found.filter(v => added.includes(v.key))) console.error(`  ${v.file}:${v.line}`)
    console.error('\nFix it, or waive with the escape-hatch comment and a written reason.')
    return 1
  }
  const fixed = [...base].filter(k => !current.includes(k))
  if (fixed.length) console.log(`${fixed.length} fixed since the baseline; re-record with --update.`)
  console.log('ok: no new violations')
  return 0
}

// CLI only when invoked directly, so the self-test can import findViolations.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) process.exit(main())
