// Registration plan for the Vue 3 registration codemod. Report only: nothing is written.
//
// Today a page template can use `<page-header>` because some `Vue.component("page-header", ...)`
// call ran somewhere in the bundle. Vue 3 wants each file to import and register what it uses.
// This module answers, for every tag the lint rule `vue/no-undef-components` reports:
// which file or package does the tag need to import, or why can't that be decided?
//
//   const sources = readSources(root);
//   const { registrations, imports } = analyzeSources(sources);
//   const { edits, unresolved } = planRegistrations({
//     uses: await undefinedTags(root),
//     registrations,
//     imports,
//     pages: pageEntries(sources),
//     scriptSetupFiles: scriptSetupFiles(sources),
//   });
//
// All paths are relative to `root`, with forward slashes (`src/components/A.vue`).
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import eslint from 'eslint';
import { reachable, resolveImport, toKebab, toKey } from './component-graph.mjs';

const { ESLint } = eslint;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
// The ratchet's config, so the rule and its options (`ignorePatterns`) are the ones `lint:vue3` counts.
const configFile = resolve(here, 'eslint-vue3.cjs');

const RULE = 'vue/no-undef-components';
// Rules left on besides RULE. `vue/comment-directive` is what makes `<!-- eslint-disable-next-line ... -->`
// work inside a template; without it a tag someone deliberately silenced would be reported again.
const KEEP_RULES = new Set([RULE, 'vue/comment-directive']);
const MESSAGE = /^The '<(.+)>' component has been used, but not defined\.$/;

// `./x`, `../x` and `@/x` are files of this repo; anything else is a package.
const LOCAL_SPECIFIER = /^(?:\.{1,2}\/|@\/)/;

const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Every reason a use can be unresolved, in the order the rules decide them. */
export const REASONS = ['no-registration', 'phase-2-present', 'ambiguous', 'self', 'not-loaded', 'script-setup', 'cycle'];

/**
 * One use of an undefined tag, as the lint rule reports it.
 * `tag` is the name exactly as the message gives it (`page-header`, `Strong`, `LigerBrowser`);
 * `line` is the 1-based line in the file.
 * @typedef {{ tag: string, line: number }} Use
 */

/**
 * One local registration to add to a file.
 *  - `tag`: the tag as first used in that file (kebab or Pascal case).
 *  - `key`: the registration key, `toKey(tag)` (`PageHeader`).
 *  - `source`: what to import it from. A file under `src/` is `@/` plus its path without `src/`, with
 *    its extension (`@/components/PageHeader.vue`); a package component keeps the package name.
 * @typedef {{ tag: string, key: string, source: string }} Entry
 */

/**
 * A use that could not be planned.
 *  - `no-registration`: nothing registers the name, or the only registrations are aliases whose
 *    component cannot be located (not imported, or not a file of this repo).
 *  - `phase-2-present`: a `named` component has the name (`export default { name: "x", ... }`, phase 2
 *    output or written so by hand). It registers nothing globally, so the scan cannot tell which file a page
 *    loads the tag from, or whether it loads one at all. `candidates` lists the files that define the name,
 *    named or `Vue.component`, sorted.
 *  - `ambiguous`: the name has several candidates and the pages do not settle it. `candidates` lists
 *    them, sorted: definition files, or import specifiers when only aliases register the name.
 *  - `self`: the file is the component the tag names (a recursive component).
 *  - `not-loaded`: some page renders the file but never loads a file that registers the name, so the
 *    tag is an unknown element there today and registering it would change what the page shows.
 *    `pages` lists those page entries, sorted.
 *  - `script-setup`: the file has `<script setup>` or `lang="ts"`; the codemod leaves it to a person.
 *  - `cycle`: importing the target would put the file in an import loop.
 * @typedef {{ file: string, line: number, tag: string,
 *   reason: 'no-registration' | 'phase-2-present' | 'ambiguous' | 'self' | 'not-loaded' | 'script-setup' | 'cycle',
 *   candidates?: string[], pages?: string[] }} Unresolved
 */

