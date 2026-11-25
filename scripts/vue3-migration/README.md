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
stack); a `RegExp`, an `Error`, an `ArrayBuffer` or a boxed primitive (each becomes a plain object); symbol keys and
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

2.7 always runs them in declaration order. Vue 3.5 runs them in the order in which they are triggered: for props, the
order in which the parent lists them, and a trigger that comes from the store and fires first runs its watcher first.
The parents of both region plots list `plotData` before `starItems`. But `staredVariants` (it reads the store's
`pkgDataSelected`) is a store trigger, and so is `hoverPos` in `MultiRegionPlot`. A draw with the new association data
and the old LD data or positions is therefore possible there: look at the region plots after a new region, a zoom and a
star.

#### Rows that get a new key

On Vue 3 a key added to a row is reactive, so it runs again every computed that enumerates rows (`Object.entries`,
`Object.keys`, `for...in`, a spread). The two region plots read their rows through `toRaw` for that reason, and a new
plot that enumerates rows in a computed has to do the same. What is read through `toRaw` does not trigger either, so a
value changed in place in a drawn row would not redraw on Vue 3; nothing in this tree does that. The GEM table's
`tableContent` (the last row of the table below) adds keys to the store's rows, so computeds elsewhere that enumerate
the same rows are run again by it, not only `tableContent` itself.

#### Computeds that change shared data through an alias

The lint does not count these: each sorts, or adds fields to, rows or lists of the store or of a prop through a local
variable or a callback parameter. They were found by reading the computeds of `src/`, following locals, callback
parameters, destructuring, loops, the component's own methods and the functions of `src/utils/`. Not covered: methods
that come from a mixin or a spread (`...uiUtils`), what a child does with a prop in its methods or watchers, and
functions of npm packages. Those that Stage 1 item 7 fixed are not listed; these were left as they are.

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
element and sets `keyParams`. The table lists a computed only for the data it changes.

### Portal procedure for Vue 3 semantics

A portal that has not taken Stage 1 yet starts at Sync-point order (above) instead (its step 3 is the merge of step 1
here), then runs the page setup and template fixes procedures, and goes on with step 2. The order matters: a file with
a space to add whose template does not compile on 2.7 makes `explicit-spaces` write nothing.

On the portal's `vue3/<portal>` branch, from a clean working tree (`git status` shows nothing): `explicit-spaces` does
not check for local changes, and step 2 commits its output alone.

1. Merge `dev/vue3`. In a conflicted file, take the portal's side, with the warning of step 1 of "Portal procedure for
   page setup": that drops every change `dev/vue3` made to the file. Here most of those are hand fixes, not codemod
   output, so check `git log -p HEAD..dev/vue3 -- <file>` and re-apply each one by hand. In a file that `explicit-spaces`
   rewrote, take the portal's side and run the codemod on it again. Commit the merge.
2. From a current `dev/vue3` checkout, read `npm run codemod:explicit-spaces -- --root <portal checkout> --dry-run`,
   then run it without `--dry-run`. Commit its output alone. Decide each place under Left by hand.
3. From the same checkout, `npm run tool:semantics-scan -- --root <portal checkout>`. The merge brought the fixes of
   `master`'s files, so what is listed is the portal's own, and any fix that a conflict dropped. Fix each hit by the
   rules above, then run it again:
   - `structuredClone`: `cloneDeep`, after checking what each call clones.
   - `chartObjects`: `markRaw`, after listing the reads of the object.
   - `computedParams`: read `this`, not the parameter.
   - `extraScripts` and `unknownTags`: as in the table at the top of the section.
   - `inlineSpaces`: what is left is Left of step 2.
4. In the portal checkout, `npm run lint:vue3 -- --base <commit before the merge>`: no rule rose, and
   `vue/no-side-effects-in-computed-properties` is down to the portal's own findings. Fix those by the three rules.
   Then read the portal's own computeds for the cases the lint does not see (a local, a callback parameter,
   `Object.assign`: the third point of Computed side effects). A portal's own copy of something `dev/vue3` fixed needs
   the same fix: the PanKbase `Gene` entry has its own `transcriptOr52k`.
5. Compare the rendered pages: the development A/B (see compare-render) with the commit before the merge as `<base ref>`,
   then sweep the portal's own pages as in step 6 of "Portal procedure for page setup". Look at what the fixes touch:
   spaces between a label and its value, the order of rows and options, the charts and graphs, and the associations
   table of the region page, which must come out sorted by p-value, smallest first.

## PanKbase switch branch

