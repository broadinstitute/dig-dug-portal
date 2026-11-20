// Source writer for the Vue 3 registration codemod: puts the registrations the planner chose
// (`register-plan.mjs`) into the text of one `.vue` file. Nothing is read or written on disk.
//
//   const { source: next, changed } = applyRegistrations(source, edits.get(file), file);
//
// Every change is a text splice at a position found by the SFC parser or Babel. Bytes outside the
// splices stay as they were: no reformatting, and the file keeps its line endings (LF or CRLF).
import { posix } from 'node:path';
import { parse as parseBabel } from '@babel/parser';
import { parse as parseSfc } from 'vue/compiler-sfc';
import { BABEL_OPTIONS, isVueComponentCall, toKebab, toKey } from './component-graph.mjs';

export const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
export const isBlank = (text) => /^\s*$/.test(text);

/** Indentation of the line that holds `offset`. */
export function lineIndent(text, offset) {
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
  return /^[ \t]*/.exec(text.slice(lineStart))[0];
}

/** Offset of the first character at or after `from` that is not whitespace or inside a comment. */
function skipTrivia(text, from) {
  let i = from;
  for (;;) {
    while (/\s/.test(text[i] ?? '')) i++;
    if (text.startsWith('//', i)) {
      const end = text.indexOf('\n', i);
      i = end === -1 ? text.length : end;
    } else if (text.startsWith('/*', i)) {
      const close = text.indexOf('*/', i + 2);
      i = close === -1 ? text.length : close + 2;
    } else {
      return i;
    }
  }
}

/**
 * Where the line that `from` is on ends, when nothing but a comment follows `from` on it: the offset
 * of its `\r` or `\n`, or the end of `text`. When code follows, or a comment runs on to another line,
 * `from` itself. New lines go here, after a trailing comment, so the comment stays with its code.
 */
export function lineEnd(text, from) {
  let i = from;
  for (;;) {
    while (text[i] === ' ' || text[i] === '\t') i++;
    if (text.startsWith('/*', i)) {
      const close = text.indexOf('*/', i + 2);
      if (close === -1 || text.slice(i, close).includes('\n')) return from;
      i = close + 2;
    } else if (text.startsWith('//', i)) {
      while (i < text.length && text[i] !== '\r' && text[i] !== '\n') i++;
      return i;
    } else {
      return i >= text.length || text[i] === '\r' || text[i] === '\n' ? i : from;
    }
  }
}

/** The key of an object property as written (`foo` and `"foo"` are both `foo`), or null when it is not known. */
export function keyName(property) {
  if (property.type === 'SpreadElement' || property.computed) return null;
  const { key } = property;
  if (key.type === 'Identifier') return key.name;
  return key.type === 'StringLiteral' ? key.value : null;
}

