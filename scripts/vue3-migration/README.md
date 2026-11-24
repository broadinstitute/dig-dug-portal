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
6. In the portal checkout, `npm run lint:vue3 -- --base <commit before the merge>`: the 16 rules of this section read 0
   and none rose. The config counts one more rule, `vue/no-side-effects-in-computed-properties`, which is not one of the
   16: after the template fixes alone it only has to stay level or fall, and it reads 0 at the end of the Vue 3
   semantics procedure.

Never hand-merge codemod output: take the portal's side and run the codemods again. Never squash a branch that
carries it.

## Vue 3 semantics (Stage 1 item 7)

Some code compiles and runs on both Vue versions and means something else on Vue 3, with no error: a space that is
dropped, a clone that throws, a chart that is made reactive, a computed property that runs at another moment. Every fix
here runs on Vue 2.7 too, with the same output unless the commit that made it says otherwise. One tool counts six
patterns, the lint finds a seventh, and one codemod writes the spaces:

| Pattern | What goes wrong on Vue 3 | Fix |
| --- | --- | --- |
| `structuredClone` | Vue 3 wraps component and store data in a Proxy, and `structuredClone` throws a `DataCloneError` on it. | `cloneDeep`, below. |
| `chartObjects` | Vue 3 makes what a component stores reactive, deeply. An amCharts chart overflowed the stack there and stopped the page update partway. | `markRaw`, below. |
| `computedParams` | Vue 2.7 passes the instance to a computed function, Vue 3 (3.4 and later) the previous value. | Read `this.x`, not the parameter. |
| `extraScripts` | A Vue 3 single-file component has one plain `<script>` block, and a file with two does not compile. | Delete every block but the last: 2.7 uses the last one, so the component does not change. |
| `unknownTags` | Vue 3 does not know `<center>`, `<font>` and the like as HTML tags, so it looks for a component of that name. | A `div` or `span` with the same style. `<center>` also centres block children, so look at the page. |
| `inlineSpaces` | Vue 3 drops whitespace-only text at the start or end of an element, where 2.7 renders a space: "up 3.06" runs together as "up3.06". | `explicit-spaces`, below. |
| `vue/no-side-effects-in-computed-properties` (lint) | A computed that sets data or sorts in place runs when its value is first read, and Vue 3 renders slot content lazily, in the child, so that moment moves. A region table whose computed sorted its rows in place came out unsorted. | The rules below. |

### The scan

```bash
npm run tool:semantics-scan -- [--root <dir>] [--json]
```

It reads the `.vue` and `.js` files under `src/` of this checkout, or of `--root <dir>`, which may be a portal without
`node_modules`. The report is markdown: a count for each pattern above, then every hit as `file:line` with its code,
then the files that did not parse. `--json` prints the hits of each pattern and `errors` instead. It writes no file.
Exit 0 whatever it finds, so it is a report and not a gate; 2 for a usage error or a `--root` without a `src/` folder.
A file it cannot parse is listed under Errors, and the rest of the tree is still scanned. A template that is not plain
HTML is not scanned and is listed too. On `dev/vue3` every pattern reads 0.

A 0 is not a proof. What it does not see:

- `structuredClone`: only a direct call, with or without `window.` or `globalThis.` before it. Not
  `self.structuredClone`, an alias (`const copy = structuredClone`), `rows.map(structuredClone)` or
  `structuredClone?.(x)`: `grep -rn structuredClone src` shows those.
- `chartObjects`: only the objects it names, found by their import: `Network` and `DataSet` (vis-network, vis-data),
  `create` of amCharts core, `generate` of c3, `populate` and `DataSources` of locuszoom, and the classes of
  `src/components/lz/panels/`. Another chart library, or one that is a global, is not seen. The creating expression has
  to be the value that is assigned (`this.x = new Network(...)`, or a property of the object `data()` returns): not one
  that goes through a local (also one that `data()` returns), a helper function, an alias of `this` (`const self =
  this`), a ternary, `||=` or an array element, and of a chained assignment only the last target. It does not check that
  `x` is declared in `data()`. Objects of d3, Plotly, IGV or CodeMirror on `this` are not in its list: read those by
  hand.
- `computedParams`: only a function written in the `computed` object; a spread brings in what it brings.
- `unknownTags`: only a fixed list of obsolete tags (`center`, `font`, `tt`, `big`, `strike`, `marquee`, `acronym` and
  their kind), and not a tag that a component is named after. Any other unknown tag is a component, which
  `vue/no-undef-components` finds.