/**
 * Where every use of an undefined component tag is, according to ESLint's `vue/no-undef-components`
 * over `<root>/src` (`.vue` and `.js`). The configuration is the lint ratchet's
 * (`eslint-vue3.cjs`, so the same `ignorePatterns`), with every other rule switched off by name,
 * except `vue/comment-directive`, which keeps `eslint-disable` comments in templates working: a tag
 * silenced that way is not reported, which is how the ratchet counts it. The rule list is read from the
 * resolved config, so a rule added to the config later is switched off here without an edit.
 * Plugins resolve from this repo, as in `lint-ratchet.mjs`, so `root` may be a worktree without `node_modules`.
 *
 * Keys are paths relative to `root` in sorted order, and only files with a finding are present. A use
 * is every occurrence, in the order ESLint reports them. Throws when ESLint reports anything but this
 * rule (a file that does not parse, say): a file ESLint could not read would otherwise be missing from
 * the plan without a trace.
 * @param {string} root
 * @returns {Promise<Map<string, Use[]>>}
 */
export async function undefinedTags(root) {
  const cwd = resolve(root);
  const options = {
    cwd,
    useEslintrc: false,
    overrideConfigFile: configFile,
    // Worktrees have no node_modules, so always resolve plugins from the real repo.
    resolvePluginsRelativeTo: repoRoot,
    extensions: ['.js', '.vue'],
  };
  const { rules } = await new ESLint(options).calculateConfigForFile(join(cwd, 'src', 'file.vue'));
  const off = Object.fromEntries(
    Object.keys(rules)
      .filter((rule) => !KEEP_RULES.has(rule))
      .map((rule) => [rule, 'off']),
  );
  const results = await new ESLint({ ...options, overrideConfig: { rules: off } }).lintFiles(['src']);

  const found = [];
  for (const result of results) {
    const file = relative(cwd, result.filePath).split(sep).join('/');
    const uses = result.messages.map((message) => {
      const match = message.ruleId === RULE ? MESSAGE.exec(message.message) : null;
      if (match === null) {
        throw new Error(`${file}:${message.line ?? 0}: unexpected ESLint message (${message.ruleId ?? 'fatal'}): ${message.message}`);
      }
      return { tag: match[1], line: message.line };
    });
    if (uses.length > 0) found.push([file, uses]);
  }
  return new Map(found.sort(([a], [b]) => byCodeUnit(a, b)));
}

/** `@/` form of a file under `src/`: `src/components/A.vue` -> `@/components/A.vue`. */
function specifierOf(file) {
  if (!file.startsWith('src/')) throw new Error(`${file}: not under src/, so it has no @/ specifier`);
  return `@/${file.slice('src/'.length)}`;
}

/** What an alias registration points at: `{ source, file }` (`file` is null for a package), or null if unknown. */
function aliasTarget({ file, source }, files) {
  if (source === null) return null;
  if (!LOCAL_SPECIFIER.test(source)) return { source, file: null };
  const target = resolveImport(file, source, files);
  return target === null ? null : { source: specifierOf(target), file: target };
}

/**
 * The one candidate every page that reaches `file` also reaches, or null. A page counts only when it
 * reaches `file`; a page that reaches no candidate or several of them, two pages that disagree, and
 * a `file` no page reaches (no evidence) all give null.
 */
function settleByPages(file, candidates, pageSets) {
  const chosen = new Set();
  let evidence = 0;
  for (const reached of pageSets) {
    if (!reached.has(file)) continue;
    evidence++;
    const hits = candidates.filter((candidate) => reached.has(candidate));
    if (hits.length !== 1) return null;
    chosen.add(hits[0]);
  }
  return evidence > 0 && chosen.size === 1 ? [...chosen][0] : null;
}