`vue3/pankbase-switch` is PanKbase on Vue 3.5, made from `vue3/pankbase`. PanKbase's build has neither `@vue/compat` nor
BootstrapVue's code: it runs on Vue 3 as it is, with components of our own (`src/components/bv/`) in place of
BootstrapVue's. It is temporary: it builds with Vue CLI 4, and Vite is a later stage. Do not merge it into `dev/vue3` or
`master`. Its pull request into `pankbase-main` (#1348) is a draft, to be merged at PanKbase's switch and not before. It
takes `vue3/pankbase` by merge (below), never the other way round; how `pankbase-main` gets `master`'s changes after the
switch is in "After the switch".

The default `vue.config.js` keeps `@vue/compat` (MODE 2) for all components, and BootstrapVue on it, and only PanKbase's
pages were compared with Vue 2. `configs/vue.config.CFDE.js` and `vue.configPapers.js` are not switched: they have no
`chainWebpack`, so they build against plain Vue 3, where `import Vue from "vue"` has no default export.

What a portal has to do to follow: take its own code off compat until `npm run tool:nocompat-scan -- --config <its
config>` has only hits with a reason (PanKbase's are in step 7 of the merge below), set its config up as PanKbase's (the
second bullet below), add to `src/components/bv/` what the scan and the development build (`[bv] <b-x> does not support
...`) say is missing, and compare its pages with its Vue 2 build.

An app of a portal's own (a `createApp(...)`; `ResearchPageHeader.vue` makes one for its search box, now with
`Vue.extend` and `$mount`, which only compat has) gets none of what `mountPage` installs. On plain Vue it needs
`.use(BootstrapVue)` and `.use(BootstrapVueIcons)` itself, or its `b-*` tags are raw elements: the scan does not see that
(it takes every tag of ours as registered), and the development build says only `Failed to resolve component`.
Likewise a bare `h("b-table")` is a raw element, which the scan lists as a hit whatever the build has.

A 0 of the scan is not a proof, also under `bvTags`. It does not check the modifiers of a directive
(`v-b-tooltip.top`), the methods of a `$bv` member, the keys of a table's fields, what is bound by an object
(`v-bind="obj"`) or by a dynamic name, a dynamic slot name, nor the keys that the code reads from a slot's scope. When
the code runs, a development build warns about most of these (an attribute, listener or slot, a field or item key, a
modifier or option of `v-b-tooltip`, an unknown icon, an option of `$bvToast.toast`), but not about a method that a
`$bv` member does not have (`$bvModal.msgBoxOk` is undefined, so the call throws) or a key of a slot's scope that the
component does not pass (it is undefined). Read those uses by hand, and load the pages that have them in a development
build.

### What differs from `vue3/pankbase`

- Packages (`package.json`, `package-lock.json`): `vue`, `@vue/compat` and `@vue/compiler-sfc` 3.5.45, `vuex` 4.1.0, no
  `vue-template-compiler`, and the override `"vue": "$vue"`. The override because npm refuses the tree without it
  (`vue-async-computed` asks for Vue 2), and because `portal-vue` and `vue-typeahead-bootstrap` would each bring a Vue
  2.7.
- PanKbase's build (`configs/vue.config.PanKbase.js`): no alias for `vue` (Vue CLI 4.5 sets `vue$` to
  `vue/dist/vue.runtime.esm-bundler.js` when it finds Vue 3, so everything, Vuex included, shares that one), no
  `compatConfig`, `bootstrap-vue$` is `src/components/bv/index.js`, and `__VUE_PROD_HYDRATION_MISMATCH_DETAILS__` is
  added to the feature flags that Vue CLI defines (`__VUE_OPTIONS_API__` true, `__VUE_PROD_DEVTOOLS__` false; it does
  not know the third). The alias is exact, so `bootstrap-vue/dist/bootstrap-vue.css` is still the package's.
- The default build (`vue.config.js`): `vue$` is `src/utils/vueCompat.js`, so our code and the Vue 2 packages
  (BootstrapVue, `vue-async-computed`) share one Vue, Vue 3 with the Vue 2 API; vue-loader compiles templates with
  `compatConfig: { MODE: 2 }` (Vue 2's rules); `bootstrap-vue$` is `src/utils/bootstrapVueCompat.js`.
- Both: `vuex$` is `vuex/dist/vuex.esm-bundler.js`: webpack 4 takes Vuex 4's `browser` field first, its development
  build, which logs in production what Vue 2's Vuex does not. `vue-typeahead-bootstrap$` is
  `src/components/typeahead/VueTypeaheadBootstrap.vue`.
- `src/utils/vueCompat.js` (new, default build): `@vue/compat` and two changes. Compat's `WATCH_ARRAY` is off, because it
  deep-traverses every watched array and a watcher that edits its own rows loops forever; it is on again for what
  `Vue.extend` makes, which is BootstrapVue's components (`b-table` relies on it). And a no-op `el._assign` for
  BootstrapVue's `model` directive: since Vue 3.4 the assigner is under a symbol, so changing such an input threw.
- `mountPage` (`src/utils/pageSetup.js`): `createApp`, the same signature, the store and the plugins installed on the
  app. It mounts into `#page-root` itself (the old `#app`, renamed, with `display: contents`), not into a child `div` as
  "Page setup" above says: Vue 3 keeps its target where 2.7 replaces it, so a child would stay as a block `div` between
  `#page-root` and the page. It installs `BootstrapVue` and `BootstrapVueIcons` on the app, whichever the alias gives:
  ours, or, in the default build, those of `src/utils/bootstrapVueCompat.js` (new), which installs the package on
  compat's global `Vue` when it is read and has nothing left for the app. On the app alone the package would be missing
  in the apps that are not `mountPage`'s: a component in the slot of a `b-popover` or `b-tooltip`, and the search box of
  `ResearchPageHeader.vue`, would show a raw `<b-icon>`. The root has the page as `$refs.page`, which replaces
  `$children[0]`.
- Our components without compat. Lifecycle hooks by their Vue 3 names (all of `src`), and in what PanKbase's pages reach
  assignments instead of `$set` and `$delete`, an event bus that is no Vue instance, `modelValue` for `v-model`, named
  imports instead of the global `Vue`, and a few render functions. Components that the default build uses as well have
  `COMPONENT_V_MODEL: false`, which plain Vue ignores.
- `src/components/bv/` (new): what PanKbase uses of BootstrapVue 2.23, with the same tags, markup and classes, on
  Bootstrap 4 and BootstrapVue's stylesheet, both still imported from their packages: 25 components, three icons (six
  bodies), `v-b-tooltip`, `$bvModal` and `$bvToast`, for the props, events and slots in use and no others; in development
  every other one warns. Its components are `compatConfig: { MODE: 3 }`, so that they can be tried under compat too (a
  build that does it also needs `configureCompat({ COMPONENT_ASYNC: false })`: compat takes the functional ones, plain
  functions, for async components); plain Vue ignores it.
