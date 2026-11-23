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

## Template fixes (Stage 1 item 3)

Sixteen Vue 3 lint rules are at 0 on `dev/vue3`, and every fix still runs on Vue 2.7: two codemods, a render check
and hand fixes. `npm run lint:vue3` shows the counts.

### Codemods

```bash
npm run codemod:lint-fix -- --rule vue/no-deprecated-slot-attribute --rule vue/no-deprecated-slot-scope-attribute --rule vue/no-deprecated-data-object-declaration [--root <dir>] [--dry-run]
npm run codemod:declare-emits -- [--root <dir>] [--dry-run]
```

Both take ESLint from this checkout (so `--root` may be a portal without `node_modules`), splice text without
reformatting, and write nothing if a changed file no longer parses (exit 1). A second run changes nothing.

`lint-fix` applies ESLint's own fix: `slot="x" slot-scope="s"` becomes `v-slot:x="s"`, a lone `slot-scope="s"`
becomes `v-slot="s"`, and a root `data: {...}` becomes `data: () => ({...})`. It refuses a rule whose fix writes
Vue 3-only syntax (`.sync`, `beforeDestroy`) with exit 2. Two reshapes depend on how ESLint 8.57.1's fixer calls its
`fix` predicate, so re-check after an ESLint upgrade. A slot name with a character outside `[\w-]`, such as
`cell(name)`, is left and stays counted: write `<template v-slot:cell(name)="r">` by hand.

`declare-emits` adds the events a component emits to `emits`, which 2.7 ignores. Vue 3 also binds a listener for an
undeclared event to the root element, so a native-named event such as `click` fires twice. Names are verbatim
(`click`, `update:regionViewArea`, `toggle-star-variant`). A new `emits` goes after `props`, else `components`, else
`name`, else first; an existing array gets the missing names. Its report lists two things for a person:

- Unresolved: a file it will not edit (object-form `emits`, a `.js` file, `<script setup>`, a spread in the
  options). Add the listed names by hand, placed the same way. The exit code stays 0.
- Check by hand: a `$emit(` whose first argument is not a string literal, such as `$emit(eventName)`. Declare the
  names it can emit. A hit inside a comment is not a call.

Its other blind spot is an emit through an alias, such as `self.$emit("name")`: the lint rule reads only
`this.$emit` and the template. Find them from the repo root (single quotes, or the shell eats the `\$`):

```bash
grep -rnoE '[A-Za-z_$][A-Za-z0-9_$]*\.\$emit\(' src | grep -vE 'this\.\$emit|EventBus\.\$emit|eventBus\.\$emit|\$parent\.\$emit|\$root\.\$emit'
```

On `dev/vue3` it finds only the two `self.$emit` calls in `src/components/lz/LocusZoom.vue`, both declared. Declare
any other hit by hand.

### compare-render

```bash
npm run tool:compare-render -- --base <ref> [--root <dir>] <file.vue> [<file.vue> ...]
```

It compiles each file's `<template>` with Vue 2.7 at `<ref>` and in the working tree, and compares the `render` and
`staticRenderFns` text. `same` means 2.7 renders the same; `differs` prints both sides, as it does for a side that
does not compile or has no `<template>`. Exit 0 if every file is `same`, 1 if any differs, 2 for a usage error. It
refuses `NODE_ENV=production`, where the 2.7 compiler drops compile errors. Two `differs` are false: a stray end tag
removed between two text runs (it splits or merges text nodes, the DOM is the same), and a file whose template moved
into a `render()` option. Check those by rendering the VNode trees, with adjacent text merged.

### Rules that wait for the Vue 3 switch

Three rules stay at their counts: their Vue 3 form is invalid on 2.7. They run as `eslint --fix` in the switch commit.

- `vue/no-deprecated-destroyed-lifecycle`: 2.7 has no `beforeUnmount` or `unmounted` option.
- `vue/no-v-for-template-key-on-child`: 2.7's compiler rejects a `key` on `<template v-for>`.
- `vue/no-deprecated-v-on-native-modifier`: without `.native`, 2.7 listens for a component event that never fires.

