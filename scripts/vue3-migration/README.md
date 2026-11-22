# Vue 3 migration scripts

Codemods, reports and gates for the Vue 3 migration. Each tool describes itself in its header comment;
the unit tests run with `npm run test:scripts`.

## Sync-point order

The component registration codemods run in two phases: `register-components` (phase 1) gives every
file explicit `components: { ... }` registrations, and `unwrap-vue-component` (phase 2) then removes
the global `Vue.component(...)` registrations. Stage 1 is on `dev/vue3`, not `master`, so each portal
takes it on its `vue3/<portal>` branch (made from `<portal>-main`), in this order:

1. Merge `dev/vue3` into the portal up to the last phase 1 commit, `a80bf72f2` (`Stage 1: handle the
   five tags the codemod found no registration for (plan Task 7 rules)`), before the phase 2 output
   (`164eb14bf`, `Stage 1: unwrap Vue.component (unwrap-vue-component output)`).
2. Run phase 1 on the portal, `npm run codemod:register-components -- --root <portal checkout>` from
   a current `dev/vue3` checkout (the scripts' later fixes are only there), then its hand fixes and
   gates. Commit.
3. Merge the rest of `dev/vue3`, which brings phase 2 for `master`'s files. Run phase 2 the same way,
   `npm run codemod:unwrap-vue-component -- --root <portal checkout>`, then its hand fixes and gates.

Each phase refuses to run out of order. Phase 2 writes nothing until phase 1 is complete (ruling R2).
Phase 1 writes nothing once phase 2 output is in the tree: a component that is already
`export default { name: "x", ... }` no longer shows where it is registered, so its uses are
`phase-2-present` instead of being planned.

Step 1 needs a commit that has phase 1 but not phase 2, which is why the Stage 1 PR (#1343) was
merged with a merge commit. Never squash a branch that carries codemod output.

Phase 1 registers a component only where every page that renders the file loads that one component
under the name. A portal's own `Vue.component("x", Other)` beside `master`'s definition of `x` is a
second candidate, so a page that loads it keeps `Other` or is listed as `ambiguous` (ruling R17).

`npm run codemod:portal-dry-run` shows what both phases would do on every portal branch.
