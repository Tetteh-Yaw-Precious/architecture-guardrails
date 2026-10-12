#!/usr/bin/env node
/**
 * Self-test for checker.mjs.
 *
 * MUTATION DISCIPLINE: each fixture below was validated by reintroducing the bug
 * into findViolations() and watching this suite fail, then restoring it and
 * watching it pass. A checker sitting at "0 violations" is indistinguishable from
 * a broken one until you have watched it correctly catch something, so pin BOTH
 * what it must catch and what it must NOT.
 */
import { findViolations } from './checker.mjs'

let failures = 0
const check = (name, cond) =>
  cond ? console.log(`  ok   ${name}`) : (failures++, console.error(`  FAIL ${name}`))

// Must CATCH the violation.
{
  const v = findViolations('a.ts', 'const x = 1 // TODO drop this\n')
  check('catches a bare TODO', v.length === 1 && v[0].line === 1)
}

// Must NOT flag a clean file (guards against a checker that flags everything).
{
  const v = findViolations('b.ts', 'const y = 2\n')
  check('passes a clean file', v.length === 0)
}

// Must respect the escape hatch (waived with a written reason on the line above).
{
  const v = findViolations('c.ts', '// gr-XXX-ok: tracked in JIRA-123\nconst z = 3 // TODO later\n')
  check('honours the escape hatch', v.length === 0)
}

// The key must be stable (baseline-friendly): same key regardless of line moves.
// Read the key defensively: a predicate that returns nothing must FAIL here, not
// crash the suite on [0] and skip whatever assertions come after it.
{
  const a = findViolations('d.ts', '// TODO one\n')[0]?.key
  const b = findViolations('d.ts', '\n\n// TODO one\n')[0]?.key
  check('key is stable across line shifts', a !== undefined && a === b)
}

if (failures) {
  console.error(`\n${failures} test(s) failed`)
  process.exit(1)
}
console.log('\nall checker tests passed')
