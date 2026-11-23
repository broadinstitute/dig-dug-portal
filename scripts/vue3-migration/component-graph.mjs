// Component graph for the Vue 3 registration codemods. Report only: nothing is written.
//
// Reads every `.vue` and `.js` file under `<root>/src` and answers four questions:
//   - which components does each file register (`Vue.component("name", ...)`), and which `.vue` files are
//     already plain `export default { name: "name", ... }` (phase 2 output, or written that way by hand)?
//   - which local files does each file import?
//   - which files are page entries (every `main.js` under `src/`) and what does each one pull in?
//   - which files import each other in a loop?
// It also lists the components a file chooses at run time (`runtimeChoices` of `analyzeSources`), which no
// lint finds, for a person to check.
//
// All paths are relative to `root`, with forward slashes (`src/components/A.vue`).
//
// Failures are reported, never skipped silently. A script that does not parse, and a
// `Vue.component(...)` call the scanner cannot classify, come back as `ScanError`
// entries (see `analyzeSources`). The files concerned keep going: the rest of the tree
// is still scanned.
import { readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { parse as parseBabel } from '@babel/parser';
import { compileTemplate, parse as parseSfc } from 'vue/compiler-sfc';

/**
 * One `Vue.component(...)` call, or one component that has a name but no global registration.
 *  - `definition`: `export default Vue.component("name", { ... })`, the component is defined in place and is
 *    the file's default export (what an `import` of the file gets).
 *  - `unexported`: `Vue.component("name", { ... })` anywhere else (a second component in the file, or one
 *    exported later through a variable). It registers the name when it runs, but importing the file does
 *    not give that component, so the planner does not count it as a definition: it is a candidate that
 *    cannot be imported, so a page that loads it blocks a choice for the name (ruling R17).
 *  - `alias`: `Vue.component("name", Identifier)`; `source` is the specifier of the default import the
 *    identifier comes from, or `null` when it is not a default import (not imported, or a named or
 *    namespace import, which a default import of that specifier would not give).
 *  - `named`: a `.vue` file whose default export is a plain options object with a string-literal `name`,
 *    `export default { name: "name", ... }`: what phase 2 (`unwrap-vue-component`) leaves, or a component
 *    written that way by hand. It registers nothing globally; it is recorded so that a tag can be matched
 *    against it (the planner's `phase-2-present`).
 * `name` is the string as written; the map from `scanRegistrations` is keyed by `toKebab(name)`.
 * @typedef {{ file: string, name: string, kind: 'definition' | 'unexported' }
 *   | { file: string, name: string, kind: 'alias', source: string | null }
 *   | { file: string, name: string, kind: 'named' }} Registration
 */

/**
 * A problem found while scanning one file.
 *  - `parse`: a script block (or the SFC itself) did not parse.
 *  - `registration`: a `Vue.component(...)` call whose name is not a string literal or whose
 *    component is neither an object literal nor an identifier, so it cannot be classified.
 * `line` is the 1-based line in the file when known.
 * @typedef {{ file: string, kind: 'parse' | 'registration', message: string, line?: number }} ScanError
 */

/**
 * A component chosen at run time, which `vue/no-undef-components` cannot see and the codemods do not plan.
 * Once registrations are local, each one has to find its component another way, so a person checks it.
 *  - `kind` `is`, `:is` or `v-bind:is`: that template attribute, as written; `expression` is its value.
 *  - `kind` `h`, `createElement` or `<object>.$createElement` (the callee as written): a render call whose
 *    first argument is a string literal with a `-` in it, or not a literal at all (a string or template
 *    literal without a `-`, a number, `null`, a boolean and an object literal are literals);
 *    `expression` is that argument's source, on one line.
 *  - `kind` `template`: a `<template>` that was not scanned (`lang` other than html, `src`, or the template
 *    compiler threw); `expression` says why.
 * `line` is the 1-based line in the file.
 * @typedef {{ file: string, line: number, kind: string, expression: string }} RuntimeChoice
 */

const SCRIPT_FILE = /\.(vue|js)$/;
// Any `main.js` under `src/`: master's pages are `src/views/<Page>/main.js`, most portal branches also have
// `src/portals/<Portal>/views/<Page>/main.js`. See `pageEntries`.
const PAGE_ENTRY = /^src\/(?:.+\/)?main\.js$/;
// Tried in this order against the files that exist (webpack resolves `.vue` before `.js`).
const EXTENSIONS = ['', '.vue', '.js', '/index.js', '/index.vue'];
// Template attributes that choose the component, as the template compiler's `rawAttrsMap` keys them.
const IS_ATTRIBUTES = new Set([':is', 'is', 'v-bind:is']);
// Render functions that take a tag or a component as their first argument.
const RENDER_FUNCTIONS = new Set(['createElement', 'h']);
// First arguments of a render call that are literals besides strings (a string without a `-` is an element).
const LITERAL_TYPES = new Set(['BooleanLiteral', 'NullLiteral', 'NumericLiteral', 'ObjectExpression']);
// Babel node keys that hold positions, comments or bookkeeping rather than child nodes.
const SKIP_KEYS = new Set(['loc', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'errors']);

/** How a component script is parsed: an ES module with JSX, carrying on past errors Babel can recover from. */
export const BABEL_OPTIONS = { sourceType: 'module', plugins: ['jsx', 'dynamicImport'], errorRecovery: true };

const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const hasScriptExtension = (file) => SCRIPT_FILE.test(file);

/**
 * Kebab-case form of a component name, the way Vue's `hyphenate` does it:
 * `DownloadChart` -> `download-chart`; names that are already kebab-case are unchanged.
 * @param {string} name
 * @returns {string}
 */
export function toKebab(name) {
  return name.replace(/\B([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Canonical key for a component tag: `capitalize(camelize(toKebab(tag)))`. Every spelling Vue
 * accepts for one component (`download-chart`, `downloadChart`, `DownloadChart`) maps to the same key.
 * @param {string} tag
 * @returns {string}
 */
export function toKey(tag) {
  const camel = toKebab(tag).replace(/-(\w)/g, (_, c) => c.toUpperCase());
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Every `.vue` and `.js` file under `<root>/src`, keyed by its path relative to `root`
 * (forward slashes), in sorted key order. `node_modules` folders and symbolic links are skipped.
 * Throws when `<root>/src` does not exist.
 * @param {string} root
 * @returns {Map<string, string>}
 */
export function readSources(root) {
  const files = [];
  const listFiles = (dir) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') listFiles(path);
      } else if (entry.isFile() && hasScriptExtension(entry.name)) {
        files.push(path);
      }
    }
  };
  listFiles('src');
  return new Map(files.sort(byCodeUnit).map((file) => [file, readFileSync(join(root, file), 'utf8')]));
}

/**
 * Script blocks of one file. A `.js` file is one block; a `.vue` file contributes its `<script>`
 * and `<script setup>` blocks in the order they appear (a file with several plain `<script>`
 * blocks yields only the last, as vue-loader sees it). Problems with the SFC itself go to `errors`.
 * @returns {{ content: string, start: number, startLine: number }[]}
 */
export function scriptBlocks(file, source, errors) {
  if (!file.endsWith('.vue')) return [{ content: source, start: 0, startLine: 1 }];
  let descriptor;
  try {
    descriptor = parseSfc({ source, filename: file });
  } catch (err) {
    errors.push({ file, kind: 'parse', message: err.message });
    return [];
  }
  // `descriptor.errors` is not used: it holds template HTML warnings (an unclosed `<img>`), which
  // do not affect the script. A script the SFC parser lost is caught below instead.
  const blocks = [];
  for (const block of [descriptor.script, descriptor.scriptSetup]) {
    if (!block) continue;
    const startLine = source.slice(0, block.start).split('\n').length;
    blocks.push({ content: block.content, start: block.start, startLine });
  }
  if (blocks.length === 0 && /^<script[\s>]/m.test(source)) {
    errors.push({ file, kind: 'parse', message: '<script> block not found by the SFC parser' });
  }
  return blocks.sort((a, b) => a.start - b.start);
}

/**
 * Calls `visit(node, parent)` on every AST node under `node`, children in source order. `parent` is
 * the node that holds it (the node itself for the nodes of an array, `null` for the first call).
 */
export function walk(node, visit, parent = null) {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit, parent);
  } else if (node && typeof node.type === 'string') {
    visit(node, parent);
    for (const [key, child] of Object.entries(node)) {
      if (!SKIP_KEYS.has(key) && child && typeof child === 'object') walk(child, visit, node);
    }
  }
}

const stringValue = (node) => (node?.type === 'StringLiteral' ? node.value : null);

/** Whether a `CallExpression` node calls `Vue.component(...)`, whatever its arguments. */
export const isVueComponentCall = ({ callee }) =>
  callee.type === 'MemberExpression' &&
  !callee.computed &&
  callee.object.type === 'Identifier' &&
  callee.object.name === 'Vue' &&
  callee.property.type === 'Identifier' &&
  callee.property.name === 'component';

/** `Vue.component("name")`: looks up an already registered component, so it is not a registration. */
export const isLookup = ({ arguments: args }) => args.length === 1 && args[0].type === 'StringLiteral';

/** The key of a non-computed object property or method as written (`name` and `"name"` alike), else null. */
const propertyKey = (property) =>
  property.computed ? null : property.key?.type === 'Identifier' ? property.key.name : stringValue(property.key);

/**
 * The `name` of `export default { name: "...", ... }` in `program`, or null: the default export must be an
 * object literal whose last `name` key holds a string literal.
 */
function exportedName(program) {
  const declaration = program.body.find((node) => node.type === 'ExportDefaultDeclaration')?.declaration;
  if (declaration?.type !== 'ObjectExpression') return null;
  const name = declaration.properties.filter((property) => property.type !== 'SpreadElement' && propertyKey(property) === 'name').at(-1);
  return name?.type === 'ObjectProperty' ? stringValue(name.value) : null;
}

const oneLine = (text) => text.replace(/\s+/g, ' ').trim();

/** The callee of a render call as written (`h`, `createElement`, `this.$createElement`), or null. */
function renderFunction(callee, code) {
  if (callee.type === 'Identifier') return RENDER_FUNCTIONS.has(callee.name) ? callee.name : null;
  const isCreateElement = callee.type === 'MemberExpression' && !callee.computed && callee.property.name === '$createElement';
  return isCreateElement ? code.slice(callee.start, callee.end) : null;
}

/** Whether a render call's first argument names a component chosen at run time (see `RuntimeChoice`). */
function chosenAtRunTime(argument) {
  const text =
    argument.type === 'StringLiteral' ? argument.value
    : argument.type === 'TemplateLiteral' && argument.expressions.length === 0 ? argument.quasis[0].value.cooked
    : null;
  return text === null ? !LITERAL_TYPES.has(argument.type) : text.includes('-');
}

/**
 * The template attributes of a `.vue` file that choose a component (see `RuntimeChoice`), with `column` for
 * sorting. A template that does not parse as an SFC is the script scan's to report, so it gives nothing here.
 */
function templateChoices(file, source) {
  let template;
  try {
    ({ template } = parseSfc({ source, filename: file }));
  } catch {
    return [];
  }
  if (!template) return [];
  const linesBefore = (text, offset) => text.slice(0, offset).split('\n').length - 1;
  const firstLine = linesBefore(source, template.start) + 1;
  const notScanned = (why) => [{ file, line: firstLine, column: 0, kind: 'template', expression: `not scanned: ${why}` }];
  const { lang, src } = template.attrs;
  if (src !== undefined) return notScanned(`<template src="${src}">`);
  if (lang !== undefined && lang !== 'html') return notScanned(`<template lang="${lang}">`);
  let ast;
  try {
    ({ ast } = compileTemplate({ source: template.content, filename: file, prettify: false, compilerOptions: { outputSourceRange: true } }));
  } catch (err) {
    return notScanned(oneLine(err.message));
  }
  // The SFC parser de-indents the template and the compiler trims it, so positions are in that text. Both
  // keep the line breaks, which is all a line number needs.
  const { content } = template;
  const leading = content.length - content.trimStart().length;
  const found = [];
  const visit = (element) => {
    for (const [name, attribute] of Object.entries(element.rawAttrsMap ?? {})) {
      if (!IS_ATTRIBUTES.has(name)) continue;
      const offset = leading + attribute.start;
      const column = offset - content.lastIndexOf('\n', offset - 1) - 1;
      found.push({ file, line: firstLine + linesBefore(content, offset), column, kind: name, expression: attribute.value });
    }
    // `v-else` branches and slot templates are not among the children of the element they belong to.
    for (const child of element.children ?? []) visit(child);
    for (const { block } of element.ifConditions ?? []) if (block !== element) visit(block);
    for (const slot of Object.values(element.scopedSlots ?? {})) visit(slot);
  };
  if (ast) visit(ast);
  return found;
}

/** Registrations, import specifiers (unresolved) and registration problems found in one parsed script. */
function collect(file, ast, code, found) {
  /**
   * default-import identifier -> specifier. Only default imports (`import X from`, `import { default as X }
   * from`): the codemod writes a default import of the alias's source, so an alias of a named or namespace
   * import (`import { X } from`, `import * as X from`) has no source it could import, and stays `null`.
   */
  const importedFrom = new Map();
  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration') continue;
    for (const specifier of node.specifiers) {
      const imported = specifier.imported?.name ?? specifier.imported?.value;
      if (specifier.type === 'ImportDefaultSpecifier' || imported === 'default') importedFrom.set(specifier.local.name, node.source.value);
    }
  }
  const problem = (node, message) =>
    found.errors.push({ file, kind: 'registration', message, line: node.loc?.start.line });
  const named = file.endsWith('.vue') ? exportedName(ast.program) : null;
  if (named !== null) found.registrations.push({ file, name: named, kind: 'named' });

  walk(ast.program, (node, parent) => {
    if (node.type === 'ImportDeclaration' || node.type === 'ExportAllDeclaration' || node.type === 'ExportNamedDeclaration') {
      if (node.source) found.specifiers.push(node.source.value);
    } else if (node.type === 'CallExpression') {
      const [first, second] = node.arguments;
      if (node.callee.type === 'Import' || (node.callee.type === 'Identifier' && node.callee.name === 'require')) {
        const specifier = stringValue(first);
        if (specifier !== null) found.specifiers.push(specifier);
      } else if (renderFunction(node.callee, code) !== null && first !== undefined && chosenAtRunTime(first)) {
        const { line, column } = node.loc.start;
        found.runtime.push({ file, line, column, kind: renderFunction(node.callee, code), expression: oneLine(code.slice(first.start, first.end)) });
      } else if (isVueComponentCall(node) && !isLookup(node)) {
        const name = stringValue(first);
        if (name === null) {
          problem(node, 'Vue.component(): first argument is not a string literal');
        } else if (second.type === 'ObjectExpression') {
          const kind = parent?.type === 'ExportDefaultDeclaration' ? 'definition' : 'unexported';
          found.registrations.push({ file, name, kind });
        } else if (second.type === 'Identifier') {
          found.registrations.push({ file, name, kind: 'alias', source: importedFrom.get(second.name) ?? null });
        } else {
          problem(node, `Vue.component("${name}", ...): second argument is neither an object literal nor an identifier`);
        }
      }
    }
  });
}