/** Every name the top level of a script declares: imports, variables (destructured too), functions, classes. */
function declaredNames(body) {
  const names = new Set();
  const addPattern = (pattern) => {
    if (pattern.type === 'Identifier') names.add(pattern.name);
    else if (pattern.type === 'ObjectPattern') pattern.properties.forEach((property) => addPattern(property.value ?? property.argument));
    else if (pattern.type === 'ArrayPattern') pattern.elements.forEach((element) => element && addPattern(element));
    else if (pattern.type === 'AssignmentPattern') addPattern(pattern.left);
    else if (pattern.type === 'RestElement') addPattern(pattern.argument);
  };
  const addDeclaration = (node) => {
    if (node.type === 'VariableDeclaration') node.declarations.forEach((declarator) => addPattern(declarator.id));
    else if ((node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') && node.id) names.add(node.id.name);
  };
  for (const node of body) {
    if (node.type === 'ImportDeclaration') node.specifiers.forEach((specifier) => names.add(specifier.local.name));
    else if (node.type === 'ExportNamedDeclaration' && node.declaration) addDeclaration(node.declaration);
    else addDeclaration(node);
  }
  return names;
}

/**
 * The `@/...vue` form of a specifier that names a file of this repo, so that `./DownloadChart.vue`
 * (from `src/components/X.vue`), `@/components/DownloadChart` and `@/components/DownloadChart.vue` are
 * one source. Anything else (a package, a file outside `src/`, a specifier with another extension) is as written.
 */
function canonicalSource(specifier, file) {
  let local = specifier;
  if (/^\.{1,2}\//.test(specifier) && file.startsWith('src/')) {
    const path = posix.join(posix.dirname(file), specifier);
    if (path.startsWith('src/')) local = `@/${path.slice('src/'.length)}`;
  }
  return local.startsWith('@/') && !/\.\w+$/.test(local) ? `${local}.vue` : local;
}

/** Local name of the default import of each source: `import Local from "source"` -> `source -> Local`, sources as `canonicalSource` writes them. */
function defaultImports(body, file) {
  const imported = new Map();
  for (const node of body) {
    if (node.type !== 'ImportDeclaration') continue;
    const specifier = node.specifiers.find(({ type }) => type === 'ImportDefaultSpecifier');
    const source = canonicalSource(node.source.value, file);
    if (specifier && !imported.has(source)) imported.set(source, specifier.local.name);
  }
  return imported;
}

/**
 * What to import and what to register for `entries` (sorted, with unique keys). An entry whose key, or
 * whose tag's kebab-case name, is in `present` is skipped. A source that is already imported by default
 * (however `canonicalSource` spells it) is reused under that name. Otherwise it is imported as the key,
 * or as `<Key>Component` (then `<Key>Component2`, ...) when a binding of that name exists. `importedAs`
 * and `bindings` are updated as entries are placed, so two entries never declare the same name and one
 * source is never imported twice.
 * Returns the `import` statements to add and the `components` entries (`Key` or `Key: Local`). A tag
 * that its key does not round-trip to (`gene-set-2-phenotype` -> `GeneSet2Phenotype` -> `gene-set2-phenotype`)
 * is registered under its own kebab-case name instead, `"gene-set-2-phenotype": Local`: Vue looks up the
 * exact name first, and the lint rule `vue/no-undef-components` compares kebab-case names.
 */
function resolveEntries(entries, file, { present, importedAs, bindings }) {
  const imports = [];
  const registrations = [];
  for (const { tag, key, source } of entries) {
    const kebab = toKebab(tag);
    if (present.has(key) || present.has(kebab)) continue;
    const same = canonicalSource(source, file);
    let local = importedAs.get(same);
    if (local === undefined) {
      local = key;
      if (bindings.has(local)) {
        local = `${key}Component`;
        for (let n = 2; bindings.has(local); n++) local = `${key}Component${n}`;
      }
      bindings.add(local);
      importedAs.set(same, local);
      imports.push(`import ${local} from ${JSON.stringify(source)};`);
    }
    const name = kebab === toKebab(key) ? key : JSON.stringify(kebab);
    registrations.push(local === name ? name : `${name}: ${local}`);
  }
  return { imports, registrations };
}

/** A whole script body for a file that has none: the imports, then `export default { components: { ... } };`. */
function newScriptBody({ imports, registrations }, eol) {
  const unit = '    ';
  return [
    ...imports,
    '',
    'export default {',
    `${unit}components: {`,
    ...registrations.map((registration) => `${unit}${unit}${registration},`),
    `${unit}},`,
    '};',
  ].join(eol);
}

/** `components: { ... },` as lines at `indent`, joined with `eol`. */
function componentsBlock(indent, unit, registrations, eol) {
  return [`${indent}components: {`, ...registrations.map((registration) => `${indent}${unit}${registration},`), `${indent}},`].join(eol);
}

/**
 * The indentation step of the component options: how far the first property is indented from the
 * line the options object opens on. A file that does not show one (a first property level with the
 * brace, an empty object) gets a tab when it is tab-indented, else four spaces.
 */
export function indentUnit(raw, options) {
  const outer = lineIndent(raw, options.start);
  const first = options.properties[0];
  const inner = first ? lineIndent(raw, first.start) : outer;
  if (inner.length > outer.length && inner.startsWith(outer)) return inner.slice(outer.length);
  return outer.includes('\t') || inner.includes('\t') ? '\t' : '    ';
}

/**
 * Edit that puts `lines` (indented, joined, no outer line breaks) inside the empty braces of `node`
 * (`{}`, `{ }` or `{` and `}` on lines of their own). A closing brace that shares the line with the
 * opening one moves to its own line at `closeIndent`.
 */
export function fillEmpty(raw, node, lines, closeIndent, eol) {
  const interior = raw.slice(node.start + 1, node.end - 1);
  if (interior.includes('\n')) {
    const at = lineEnd(raw, node.start + 1);
    return { start: at, end: at, text: `${eol}${lines}` };
  }
  // `{}` and `{ }` are replaced; `{ /* none */ }` keeps its comment.
  const start = isBlank(interior) ? node.start + 1 : node.end - 1;
  return { start, end: node.end - 1, text: `${eol}${lines}${eol}${closeIndent}` };
}

/** The options object of the component: the `{...}` of `export default {...}` or `export default Vue.component("name", {...})`. */
function optionsObject(body, fail) {
  const declaration = body.find((node) => node.type === 'ExportDefaultDeclaration')?.declaration;
  if (declaration?.type === 'ObjectExpression') return declaration;
  if (declaration?.type === 'CallExpression' && isVueComponentCall(declaration)) {
    const [name, options, ...rest] = declaration.arguments;
    if (name?.type === 'StringLiteral' && options?.type === 'ObjectExpression' && rest.length === 0) return options;
  }
  return fail('the script has no `export default { ... }` or `export default Vue.component("name", { ... })` to add `components` to');
}

/** The `components` property of the options (the last one wins), or null. */
function componentsProperty(options, fail) {
  if (options.properties.some(({ type }) => type === 'SpreadElement')) {
    fail('the component options contain a spread, so where `components` comes from is unclear');
  }
  const found = options.properties.filter((property) => keyName(property) === 'components').at(-1);
  if (found && (found.type !== 'ObjectProperty' || found.value.type !== 'ObjectExpression')) {
    fail('`components` is not an object literal');
  }
  return found ?? null;
}

/** Edit for the import statements: after the last import, or at the top of the script. */
function importsEdit(raw, body, imports, eol) {
  const last = body.filter(({ type }) => type === 'ImportDeclaration').at(-1);
  const lines = (indent) => imports.map((statement) => `${eol}${indent}${statement}`).join('');
  if (last) {
    const at = lineEnd(raw, last.end);
    return { start: at, end: at, text: lines(lineIndent(raw, last.start)) };
  }
  return { start: 0, end: 0, text: lines(body[0] ? lineIndent(raw, body[0].start) : '') };
}

/** Edits that add `registrations` to the existing `components` object. */
function extendComponents(raw, property, registrations, unit, eol) {
  const object = property.value;
  if (object.properties.length === 0) {
    const indent = lineIndent(raw, property.start);
    return [fillEmpty(raw, object, registrations.map((registration) => `${indent}${unit}${registration},`).join(eol), indent, eol)];
  }
  const last = object.properties.at(-1);
  const commaAt = skipTrivia(raw, last.end);
  const hasComma = raw[commaAt] === ',';
  const afterLast = hasComma ? commaAt + 1 : last.end;
  if (!raw.slice(afterLast, object.end).includes('\n')) {
    // `{ A, B }`: the new entries stay on that line, and a trailing comma stays last.
    return [{ start: last.end, end: last.end, text: registrations.map((registration) => `, ${registration}`).join('') }];
  }
  const indent = lineIndent(raw, last.start);
  const at = lineEnd(raw, afterLast);
  const edits = hasComma ? [] : [{ start: last.end, end: last.end, text: ',' }];
  edits.push({ start: at, end: at, text: registrations.map((registration) => `${eol}${indent}${registration},`).join('') });
  return edits;
}

/**
 * Edit that adds a property as the first property of the options object. `lines(indent)` is its text
 * (one or more lines, joined with `eol`, no outer line breaks): `indent` is that of the first property,
 * or one `unit` in from the line the braces are on when the object is empty.
 */
export function addFirstProperty(raw, options, lines, unit, eol) {
  const first = options.properties[0];
  if (first) {
    const at = lineEnd(raw, options.start + 1);
    return { start: at, end: at, text: `${eol}${lines(lineIndent(raw, first.start))}` };
  }
  const outer = lineIndent(raw, options.start);
  return fillEmpty(raw, options, lines(outer + unit), outer, eol);
}

/** Edit that adds a `components` property as the first property of the options object. */
function newComponents(raw, options, registrations, unit, eol) {
  return addFirstProperty(raw, options, (indent) => componentsBlock(indent, unit, registrations, eol), unit, eol);
}

/** The script's own edits, in the script's coordinates (`raw` is its text). */
function editScript(raw, entries, eol, file, fail) {
  if (isBlank(raw)) {
    // A `<script>` with nothing in it is filled in place.
    const added = resolveEntries(entries, file, { present: new Set(), importedAs: new Map(), bindings: new Set() });
    return [{ start: 0, end: raw.length, text: `${eol}${newScriptBody(added, eol)}${eol}` }];
  }
  let ast;
  try {
    ast = parseBabel(raw, { ...BABEL_OPTIONS, errorRecovery: false });
  } catch (error) {
    return fail(`the <script> does not parse: ${error.message}`);
  }
  const { body } = ast.program;
  const options = optionsObject(body, fail);
  const components = componentsProperty(options, fail);
  // Each existing key as written and as `toKey` spells it: `"page-header"` is also `PageHeader`.
  const names = (components?.value.properties ?? []).map(keyName).filter((name) => name !== null);
  const present = new Set(names.flatMap((name) => [name, toKey(name)]));
  const added = resolveEntries(entries, file, { present, importedAs: defaultImports(body, file), bindings: declaredNames(body) });
  if (added.registrations.length === 0) return [];

  const unit = indentUnit(raw, options);
  const edits = added.imports.length > 0 ? [importsEdit(raw, body, added.imports, eol)] : [];
  if (components) edits.push(...extendComponents(raw, components, added.registrations, unit, eol));
  else edits.push(newComponents(raw, options, added.registrations, unit, eol));
  return edits;
}

/**
 * The file's one script block, or null when it has none. The SFC parser keeps only the last of
 * several `<script>` blocks, so the openers are counted separately: the writer cannot tell which
 * of two blocks a person means, so it refuses.
 */
export function soleScript(source, descriptor, fail) {
  const { script, scriptSetup } = descriptor;
  if (scriptSetup) fail('has a <script setup> block');
  if (!script) return null;
  const { lang, src } = script.attrs;
  if (src !== undefined) fail('has a <script src="..."> block, whose code is in another file');
  if (lang !== undefined && !/^jsx?$/.test(lang)) fail(`has a <script lang="${lang}"> block, which is not plain JavaScript`);
  const others = [descriptor.template, ...descriptor.styles, ...descriptor.customBlocks].filter(Boolean);
  let openers = 0;
  for (const { index } of source.matchAll(/<script[\s>]/g)) {
    const inside = [...others, script].some((block) => index >= block.start && index < block.end);
    if (!inside) openers++;
  }
  if (openers > 1) fail('has more than one <script> block');
  return script;
}

/** Edits applied in position order; edits at one position keep their order. */
export function splice(source, edits) {
  let result = '';
  let at = 0;
  for (const edit of [...edits].sort((a, b) => a.start - b.start)) {
    if (edit.start < at) throw new Error('overlapping edits');
    result += source.slice(at, edit.start) + edit.text;
    at = edit.end;
  }
  return result + source.slice(at);
}

/**
 * Registers `entries` in the `components` option of a `.vue` file's component, importing what they need.
 *
 *  - No `<script>`: a new one goes right after `</template>` (before any `<style>`), with the imports
 *    and `export default { components: { ... } };`. A `<script>` with nothing in it is filled in place.
 *  - `export default Vue.component("name", { ... })` or `export default { ... }`: keys missing from its
 *    `components` object are added after the last entry, one per line with a trailing comma (on the
 *    same line when the object is on one line). Without a `components` option, one is added as the first
 *    property. New lines are indented like the existing first property; one level deeper is the
 *    file's own step (a tab, two spaces, ...) and four spaces when the file shows none.
 *  - Imports go after the last `import` (or at the top of the script). A source already imported by
 *    default is reused (`Key: Local`, or `Key` when the names match); `./A.vue` (relative to `file`),
 *    `@/x/A` and `@/x/A.vue` count as one source. A name already declared in the script means the
 *    new import is `<Key>Component`, registered as `Key: <Key>Component`.
 *  - A tag that its key does not round-trip to (digit segments: `<gene-set-2-phenotype>` has the key
 *    `GeneSet2Phenotype`, whose kebab-case form is `gene-set2-phenotype`) is registered as the string key
 *    `"gene-set-2-phenotype": GeneSet2Phenotype`, with the import named as above.
 *  - Keys are compared as written and as `toKey` of the existing key (`"page-header"` and `PageHeader` are
 *    the same), and also against the tag's kebab-case name; a key that is already registered is left alone. New entries are ordered by key. With nothing
 *    to add the result is `{ source, changed: false }`, and a second run changes nothing.
 *  - Inserted lines use the file's line ending, taken from its first line break.
 *
 * Throws an `Error` that starts with `<file>: ` for a shape it will not guess at: two `<script>`
 * blocks, `<script setup>`, `lang="ts"`, a `<script src>`, a script that does not parse, no
 * `export default` of those two forms, a spread in the options, a `components` that is not an
 * object literal, no `<template>` to put a script after, or two entries with one key.
 * With no entries it returns at once and checks nothing.
 * @param {string} source the `.vue` file's text
 * @param {import('./register-plan.mjs').Entry[]} entries the registrations to add, as planned for this file
 * @param {string} [file] the file's path relative to the repo root (`src/components/A.vue`): it names the
 *   file in error messages and resolves the relative imports that are compared with the entries' sources
 * @returns {{ source: string, changed: boolean }}
 */
export function applyRegistrations(source, entries, file = '<source>') {
  if (entries.length === 0) return { source, changed: false };
  const fail = (message) => {
    throw new Error(`${file}: ${message}`);
  };
  const sorted = [...entries].sort((a, b) => byCodeUnit(a.key, b.key));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].key === sorted[i - 1].key) fail(`two entries for ${sorted[i].key}`);
  }
  const firstBreak = source.indexOf('\n');
  const eol = firstBreak > 0 && source[firstBreak - 1] === '\r' ? '\r\n' : '\n';

  const descriptor = parseSfc({ source, filename: file });
  const script = soleScript(source, descriptor, fail);
  let edits;
  if (script) {
    const raw = source.slice(script.start, script.end);
    edits = editScript(raw, sorted, eol, file, fail).map((edit) => ({
      start: edit.start + script.start,
      end: edit.end + script.start,
      text: edit.text,
    }));
  } else {
    if (!descriptor.template) fail('has no <script> and no <template> to put one after');
    const close = /<\/template\s*>/y;
    close.lastIndex = descriptor.template.end;
    if (!close.test(source)) fail('cannot find the </template> that ends the template');
    const added = resolveEntries(sorted, file, { present: new Set(), importedAs: new Map(), bindings: new Set() });
    const text = `${eol}${eol}<script>${eol}${newScriptBody(added, eol)}${eol}</script>`;
    edits = [{ start: close.lastIndex, end: close.lastIndex, text }];
  }
  return edits.length === 0 ? { source, changed: false } : { source: splice(source, edits), changed: true };
}