- `inlineSpaces`: only `span a strong em b i small sup sub u code label b-badge b-link` and a `<template>` with a
  condition or a loop that fills no slot, not `b-button` or another component. It lists every side that is not known to
  be safe, so some hits need no space: a needless `{{ " " }}` changes nothing, and a missed one is a visible defect. It
  takes the first or last child of a `<transition>`, a `<slot>` or a component as the edge of a block, and a block
  element beside it as a line break, even when that element has a `v-if`. If the wrapper or the neighbour renders no
  block there, the space is lost and not counted.
- Computed side effects are not in the scan. The lint counts them, but not those through an alias (see below).

### Computed side effects

`vue/no-side-effects-in-computed-properties` is an error in `eslint-vue3.cjs`, so `npm run lint:vue3` counts it and the
ratchet fails when it rises. It reads 0 on `dev/vue3`. Fix a finding by one of three rules, and check who else reads
what the computed used to change:

1. Sorting or reversing `this.x` or store data: sort a copy, `[...this.x].sort(...)`. If another computed, a method or
   the template read `x` and relied on that order, make it read the sorted computed instead.
2. Writing `this.y = ...`: if only this computed reads `y`, make `y` a local. If others read it, make `y` a computed of
   its own, or move the write to a watcher with `immediate: true`.
3. Changing an item of props or store data (`item.group = ...`): map to new objects, and check that nothing else reads
   the added fields from the original.

Three more points:

- A write that has to stay goes into a watcher with `immediate: true`, never into `created`. The computed ran again
  whenever what it read changed, and `created` runs once. An immediate watcher runs when the component is set up, before
  `created`, in the order the watchers are declared, so its write is in place before anything draws.
- A getter must not throw. On 2.7 a watcher whose getter throws keeps only what it read before the throw, and one whose
  source is a computed that throws keeps nothing and never runs again. The region plots had this: a gene symbol in the
  region search made `searchingRegion` throw inside the watched `plotsSetup`, and zoom and new rows did nothing until
  the plot was mounted again. `plotsSetup` now reads what `searchingRegion` reads, so the throw happens in the handler,
  and the next search sets the plot up again.
- The lint rule reads `this.x`, `this.$store.state...` and `const self = this`. It does not read a local that holds
  `this.x` or store data (`const rows = this.rows; rows.sort()`), a callback parameter
  (`this.rows.forEach((r) => { r.group = 1; })`) or `Object.assign(this.obj, ...)`. Those stay uncounted:
  "Checks for the Vue 3 switch" lists the ones in this tree.

### markRaw for chart objects

Use it where a component stores an object that a chart or graph library made: the `chartObjects` hits of the scan, and
any other library the scan does not know.

```js
import { markRaw } from "vue";

this.chart = markRaw(c3.generate(config));
```