- Template keys, 41 files. Vue 3 wants the key of the children of a `<template v-for>` on the template, and 2.7 refuses
  it there, so these files build on this branch only. `vue3: template-keys output` is what `codemod:template-keys` wrote
  (38 templates, 25 files). `vue3: template keys by hand` is 30 templates in 19 files: the 27 the script listed under
  Left (24 with different keys on the children, such as the suffixes `-dt` and `-dd`, and 3 `v-if`/`v-else` chains with
  one key on both branches) and 3 where the children keep their keys and the template got the shared key, so that Vue 3
  keeps the identity 2.7 gave (`GP2BrowserCanvas.vue`, `VariantSifterCanvas.vue`, `GeneAssociationsMasks.vue`).
- `src/components/typeahead/` (new): vue-typeahead-bootstrap 2.12.0 (MIT) written for Vue 3, with `v-slot` and `emits`
  and without `$parent.$on`, `$listeners` and `.native`; under compat the package lost the text of its suggestions. The
  three components are `compatConfig: { MODE: 3 }`, so they behave the same with and without compat. The package is
  still in `package.json`, for the two configs that are not switched.
- Fixes for differences that the comparison found, each valid on 2.7 too. `Phenotype/main.js` defines
  `maFormatter`, which the Meta-analysis filter calls (both versions throw it, and Vue 3 also took the input away). The
  single-cell browser watches what it changes in place (Vue 2 runs a watcher when its array gets an item, Vue 3 only
  when it is replaced) and reads the highlighted labels once. `NMF/Template.vue` gives its tooltips a class:
  BootstrapVue reads `$options._scopeId`, which vue-loader 16 calls `__scopeId`, so the scoped `::v-deep` rule matched
  nothing (our own tooltip carries the scope id again, so the class is no longer needed for that). `BulkHeatmap.vue`
  returns no sample groups as `[]` (an empty selection threw, and Vue 3 did not recover until a reload), and draws, or
  shows its download button and legend, only with rows and samples: since it mounts with neither, a failed `dea.tsv.gz`
  gave an empty frame and an unhandled `reading '0'`, and a failed `fields.json.gz` gave axes without cells, where Vue 2
  shows nothing. What "Select a dataset" does is unchanged: the old heatmap stays. `ResearchUmapPlotGL.vue` reads its
  values once and not for every cell, and `Functional/main.js` marks the rows of its two plots raw: a read through `this`
  or through a reactive row is slow on Vue 3 when there are hundreds of thousands. `DiffExp/main.js` and
  `Phenotype/Template.vue` take rows with missing fields (a throw in a render takes the component away on Vue 3, below).
- Scoped styles without nested rules: `pkb-footer.vue`, `Index/Template.vue`, `ResearchSingleCellSelector.vue` and
  `ResearchSingleCellBrowser.vue` had 27 nested rules in 10 blocks, now written flat, in the same order and with the same
  specificity. vue-loader 16 turns `.a { decls; .b {} }` into `.a{&[data-v]{decls} .b[data-v]{}}`, so a browser without
  CSS nesting (Safari before 16.5, Chrome before 112, Firefox before 117) drops the declarations of `.a` with the rest
  (the footer lost its flex and padding), where Vue 2 wrote `.a[data-v]{decls; …}`. The flat `.a .b` is scoped as
  `.a .b[data-v]`: own elements only, where Vue 2's nested `.b` also reached into child components, slot content and
  `v-html`. None of the 27 does (no such element carries those classes), so no `::v-deep`; the blocks of the
  single-cell browser match no element of its template at all. A build (its `--dest` folder is `<dest>`) that has nested
  rules in a scoped style again prints a number above 0 here, run from the root of the checkout (32 before this change,
  0 after):

  ```bash
  node -e 'const postcss = require("postcss"), fs = require("fs"); let n = 0; for (const f of fs.readdirSync(process.argv[1] + "/css").filter((f) => f.endsWith(".css"))) postcss.parse(fs.readFileSync(process.argv[1] + "/css/" + f, "utf8")).walkRules((r) => { if (r.parent.type === "rule") n++; }); console.log(n);' <dest>
  ```

- Two scripts (`codemod:template-keys`, `tool:nocompat-scan`) and their tests, below.

### Merging `vue3/pankbase` forward

From a clean tree. In a merge conflict `--ours` is this branch and `--theirs` is `vue3/pankbase`.

1. `git merge-base HEAD vue3/pankbase`, then `git diff --stat <that commit> HEAD`: keep the output for step 7. It is
   what this branch itself changed. Then `git merge vue3/pankbase`.