/**
 * Resolves a local specifier (`@/`, `./` or `../`) imported by `from` to a key of `files`, or `null`
 * for packages and files that do not exist. The extensions tried are those of `scanImports`.
 * @param {string} from importing file, relative to the root
 * @param {string} specifier
 * @param {Set<string>} files every scanned file
 * @returns {string | null}
 */
export function resolveImport(from, specifier, files) {
  let base;
  if (specifier.startsWith('@/')) base = posix.normalize(`src/${specifier.slice(2)}`);
  else if (specifier.startsWith('./') || specifier.startsWith('../')) base = posix.join(posix.dirname(from), specifier);
  else return null;
  for (const extension of EXTENSIONS) {
    if (files.has(base + extension)) return base + extension;
  }
  return null;
}

/** Everything one file contributes. `specifiers` are the raw import strings, in source order. */
function analyzeFile(file, source) {
  const found = { registrations: [], specifiers: [], errors: [], runtime: file.endsWith('.vue') ? templateChoices(file, source) : [] };
  for (const block of scriptBlocks(file, source, found.errors)) {
    let ast;
    try {
      ast = parseBabel(block.content, { ...BABEL_OPTIONS, startLine: block.startLine });
    } catch (err) {
      found.errors.push({ file, kind: 'parse', message: err.message, line: err.loc?.line });
      continue;
    }
    // errorRecovery lets Babel carry on past some errors (a duplicate declaration, say); they still count.
    for (const err of ast.errors ?? []) {
      found.errors.push({ file, kind: 'parse', message: err.message, line: err.loc?.line });
    }
    collect(file, ast, block.content, found);
  }
  return found;
}