### Hand fixes

Each keeps what 2.7 renders today, unless its bullet says otherwise. Run `compare-render` on what you edit: `same`
is the proof, and a `differs` should be a change listed here.

- `vue/no-use-v-if-with-v-for` (2.7 runs `v-for` first, then `v-if` per item; keep that):
  - the condition does not use the loop variables: wrap in `<template v-if="cond">` and drop the `v-if`. Never put a
    `v-for` or `key` on a `<template>`;
  - otherwise filter the source, `v-for="x in (src || []).filter((x) => cond)"`. Guard a plain property with
    `(src || [])`: 2.7 renders nothing for null, but `null.filter()` throws;
  - the body uses the index for more than `:key`: `v-for="[x, i] in (src || []).map((x, i) => [x, i]).filter(([x, i]) => cond)"`;
  - an object source: `v-for="[v, k] in Object.keys(src || {}).map((k) => [src[k], k]).filter(([v, k]) => cond)"`
    (the index only where the original alias had one).
- `vue/no-parsing-error`: write a bare `<` in text as `&lt;`. Delete a stray end tag, unless it is the template's
  only closer: the typo `</tempate>` is one, which 2.7 accepts, so fix the typo.
- `vue/valid-template-root`: an empty template renders an empty `<div>` on 2.7, so use `render(h) { return h("div"); }`.
- `vue/no-v-text-v-html-on-component`: use the native element and classes BootstrapVue 2.23 renders for the current
  props, keeping every other attribute (`<b-row>` is `<div class="row">`, `<b-badge pill>` is
  `<span class="badge badge-secondary badge-pill">`; read `node_modules/bootstrap-vue/src/components/`).
  `compare-render` says `differs` here, so compare the rendered DOM.
- `vue/no-dupe-keys`: keep the declaration 2.7 resolves: it sets up `props`, then `methods`, `data`, `computed`; a
  later key in an object literal wins; a `props` array is read from the end, so delete the earlier of a name listed
  twice. If unsure, build the component with `Vue.extend(options)` and `new Ctor({ propsData })` and read the key.
- `vue/no-deprecated-v-bind-sync`: `:x="y" @update:<event>="y = $event"`, with `<event>` the name the child really
  emits. 2.7's `.sync` listens for both the camelCase and the hyphenated name, so read the child's `$emit`
  (`b-table` emits `update:sortBy`, `CriterionFunctionGroup` emits `update:filter-list`). A member target uses
  `$set(obj, key, $event)`, as `.sync` does today.
- `vue/no-child-content`: delete the content inside a `v-html` element; 2.7 drops it.
- `vue/no-textarea-mustache`: `<textarea :value="expr"></textarea>`. The box now follows `expr` after the user types.
- `vue/require-valid-default-prop`: `default: () => [...]`; each instance gets its own array.
- `vue/valid-v-html`: delete an empty `v-html=""`.
- `vue/no-duplicate-attributes`: keep the last, which is the value 2.7 uses.
- `vue/no-useless-template-attributes`: delete it, such as `center` in `<template center v-slot:cell(image)="r">`.

### Portal procedure

On the portal's `vue3/<portal>` branch:

1. Merge `dev/vue3`.
2. In a conflicted file the codemods rewrote, take the portal's side (`git checkout --ours <file>`). Commit the merge.
3. From a current `dev/vue3` checkout, run both codemods with `--root <portal checkout>`. Commit their output alone.
4. Run the alias grep from the portal checkout. Declare its hits, and the Unresolved and Check by hand names, by hand.
5. Hand-fix the findings only the portal has, by the rules above.
6. In the portal checkout, `npm run lint:vue3 -- --base <commit before the merge>`: the 16 rules read 0 and none rose.

Never hand-merge codemod output: take the portal's side and run the codemods again. Never squash a branch that
carries it.