/** Rules 1 to 3: `{ target: { source, file } }` or `{ reason, candidates? }`. */
function chooseTarget(file, tag, { registrations, files, pageSets }) {
  const found = registrations.get(toKebab(tag)) ?? [];
  if (found.length === 0) return { reason: 'no-registration' };
  if (found.some(({ kind }) => kind === 'named')) {
    const defining = found.filter(({ kind }) => kind !== 'alias').map((registration) => registration.file);
    return { reason: 'phase-2-present', candidates: [...new Set(defining)].sort(byCodeUnit) };
  }

  const definitions = [...new Set(found.filter(({ kind }) => kind === 'definition').map((r) => r.file))].sort(byCodeUnit);
  if (definitions.length === 1) return { target: { source: specifierOf(definitions[0]), file: definitions[0] } };
  if (definitions.length > 1) {
    const settled = settleByPages(file, definitions, pageSets);
    if (settled === null) return { reason: 'ambiguous', candidates: definitions };
    return { target: { source: specifierOf(settled), file: settled } };
  }

  // Aliases only: usable when every alias leads to the same place.
  const targets = found.map((registration) => aliasTarget(registration, files));
  const known = new Map(targets.filter((target) => target !== null).map((target) => [target.source, target]));
  if (known.size === 0) return { reason: 'no-registration' };
  if (known.size === 1 && targets.every((target) => target !== null)) return { target: [...known.values()][0] };
  return { reason: 'ambiguous', candidates: [...known.keys()].sort(byCodeUnit) };
}

/** Whether `to` can be reached from `from` along `edges`. */
function canReach(edges, from, to) {
  const seen = new Set([from]);
  const pending = [from];
  while (pending.length > 0) {
    for (const next of edges.get(pending.pop()) ?? []) {
      if (next === to) return true;
      if (!seen.has(next)) {
        seen.add(next);
        pending.push(next);
      }
    }
  }
  return false;
}

/**
 * The page entries that render `file` but never load a file that registers `tag`, sorted. A page
 * renders `file` when its reach set (`pageSets[i]`, for `pages[i]`) contains it, and loads the tag when
 * that set contains any file with a registration for the tag's kebab name, definition or alias.
 */
function pagesNotLoading(file, tag, { registrations, pages, pageSets }) {
  const registering = (registrations.get(toKebab(tag)) ?? []).map((registration) => registration.file);
  return pages
    .filter((entry, index) => pageSets[index].has(file) && !registering.some((registered) => pageSets[index].has(registered)))
    .sort(byCodeUnit);
}

/** Rules 4 to 7: `{ reason, pages? }` for why `file` cannot import `target`, or null when it can. */
function rejection(file, tag, target, scriptSetupFiles, edges, context) {
  if (target.file === file) return { reason: 'self' };
  const pages = pagesNotLoading(file, tag, context);
  if (pages.length > 0) return { reason: 'not-loaded', pages };
  if (scriptSetupFiles.has(file)) return { reason: 'script-setup' };
  if (target.file !== null && canReach(edges, target.file, file)) return { reason: 'cycle' };
  return null;
}