/**
 * One pass over every `.vue` and `.js` file in `sources`, in sorted file order. Prefer this to
 * calling `scanRegistrations` and `scanImports` separately: it parses each file once and returns
 * the errors for both. `registrations` holds every `Vue.component` registration (definitions, unexported
 * ones and aliases) and the `named` components (see `Registration`). `runtimeChoices` lists the components chosen at run time (see
 * `RuntimeChoice`), sorted by file, then by position.
 *
 * Errors are collected, not thrown, and the rest of the tree is still scanned:
 *  - A script block that does not parse contributes no imports and no registrations and gets one
 *    `kind: 'parse'` entry. Its file still has an import list (empty when no other block parsed).
 *  - Errors Babel recovers from (a duplicate declaration, say) are `kind: 'parse'` entries too, and
 *    the file is scanned normally. A `.vue` whose `<script>` the SFC parser lost is a `parse` entry.
 *  - A `Vue.component(...)` call whose name is not a string literal, or whose second argument is
 *    neither an object literal nor an identifier, is one `kind: 'registration'` entry and is not
 *    counted. The one exception is `Vue.component("name")`, a single string-literal argument: it
 *    looks up an existing component and is ignored. `Vue.component(name)` and
 *    `Vue.component(...args)` are reported.
 * @param {Map<string, string>} sources file path -> source text
 * @returns {{ registrations: Map<string, Registration[]>, imports: Map<string, string[]>, errors: ScanError[],
 *   runtimeChoices: RuntimeChoice[] }}
 */