2. A conflict in a file that the key commits changed (the 41 files of `vue3: template-keys output` and
   `vue3: template keys by hand`; `git show --name-only --format= <commit>` lists them): this branch's own change in the
   file is keys only, and the script writes them again, so take the incoming file whole. Not `--ours`: it drops every
   change that `vue3/pankbase` made to the file. Check first that nothing else of this branch is in the file:

   ```bash
   git merge-base HEAD vue3/pankbase        # the tip of vue3/pankbase that this branch has merged so far
   git diff <that commit> HEAD -- <file>    # this branch's own change: key attributes and the v-for lines that gain one
   git checkout --theirs <file>
   git add <file>
   ```

   40 of the 41 are keys only today (checked by taking the key attributes out of both versions), and in nine of them
   one lifecycle hook that step 5 renames again. `GeneAssociationsMasks.vue` also has assignments in place of `$set`.
   The other changes of this branch are in files the key commits did not change: `Phenotype/main.js`,
   `Phenotype/Template.vue`, `DiffExp/main.js`, `Functional/main.js`, `NMF/Template.vue`, `BulkHeatmap.vue`,
   `pkb-footer.vue`, `Index/Template.vue`, the three single-cell browser files (`ResearchSingleCellBrowser.vue`,
   `ResearchSingleCellSelector.vue`, `ResearchUmapPlotGL.vue`), and the files of "Our components without compat". A
   conflict in one of those, or in any file whose diff shows more than keys, is resolved by hand, keeping both sides. A
   taken file also loses the hand fixes in it; step 5 puts them back.
3. Other conflicts. `package.json`: keep this branch's `vue`, `@vue/compat`, `@vue/compiler-sfc`, `vuex`, the
   `"vue": "$vue"` override and the missing `vue-template-compiler`, and take the rest. `package-lock.json`: take the
   incoming file, then `npm install --package-lock-only`. The two build configs and `src/utils/pageSetup.js`: keep both
   changes. Commit the merge.
4. `npm ci`, then `npm ls vue`: one Vue, 3.5.45.
5. `npm run codemod:template-keys -- --dry-run`, read it, run it without `--dry-run`, and commit its output alone. Run
   on `vue3/pankbase` as first merged, it writes the 25 files of the script commit byte for byte and lists 27 places
   under Left. Settle each place under Left by hand, as the report says: one key on the template, the others off the
   children (`git show` of `vue3: template keys by hand` has all 30 places as they were fixed, by file and `v-for`
   text). The 3 templates with a shared key added by hand are under Kept, not Left, so look at them yourself if their
   file was taken: `:key="section.id"` in the two canvases, `:key="row.phenotype"` in `GeneAssociationsMasks.vue`.

   Then the lifecycle hooks, committed alone too. `codemod:lint-fix` refuses the rule, whose fix is not valid on 2.7:

   ```bash
   npx eslint --no-eslintrc --plugin vue --parser vue-eslint-parser --parser-options ecmaVersion:2022,sourceType:module \
       --rule '{"vue/no-deprecated-destroyed-lifecycle":"error"}' --ext .vue,.js --quiet --fix src
   ```
6. Build (below). A key in the wrong place is a compile error, so a build that exits 0 has none.
7. The checks:
   - The dry run of step 5 again reads Left 0 and `Key errors left on Vue 3` 0, with the line `Vue 3 check: ran`.
   - The tests of the two scripts pass (below).
   - `git diff --stat vue3/pankbase HEAD` now lists the files of step 1 plus the key files the merge added. The non-key
     files above have the line counts of step 1, unless `vue3/pankbase` changed the same lines. A merge that is clean, or
     a `--theirs` on one of those, shows no conflict to read, and a lost fix shows only here: the file is missing from
     the list, or its numbers have shrunk.
   - `npm run tool:nocompat-scan -- --config configs/vue.config.PanKbase.js` has no hit under Script and Global API, and
     elsewhere only these: `emitInput` 1 (`BPagination.vue`, which emits `input` beside `update:modelValue` for the uses
     with `:value` and `@input`), `rootListener` 4 (the typeahead's list and the toggle of `BDropdown.vue`, meant so),
     `vForRef` 3 (donors: each ref is an array of one; `BTabs.vue`, which looks for its buttons by id), `bvImports` 1
     (the stylesheet), `bvRefs` 3 (refs that the scan cannot place, none of BootstrapVue) and `bvCss` 30 (rules on
     BootstrapVue's classes: 27 on classes that our components render, `.b-table`, `.b-table-details`,
     `.b-table-sticky-header`, `.b-pagination` and the like, and the three `.b-popover` rules of `public/css/table.css`,
     which match nothing: we have no popover, and no page of PanKbase makes one). What the merge added is to be fixed:
     without compat `$set` and the like throw, `v-model` on a `value`/`input` component does nothing, and an old
     lifecycle name is never called. A `bvTags` hit is a use that our component does not support: an attribute,
     listener, `v-model` or slot that it has not, an `icon` that `src/components/bv/icons.js` has no body for, or a tag
     made by `h("b-x")`. A second `bvImports` hit is a name that `src/components/bv/index.js` does not export
     (`ToastPlugin`, `VBPopover`, a `BIcon…`).
   - The same scan's packages table has no new package that depends on Vue (now `bootstrap-vue`, `vue`, `vue-cookies`,
     `vue-typeahead-bootstrap`, `vuex`): the `"vue": "$vue"` override lets a Vue 2 package install without complaint. Its
     notes `dataMerge`, `bindObjectOrder` and `multiRoot` stay 0, and a new `attrCoercion` (now 11) is looked at.
   - The command for nested rules above prints 0 on the new build.
   - Serve the build and load the pages the merge changed, and gene, phenotype and diff-exp for the typeahead, next to a
     build of `vue3/pankbase` on another port (step 6 of "Portal procedure for page setup").
   - Read what the merge added for what no scan sees. A watcher of an array that another file changes in place: Vue 3
     does not run that watcher, and `watchArrays` of the scan lists the watchers but sees only changes in the watcher's
     own file. A watcher of a computed that returns the same object again (below). A use that our components warn about
     in development only: a `<b-modal>` without `hide-footer` has no footer, and `b-tab` and `b-form-radio` need their
     parent. A render that throws on a row with missing fields (below).