/**
 * Decides, for every use in `uses`, which import registers it. Pure: reads its arguments only.
 *
 * Inputs (from `component-graph.mjs` and `undefinedTags`):
 *  - `uses`: `undefinedTags(root)`.
 *  - `registrations`, `imports`: from `analyzeSources(sources)`. `imports` has an entry for every
 *    scanned file; its keys are the files an alias import may resolve to.
 *  - `pages`: the page entry files (`pageEntries(sources)`); what each one reaches is computed here
 *    from `imports`, which is the evidence that settles a duplicate name. Planned edges are not part of it.
 *  - `scriptSetupFiles`: `scriptSetupFiles(sources)`.
 *
 * Per file and per tag (tags that differ only in spelling, `<a-b>` and `<AB>`, are one key,
 * `toKey(tag)`), in this order:
 *  1. No registration for `toKebab(tag)` -> `no-registration`. A `named` component of that name (phase 2
 *     output, see `Registration`) -> `phase-2-present`, with the defining files as `candidates`: what such
 *     a file used to register, and whether the pages load it, cannot be read from the tree any more, so
 *     the rules below would decide on part of the picture (a portal-only definition of the name would
 *     look like the only one).
 *  2. Exactly one defining file -> that file, aliases of the same name ignored. No definition and every
 *     alias leading to one place -> that place: a package name as written, or a local import resolved
 *     against the aliasing file to its `@/` form. An alias that is not imported, or whose local path
 *     matches no file, is unknown; with only unknown aliases that is `no-registration`, and a mix of
 *     different places, or of known and unknown, is `ambiguous`.
 *  3. Several defining files -> for every page that reaches the using file, the candidates that page
 *     reaches. All pages reach the same single candidate -> that file. Otherwise, and when no page reaches
 *     the using file, `ambiguous` with all candidates.
 *  4. The target is the using file -> `self`.
 *  5. Some page reaches the using file (its reach set contains it) but reaches no file that registers
 *     `toKebab(tag)`, as a definition or an alias -> `not-loaded`, with `pages` the page entries where
 *     that holds, sorted. The tag is an unknown element on those pages today, so registering it would
 *     change what they show. A using file no page reaches never renders and keeps its entry. The reach
 *     sets come from `imports` alone, not from planned edges.
 *  6. The using file has `<script setup>` or `lang="ts"` -> `script-setup`.
 *  7. Some import path leads from the target back to the using file -> `cycle`. A registration reads the
 *     imported component while the using file loads, so a path back is unsafe even when the file already
 *     imports the target today. Files are taken in sorted order and tags in key order, over a running
 *     edge set that starts as `imports`; an accepted entry adds its edge, a `cycle` one is dropped and
 *     the next carries on. The same input always gives the same plan.
 *  8. Entries in one file are deduplicated by key, with the tag as first used, and sorted by key.
 *
 * Every use ends up in exactly one place: covered by an entry in `edits` (the entry stands for all
 * uses of that key in the file), or its own item in `unresolved`, with that use's `line`. `unresolved`
 * is sorted by file, line and tag; `edits` holds only files with at least one entry, in sorted order.
 * `candidates` is set for `ambiguous` and `phase-2-present` only, and `pages` for `not-loaded` only.
 * @param {{ uses: Map<string, Use[]>, registrations: Map<string, import('./component-graph.mjs').Registration[]>,
 *   imports: Map<string, string[]>, pages: string[], scriptSetupFiles: Set<string> }} input
 * @returns {{ edits: Map<string, Entry[]>, unresolved: Unresolved[] }}
 */
export function planRegistrations({ uses, registrations, imports, pages, scriptSetupFiles }) {
  const context = {
    registrations,
    files: new Set(imports.keys()),
    pages,
    pageSets: pages.map((entry) => reachable(imports, entry)),
  };
  const edges = new Map([...imports].map(([file, targets]) => [file, new Set(targets)]));
  const edits = new Map();
  const unresolved = [];

  for (const file of [...uses.keys()].sort(byCodeUnit)) {
    const found = [...uses.get(file)].sort((a, b) => a.line - b.line || byCodeUnit(a.tag, b.tag));
    const byKey = new Map();
    for (const use of found) {
      const key = toKey(use.tag);
      byKey.set(key, [...(byKey.get(key) ?? []), use]);
    }

    for (const key of [...byKey.keys()].sort(byCodeUnit)) {
      const group = byKey.get(key);
      const choice = chooseTarget(file, group[0].tag, context);
      const rejected = choice.reason === undefined ? rejection(file, group[0].tag, choice.target, scriptSetupFiles, edges, context) : choice;
      if (rejected === null) {
        if (choice.target.file !== null) {
          if (!edges.has(file)) edges.set(file, new Set());
          edges.get(file).add(choice.target.file);
        }
        edits.set(file, [...(edits.get(file) ?? []), { tag: group[0].tag, key, source: choice.target.source }]);
      } else {
        const { reason, candidates, pages: notLoaded } = rejected;
        for (const { tag, line } of group) {
          unresolved.push({ file, line, tag, reason, ...(candidates && { candidates }), ...(notLoaded && { pages: notLoaded }) });
        }
      }
    }
  }

  unresolved.sort((a, b) => byCodeUnit(a.file, b.file) || a.line - b.line || byCodeUnit(a.tag, b.tag));
  return { edits, unresolved };
}
