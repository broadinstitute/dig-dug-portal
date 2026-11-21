# Vue 3 migration scripts

Codemods, reports and gates for the Vue 3 migration. Each tool describes itself in its header comment;
the unit tests run with `npm run test:scripts`.

## Sync-point order

The component registration codemods run in two phases: `register-components` (phase 1) gives every
file explicit `components: { ... }` registrations, and `unwrap-vue-component` (phase 2) then removes
the global `Vue.component(...)` registrations. When `master` is merged down into a portal branch, run
them on the portal in this order:

1. Merge `master` into the portal up to the last phase 1 commit (`Stage 1: handle the five tags the
   codemod found no registration for`), before the phase 2 output (`Stage 1: unwrap Vue.component`).
2. Run phase 1 on the portal, `npm run codemod:register-components -- --root <portal checkout>` from
   a current `master` checkout, then its hand fixes and gates. Commit.
3. Merge the rest of `master`, which brings phase 2 for `master`'s files. Run phase 2 the same way,
   `npm run codemod:unwrap-vue-component -- --root <portal checkout>`, then its hand fixes and gates.

Each phase refuses to run out of order. Phase 2 writes nothing until phase 1 is complete (ruling R2).
Phase 1 writes nothing once phase 2 output is in the tree: a component that is already
`export default { name: "x", ... }` no longer shows where it is registered, so its uses are
`phase-2-present` instead of being planned.

Step 1 needs a `master` commit that has phase 1 but not phase 2. If the Stage 1 branch is squashed
when it merges, there is no such commit.

`npm run codemod:portal-dry-run` shows what both phases would do on every portal branch.