export function analyzeSources(sources) {
  const files = new Set(sources.keys());
  const byName = new Map();
  const imports = new Map();
  const errors = [];
  const runtimeChoices = [];
  for (const file of [...sources.keys()].filter(hasScriptExtension).sort(byCodeUnit)) {
    const found = analyzeFile(file, sources.get(file));
    errors.push(...found.errors);
    const inOrder = found.runtime.sort((a, b) => a.line - b.line || a.column - b.column);
    runtimeChoices.push(...inOrder.map(({ column, ...choice }) => choice));
    const resolved = found.specifiers.map((specifier) => resolveImport(file, specifier, files)).filter((path) => path !== null);
    imports.set(file, [...new Set(resolved)]);
    for (const registration of found.registrations) {
      const key = toKebab(registration.name);
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(registration);
    }
  }
  const registrations = new Map([...byName].sort(([a], [b]) => byCodeUnit(a, b)));
  return { registrations, imports, errors, runtimeChoices };
}

/**
 * Every component registration, keyed by `toKebab(name)`; each key lists the registrations in file
 * order, so a name registered in two files returns both. Keys are sorted. See `analyzeSources`.
 * @param {Map<string, string>} sources file path -> source text
 * @param {ScanError[]} [errors] receives the parse and registration errors
 * @returns {Map<string, Registration[]>}
 */