### After the switch: taking `master`'s changes

For when this branch is in `pankbase-main`, which is then Vue 3 while `master` is still Vue 2. `vue3/pankbase` has no
part in it any more. What `master` gets goes `master` → `dev/vue3` → `pankbase-main`, each step on a branch of its own
with a pull request that is merged with a merge commit. Never squash one: git then keeps the old merge base, and
the next update shows the same conflicts again.

**Do not merge `master` into `pankbase-main`.** Git can take it without a conflict, and the Vue 2 code is in. A key in
the wrong place still stops the build. One `export default Vue.component(...)` does not: the build passes with a warning
(`export 'default' (imported as 'Vue') was not found in 'vue'`) and every page that imports the file is blank. If it has
happened, steps 4 to 6 of the second part find it.

`git log --oneline origin/dev/vue3..origin/master` lists what there is to take; with no output there is nothing.

#### `master` into `dev/vue3`

Once for all portals. On a branch `dev/vue3-master-<date>` from `origin/dev/vue3`, with its own packages (Vue 2.7; `npm
ci`), from a clean tree:

1. `git merge origin/master`. In a conflict take this side (`git checkout --ours <file>`), then put `master`'s change
   into it by hand: `git diff $(git merge-base origin/dev/vue3 origin/master) origin/master -- <file>` has it. Commit the
   merge. If `package-lock.json` changed, `npm ci` again.
2. Register by hand. The two registration codemods refuse to write now (`phase-2-present`, `phase 1 is not complete`),
   but their dry runs are the worklist: `npm run codemod:register-components -- --dry-run` and `npm run
   codemod:unwrap-vue-component -- --dry-run`.
   - `export default Vue.component("x", { ... })` becomes `export default { name: "x", ... }`.
   - A file that uses `<x>` imports it and has it under `components`. A page's `Template.vue` without a `<script>` gets
     one. `import "@/components/X.vue"` in a `main.js`, for its side effect, goes.
   - Two components can have one name (`download-chart`): take the one that the page's `main.js` imports.

   Done when both dry runs exit 0, with nothing under Unresolved and no file to change.
3. The other codemods write as before. Commit their output alone, then settle what each lists under Unresolved, Left and
   Check by hand:

   ```bash
   npm run codemod:lint-fix -- --rule vue/no-deprecated-slot-attribute --rule vue/no-deprecated-slot-scope-attribute --rule vue/no-deprecated-data-object-declaration
   npm run codemod:declare-emits
   npm run codemod:page-setup
   npm run codemod:explicit-spaces
   ```
4. Fix by hand what is left, by the rules of "Hand fixes" and "Vue 3 semantics". Done when `npm run
   tool:semantics-scan` reads 0 everywhere, and `npm run lint:vue3 -- --base origin/dev/vue3` shows a rise only in the
   three rules that wait for the switch. It exits 1 for that rise: read the table, not the exit code.
5. `npm run test:scripts`. A new page fails two tests until it is in `e2e/catalog.mjs` and the number of pages in
   `scripts/vue3-migration/check-dist.test.mjs` is raised.
6. The development A/B (see compare-render) with `origin/master` as `<base ref>`, then the pull request into `dev/vue3`.

#### `dev/vue3` into `pankbase-main`

On a branch `vue3/pankbase-update-<date>` from `origin/pankbase-main`, with its own packages (Vue 3; `npm ci`), from a
clean tree:

1. `git merge-base HEAD origin/dev/vue3` gives M, the last `dev/vue3` that PanKbase has. Keep the output of
   `git diff --stat M HEAD -- src ':!src/portals'` for step 7, then `git merge origin/dev/vue3`.
2. A conflict, by what `git diff M HEAD -- <file>` shows. It is what PanKbase and the switch changed in the file:
   - Only keys and names of lifecycle hooks: take the incoming file whole (`git checkout --theirs <file>`), step 4 writes
     them again. Four key files have PanKbase's own changes as well, so they are not such files: `PheWASDatasets.vue`,
     `PhenotypeSignalInGroup.vue`, and `ProgramDetails.vue` and `StateDetails.vue` of `LIGER/`.
   - Anything else (27 shared files have both): by hand, keeping both sides.
   - `package.json`, `package-lock.json`, the build configs and `pageSetup.js`: step 3 of "Merging `vue3/pankbase`
     forward".

   Commit the merge.
3. `npm ci`, then `npm ls vue`: one Vue, 3.5.45.
4. `npm run codemod:template-keys`, then the `eslint` command for the lifecycle hooks (both in step 5 of the section
   above), each committed alone. Settle Left by hand. The dry run then reads Left 0 and `Key errors left on Vue 3` 0.
