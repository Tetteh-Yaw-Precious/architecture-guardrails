#!/usr/bin/env node
/**
 * Tests for GR-010 (scripts/lint-guardrails-honest.mjs). Each fixture validated by
 * mutation: the relevant check was removed from analyze() and the suite watched
 * to fail, so a green run means the checker actually catches drift.
 */
import { analyze } from './lint-guardrails-honest.mjs'

let failures = 0
const check = (name, cond) =>
  cond ? console.log(`  ok   ${name}`) : (failures++, console.error(`  FAIL ${name}`))

const tracked = ['scripts/lint-real.mjs', 'packages/api/cmd/lint-x/main.go', '.husky/pre-push']

// Clean: rows ↔ entries match, file enforcers exist, prose enforcers ignored.
{
  const p = analyze({
    rows: [{ id: 'GR-001', linkFile: 'GR-001-a.md', enforcers: ['lint-real.mjs', 'make swagger-check'] }],
    entryFiles: ['GR-001-a.md'],
    trackedPaths: tracked,
  })
  check('clean folder passes', p.length === 0)
}

// A row linking a missing entry file.
{
  const p = analyze({
    rows: [{ id: 'GR-001', linkFile: 'GR-001-gone.md', enforcers: [] }],
    entryFiles: [],
    trackedPaths: tracked,
  })
  check('catches an index row with no entry file', p.some(x => /does not exist/.test(x)))
}

// An entry file that no index row lists.
{
  const p = analyze({
    rows: [],
    entryFiles: ['GR-002-orphan.md'],
    trackedPaths: tracked,
  })
  check('catches an unindexed entry file', p.some(x => /not listed in the index/.test(x)))
}

// A claimed enforcer that does not exist.
{
  const p = analyze({
    rows: [{ id: 'GR-003', linkFile: 'GR-003-c.md', enforcers: ['scripts/deleted.mjs'] }],
    entryFiles: ['GR-003-c.md'],
    trackedPaths: tracked,
  })
  check('catches a claimed-but-missing enforcer', p.some(x => /no such file/.test(x)))
}

// Duplicate ids.
{
  const p = analyze({
    rows: [
      { id: 'GR-004', linkFile: 'GR-004-d.md', enforcers: [] },
      { id: 'GR-004', linkFile: 'GR-004-d.md', enforcers: [] },
    ],
    entryFiles: ['GR-004-d.md'],
    trackedPaths: tracked,
  })
  check('catches a duplicate id', p.some(x => /duplicate index id/.test(x)))
}

// Prose enforcers (no path, no extension) are not treated as files.
{
  const p = analyze({
    rows: [{ id: 'GR-005', linkFile: 'GR-005-e.md', enforcers: ['gin panics at boot', 'pnpm lint'] }],
    entryFiles: ['GR-005-e.md'],
    trackedPaths: tracked,
  })
  check('ignores prose/make enforcers', p.length === 0)
}

if (failures) {
  console.error(`\n${failures} GR-010 test(s) failed`)
  process.exit(1)
}
console.log('\nall GR-010 tests passed')