export function scanRegistrations(sources, errors = []) {
  const analysis = analyzeSources(sources);
  errors.push(...analysis.errors);
  return analysis.registrations;
}

/**
 * Each `.vue` and `.js` file's resolved local imports: static `import` and `export ... from`,
 * `import()` and `require()` with a string-literal specifier, each file once in order of first use.
 * `@/` maps to `src/`, `./` and `../` are relative to the importing file, and the extensions tried
 * are none, `.vue`, `.js`, `/index.js`, `/index.vue`. Packages and files that are not in `sources`
 * (images, stylesheets, missing files) are dropped. Every scanned file has an entry, `[]` when it
 * imports nothing. See `analyzeSources`.
 * @param {Map<string, string>} sources file path -> source text
 * @param {ScanError[]} [errors] receives the parse errors
 * @returns {Map<string, string[]>}
 */
export function scanImports(sources, errors = []) {
  const analysis = analyzeSources(sources);
  errors.push(...analysis.errors.filter((error) => error.kind === 'parse'));
  return analysis.imports;
}

/**
 * Every page entry point, sorted: every `main.js` under `src/`, in any folder (`src/views/Gene/main.js`,
 * `src/portals/PanKbase/views/Gene/main.js`). `vue.config.js` decides which of them are built, and this does
 * not read it, so a `main.js` that is not a built page is counted as one. That never makes a write riskier.
 * Where a built page reaches a file, an extra page only adds a constraint (a duplicate name must be settled
 * the same way there too, a tag must be loaded there too), so more uses are reported. Where only extra pages
 * reach a file, no built page renders it, so what is settled for it changes nothing a page shows.
 * @param {Map<string, string>} sources file path -> source text
 * @returns {string[]}
 */