5. `npm run tool:nocompat-scan -- --config configs/vue.config.PanKbase.js`, against the hits that step 7 of the section
   above says are to stay. What is new is Vue 2 code in a file that PanKbase's pages reach:

   | Hit | Write |
   | --- | --- |
   | `setDelete` | an assignment; `delete obj.key` |
   | `eventBus` | `EventBus` of `src/utils/eventBus.js`; an event of a child is a listener in the template |
   | `children` | a `ref` |
   | `emitInput`, `vModelComponent` | the prop `modelValue` and the event `update:modelValue` |
   | `vueImport`, `vuePrototype` | named imports; a module of its own for shared state |
   | `native` | the listener without `.native` |
   | `watchArrays` (a note) | `deep: true`, if the array gets its items in place |
   | `bvTags`, `bvDirectives` | another tag, or the prop, event or icon added to `src/components/bv/` |

   Not in the list, so read the new code for it: a `$bvModal` or `$bvToast` method that ours do not have
   (`$bvModal.msgBoxOk` throws), a chart library that draws over an element whose content is Vue's (`bindto: this.$el`:
   Vue throws at the next update), a render that throws on a row with missing fields, and the rest of the last point of
   step 7 above. A file that PanKbase's pages do not reach needs none of this: nothing builds it here.
6. Build (below), and the command for nested rules: 0. Then a development build, whose console shows every use that our
   components do not support, on the pages that show what changed.
7. `git diff --stat origin/dev/vue3 HEAD -- src ':!src/portals'` next to step 1's output: every file that PanKbase or the
   switch changed is still listed with its numbers, apart from what step 4 and 5 changed. A fix that a merge has dropped
   shows only here.
8. Compare the pages with a build of `pankbase-main` from before the merge: all pages for text and errors, and by hand
   what the update changes. Then the pull request into `pankbase-main`.

#### PanKbase's own changes after the switch

They are written for Vue 3. Before a pull request: steps 4 (the dry run), 5 and 6 of the part above, on the changed
branch, and `npm run lint:vue3 -- --base origin/pankbase-main` without a rise. A page that begins to use a shared
component nobody on PanKbase used before makes the scan list that component's Vue 2 code: the scan reads only what the
pages reach (278 of 859 files when this was written), and the rest of `src` has not been converted.

Nothing goes back from `pankbase-main`. A fix in shared code that the others need as well is made on `master` and comes
back by the two steps above.

#### What was tried

On 2026-11-25, in a clone: a pretend `master` with a real commit (`LigerTable.vue`), a real new page (`mskkp-main`'s
`SingleCellCompare`) and a new component full of Vue 2 code, used by the download button that most tables have. Both
merges went without a conflict. Between them the scripts listed all of that code but `$bvModal.msgBoxOk` (the array
watcher as a note only), and after the hand work they read as before the update, and step 7's list was the old one plus
the new component. A conflict made on a key line was settled as step 2 says: the file came out as it was plus `master`'s
change. The build passed. Of eight pages compared with the build before, five were the same and three differed by the
new component, which threw on gene because its chart drew over the component's own root: only opening the page showed
that. `master` merged straight into this branch also went without a conflict; the scan then had 24 new hits and two new
notes, and with only a `Vue.component` left in the new component the build passed and phenotype was blank. Not
tried: the development A/B of the first part, and a conflict in its merge.

### Scripts of this branch

```bash
npm run codemod:template-keys -- [--root <dir>] [--dry-run]
```

It moves the key of the plain children of a `<template v-for>` onto the template. It reads templates with
`vue-eslint-parser`, needs no Vue 2.7 compiler, and edits only the template block, as text splices: line endings and
every other byte stay, and a second run changes nothing. Before it writes, every changed file is checked (it parses as
before, nothing but the keys differs, each template has the one key its children had); if one fails, nothing is written,
a dry run included. When `@vue/compiler-sfc` 3.x is found from the root, the files that change or have something under
Left or Kept are also compiled by it, and the report says whether that ran. The report is markdown on stdout: the
totals, Moved, Left, Kept, Key errors left on Vue 3, Failed, and the files that change. Left is yours: different keys on
the children, a key that uses no variable of the loop or a slot variable, a template with a `v-if` of its own, a
`v-bind="{ key }"`, pug, and a `v-if`/`v-else` chain whose branches share a simple key (`:key="name"`). Kept are the
keys that Vue 3 accepts where they are (children with their own `v-if`, `v-else` or `v-for`, and slot templates). Exit 0
when done (Left and Kept are not a failure), 1 when a file failed, 2 for a usage error or a root without `src/`. It
cannot see a same-key chain that is not a child of a `<template v-for>` (only the Vue 3 check does, in the files that
change or have something under Left or Kept), and it does not judge identity: where every keyed child of a template
stays keyed, the template gets no key, and Vue 3 then patches its iterations by position and recreates the keyed
elements when the list is reordered (the same on screen; write a shared key on the template by hand where a row holds
state).

```bash
npm run tool:nocompat-scan -- [--root <dir>] [--config <vue.config.js>] [--entries <folder>]... [--json]
```

