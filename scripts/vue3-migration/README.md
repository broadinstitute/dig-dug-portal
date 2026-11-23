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

## Page setup (Stage 1 item 2)

Vue 3 installs plugins on an app, not on `Vue`, so one module, `src/utils/pageSetup.js`, owns what every page installs
and how it mounts. On import it installs Vuex, BootstrapVue, its icons and VueCookies, imports `bootstrap.css` and
`bootstrap-vue.css`, and turns off `productionTip`. `mountPage(Template, options, plugins)` installs `plugins`, then
mounts `Template` with `options`. Vue 3 mounts inside `#app` and 2.7 replaces it, so `mountPage` mounts inside on both:
the page goes into a new `<div>` in the `#app` element, which gets `display: contents` and is renamed `page-root`. A page
may have its own `#app` (Papers/Research does), and the wrapper must not be a second one.

An entry imports `mountPage` first, because a store creates its `Vuex.Store` when it is imported, which needs Vuex:

```js
import { mountPage } from "@/utils/pageSetup";
import Template from "./Template.vue";
import store from "./store.js";

// @vue/component
mountPage(Template, { store });
```

- `// @vue/component` is eslint-plugin-vue's marker. Without it the lint does not check the entry.
- A new page calls `mountPage`, with the marker, and never `new Vue` or `Vue.use`. A plugin only that page needs goes in
  the third argument: `mountPage(Template, { store }, [VueCodemirror])`.
- `Vue.$cookies` has no Vue 3 equivalent: the app gets `$cookies`, the `vue` module does not. Import `VueCookies` from
  `vue-cookies`. Find the rest with `grep -rn 'Vue\.\$cookies' src`.

### Codemod

```bash
npm run codemod:page-setup -- [--root <dir>] [--dry-run]
```

In every `.vue` and `.js` file under `src/` it removes a top-level `Vue.use` of the four plugins, the assignment
`Vue.config.productionTip = false`, the two Bootstrap stylesheet imports, and the imports these leave unused. In every
entry (a `main.js`) it turns `new Vue({ ... }).$mount("#app")` into `mountPage(Template, { ... })` without `render`,
imports `mountPage` first, and writes the marker above the call. An entry that calls `mountPage` already is left as it
is, so a hand-written or hand-converted entry needs the marker by hand. Edits are text splices: comments (trailing ones
too) and line endings stay, and a second run changes nothing. Merge first: it needs `src/utils/pageSetup.js` under
`--root`.

Run it again after any merge of `master`, or of a `<portal>-main`. `npm run test:scripts` (`page-setup.tree.test.mjs`)
fails while it has something to convert, and for any file that uses Vue or one of the plugins without importing it.

The report has three lists for a person:

- Unresolved: an entry that mounts another way (an `el` option, a custom `render`, a second `new Vue`), or a component
  without one plain `<script>`. The file is not changed. Convert an entry by hand before its page is built, even if the
  page loses nothing: its store is stripped and creates its `Vuex.Store` before the entry could install Vuex.
- Left in place: any other install, with its line. It runs after `pageSetup.js`, and Vue ignores a second install of a
  plugin, options included: move the options there. A plugin of one page goes in the third argument of its `mountPage`.
  An import of a minified Bootstrap stylesheet is listed too: delete it, or its rules load twice.
- Pages that gain or lose something: the plugins and stylesheets that run when a page's files load, before and after.
  A gain is expected: every page now gets all of them, and gets them first, so a `Vue.component("b-...", X)` that ran
  before a later `Vue.use(BootstrapVue)` used to lose and now wins. A page that loses something has an unresolved entry.

Exit 0 when done (what it reports is not a failure), 1 when a file failed, 2 for a usage error or no `pageSetup.js`. A
file that does not parse, such as one with committed conflict markers, makes the run exit 1 and write nothing.

### compare-css

```bash
npm run e2e:baseline -- <ref>
npm run deploy
npm run tool:compare-css -- [--base dist-baseline] [--head dist]
```

Both sides are production builds, the only ones that link their CSS. `<ref>` is a commit from before your change. For
each page it joins the local stylesheets the page links, in link order, and compares the text:

