// Moves what every page installs, and how it mounts, into `src/utils/pageSetup.js`. Run it from the repo root:
//
//   npm run codemod:page-setup -- --dry-run        # report only
//   npm run codemod:page-setup                     # write the changes
//   npm run codemod:page-setup -- --root <dir>     # another checkout (a portal branch)
//
// Vuex, BootstrapVue, its icons and VueCookies are installed by whichever entry, store, component or mixin happened
// to need them, and each entry mounts its page itself. Vue 3 installs plugins on an app, not on `Vue`, so one module
// has to own both: `pageSetup.js` installs the four plugins, loads the two Bootstrap stylesheets and exports
// `mountPage(Template, options, plugins)`.
//
// In every `.vue` and `.js` file under `src/` but `pageSetup.js` itself, this removes:
//   - `Vue.use(X);` at the top level, where X is imported from `vuex`, `vue-cookies` (the default export) or
//     `bootstrap-vue` (the default export, `BootstrapVue`, `BootstrapVueIcons`, `IconsPlugin`);
//   - `Vue.config.productionTip = false;`;
//   - the imports of `bootstrap/dist/css/bootstrap.css` and `bootstrap-vue/dist/bootstrap-vue.css`;
//   - an import binding whose last reference that removed. One that was unused before stays.
// Names count for what they are bound to (Babel's scopes), not for how they are spelled: `Vue` is the default import
// of `vue`, and commented-out code is nothing.
//
// In every entry (each `main.js` under `src/`, see `pageEntries`) it turns `new Vue({ ... }).$mount("#app")` into
// `mountPage(Template, { ... })` without the `render` option, and imports `mountPage` before anything else: a store
// creates its `Vuex.Store` when it is imported, which needs Vuex installed. An entry that calls `mountPage` already
// is done.
//
// The line above the call gets `// @vue/component`, the marker of eslint-plugin-vue. The plugin knows the options of
// `new Vue({ ... })` for a component, but not those of `mountPage(Template, { ... })`: without the marker the lint
// would stop checking the entries, and its findings in them would vanish unfixed.
//
// Every change is a text splice: bytes outside it stay as they were and the file keeps its line endings. A statement
// takes its line along when nothing else is on it. A comment stays where it stood, on a line of its own or after what
// goes: it can be code that was commented out. Where a removal leaves a blank line on each side, one of them goes too.
//
// It reports what it will not decide, as markdown on stdout, after the totals:
//   - Unresolved: an entry that mounts in another way (an `el` or `template` option, a `render` that does more than
//     return `createElement(Template)`, a second `new Vue`, ...), and a component whose script it cannot edit
//     (`<script setup>`, `lang="ts"`, two scripts). The file is not changed: edit it by hand, then run this again. An
//     entry must be converted before its page is built, even one that installs Vuex itself. Its store is stripped like
//     any other file, and creates its `Vuex.Store` when it is imported, before the entry can install Vuex.
//   - Left in place: any other install, with its line. Another plugin, `Vue.use(X, options)`, an install in a
//     function or a condition, a plugin or a `Vue` that is re-assigned or not imported as above. Note that
//     `pageSetup.js` runs first, and Vue ignores a second install of a plugin, its options included.
//   - Pages that gain or lose something: the plugins and stylesheets that run when the page's files load, by
//     reachability from its entry, before and after. A page loses something when its entry is unresolved and a file
//     that installed it for the page is stripped. An unresolved entry can need converting without losing anything.
//
// Every changed file is parsed again (as `register-components.mjs` does). When one fails, or any file under `src/`
// does not parse to begin with (what it imports is then unknown), it is listed under Failed and nothing at all is
// written. A second run changes nothing.
//
// Exit codes: 0 done (what it reports is not a failure), 1 a file failed (it does not parse, or a write failed), 2
// usage error, or no `src/utils/pageSetup.js` under the root.
import { existsSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { traverse } from '@babel/core';
import { parse as parseSfc } from 'vue/compiler-sfc';
import { pageEntries, reachable, readSources, resolveImport, scanImports } from './component-graph.mjs';
import { assertParses, cell, code, failure, hasSrc, oneLine, pageName, parseArgs, parseStrict } from './register-components.mjs';
import { byCodeUnit, isBlank, keyName, lineIndent, soleScript, splice } from './register-write.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const USAGE = 'usage: node scripts/vue3-migration/page-setup.mjs [--root <dir>] [--dry-run]';

const PAGE_SETUP = 'src/utils/pageSetup.js';
const MOUNT_IMPORT = 'import { mountPage } from "@/utils/pageSetup";';
const COMPONENT_MARKER = '// @vue/component';

/** What `pageSetup.js` installs: module -> exported name -> plugin. */
const PLUGINS = {
  vuex: { default: 'Vuex' },
  'bootstrap-vue': { default: 'BootstrapVue', BootstrapVue: 'BootstrapVue', BootstrapVueIcons: 'BootstrapVueIcons', IconsPlugin: 'IconsPlugin' },
  'vue-cookies': { default: 'VueCookies' },
};
const STYLESHEETS = ['bootstrap/dist/css/bootstrap.css', 'bootstrap-vue/dist/bootstrap-vue.css'];
/** What a page can get, in report order. */
const SETUP = ['Vuex', 'BootstrapVue', 'BootstrapVueIcons', 'VueCookies', ...STYLESHEETS];
/** `BootstrapVueIcons` is `IconsPlugin` in a plugin of its own. */
const SAME_PLUGIN = { IconsPlugin: 'BootstrapVueIcons' };

/** A file without any of these has nothing to strip, so it is not parsed. */
const CANDIDATE = /\.\s*use\b|\[\s*["'`]use["'`]|productionTip|bootstrap(?:-vue)?\.css/;

/** Longest code the Left in place table shows. */
const SHOWN = 80;

/** What a shape this will not edit throws; the message is the reason. */
class Unresolved extends Error {}
const unresolve = (reason) => {
  throw new Unresolved(reason);
};

// ---- bindings ---------------------------------------------------------------------------------

/** The Babel path of the program of `raw`, with its scopes. */
function programPath(raw) {
  const ast = parseStrict(raw);
  let program;
  traverse(ast, {
    Program(path) {
      program = path;
      path.skip();
    },
  });
  return { ast, program };
}

/** The module and the exported name (`default`, `*`) that `binding` imports, or null when it is not an import. */
function importOf(binding) {
  if (binding?.kind !== 'module') return null;
  const { type, imported } = binding.path.node;
  const source = binding.path.parent.source.value;
  if (type === 'ImportDefaultSpecifier') return { source, name: 'default' };
  if (type === 'ImportNamespaceSpecifier') return { source, name: '*' };
  return { source, name: imported.name ?? imported.value };
}

/** Whether `node` is `require("vue")` or `require("vue").default`. */
function isRequiredVue(node) {
  if (node?.type === 'MemberExpression') return isRequiredVue(node.object);
  return node?.type === 'CallExpression' && node.callee.name === 'require' && node.arguments[0]?.value === 'vue';
}

/**
 * Whether `node` is Vue: `vue` for the default import of `vue`; `unsure` when it probably is (a namespace import, a
 * `require`, a re-assigned import, a `Vue` that nothing in the file declares); else null.
 */
function vueKind(node, scope) {
  if (node.type !== 'Identifier') return null;
  const binding = scope.getBinding(node.name);
  if (!binding) return node.name === 'Vue' ? 'unsure' : null;
  const imported = importOf(binding);
  if (imported?.source === 'vue' && imported.name === 'default') return binding.constantViolations.length === 0 ? 'vue' : 'unsure';
  if (imported?.source === 'vue' && imported.name === '*') return 'unsure';
  return isRequiredVue(binding.path.node.init) ? 'unsure' : null;
}

/** The plugin of `pageSetup.js` that `node` is, as `PLUGINS` names it, or null. */
function pluginOf(node, scope) {
  if (node?.type !== 'Identifier') return null;
  const binding = scope.getBinding(node.name);
  const imported = importOf(binding);
  if (!imported || binding.constantViolations.length > 0) return null;
  return PLUGINS[imported.source]?.[imported.name] ?? null;
}

const propertyName = ({ computed, property }) => (computed ? (property.type === 'StringLiteral' ? property.value : null) : property.name);

// ---- removing text ----------------------------------------------------------------------------

const atLineBreak = (text, offset) => offset >= text.length || text[offset] === '\r' || text[offset] === '\n';

/** The lines `range` is on, the last line break included, when nothing else is on them; else null. */
function wholeLines(text, range) {
  const start = text.lastIndexOf('\n', range.start - 1) + 1;
  const lineBreak = text.indexOf('\n', range.end);
  const end = lineBreak === -1 ? text.length : lineBreak + 1;
  return isBlank(text.slice(start, range.start)) && isBlank(text.slice(range.end, end)) ? { start, end } : null;
}

/**
 * Edits that remove `ranges` (in order, not overlapping) from `text`: whole lines where nothing else is on them, else
 * the range with the spaces that set it apart. A run of removed lines between two blank lines takes one of them along,
 * and one at the start or end of `region` (a script, the inside of an object literal) the blank line beside it.
 */
function removals(text, ranges, region = { start: 0, end: text.length }) {
  const edits = [];
  const runs = [];
  const isEdge = (from, to) => isBlank(text.slice(from, to));
  const grouped = [];
  for (const { start, end } of ranges) {
    const last = grouped.at(-1);
    if (last && /^[ \t]*$/.test(text.slice(last.end, start))) last.end = end;
    else grouped.push({ start, end });
  }
  for (const range of grouped) {
    const lines = wholeLines(text, range);
    if (!lines) {
      const [before] = /[ \t]*$/.exec(text.slice(0, range.start));
      const [after] = /^[ \t]*/.exec(text.slice(range.end));
      const isFirst = range.start === before.length || text[range.start - before.length - 1] === '\n';
      const isLast = atLineBreak(text, range.end + after.length);
      // One of the two spaces goes; a range with none before it keeps the one after it.
      const start = isLast ? range.start - before.length : range.start;
      const end = isFirst || isLast || before !== '' ? range.end + after.length : range.end;
      edits.push({ start, end, text: '' });
      continue;
    }
    if (runs.at(-1)?.end === lines.start) runs.at(-1).end = lines.end;
    else runs.push(lines);

    const run = runs.at(-1);
    const previousLine = text.lastIndexOf('\n', run.start - 2) + 1;
    const followsBlank = run.start > 0 && previousLine > region.start && isBlank(text.slice(previousLine, run.start));
    const nextBreak = text.indexOf('\n', run.end);
    const precedesBlank = nextBreak !== -1 && nextBreak < region.end && isBlank(text.slice(run.end, nextBreak));
    if (precedesBlank && (followsBlank || isEdge(region.start, run.start))) run.end = nextBreak + 1;
    else if (followsBlank && isEdge(run.end, region.end)) run.start = previousLine;
  }
  return [...edits, ...runs.map((run) => ({ ...run, text: '' }))];
}

/** Edits that take the bindings named in `names` out of one import declaration that has others. */
function specifierEdits(text, { specifiers }, names) {
  const edits = [];
  const remove = (start, end) => edits.push({ start, end, text: '' });
  const dropped = ({ local }) => names.has(local.name);
  const [first] = specifiers;
  const named = specifiers.filter(({ type }) => type === 'ImportSpecifier');
  if (first.type === 'ImportDefaultSpecifier' && dropped(first)) {
    const comma = /\s*,\s*/y;
    comma.lastIndex = first.end;
    if (comma.test(text)) remove(first.start, comma.lastIndex);
  }
  const namespace = specifiers.find(({ type }) => type === 'ImportNamespaceSpecifier');
  if (namespace && dropped(namespace)) remove(first.end, namespace.end);

  const kept = named.filter((specifier) => !dropped(specifier));
  if (named.length > 0 && kept.length === 0) {
    remove(first.end, text.indexOf('}', named.at(-1).end) + 1);
  } else if (kept.length > 0) {
    const lastKept = kept.at(-1);
    named.forEach((specifier, i) => {
      if (dropped(specifier) && specifier.start < lastKept.start) remove(specifier.start, named[i + 1].start);
    });
    if (named.at(-1) !== lastKept) remove(lastKept.end, named.at(-1).end);
  }
  return edits;
}

const hasComment = ({ comments }, start, end) => comments.some((comment) => comment.start < end && comment.end > start);

/**
 * `text`, whose top level is `program`, without `statements` (and with `edits` made). Throws when what was before one
 * of them runs on into what was after it: `const a = b` without a semicolon, then `(function () {})()`.
 */
function withoutStatements(text, { body }, statements, edits = []) {
  const result = splice(text, [...edits, ...removals(text, statements)]);
  if (parseStrict(result).program.body.length !== body.length - statements.length) {
    throw new Error('removing the installs would join two statements (a missing semicolon?)');
  }
  return result;
}

/** `text` without the import bindings named in `names`. An import that holds a comment keeps its bindings. */
function dropImports(text, names) {
  if (names.size === 0) return text;
  const ast = parseStrict(text);
  const whole = [];
  const edits = [];
  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration' || !node.specifiers.some(({ local }) => names.has(local.name))) continue;
    if (hasComment(ast, node.start, node.end)) continue;
    if (node.specifiers.every(({ local }) => names.has(local.name))) whole.push(node);
    else edits.push(...specifierEdits(text, node, names));
  }
  return withoutStatements(text, ast.program, whole, edits);
}

/** The imported names whose every reference (there is one at least) is inside one of `ranges`. */
function lostBindings(program, ranges) {
  const isInside = ({ node }) => ranges.some((range) => node.start >= range.start && node.end <= range.end);
  const lost = Object.values(program.scope.bindings).filter(
    (binding) =>
      binding.kind === 'module' && binding.constantViolations.length === 0 && binding.referencePaths.length > 0 && binding.referencePaths.every(isInside),
  );
  return new Set(lost.map(({ identifier }) => identifier.name));
}

// ---- stripping ----------------------------------------------------------------------------------

/**
 * What a script installs, in source order.
 *  - `remove`: the statements to remove, `{ start, end, label }` (`label` is what the report counts);
 *  - `left`: the installs to leave, `{ start, line, text }`, with `startLine` the line `raw` starts on;
 *  - `installed`: what is installed whenever the script runs, as `SETUP` names it.
 */
function findInstalls({ ast, program }, raw, startLine) {
  const remove = [];
  const left = new Map();
  const installed = new Set();

  const leave = ({ node }) => {
    const shown = oneLine(raw.slice(node.start, node.end));
    left.set(node.start, {
      start: node.start,
      line: node.loc.start.line + startLine - 1,
      text: shown.length > SHOWN ? `${shown.slice(0, SHOWN - 3)}...` : shown,
    });
  };
  const isTopStatement = (path) => path.parentPath.isExpressionStatement() && path.parentPath.parentPath.isProgram();
  const take = ({ node }, label) => remove.push({ start: node.start, end: node.end, label });
  const isBare = ({ node }) => !hasComment(ast, node.start, node.end);

  /** `<object>.use`, called or not. */
  const onUse = (path) => {
    const { parentPath, scope } = path;
    const isCalled = (parentPath.isCallExpression() || parentPath.isOptionalCallExpression()) && parentPath.node.callee === path.node;
    const plugin = isCalled ? pluginOf(parentPath.node.arguments[0], scope) : null;
    // `Vue.use(A).use(B)` is one install to leave: its root is Vue, and the outermost call stands for it.
    let root = path.node.object;
    while (root.type === 'CallExpression' && root.callee.type === 'MemberExpression' && propertyName(root.callee) === 'use') root = root.callee.object;
    let outer = parentPath;
    while (isCalled && outer.parentPath.isMemberExpression() && outer.key === 'object' && propertyName(outer.parent) === 'use' && outer.parentPath.parentPath.isCallExpression()) {
      outer = outer.parentPath.parentPath;
    }
    const kind = vueKind(root, scope);
    if (!kind && !plugin) return;

    if (kind === 'vue' && plugin && isTopStatement(outer)) installed.add(SAME_PLUGIN[plugin] ?? plugin);
    const isPlain = path.isMemberExpression({ computed: false }) && parentPath.isCallExpression() && path.node.object === root && outer === parentPath;
    if (kind === 'vue' && plugin && isPlain && parentPath.node.arguments.length === 1 && isTopStatement(parentPath) && isBare(parentPath.parentPath)) {
      take(parentPath.parentPath, `Vue.use(${plugin})`);
    } else {
      leave(outer);
    }
  };

  /** `<object>.config.productionTip`; only an assignment to it counts. */
  const onProductionTip = (path) => {
    const { object } = path.node;
    if (object.type !== 'MemberExpression' || propertyName(object) !== 'config') return;
    const kind = vueKind(object.object, path.scope);
    const assignment = path.parentPath;
    if (!kind || !assignment.isAssignmentExpression() || path.key !== 'left') return;
    const { operator, right } = assignment.node;
    const isFalse = operator === '=' && right.type === 'BooleanLiteral' && right.value === false;
    if (kind === 'vue' && isFalse && isTopStatement(assignment) && isBare(assignment.parentPath)) take(assignment.parentPath, 'Vue.config.productionTip = false');
    else leave(assignment);
  };

  program.traverse({
    'MemberExpression|OptionalMemberExpression'(path) {
      const name = propertyName(path.node);
      if (name === 'use') onUse(path);
      else if (name === 'productionTip') onProductionTip(path);
    },
    ImportDeclaration(path) {
      const { source, specifiers } = path.node;
      if (!STYLESHEETS.includes(source.value)) return;
      installed.add(source.value);
      if (specifiers.length === 0 && isBare(path)) take(path, `import "${source.value}"`);
      else leave(path);
    },
    CallExpression(path) {
      const { callee, arguments: args } = path.node;
      const isRequire = callee.type === 'Import' || (callee.type === 'Identifier' && callee.name === 'require');
      if (isRequire && args[0]?.type === 'StringLiteral' && STYLESHEETS.includes(args[0].value)) leave(path);
    },
  });
  const inOrder = (a, b) => a.start - b.start;
  return { remove: remove.sort(inOrder), left: [...left.values()].sort(inOrder), installed };
}

/** The script of `source`, as a range with the line it starts on, or null. Throws `Unresolved` for one that is not a sole plain script. */
function scriptOf(source, file) {
  if (!file.endsWith('.vue')) return { start: 0, end: source.length, startLine: 1 };
  const script = soleScript(source, parseSfc({ source, filename: file }), unresolve);
  return script && { start: script.start, end: script.end, startLine: source.slice(0, script.start).split('\n').length };
}

/**
 * Removes what `pageSetup.js` installs from one file (see the header comment), with the imports that this leaves
 * unused.
 *
 *  - `removed`: what was removed, in source order (`Vue.use(BootstrapVue)`, whatever the local names are; the imports
 *    dropped after it are not listed);
 *  - `left`: the installs it leaves to a person, `{ line, text }`, in source order;
 *  - `unresolved`: why the file's script cannot be edited, when it has an install and is not one plain `<script>`.
 *
 * `pageSetup.js` is returned as it is, and so, unparsed, is a file without any install in its text. Throws when the
 * script does not parse, and when removing a statement would join its neighbors (a missing semicolon).
 * @param {string} source the file's text
 * @param {string} [file] the file's path relative to the repo root: it picks the file type
 * @returns {{ source: string, removed: string[], left: { line: number, text: string }[], unresolved?: string }}
 */
export function stripPlugins(source, file = '<source>') {
  const unchanged = { source, removed: [], left: [] };
  if (file === PAGE_SETUP || !CANDIDATE.test(source)) return unchanged;
  let script;
  try {
    script = scriptOf(source, file);
  } catch (error) {
    if (!(error instanceof Unresolved)) throw error;
    return { ...unchanged, unresolved: error.message };
  }
  if (!script) return unchanged;

  const raw = source.slice(script.start, script.end);
  const parsed = programPath(raw);
  const { remove, left: found } = findInstalls(parsed, raw, script.startLine);
  const left = found.map(({ line, text }) => ({ line, text }));
  if (remove.length === 0) return { ...unchanged, left };

  const result = dropImports(withoutStatements(raw, parsed.ast.program, remove), lostBindings(parsed.program, remove));
  return {
    source: source.slice(0, script.start) + result + source.slice(script.end),
    removed: remove.map(({ label }) => label),
    left,
  };
}

// ---- mounting -----------------------------------------------------------------------------------

/** Whether the script calls the `mountPage` of `pageSetup.js`. */
function callsMountPage(program, file) {
  return Object.values(program.scope.bindings).some((binding) => {
    const imported = importOf(binding);
    if (imported?.name !== 'mountPage' || resolveImport(file, imported.source, new Set([PAGE_SETUP])) === null) return false;
    return binding.referencePaths.some(({ key, parentPath }) => key === 'callee' && parentPath.isCallExpression());
  });
}

/** Whether `property` (the path of one) is a `render` that only returns `<first parameter>(Template)`, of the file's own `Template`. */
function rendersTemplate(property, program) {
  const { node } = property;
  const render = node.type === 'ObjectMethod' ? property : property.get('value');
  const isFunction = node.type === 'ObjectMethod' ? node.kind === 'method' : render.isFunctionExpression() || render.isArrowFunctionExpression();
  if (!isFunction || render.node.async || render.node.generator) return false;
  const { params, body } = render.node;
  let returned = body;
  if (body.type === 'BlockStatement') {
    const [statement, ...rest] = body.body;
    if (body.directives.length > 0 || rest.length > 0 || statement?.type !== 'ReturnStatement') return false;
    returned = statement.argument;
  }
  if (params[0]?.type !== 'Identifier' || returned?.type !== 'CallExpression') return false;
  const { callee, arguments: args } = returned;
  const isTemplate = args.length === 1 && args[0].type === 'Identifier' && args[0].name === 'Template';
  if (callee.type !== 'Identifier' || callee.name !== params[0].name || !isTemplate) return false;
  const template = program.scope.getBinding('Template');
  return template !== undefined && render.scope.getBinding('Template') === template;
}

/** The `new Vue({ ... })` to rewrite, with the call that mounts it and the `render` options to remove. */
function mountShape(program) {
  const created = [];
  program.traverse({
    NewExpression(path) {
      if (vueKind(path.node.callee, path.scope) === 'vue') created.push(path);
    },
  });
  if (created.length === 0) return unresolve('no `new Vue({ ... })`, with `Vue` the default import of "vue"');
  if (created.length > 1) return unresolve(`${created.length} \`new Vue\` calls`);
  const [vue] = created;
  const options = vue.node.arguments[0];
  if (vue.node.arguments.length !== 1 || options.type !== 'ObjectExpression') return unresolve('the options of `new Vue` are not one object literal');

  const properties = vue.get('arguments.0.properties');
  if (properties.some((property) => property.isSpreadElement())) return unresolve('the options contain a spread, which could hold `render`');
  if (options.properties.some(({ computed }) => computed)) return unresolve('the options have a computed key, which could be `render`');
  const named = (name) => properties.filter(({ node }) => keyName(node) === name);
  for (const name of ['el', 'template']) if (named(name).length > 0) return unresolve(`the options have \`${name}\``);

  const mount = vue.parentPath.parentPath;
  const isMounted =
    vue.parentPath.isMemberExpression({ computed: false }) &&
    vue.key === 'object' &&
    vue.parent.property.name === '$mount' &&
    mount.isCallExpression() &&
    vue.parentPath.key === 'callee' &&
    mount.node.arguments.length === 1 &&
    mount.node.arguments[0].type === 'StringLiteral' &&
    mount.node.arguments[0].value === '#app';
  if (!isMounted) return unresolve('not mounted with `.$mount("#app")`');
  if (!mount.parentPath.isExpressionStatement() || !mount.parentPath.parentPath.isProgram()) {
    return unresolve('`new Vue({ ... }).$mount("#app")` is not a statement of its own at the top level');
  }
  // Parentheses that open before `new` would hold the marker, and can close among what is replaced.
  if (mount.parent.start !== vue.node.start) return unresolve('parentheses around `new Vue({ ... })`');

  const renders = named('render');
  if (renders.length === 0) return unresolve('no `render` option');
  // Two `render` options are one to Vue (the later), so all of them must do the same thing.
  if (!renders.every((property) => rendersTemplate(property, program))) {
    return unresolve('`render` does something else than return `<its first parameter>(Template)`');
  }
  if (program.scope.hasBinding('mountPage', true)) return unresolve('`mountPage` is declared in the file already');
  return { vue: vue.node, options, mount: mount.node, renders: renders.map(({ node }) => node) };
}

/** Edits that remove the properties `dropped` from the object literal `options`. */
function propertyRemovals(text, ast, options, dropped) {
  const ranges = dropped.map((property) => {
    const trivia = /(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*)*/y;
    trivia.lastIndex = property.end;
    trivia.test(text);
    const hasComma = text[trivia.lastIndex] === ',';
    if (hasComment(ast, property.start, hasComma ? trivia.lastIndex : property.end)) return unresolve('a comment inside `render` would be deleted with it');
    const range = { start: property.start, end: hasComma ? trivia.lastIndex + 1 : property.end };
    // The last of several on a line: the comma before it goes instead.
    const previous = options.properties[options.properties.indexOf(property) - 1];
    const sharesLine = previous && !text.slice(previous.end, range.start).includes('\n');
    if (!hasComma && sharesLine && !dropped.includes(previous) && !hasComment(ast, previous.end, range.start)) range.start = previous.end;
    return range;
  });
  return removals(text, ranges, { start: options.start + 1, end: options.end - 1 });
}

/**
 * Edits that put the marker on the line above the call that starts at `vue`, unless one is there. eslint-plugin-vue
 * looks for it on the line before the one the options open on, which is the call's own line once it is rewritten.
 */
function markerEdits(text, { comments }, vue, eol) {
  if (comments.some(({ value, loc }) => /@vue\/component/.test(value) && loc.end.line === vue.loc.start.line - 1)) return [];
  const indent = lineIndent(text, vue.start);
  const marker = `${COMPONENT_MARKER}${eol}${indent}`;
  const before = text.slice(text.lastIndexOf('\n', vue.start) + 1, vue.start);
  if (isBlank(before)) return [{ start: vue.start, end: vue.start, text: marker }];
  // What shares the line stays on it, and the call moves to one of its own.
  return [{ start: vue.start - /[ \t]*$/.exec(before)[0].length, end: vue.start, text: `${eol}${indent}${marker}` }];
}

/**
 * Mounts an entry through `mountPage` (see the header comment): `new Vue({ ... }).$mount("#app")` becomes
 * `mountPage(Template, { ... })` without its `render` and with the marker above it, `mountPage` is imported before the
 * first import, and the import of Vue goes with its last reference. An entry that calls `mountPage` already comes back
 * as it is.
 *
 * For an entry of any other shape the result is the reason, alone.
 * @param {string} source the entry's text
 * @param {string} [file] the entry's path relative to the repo root
 * @returns {{ source: string } | { unresolved: string }}
 */
export function mountEntry(source, file = '<source>') {
  let parsed;
  try {
    parsed = programPath(source);
  } catch (error) {
    return { unresolved: `does not parse: ${oneLine(error.message)}` };
  }
  const { ast, program } = parsed;
  if (callsMountPage(program, file)) return { source };
  try {
    const { vue, options, mount, renders } = mountShape(program);
    if (hasComment(ast, vue.start, options.start) || hasComment(ast, options.end, mount.end)) {
      return unresolve('a comment between `new Vue(`, its options and `.$mount("#app")` would be deleted');
    }
    // There is one: `Vue` is imported.
    const first = ast.program.body.find(({ type }) => type === 'ImportDeclaration');
    const firstBreak = source.indexOf('\n');
    const eol = firstBreak > 0 && source[firstBreak - 1] === '\r' ? '\r\n' : '\n';
    const text = splice(source, [
      { start: first.start, end: first.start, text: `${MOUNT_IMPORT}${eol}${lineIndent(source, first.start)}` },
      ...markerEdits(source, ast, vue, eol),
      { start: vue.start, end: options.start, text: 'mountPage(Template, ' },
      ...propertyRemovals(source, ast, options, renders),
      { start: options.end, end: mount.end, text: ')' },
    ]);
    return { source: dropImports(text, lostBindings(program, [{ start: vue.start, end: options.start }])) };
  } catch (error) {
    if (!(error instanceof Unresolved)) throw error;
    return { unresolved: error.message };
  }
}

// ---- the tree -----------------------------------------------------------------------------------

/** What one file installs whenever it runs, as `SETUP` names it. Nothing for a script that cannot be read. */
function installedBy(source, file) {
  if (!CANDIDATE.test(source)) return [];
  try {
    const script = scriptOf(source, file);
    if (!script) return [];
    const raw = source.slice(script.start, script.end);
    return findInstalls(programPath(raw), raw, script.startLine).installed;
  } catch {
    return [];
  }
}

/**
 * What each page gets: the plugins of `pageSetup.js` installed, and the two Bootstrap stylesheets imported, by any
 * file its entry reaches (`reachable`), as the `SETUP` names. `IconsPlugin` counts as `BootstrapVueIcons`. An install
 * counts when it runs whenever its file does: a statement at the top level, with options or without.
 * @param {Map<string, string>} sources file path -> source text
 * @param {import('./component-graph.mjs').ScanError[]} [errors] receives the parse errors
 * @returns {Map<string, Set<string>>}
 */
export function pagePlugins(sources, errors = []) {
  const imports = scanImports(sources, errors);
  const installed = new Map([...sources].map(([file, source]) => [file, installedBy(source, file)]));
  const pages = new Map();
  for (const entry of pageEntries(sources)) {
    const plugins = new Set([...reachable(imports, entry)].flatMap((file) => [...installed.get(file)]));
    pages.set(entry, new Set(SETUP.filter((name) => plugins.has(name))));
  }
  return pages;
}

/**
 * Strips the files under `<root>/src` and mounts its entries, and writes them unless `dryRun`.
 *
 *  - `changed`: the files (relative to `root`, sorted) written, or in a dry run the files a real run would write.
 *    Empty when any file failed to parse;
 *  - `failed`: `{ file, message }`, sorted. A file that does not parse, or whose new text does not, in which case
 *    nothing is written at all, or whose write throws, in which case the other files are still written;
 *  - `unresolved`: the files left as they are for a person, `{ file, reason }`, sorted;
 *  - `left`: the installs left in place, `{ file, line, text }`, sorted;
 *  - `pages`: the pages that gain or lose something, `{ entry, gained, lost }`, sorted (see `pagePlugins`);
 *  - `planned`: how many files have a change, written or not;
 *  - `entries`: how many entries are `converted` by this, and `done` before it;
 *  - `removed`: what was removed -> how often, sorted.
 *
 * Throws when `<root>/src` does not exist. `write(absPath, text)` and `strip(source, file)` default to
 * `fs.writeFileSync` and `stripPlugins`; they are seams for tests.
 * @param {{ root: string, dryRun?: boolean, write?: (path: string, text: string) => void, strip?: typeof stripPlugins }} options
 */
export function setupTree({ root, dryRun = false, write = writeFileSync, strip = stripPlugins }) {
  const sources = readSources(root);
  const entryFiles = new Set(pageEntries(sources));
  const parseErrors = [];
  const before = pagePlugins(sources, parseErrors);
  const failed = parseErrors.map(({ file, message }) => failure(file, message));
  const broken = new Set(failed.map(({ file }) => file));

  const outputs = new Map();
  const unresolved = [];
  const left = [];
  const entries = { converted: 0, done: 0 };
  const counts = new Map();
  for (const [file, source] of sources) {
    if (broken.has(file)) continue;
    try {
      const stripped = strip(source, file);
      left.push(...stripped.left.map((install) => ({ file, ...install })));
      const mounted = entryFiles.has(file) ? mountEntry(stripped.source, file) : stripped;
      const reason = stripped.unresolved ?? mounted.unresolved;
      if (reason !== undefined) {
        unresolved.push({ file, reason });
        continue;
      }
      if (mounted.source !== source) {
        assertParses(file, source, mounted.source);
        outputs.set(file, mounted.source);
      }
      if (entryFiles.has(file)) entries[mounted.source === stripped.source ? 'done' : 'converted']++;
      for (const label of stripped.removed) counts.set(label, (counts.get(label) ?? 0) + 1);
    } catch (error) {
      failed.push(failure(file, error));
    }
  }

  const after = pagePlugins(new Map([...sources, ...outputs]));
  const pages = [];
  for (const [entry, had] of before) {
    const has = after.get(entry);
    const gained = [...has].filter((name) => !had.has(name));
    const lost = [...had].filter((name) => !has.has(name));
    if (gained.length > 0 || lost.length > 0) pages.push({ entry, gained, lost });
  }

  // One file that does not parse stops the run: the others were changed by the same rules.
  const changed = [];
  if (failed.length === 0) {
    for (const [file, text] of outputs) {
      try {
        if (!dryRun) write(join(root, file), text);
        changed.push(file);
      } catch (error) {
        failed.push(failure(file, `write failed: ${error instanceof Error ? error.message : error}`));
      }
    }
  }
  failed.sort((a, b) => byCodeUnit(a.file, b.file));
  const removed = new Map([...counts].sort(([a], [b]) => byCodeUnit(a, b)));
  return { changed, failed, unresolved, left, pages, planned: outputs.size, entries, removed };
}

const LEFT_NOTE =
  'Each of these still runs where it is, after `pageSetup.js`. An install of a plugin that `pageSetup.js` has installed does nothing there, and its options are ignored: move those into `pageSetup.js` by hand. A plugin of one page belongs in the third argument of its `mountPage`.';
const UNRESOLVED_NOTE =
  'These files are not changed. Convert every entry listed here by hand before it is built, whether its page loses something below or not: its store is stripped like any other file, and creates its `Vuex.Store` when it is imported, before the entry can install Vuex itself. In a component, leave one plain `<script>` block, or take out its installs, stylesheet imports and what they leave unused by hand. Then run this again.';
const PAGES_NOTE =
  'What runs when the files of a page load, by reachability from its entry, before and after. A page that loses something does not reach `pageSetup.js`: its entry is unresolved.';

/** A table with the given header cells, or `None.` when it has no rows. */
const table = (header, rows) =>
  rows.length === 0 ? ['None.'] : [`| ${header.join(' | ')} |`, `|${' --- |'.repeat(header.length)}`, ...rows.map((cells) => `| ${cells.map(cell).join(' | ')} |`)];

function renderReport({ dryRun, changed, failed, unresolved, left, pages, planned, entries, removed }) {
  const codes = (names) => names.map(code).join(', ');
  const lines = [
    `# Page setup${dryRun ? ' (dry run)' : ''}`,
    '',
    '| Total | Count |',
    '| --- | ---: |',
    `| Entries converted | ${entries.converted} |`,
    `| Entries already on pageSetup | ${entries.done} |`,
    `| Files to change | ${planned} |`,
    `| Unresolved | ${unresolved.length} |`,
    `| Left in place | ${left.length} |`,
    `| Pages that gain | ${pages.filter(({ gained }) => gained.length > 0).length} |`,
    `| Pages that lose | ${pages.filter(({ lost }) => lost.length > 0).length} |`,
  ];

  lines.push('', '## Unresolved', '');
  if (unresolved.length > 0) lines.push(UNRESOLVED_NOTE, '');
  lines.push(...table(['file', 'reason'], unresolved.map(({ file, reason }) => [code(file), reason])));

  lines.push('', '## Left in place', '');
  if (left.length > 0) lines.push(LEFT_NOTE, '');
  lines.push(...table(['file:line', 'code'], left.map(({ file, line, text }) => [code(`${file}:${line}`), code(text)])));

  lines.push('', '## Pages that gain or lose something', '');
  if (pages.length > 0) lines.push(PAGES_NOTE, '');
  lines.push(...table(['page', 'gains', 'loses'], pages.map(({ entry, gained, lost }) => [code(pageName(entry)), codes(gained), codes(lost)])));

  lines.push('', '## Removed', '', ...table(['what', 'count'], [...removed].map(([label, count]) => [code(label), String(count)])));

  if (failed.length > 0) {
    lines.push('', '## Failed', '');
    for (const { file, message } of failed) lines.push(`- ${code(file)}: ${message}`);
    if (changed.length === 0) lines.push('', dryRun ? 'A real run would write nothing.' : 'Nothing was written.');
  }

  lines.push('', dryRun ? '## Files that would change' : '## Changed files', '');
  if (changed.length === 0) lines.push('None.');
  for (const file of changed) lines.push(`- ${code(file)}`);
  return `${lines.join('\n')}\n`;
}

/**
 * Moves the tree under `root` onto `pageSetup.js`, and writes it unless `--dry-run`.
 *
 * `root` defaults to the repo root and `--root <dir>` overrides it. `write(absPath, contents)` and
 * `strip(source, file)` default to `fs.writeFileSync` and `stripPlugins`; they are seams for tests. The report goes to
 * `out`, usage errors and a one-line summary of what failed go to `err`.
 *
 * @param {string[]} argv
 * @param {{ root?: string, write?: (path: string, contents: string) => void, strip?: typeof stripPlugins,
 *   out?: { write: (text: string) => unknown }, err?: { write: (text: string) => unknown } }} [deps]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, deps = {}) {
  const { root: defaultRoot = repoRoot, write = writeFileSync, strip = stripPlugins, out = process.stdout, err = process.stderr } = deps;

  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    err.write(`${error.message}\n${USAGE}\n`);
    return 2;
  }
  const root = resolve(options.root ?? defaultRoot);
  if (!hasSrc(root)) {
    err.write(`${root} is not a directory with a src/ folder\n${USAGE}\n`);
    return 2;
  }
  if (!existsSync(join(root, PAGE_SETUP))) {
    err.write(`page-setup: ${root} has no ${PAGE_SETUP} to move the installs to; merge it first\n`);
    return 2;
  }

  const tree = setupTree({ root, dryRun: options.dryRun, write, strip });
  out.write(renderReport({ dryRun: options.dryRun, ...tree }));

  if (tree.failed.length > 0) {
    const effect = tree.changed.length > 0 ? '' : options.dryRun ? '; a real run would write nothing' : '; nothing was written';
    err.write(`page-setup: ${tree.failed.length} file(s) failed${effect}; see the Failed section of the report\n`);
    return 1;
  }
  return 0;
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

// Run the CLI only when executed directly, so tests can import `run`.
if (isMain()) {
  run(process.argv.slice(2)).then(
    (exitCode) => {
      process.exitCode = exitCode;
    },
    (error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    },
  );
}