It lists what the pages of a build reach that Vue 3 without `@vue/compat` does not have: the worklist for taking our
code off compat, and the specification of the BootstrapVue components that would replace the library's. `--config`
reads the pages of a build config (parsed, never run) and follows its aliases; `--entries` takes the `main.js` entries
under a folder; with neither it scans every entry. It follows `import`, `export ... from`, `import()` and `require()`,
and lists the imports it could not follow. Run with `--config configs/vue.config.PanKbase.js`, it reads 41 pages and
278 of 859 files. The report is markdown: a table of the patterns (hits, and notes that may be right as they stand), a
section for each pattern with `file:line` and the code, a table of every `b-*` tag with the props, events and slots it
is used with, the `v-b-*` directives and `$bv` calls, the packages that depend on Vue, the imports it could not follow,
and the files that did not parse. Where the config aliases `bootstrap-vue` to components of ours, a `b-*` tag is a hit
only for what ours do not support, as their own development check declares it (`functional(...)` and `checksUse(...)`),
and for an `icon` that the component's `ICONS` has no body for (one that is not a literal is listed as dynamic, not as
a hit); a tag made by `h("b-x")` is always a hit (on Vue 3 a string is an element), and so is an import or re-export of
a name that the aliased file does not export. Only the files that the aliased file imports are exempt from the
BootstrapVue kinds, and a component it imports and never uses is not supported. `--json` prints the same as JSON. It
writes no file. Exit 0 whatever it finds, 2 for a usage error. A 0 is not a proof. It cannot see a value known only at
run time (`:is`, a ref or event name built from a variable), what a mixin declares for the component that uses it (each
file is read on its own), `$watch(...)` calls, JSX, templates written as strings, Sass nesting with `&-suffix`, loaders
and webpack settings other than the aliases, or `public/*.html`. Of our own components' uses it does not check the
modifiers of a directive, the methods of a `$bv` member (`$bvModal.msgBoxOk` is not there: the call throws, with no
warning before), the keys of a table's fields, what `v-bind="obj"` or a dynamic name binds, a dynamic slot name, nor
the keys read from a slot's scope; a development build warns about most of these when the code runs, as above. It lists
the watchers of arrays (`watchArrays`) and notes a change in place only in the watcher's own file, so an array that
another component changes in place (the single-cell browser had three) is not seen.

The other scripts need Vue 2.7's compiler, which this branch does not have: run them from a `dev/vue3` checkout with
`--root <this checkout>`. `npm run test:scripts` is not a gate here: 216 of its 711 tests fail, those of the scripts
that call `compiler-sfc`'s `parse({ source })` and `compileTemplate` as Vue 2.7 does (Vue 3's `parse` takes other
arguments: `currentInput.slice is not a function`). The tests of the two scripts above run here, and pass:

```bash
node --test scripts/vue3-migration/template-keys.test.mjs scripts/vue3-migration/nocompat-scan.test.mjs
```

### Build and serve

```bash
VUE_CLI_SERVICE_CONFIG_PATH="$PWD/configs/vue.config.PanKbase.js" npm run deploy
npx serve -l tcp://127.0.0.1:<port> -c "$PWD/e2e/serve.json" portals/PanKbase
```

The first command builds production into `portals/PanKbase/`, the config's `outputDir` (git ignores it); add `-- --dest
<dir>` to build elsewhere. A wrong config path is not an error: Vue CLI builds the default config. `npm run build` is
the development build, in which our BootstrapVue components warn about what they do not support (the default config's
prints compat's deprecation warnings). `tcp://127.0.0.1:<port>` keeps the server on the loopback. `e2e/serve.json` is
`{ "cleanUrls": false }`. Without it `serve` answers `/gene.html?gene=PCSK9` with a 301 to `/gene` and drops the query
string, which the pages read; `npm run preview` has no such config.

### Known differences to Vue 2

Production builds of this branch, without compat and BootstrapVue, and of `vue3/pankbase` (Vue 2.7, with `maFormatter`
added to the phenotype page) were compared, from the same recorded answers, on every page of the config, in Chromium at
desktop and phone size: the same text, screenshots (no pixel differs) and DOM, and no error on Vue 3 only. Single
actions (sorts, page changes, selects, tabs, clicks, hovers: 722, of which 653 are the same and 36 differ in the number
of listeners only) and by-hand flows (744 steps, 694 and 26) were done on both in lockstep, and the cause of every
other difference is below. With BioIndex failing, empty or not answering, all 42 pages have the same text. In Firefox 41
of 42 pages are the same (phenotype depends on which of two answers comes first, on both versions). All of this was run
on the final code (2026-11-25, 0b6952900 and the same source since). What follows here was run before the two guards of
`DiffExp/main.js` and `Phenotype/Template.vue`. Downloads (CSV, TSV, JSON, SVG, PNG) have the same names and text, and
the real 110 MB single-cell dataset gives the same text. The accessibility trees of gene, phenotype, donors (table, dropdown, modals),
diff-exp, data-browser and NMF are the same, and so is a walk by keyboard through donors and gene. The comparison tools
and the probes of the components (`src/components/bv` has no test in the repository) are not in the repository.

- A watcher on a computed value that is an object or an array: when a dependency changes and the computed returns the
  same object or array as before, Vue 2 runs the watcher and Vue 3 does not (it runs for another value only). Seen on
  404.html with an empty groups answer (the `diseaseGroup` watcher of `pageMixin`, which loads the front content). Not
  searched for on other portals' pages: to check there before they switch.
- A button replaced by its `v-else` branch keeps or loses the focus the other way round (cell-states, NMF).
- Donors: a numeric filter that is emptied by hand shows its value `0` again at once; Vue 2 does after the next redraw.
  Functional's donor filters follow the boxes after a filter that leaves no donor; Vue 2's go wrong. Vue 3 is right in
  both.