- `same`: equal, however the files are split. `reordered`: the same top-level rules, in another order, and the report
  lists the rules that moved. `differs`: anything else, or a stylesheet it could not read. `missing`: one build only.
  Exit 0 if every page is `same`, 1 if any is not, 2 for a usage error, an unreadable page, or a side that is not a
  production build (no page links a stylesheet with a content hash). The cascade depends on the order, so `reordered` is
  for you to look at, not a pass.
- Scoped ids (`data-v-` and 8 hex digits) are masked. A production build hashes the component's path and source, so two
  checkouts never agree on a vendor component's id and every page would differ.

Against a baseline from before this change all 54 pages are `reordered` by exactly two rules of
vue-typeahead-bootstrap's `ListItem`, `a[data-v-…]:not(.disabled)` and `a.disabled[data-v-…]`. They moved from between
`bootstrap.css` and `bootstrap-vue.css` to after both. None of the rules they pass can match a typeahead item. Expect the
same pair on a portal. Anything else needs a look. The 5 pages of `vue.configPapers.js` are `reordered` by all four
vue-typeahead-bootstrap rules, from before `bootstrap.css` to after it; they share no property with a Bootstrap rule of
equal or higher specificity on the same element.

### Portal procedure for page setup

A portal that has not taken Stage 1 yet starts at Sync-point order (above) instead. Step 3 there is the merge of step 1
here.

On the portal's `vue3/<portal>` branch, from a clean working tree, so the output is committed alone:

1. Merge `dev/vue3`. In a conflicted file the codemod rewrote, take the portal's side (`git checkout --ours <file>`, then
   `git add <file>`). This drops every change `dev/vue3` made to the file, codemod output or not, and git then
   counts them as merged. So, before you commit, check `git log -p HEAD..dev/vue3 -- <file>` (the file's commits since
   the merge base) and re-apply by hand what is not codemod output. Commit the merge.
2. Run the earlier codemods first (sync-point order, then the template fixes): `lint-fix` finds `data: {...}` by
   `new Vue({...})`, which an entry stops having.
3. From a current `dev/vue3` checkout, read `npm run codemod:page-setup -- --root <portal checkout> --dry-run`, then run
   it without `--dry-run`. Commit its output alone.
4. Convert each Unresolved entry by hand and run it again. Settle each Left in place. Check that no page loses anything.
   Replace each `Vue.$cookies` the grep finds.
5. Compare the CSS of the portal's own site, before and after. `configs/vue.config.<Portal>.js` builds it, into
   `portals/<Portal>/`. A plain `npm run deploy`, and `e2e:baseline`, build the default config into `dist/`. `<before>`
   is the absolute path of a new worktree, for the branch as it was before step 1:

   ```bash
   git worktree add --detach <before> <commit before the merge>
   cd <before>
   npm ci
   VUE_CLI_SERVICE_CONFIG_PATH="$PWD/configs/vue.config.<Portal>.js" npm run deploy
   cd <portal checkout>
   npm ci
   VUE_CLI_SERVICE_CONFIG_PATH="$PWD/configs/vue.config.<Portal>.js" npm run deploy
   npm run tool:compare-css -- --base <before>/portals/<Portal> --head portals/<Portal>
   ```

   - `portals/<Portal>` is the config's `outputDir`. It is `portals/<Portal>/dist` on some portals, and `dist` when the
     config sets none.
   - A wrong config path is not an error: Vue CLI builds the default config instead.
   - Without a `package-lock.json`, run `npm install` in place of `npm ci`. If a build stops at
     `ERR_OSSL_EVP_UNSUPPORTED`, that branch's `deploy` does not set `NODE_OPTIONS`: put
     `NODE_OPTIONS=--openssl-legacy-provider` before `npm`.
6. Sweep the portal's own pages. This is required: the A/B of step 7 does not open them. Serve both builds, each command
   in a terminal of its own, from the portal checkout. Open every page of the config in both, and compare what renders.
   (`npm run preview:dir` will not do: it drops query strings.)

   ```bash
   npx serve -l 8080 -c "$PWD/e2e/serve.json" portals/<Portal>
   npx serve -l 8081 -c "$PWD/e2e/serve.json" <before>/portals/<Portal>
   ```