export function pageEntries(sources) {
  return [...sources.keys()].filter((file) => PAGE_ENTRY.test(file)).sort(byCodeUnit);
}

/**
 * Files an entry pulls in, directly or not, and the entry itself.
 * @param {Map<string, string[]>} imports from `scanImports`
 * @param {string} entry
 * @returns {Set<string>}
 */
export function reachable(imports, entry) {
  const seen = new Set([entry]);
  const pending = [entry];
  while (pending.length > 0) {
    for (const next of imports.get(pending.pop()) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        pending.push(next);
      }
    }
  }
  return seen;
}

/**
 * Import cycles: the strongly connected components (Tarjan) with more than one file. A file that
 * imports itself is not a cycle. Each cycle is sorted, and the cycles are sorted by their first file.
 * Targets without an entry in `edges` count as files with no imports. Recursive, so it assumes an
 * import chain well under the engine's stack depth (thousands of files).
 * @param {Map<string, Iterable<string>>} edges file -> files it imports
 * @returns {string[][]}
 */
export function findCycles(edges) {
  const index = new Map();
  const lowLink = new Map();
  const stack = [];
  const onStack = new Set();
  const cycles = [];

  const visit = (file) => {
    index.set(file, index.size);
    lowLink.set(file, index.get(file));
    stack.push(file);
    onStack.add(file);
    for (const next of edges.get(file) ?? []) {
      if (!index.has(next)) {
        visit(next);
        lowLink.set(file, Math.min(lowLink.get(file), lowLink.get(next)));
      } else if (onStack.has(next)) {
        lowLink.set(file, Math.min(lowLink.get(file), index.get(next)));
      }
    }
    if (lowLink.get(file) === index.get(file)) {
      const component = [];
      let member;
      do {
        member = stack.pop();
        onStack.delete(member);
        component.push(member);
      } while (member !== file);
      if (component.length > 1) cycles.push(component.sort(byCodeUnit));
    }
  };

  for (const file of [...edges.keys()].sort(byCodeUnit)) {
    if (!index.has(file)) visit(file);
  }
  return cycles.sort((a, b) => byCodeUnit(a[0], b[0]));
}

/**
 * `.vue` files (paths relative to the root) that have a `<script setup>` block, or a
 * `<script lang="ts">` / `<script setup lang="ts">` block. Their scripts are not plain
 * `export default Vue.component(...)` modules, so the codemods leave them to a person.
 * A `.vue` file whose SFC cannot be parsed is not listed (`analyzeSources` reports it).
 * @param {Map<string, string>} sources file path -> source text
 * @returns {Set<string>}
 */
export function scriptSetupFiles(sources) {
  const files = new Set();
  for (const [file, source] of sources) {
    if (!file.endsWith('.vue')) continue;
    let descriptor;
    try {
      descriptor = parseSfc({ source, filename: file });
    } catch {
      continue;
    }
    const blocks = [descriptor.script, descriptor.scriptSetup].filter(Boolean);
    if (descriptor.scriptSetup || blocks.some((block) => /^tsx?$/.test(block.attrs?.lang ?? ''))) files.add(file);
  }
  return files;
}