- Differential expression, "Select a dataset" or "Select a comparison": the heatmap stays, without the sample legend,
  and the next dataset shows the right heatmap where Vue 2 still shows the old one.
- Single-cell browser: the mark of the chosen gene moves one redraw earlier, and a tooltip that is open while the plots
  change keeps its place (2 px) where Vue 2's follows.
- A development build stops at an error that a production build logs and goes on from (gene's phenotype filter,
  phenotype with another phenotype, diff-exp with no comparison, a download of 0 rows on functional): the page stops
  updating.
- Invisible attributes and properties differ: the `value`, `checked` and `selected` attributes beside the properties,
  the order of classes and of style declarations, and the listeners of BootstrapVue that did nothing (`keydown` on
  buttons, `click` on their links, `mouseenter` on table rows, `focusin` on a tooltip).
- Our own BootstrapVue components, where a visitor could meet it: a toast belongs to the app and not to the component
  that made it; on phenotype, when two more tabs come at once, the tab that came first stays active (Vue 2: the first in
  order); a toast that is neither text nor a vnode shows what it is (Vue 2: "undefined"); the row or header that has the
  focus keeps it when others change places. NMF's tooltips have the class of the fix above besides.
- NMF: the factor table is missing in some loads on both versions, since the page uses `d3` from a CDN without waiting
  for it.
- Speed and memory: functional's plots appear in 1.9 s (Vue 2: 3.8 s; medians of 10 alternating loads each), mostly
  because the table before them is there sooner, and single-cell's with the real data in 2.4 s (Vue 2: 2.8 s). The heap
  after loading is smaller (phenotype 31 MB against 76 MB), and it does not grow with sorts and pages on either
  version.
- Size: every page loads 227-230 KB less gzip than on Vue 2 (the JS and CSS that the page runs, gzip level 6, the
  `rel=prefetch` chunks that it only offers left out): -21% to -22% on every page (index.html 1,062.7 to 833.1 KB,
  gene.html 1,088.0 to 858.3 KB, -21.1%). All JS raw, prefetched chunks included, is -13%.
- Gene: the HuGE phenotype plot, and with it the page, can be 14 px wider (1,310 px instead of 1,296 in a window of
  1,280). The plot takes the width of its canvas from its wrapper when it draws (at mount, for new data and on a
  resize), and that depends on which of two answers comes first. Vue 2 does it too (2 of 8 loads with eight browsers at
  once and the machine at a load of 34; 0 of 20 at 24), and this build more often when the machine is overloaded (5 of
  8 and 11 of 20; this build draws sooner), never in 31 loads two at a time. Not fixed: the plot's own measuring is not
  part of this change. Each resize of the window also makes the plot 30 px wider, on both.
- A component whose render or computed throws while the page updates is replaced by nothing on Vue 3 until a later
  update succeeds; Vue 2 keeps its last DOM. Where the throw is in a page's own template the page goes blank. No page
  does it with the recorded answers. With made-up holes in the answers (null or missing fields, null rows, short TSV
  rows) on 20 pages the text was the same as on Vue 2 but for diff-exp, which went blank, and phenotype, which lost the
  filters above a table: both have a guard now. What is left of the kind: a table whose formatter or cell slot throws
  shows nothing until another page of rows, and a typeahead whose serializer throws or gives no text for an option
  shows an empty list (a new ancestry code in BioIndex would be the first).
- Default build: a component in the slot of a `b-tooltip`, `b-popover` or `b-toast` has no `$store`: BootstrapVue makes a
  separate app for them.
- Not changed, as in Vue 2: Enter on a suggestion can pick twice (package bug).
- The default build has one known break: `egggenerator.html`, where editing the CodeMirror throws, because
  vue-codemirror keeps the editor in reactive data and Vue 3 wraps it.

Not tested: login and private data (the private BioIndex, PanKgraph and the LLM gateway answered from made-up data),
Safari and any other WebKit browser (Chromium for everything; Firefox for the page sweep only: 41 of 42 pages the same,
and the other, phenotype, depends on which of two answers comes first, on both versions), single-cell datasets other
than the one that was loaded with real data, and the default config's pages beyond ten of them. The real WashU browser,
with the Bootstrap 4.0.0 that it loads from a CDN, was loaded on gene and atacseq: the same text, and one more logged
error on atacseq (a file that it could not fetch).

Checked as well: every page with BioIndex answering 500, answering empty, and not answering at all (the same text on 42
of 42 for each, and the same errors on all but 404.html, the watcher above, diff-exp for 500 and empty: Vue 2 logs the
error of the heatmap's failed render and Vue 3 leaves two empty `div`s where Vue 2 leaves none, and data-browser,
below). data-browser's five tables come from an API whose address (`VUE_APP_API_BASE_URL`) these builds do not have, so
it asks the static server: both versions log `Failed to execute 'json' on 'Response': Unexpected end of JSON input`,
and in some loads one of them a second line, `Unexpected end of JSON input`. With made-up rows its 5 tabs and pages 1, 2, 3 and 5 are the same (21
states). Under compat, before BootstrapVue went, and not again: a browser without CSS nesting, imitated by dropping the
nested blocks from the served CSS (the computed style of every element on index, policies, single-cell, cell-states and
donors is the same with and without them; the build has no nested block now either), and the heatmap by hand (a failed
or empty `dea.tsv.gz` or `fields.json.gz`, "Select a dataset", "Select a comparison").