7. Check the pages of the default config with the development A/B (see compare-render). It can show a page whose entry
   imports its own stylesheet ahead of Bootstrap: the page now gets Bootstrap first. That is development now matching
   production, which links `chunk-vendors` first anyway.

## Template fixes (Stage 1 item 3)

Sixteen Vue 3 lint rules are at 0 on `dev/vue3`, and every fix still runs on Vue 2.7: two codemods, a render check
and hand fixes. `npm run lint:vue3` shows the counts.

### Codemods

```bash
npm run codemod:lint-fix -- --rule vue/no-deprecated-slot-attribute --rule vue/no-deprecated-slot-scope-attribute --rule vue/no-deprecated-data-object-declaration [--root <dir>] [--dry-run]
npm run codemod:declare-emits -- [--root <dir>] [--dry-run]
```

Both take ESLint from this checkout (so `--root` may be a portal without `node_modules`), splice text without
reformatting, and write nothing if a changed file no longer parses (exit 1). A second run changes nothing. Both
exit 2 for a usage error or a lint that cannot run.

`lint-fix` applies ESLint's own fix: `slot="x" slot-scope="s"` becomes `v-slot:x="s"`, a lone `slot-scope="s"`
becomes `v-slot="s"`, and `data: {...}` in the options of `new Vue({...})` becomes `data: () => ({...})`. It refuses
a rule whose fix writes Vue 3-only syntax (`.sync`, `beforeDestroy`) with exit 2. Two reshapes depend on how ESLint
8.57.1's fixer calls its `fix` predicate, so re-check after an ESLint upgrade.

It leaves some findings, which stay counted, for you:

- A component's `data: {...}` (`export default` of a `.vue` file, `Vue.extend`, `Vue.component`). 2.7 drops it with a
  warning, so the component has no data today, and a function would give it some. Delete it, or, if it was meant to
  hold data, write `data() { return {...}; }` and check the page.
- A slot name with a character outside `[\w-]`, such as `cell(name)`: write `<template v-slot:cell(name)="r">`.
- A `slot` on an element that is not a `<template>`, such as `<div slot="b">`: wrap it in
  `<template v-slot:b>...</template>`, which is how the 2.6+ syntax gives an element to a named slot. 2.7 renders the
  `<div>` with a `slot="b"` attribute and the wrapped one without it, so check that no CSS or script selects `[slot]`.
- A `<template slot>` that shares its slot with another template, or that is not directly in a component: write the
  `v-slot` form by hand.

`declare-emits` adds the events a component emits to `emits`, which 2.7 ignores. Vue 3 also binds a listener for an
undeclared event to the root element, so a native-named event such as `click` fires twice. Names are verbatim
(`click`, `update:regionViewArea`, `toggle-star-variant`). A new `emits` goes after `props`, else `components`, else
`name`, else first; an existing array gets the missing names. Its report lists two things for a person:

- Unresolved: a file it will not edit (object-form `emits`, a `.js` file, `<script setup>`, a spread in the
  options), or one that still has findings after `export default` declares every name: a second component in the
  file, such as a `Vue.extend({...})`, emits them, and the first run put the names on the wrong component. Add the
  listed names by hand, to the component that emits them, placed the same way. The exit code stays 0.
- Check by hand: a `$emit(` whose first argument is not a string literal, such as `$emit(eventName)`. Declare the
  names it can emit. A hit inside a comment is not a call.

Its other blind spot is an emit through an alias. The lint rule reads `this.$emit`, the template and a
`const x = this` alias, but not a `let` or `var` alias (`let self = this; self.$emit("name")`, as `LocusZoom.vue`
does) and not an emit through any other object. Find them from the repo root (single quotes, or the shell eats the
`\$`):

```bash
grep -rnoE '[A-Za-z_$][A-Za-z0-9_$]*\.\$emit\(' src | grep -vE 'this\.\$emit|EventBus\.\$emit|eventBus\.\$emit|\$parent\.\$emit|\$root\.\$emit'
```

On `dev/vue3` it finds only the two `self.$emit` calls in `src/components/lz/LocusZoom.vue`, both declared. Declare
the events of any other hit by hand, unless its component lists them already.

### compare-render

