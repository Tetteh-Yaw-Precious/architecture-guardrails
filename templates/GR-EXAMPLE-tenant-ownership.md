# GR-00X: Verify tenant ownership before mutating

**Contract.** A handler that takes an entity id from the path and mutates that
entity must confirm the entity belongs to the caller's tenant **before** the
write. Route permission proves _"may delete products in tenant X"_. It does not
prove _"this product is in tenant X"_.

**Tier 1 where possible** (the unscoped signature does not exist to call);
**Tier 2** lint holds the line while the last unscoped methods migrate.

## The scar

_(Fill in the real one. Template example: the same cross-tenant write bug fixed in
three modules (products, categories, inventory) each time by adding a tenant
check in the handler AFTER the write had already committed. A caller with
permission on tenant A could modify tenant B's row by id; the response was 404 but
the change persisted. Fixed three times without writing the rule down is why this
entry exists.)_

## The shape to copy: put the scoping IN the query

```
// Tier 1: the tenant id is a required argument; the unscoped Delete does not exist.
func (r *Repo) Delete(ctx context.Context, id, tenantID ID) (int64, error) {
    res := db.WithContext(ctx).
        Where("id = ? AND tenant_id = ?", id, tenantID).
        Delete(&Model{})
    return res.RowsAffected, res.Error   // 0 => not found OR not yours, do not distinguish
}
```

Return rows-affected. **Zero means "does not exist" _or_ "not yours", and the
caller must map both to NotFound**: a distinct Forbidden confirms the row exists
in someone else's tenant and leaks its existence to a prober.

Where the entity is owned indirectly (no `tenant_id` column), join through the
parent: `WHERE id = ? AND parent_id IN (SELECT id FROM parents WHERE tenant_id = ?)`.

**Do not** copy the check-then-act shape (`load by id; if row.TenantID != caller
{ 404 }; then mutate`): two round trips, and the mutation stays callable without
the check. It works, you'll see it, it is the bug's favourite disguise.

## Enforcement

- **Tier 1:** change the repository signature to require the tenant id and delete
  the unscoped method. Now the wrong version cannot be written.
- **Tier 2 (`scripts/lint-tenant-ownership.*`):** flag handler funcs that read an
  id from the path, call a mutating verb (Update/Delete/Cancel/…), and have no
  ownership comparison before it. Baseline the known ones; gate new ones.

## Escape hatch

`// gr-tenant-ok: <reason>` above the mutating call, for genuinely tenant-less
records (platform-level rows, the tenant row itself). The reason is required so
exceptions stay greppable.

## Tests

For every historical leak, a regression test that **reverts to the pre-fix query
and is watched to fail**, then restored and watched to pass. That is the only
proof the test guards the WHERE clause. Prefer query-level scoping over
handler-level checks partly because it is testable without touching the app's
wiring.