Vue 2.7 exports `markRaw`. It makes `observe()` skip the object, so 2.7 leaves its properties as they are, and Vue 3
does not wrap it in a Proxy. Wrap the object where it is created: `this.network = markRaw(new Network(...))`, and
`nodes: markRaw(new DataSet(...))` in `data()`. An object that is already raw and is handed on needs nothing (the
LocusZoom panels' `this.plot = this.$parent.plot`).

The condition: nothing reactive reads the object's own properties. Before you wrap, list every read of a property of the
object in a template, a computed property or a watcher; a read in a method is fine. After `markRaw`, such a read no
longer runs again when the property changes, on 2.7 as on Vue 3 (assigning a new object to the property that holds it
still does). If there is one, stop and decide that case by itself: `markRaw` changes what the page shows.

### cloneDeep

`structuredClone(x)` becomes `cloneDeep(x)`, with `import { cloneDeep } from "@/utils/lodashUtils";`. It is a plain
recursive copy and gives the same result on both versions. `clone-deep.test.mjs` (in `npm run test:scripts`) runs the
shipped file.

It keeps: nested arrays and objects, as new containers; `Date`, `Map` (its keys too) and `Set`; typed arrays and
`DataView`s, as copies of their bytes; `null`, `undefined` and primitives. A 2.7 observed object clones to plain data,
without `__ob__`. A function stays the same function, where `structuredClone` would throw.

It does not keep: a class instance (the copy is a plain object with the own enumerable properties, so the prototype,
methods and getters are gone); two properties that share one object (they get two copies); a cycle (it overflows the
stack); a `RegExp`, an `Error`, an `ArrayBuffer` or a boxed primitive (each becomes `{}`); symbol keys and
non-enumerable properties.

So check what each call clones before you replace it. Plain data from BioIndex or the store is the rule. A class
instance, a cycle or a shared object is a case for a decision, not for a mechanical replacement.

### explicit-spaces

```bash
npm run codemod:explicit-spaces -- [--root <dir>] [--dry-run]
```

It finds the places the `inlineSpaces` count lists and replaces the whitespace at the edge of the element with
`{{ " " }}`, which gives the same text on both versions: 2.7 renders that whitespace as one space, and Vue 3 keeps an
interpolation. When the whitespace holds a line break, the break moves inside the braces, so no line of the file moves.
This is a leading space, before and after:

```html
up<span>
    {{ x }}
</span>
```

```html
up<span>{{
    " " }}{{ x }}
</span>
```

Only the template block of a `.vue` file is edited, as text splices: bytes outside the spaces stay, line endings
included. A second run changes nothing. It leaves alone the content of `<pre>` and of elements with `v-text`, `v-html`
or `v-pre`. Its report lists the spaces it adds, then Left, which is for you: a place where an interpolation would
change what 2.7 renders, such as a comment between the whitespace and the interpolation (2.7 drops a whitespace-only
piece at the edge of an element). It does not edit those and the scan still counts them: decide each by hand.

Before it writes anything it checks every changed file: the SFC parses as before, the text outside the template is
unchanged, and the template compiles on 2.7 to the same render, with each added interpolation read as the space it is.
If a file fails, or its template does not compile on 2.7 to begin with, it lists the file under Failed and no file is
written in that run. Exit 0 when done (Left is not a failure), 1 when a file failed, 2 for a usage error, a root without
`src/`, or `NODE_ENV=production`, where the 2.7 compiler drops the compile errors the checks need. Commit its output
alone, as for the other codemods.

### Checks for the Vue 3 switch

These are what the lint and the scan cannot show. They change nothing on 2.7. Whoever switches a build to Vue 3 compares
the pages named here on both builds.

#### Watcher declaration order

On 2.7 the watchers of a component that are triggered together run in the order they are declared in `watch`. Three
places rely on it, and each has a comment that says so:

- `CriterionGroupTemplate`: `filtersToDefine` (immediate) completes the parent's filters with the definitions of their
  fields. It is declared before `filterListInternal` and `criterion`, whose watchers use the definitions. If the order
  changed, an extra `input` event is possible. Look at the pages with criterion filters.
- `ResearchRegionPlot`: `plotsSetup` (immediate) is declared first, so that the watchers of `staredVariants` and
  `starItems`, which draw, find the plots set up.
- `MultiRegionPlot`: `ldData`, then `plotsSetup` (immediate), then the drawing watchers (`hoverPos`, `staredVariants`,
  `starItems`). `ldData` comes first so that the LD state set at creation is sent to the other sections, and the drawing
  watchers come last so that they find the plots set up.

2.7 always runs them in declaration order. On Vue 3.5 watchers that are triggered through props keep that order, but a
trigger that comes from the store and fires first runs its watcher first. In both region plots `staredVariants` (it reads
the store's `pkgDataSelected`) is such a trigger, and so is `hoverPos` in `MultiRegionPlot`. A draw with the new
association data and the old LD data or positions is therefore possible there: look at the region plots after a new
region, a zoom and a star.

#### Rows that get a new key

On Vue 3 a key added to a row is reactive, so it runs again every computed that enumerates rows (`Object.entries`,
`Object.keys`, `for...in`, a spread). The two region plots read their rows through `toRaw` for that reason, and a new
plot that enumerates rows in a computed has to do the same. The GEM table's `tableContent` (the last row of the table
below) adds keys to the store's rows, so computeds elsewhere that enumerate the same rows are run again by it, not only
`tableContent` itself.

#### Computeds that change shared data through an alias

The lint does not count these: each sorts, or adds fields to, rows or lists of the store or of a prop through a local
variable or a callback parameter. They were found by reading the computeds of `src/`, following locals, callback
parameters, destructuring, loops, the component's own methods and the functions of `src/utils/`. Not covered: methods
that come from a mixin or a spread (`...uiUtils`), what a child does with a prop in its methods or watchers, and
functions of npm packages. The computeds that the commit "computed side effects through aliases" fixed are not listed;
these were left as they are.

In every row the danger on Vue 3 is the same: a slot or a child evaluates the computed at another moment than 2.7 does,
so another reader sees the data before or after the change, with no error. And a reactive write inside a computed, to
data it reads, can evaluate it again. At the switch, compare the pages of a row on both builds: the order of the rows and
options named in it, and the text of the fields it changes. A row with no page is reached by no page of the default
`vue.config.js`; a portal may load it.

35 computeds in 21 rows. Fields such as `group` are on the store's rows unless the row says otherwise.

| File (under `src/`) | Computed | What it changes, and who else reads it | Pages |
| --- | --- | --- | --- |
| `components/PhenotypeSignalBarChart.vue`, `components/PhenotypeSignalInGroup.vue` | `topAssociationsGrouped`, `topAssociations`, `topAssociationsFiltered` (in each) | `group` (as is in the first, in capitals in the other two) and `description` on the rows that come in as the prop `phenotypes`. The three overwrite each other's `group`, and `ClumpedVariantsTable` shows `item.group` of the same rows | region |
| `components/PhenotypeSignal.vue`, `components/PhenotypeSignalMixed.vue`, `components/PhenotypeSignalMultiple.vue` | `topAssociationsGrouped` and `topAssociations` in each; also `topAssociationsFiltered` in `Mixed`, `topAssociations2nd` in `Multiple` | as the row above | none |
| `views/Phenotype/main.js` | `c2ctData` | `originalBiosample` and `biosample`. There are two row sets, switched by `selectedAnnotation`: coming back to rows already formatted makes the formatted name the "original". The download reads `originalBiosample`, and so does the computed, when it runs again on rows it already changed | phenotype |
| `views/Phenotype/main.js` | `ancestryAnnotations` | sorts `annotations.data` by p-value when no ancestry is chosen and fewer than 20 rows are significant. `Template.vue` reads the same array for its options, so their order follows | phenotype |
| `views/Papers/Research/main.js` | `multiSectionsSearchParameters` | on `sectionConfigs` (the result of another computed): flags the sections' parameters, pushes them into `"search parameters"` again on every evaluation, and replaces `values: "kp phenotypes"` with the list (the first time only, so the list keeps the order of that moment). Read by `rawSearchParameters`, `pageParams`, the section configs and itself | research |
| `components/PigeanTable.vue` | `tableData` | `subtableActive` and `phewasActive` on the rows of `probData`, reset on every evaluation (in a subtable they are the prop's own rows). `toggleTable` writes the same fields for the user. Read by the template and the methods | pigean_gene, pigean_geneset, pigean_phenotype, factorization, pigeangraph |
| `components/PigeanTable.vue`, `views/CVDI_Pigean/CVDIPigeanTable.vue` | `probData` | `<field>_probability` on the prop's rows in a subtable (elsewhere it works on a clone). The parent's cached subtable holds those rows. Whether anything else reads the field is not known | as `tableData` above; cvdi_pigean_gene, cvdi_pigean_geneset, cvdi_pigean_phenotype |
| `components/HugeScoresTable.vue` | `tableData` | `range` on the prop's rows (gene, mouse_diff_exp: the items of the page's `hugeScores`; phenotype: the store's rows). Read by its own table and download. The PheWAS plot gets the same rows and does not show it | gene, phenotype, mouse_diff_exp |
| `components/HugeCalScoreSection.vue` | `rareVarBF` | sorts `masks` of the store's rows. `HuGeCalculator/main.js` `masks` hands the same array to the mask table, whose order follows | hugecalculator, gene |
| `components/HugeCalScoreSection.vue` | `commonVarBF` | `distance` on the store's genes. Nothing else reads it | hugecalculator, gene |
| `components/MetaAnalysisBarGraph.vue` | `tableData` (through `collateData`) | `bottomLineOnly`, `bottomLineMinP` and `allMetas` of the component. The bars in the template read them, and a watcher on `tableData` writes them too | phenotype |
| `components/researchPortal/ResearchCredibleSets.vue` | `searchingRegion` (through `getCredibleSetsList`) | sends a request, then empties and fills `credibleSets`, `CSData` and `pkgData.CSData`. Read by the template and the GEM table | research |
| `views/Datasets/main.js` | `datasetsList` | `phenotype_group`, `ancestry_name` and `data_type` on the store's datasets. Read by `phenotypeGroupOptions` and `techOptions` (both through `datasetsList`) and the table | datasets |
| `components/DiseaseSystems.vue` | `correlatedPhenotypes` | sorts the store's `phenotypeCorrelation.data` by `rg` when neither filter box is filled. Read by itself: back on "pValue", the rows stay in `rg` order | most pages (the header) |
| `components/DatasetsTable.vue` | `sortedDatasets` | sorts the prop `datasets` when there is no phenotype. The phenotype page passes one, so a filtered copy is sorted there | phenotype |
| `components/GeneFinderTable.vue` | `plotData` (through `formatAssocData`) | `position`, `minusLogP` and `p` on the rows of `associations`. Nothing but this table's plot reads them | complicationsviewer, phenotype (a hidden card) |
| `components/GeneFinderTable.vue`, `components/NCATS/old/GeneFinderTable.vue` | `fields` | pushes a column into the data property `baseFields` on every evaluation (with `showChiSquared`): one more column each time. Read by itself | the same (the second file: none) |
| `views/Factorization/main.js` | `geneFactor` | `gene_score`. Nothing reads it: the result is a clone | factorization |
| `views/Factorization/main.js` | `genesetFactor` | `p_value` and `gene_set_score`. Nothing reads them: the result is a clone | factorization |
| `components/NCATS/ResultsTable.vue` | `tableItems` | pushes into the data property `tableFields` on every evaluation. Read by the table's columns | none |
| `components/researchPortal/ResearchGEMDataTable.vue` | `tableContent` | on the rows (the format's `features` list is a copy now): `indexNum`, `overStart`, `overEnd`, `bioStart`, `bioEnd`, a key for each tissue and biosample, `Annotation Overlap`, `Biosample Overlap` and `Biosamples:array`. Read by itself when it runs again (stale text in the tissue and biosample columns). On Vue 3 the new keys also run again every computed that enumerates these rows (see Rows that get a new key) | research |

Computeds that dispatch or commit also run whenever they are evaluated, which Vue 3 moves like the rest: `commonVarBF`,
`rareVarBF` and `hugeScore` of `HugeCalScoreSection.vue`, `complicationViewerPhenotypes` of
`views/ComplicationsViewer/main.js`, `eglSummaries` of `views/EffectorGenes/main.js`, `helpTOC` of `views/Help/main.js`,
`researchData` of `views/Papers/Research/main.js`, and `topAssociations` of `views/Region/main.js`, which also hides an
element and sets `keyParams`. They are not in the table.

### Portal procedure for Vue 3 semantics

On the portal's `vue3/<portal>` branch, from a clean working tree (`git status` shows nothing): `explicit-spaces` does
not check for local changes, and step 3 commits its output alone.

1. Merge `dev/vue3`. In a conflicted file, take the portal's side, with the warning of step 1 of "Portal procedure for
   page setup": that drops every change `dev/vue3` made to the file. Here most of those are hand fixes, not codemod
   output, so check `git log -p HEAD..dev/vue3 -- <file>` and re-apply each one by hand. In a file that `explicit-spaces`
   rewrote, take the portal's side and run the codemod on it again. Commit the merge.
2. If the portal has not taken page setup and the template fixes, run those procedures first (they are above): a file
   with a space to add whose template does not compile on 2.7 makes `explicit-spaces` write nothing.
3. From a current `dev/vue3` checkout, read `npm run codemod:explicit-spaces -- --root <portal checkout> --dry-run`,
   then run it without `--dry-run`. Commit its output alone. Decide each place under Left by hand.
4. From the same checkout, `npm run tool:semantics-scan -- --root <portal checkout>`. The merge brought the fixes of
   `master`'s files, so what is listed is the portal's own, and any fix that a conflict dropped. Fix each hit by the
   rules above, then run it again:
   - `structuredClone`: `cloneDeep`, after checking what each call clones.
   - `chartObjects`: `markRaw`, after listing the reads of the object.
   - `computedParams`: read `this`, not the parameter.
   - `extraScripts` and `unknownTags`: as in the table at the top of the section.
   - `inlineSpaces`: what is left is Left of step 3.
5. In the portal checkout, `npm run lint:vue3 -- --base <commit before the merge>`: no rule rose, and
   `vue/no-side-effects-in-computed-properties` is down to the portal's own findings. Fix those by the three rules.
   Then read the portal's own computeds for the cases the lint does not see (a local, a callback parameter,
   `Object.assign`: the third point of Computed side effects). A portal's own copy of something `dev/vue3` fixed needs
   the same fix: the PanKbase `Gene` entry has its own `transcriptOr52k`.
6. Compare the rendered pages: the development A/B (see compare-render) with the commit before the merge as `<base ref>`,
   then sweep the portal's own pages as in step 6 of "Portal procedure for page setup". Look at what the fixes touch:
   spaces between a label and its value, the order of rows and options, the charts and graphs, and the associations
   table of the region page, which must come out sorted by p-value, smallest first.