```bash
npm run tool:compare-render -- --base <ref> [--root <dir>] <file.vue> [<file.vue> ...]
```

It compiles each file's `<template>` with Vue 2.7 at `<ref>` and in the working tree, and compares the `render` and
`staticRenderFns` text. `same` means the two templates compile to the same render; `differs` prints both sides, as
it does for a side that does not compile or has no `<template>`. Exit 0 if every file is `same`, 1 if any differs, 2
for a usage error. It refuses `NODE_ENV=production`, where the 2.7 compiler drops compile errors.

It proves less than it seems. It compares compiled text, not the DOM, and it reads `<template>` only:

- `same` proves the template renders as before. It says nothing about an edit to a `<script>` (the `data` and `emits`
  codemods, `no-dupe-keys`, `require-valid-default-prop`), which it never reads.
- `differs` is not a failure when the compiled text changes and the DOM does not. That is every `v-if`/`v-for` split,
  every `.sync` rewrite, a duplicate-attribute fix, a `v-html` replacement, a bare `slot="x"` rewritten to
  `v-slot:x`, a stray end tag deleted between two text runs (the text node splits), and a template that moved into a
  `render()` option. The hand-fix list says what each rule should show. For these, render the VNode trees (adjacent
  text merged) where the bullet says so, and run the development A/B.
- Script-only edits have no compare-render result at all: use the development A/B, and for `no-dupe-keys` the check
  in its bullet.

The development A/B compares a development build of your tree with one of the base, page by page, and fails on a page
or console error the base lacks, a landmark that does not render, or a screenshot that changed. From a network
BioIndex accepts, after `npx playwright install chromium` once (`e2e/README.md` has the prerequisites and the
pitfalls), from the repo root:

```bash
npm run build
npm run e2e:baseline -- <base ref> --mode development
npx playwright test --project=chromium
```

`<base ref>` is a commit from before your change (`HEAD` while it is uncommitted). Both sides must be development
builds. It takes about ten minutes and covers the pages in `e2e/catalog.mjs`. It loads pages and does not click, so it
cannot prove a handler or an event name: for those, read the code, as the bullets say.

### Rules that wait for the Vue 3 switch

Three rules stay at their counts: their Vue 3 form is invalid on 2.7. They run as `eslint --fix` in the switch commit.

- `vue/no-deprecated-destroyed-lifecycle`: 2.7 has no `beforeUnmount` or `unmounted` option.
- `vue/no-v-for-template-key-on-child`: 2.7's compiler rejects a `key` on `<template v-for>`.
- `vue/no-deprecated-v-on-native-modifier`: without `.native`, 2.7 listens for a component event that never fires.

### Hand fixes

Each keeps what 2.7 renders today, unless its bullet says otherwise. Run `compare-render` on each template you edit and
read the result as the bullet says: `same`; `differs` with the DOM unchanged (then run the development A/B, see
compare-render); or not covered, a `<script>`-only edit (the A/B, or the check the bullet names).

- `vue/no-use-v-if-with-v-for` (2.7 runs `v-for` first, then `v-if` per item; keep that). compare-render:
  `differs`, DOM unchanged.
  - the condition does not use the loop variables: wrap in `<template v-if="cond">` and drop the `v-if`. The wrapper
    `<template>` carries only the `v-if`; the `v-for` stays on its element. A `<template v-for>` never gets a `key`
    on 2.7 (a `key` there is a compile error);
  - otherwise filter the source, `v-for="x in (src || []).filter((x) => cond)"`. Guard a plain property with
    `(src || [])`: 2.7 renders nothing for null, but `null.filter()` throws;
  - the body uses the index for more than `:key`: `v-for="[x, i] in (src || []).map((x, i) => [x, i]).filter(([x, i]) => cond)"`;
  - an object source: `v-for="[v, k] in Object.keys(src || {}).map((k) => [src[k], k]).filter(([v, k]) => cond)"`
    (the index only where the original alias had one).
- `vue/no-parsing-error`. compare-render: `same`, except where noted.
  - Write a bare `<` in text as `&lt;`.
  - A stray `</br>` becomes `<br />` and a stray `</p>` becomes `<p></p>`: 2.7 renders each as an element, so deleting
    it would drop one (`matkp-main` has a `</br>` in `src/portals/MATKP/views/Index/Template.vue`).
  - Delete any other stray end tag (`differs`, DOM unchanged, when it stood between two text runs: the text node
    splits), unless it is the template's only closer. The typo `</tempate>` is one, which 2.7 accepts, so fix the typo.
- `vue/valid-template-root`: an empty template renders an empty `<div>` on 2.7, so use `render(h) { return h("div"); }`.
  compare-render: `differs` (no `<template>` in the working tree), DOM unchanged.
- `vue/no-v-text-v-html-on-component`: use the native element and classes BootstrapVue 2.23 renders for the current
  props, keeping every other attribute (`<b-row>` is `<div class="row">`, `<b-badge pill>` is
  `<span class="badge badge-secondary badge-pill">`; read `node_modules/bootstrap-vue/src/components/`).
  compare-render: `differs`, DOM unchanged, so compare the rendered DOM.
- `vue/no-dupe-keys`: keep the declaration 2.7 resolves: it sets up `props`, then `methods`, `data`, `computed`; a
  later key in an object literal wins; a `props` array is read from the end, so delete the earlier of a name listed
  twice. Not covered (script only). To find which declaration 2.7 resolves, run a small script on
  `vue/dist/vue.common.dev.js` from the repo root, with the component's own options in place of the example (Vue's
  warnings name the clashing pair):

  ```bash
  node -e 'const Vue = require("vue/dist/vue.common.dev.js"); const Ctor = Vue.extend({ props: ["a"], data: () => ({ a: "data" }) }); console.log(new Ctor({ propsData: { a: "prop" } }).a)'
  ```
- `vue/no-deprecated-v-bind-sync`: `:x="y" @update:<event>="y = $event"`, with `<event>` the name the child really
  emits. 2.7's `.sync` listens for both the camelCase and the hyphenated name, so read the child's `$emit`
  (`b-table` emits `update:sortBy`, `CriterionFunctionGroup` emits `update:filter-list`). A member target uses
  `$set(obj, key, $event)`, as `.sync` does today. compare-render: `differs`, DOM unchanged. The A/B does not click, so
  the event name rests on reading the child's `$emit`.
- `vue/no-child-content`: delete the content inside a `v-html` element; 2.7 drops it. compare-render: `differs`, DOM
  unchanged.
- `vue/no-textarea-mustache`: `<textarea :value="expr"></textarea>`. The box now follows `expr` after the user types.
  compare-render: `differs`; the change in behaviour is the one named here.
- `vue/require-valid-default-prop`: `default: () => [...]`; each instance gets its own array. Not covered (script
  only).
- `vue/valid-v-html`: delete an empty `v-html=""`. compare-render: `differs`, DOM unchanged.
- `vue/no-duplicate-attributes`: keep the last, which is the value 2.7 uses. compare-render: `differs` (the base side
  reports a compile error for the duplicate), DOM unchanged.
- `vue/no-useless-template-attributes`: delete it, such as `center` in `<template center v-slot:cell(image)="r">`.
  compare-render: `same`.

### Portal procedure

On the portal's `vue3/<portal>` branch, from a clean working tree (`git status` shows nothing): neither codemod checks
for local changes, and step 3 commits their output alone.

1. Merge `dev/vue3`.
2. In a conflicted file the codemods rewrote, take the portal's side (`git checkout --ours <file>`, then
   `git add <file>`). This drops every change `dev/vue3` made to the file, codemod output or not, and git then
   counts them as merged. So, before you commit, check `git log -p HEAD..dev/vue3 -- <file>` (the file's commits since
   the merge base) and re-apply by hand what is not codemod output. Commit the merge.
3. From a current `dev/vue3` checkout, run both codemods with `--root <portal checkout>`. Commit their output alone.
4. Run the alias grep from the portal checkout. Declare its hits, and the Unresolved and Check by hand names, by hand.
5. Hand-fix the findings only the portal has, by the rules above.
6. In the portal checkout, `npm run lint:vue3 -- --base <commit before the merge>`: the 16 rules read 0 and none rose.

Never hand-merge codemod output: take the portal's side and run the codemods again. Never squash a branch that
carries it.
