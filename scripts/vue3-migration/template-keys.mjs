// Moves the key of the children of a `<template v-for>` onto the template, as Vue 3 wants it. Run it from the
// repo root, or against another checkout with `--root`:
//
//   node scripts/vue3-migration/template-keys.mjs --dry-run                  # report only
//   node scripts/vue3-migration/template-keys.mjs                            # write the keys
//   node scripts/vue3-migration/template-keys.mjs --root <dir> [--dry-run]   # another checkout (the switch branch)
//
//   <template v-for="a in as">            <template v-for="a in as" :key="a.id">
//       <dt :key="a.id">{{ a.x }}</dt>  ->      <dt>{{ a.x }}</dt>
//       <dd :key="a.id">{{ a.y }}</dd>          <dd>{{ a.y }}</dd>
//   </template>                           </template>
//
// Vue 2.7 refuses a key on a `<template>` ("<template> cannot be keyed") and Vue 3 refuses it on a child of a
// `<template v-for>` ("<template v-for> key should be placed on the <template> tag"), so the move belongs in the
// switch to Vue 3 and not before. It needs no Vue 2.7 compiler: only the parser (`vue-eslint-parser`) and the
// shared helpers, so it runs on a branch whose `node_modules` has Vue 3. When `@vue/compiler-sfc` 3.x can be
// found from the root, every file that is changed, or has something left or kept, is also compiled by it, as a last
// check of what the script writes and as a list of the key errors that Vue 3 still has there; the report says
// whether that ran.
//
// What it does, and why, one ruling at a time:
//
//  - Only the children that Vue 3 refuses move: an element, a component, a `<slot>` or a `<template>` with no
//    `v-if`, `v-else-if`, `v-else` or `v-for` of its own. Vue 3 does not look at where the key of the others is,
//    because it has turned them into a condition or a loop of their own before it checks. That keeps the key of a
//    `v-if` / `v-else` chain where it is. Vue 3 keeps a key written on a branch and numbers only a branch with
//    none, so a chain whose branches have different keys is replaced when it switches, as on 2.7, and a chain
//    whose branches share a key such as `a.id` is patched in place, as on 2.7. A key moved to the template
//    would give the branches the numbers 0 and 1, and replace the element on every switch. A child with a `v-for`
//    of its own keeps its key for its own loop (the key often uses the loop's variable, which the template has
//    not got). Both are listed under Kept, with the reason, so that what the script leaves can be audited. Where
//    every keyed child of a template is of this kind, the template stays without a key: Vue 3 then patches its
//    iterations by position where 2.7 moves them by key. That is the same on screen; a list that is reordered
//    recreates the keyed elements. A shared key can be written on such a template by hand, beside the keys of the
//    children.
//  - But Vue 3 does refuse two branches of one chain that have the same key when it is simple: a bare variable of
//    the template (a loop or slot variable: `:key="name"`), a literal, or a static `key="k"` ("v-if/else branches
//    must use unique keys"). Other keys (`a.id`, `a + 1`, a call, a name that is no variable of the template) it
//    takes. Such a chain, among the children of a `<template v-for>`, is listed under Left and not edited: whether
//    the branches may lose their keys depends on whether they can ever switch for one iteration.
//  - One key when every child that has one has the same key: the key moves, in the way it is written
//    (`:key` or `v-bind:key`), to just after the `v-for`, and is taken off the children. Children with no key
//    need none: on 2.7 an element with no key in a `<template v-for>` has none either (the generated `__vlist`
//    keys go only to an element that has the `v-for` itself), so the key of the template is all the identity they
//    had and more.
//  - The key that moves must use a variable of the template's own loop, else it would be the same on every
//    iteration (a static key, a constant, a variable of an outer loop): that is listed under Left.
//  - Different keys on the children, a key that uses a variable of its own child (a `v-slot` or `slot-scope`
//    variable is not in scope on the template), a key without a value, a child that sets its key through
//    `v-bind="{ key }"` (Vue 3 does not check it, and it cannot be told whether it is the same key), a template
//    that has a `v-if` of its own (Vue 3 reads the `v-if` first, where the loop's variables are not yet there),
//    and a template in `pug` or in another file (it is not read) are not edited. They are listed under Left,
//    and the template is left whole: no key of it moves. A person decides them.
//  - A template that has its key already keeps it. A child key with the same words is a duplicate and goes; a
//    different one is left to a person.
//  - A `<template v-for>` with a `v-slot` (or `#name`) is a dynamic slot. Vue 3 does not check its children, and
//    would drop a key on the template, so it is not touched. Its slot name stays as it is.
//  - Nested templates: each template takes the key of its own children. An inner `<template v-for>` is a child
//    with a `v-for` of its own, so its key is its own matter.
//
// Only the template block of a `.vue` file is edited. Every change is a text splice at a position from the
// parser: bytes outside the key attributes stay as they were, line endings (LF or CRLF) included, and nothing is
// reformatted. A key is taken off with the whitespace before it; a tag left with no attribute is closed up.
//
// Every changed file is checked before anything is written: the parser reports nothing new, the text outside the
// template is as it was, the elements, attributes (but for the keys), text and comments are as they were, and each
// template has the one key that its children had. A file that fails, or that does not parse, is listed under Failed,
// and then nothing at all is written in that run, a dry run included (a real run would write nothing). A second
// run changes nothing.
//
// The report is markdown on stdout: the totals, each template that gets a key, what is left and what is kept, the
// failures, and the files changed (or, in a dry run, that would change).
//
// Exit codes: 0 done (what is left is reported, not a failure), 1 a file failed (it did not pass the checks, or a
// write failed), 2 usage error (bad arguments, a root without a `src/` folder).
import { realpathSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vueEslintParser from 'vue-eslint-parser';
import { readSources } from './component-graph.mjs';
import { cell, code, failure, hasSrc, parseArgs } from './register-components.mjs';
import { byCodeUnit, splice } from './register-write.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const USAGE = 'usage: node scripts/vue3-migration/template-keys.mjs [--root <dir>] [--dry-run]';

/** The condition directives: an element with one of them, or with a `v-for`, is not checked for its key by Vue 3. */
const CONDITIONS = ['if', 'else-if', 'else'];

const PLACEMENT_ERROR = /key should be placed on the <template> tag/;

/** Every kind of key error Vue 3's compiler has: the placement on a `<template v-for>`, and two branches of a chain with one key. */
const KEY_ERROR = /\bkeys?\b/i;

// ---- reading the template ---------------------------------------------------------------------

const parse = (source, file) => vueEslintParser.parseForESLint(source, { parser: false, ecmaVersion: 2022, sourceType: 'module', filePath: file });

const isDirective = (attr, name) => attr.directive && attr.key.name.name === name;
const isCondition = (attr) => CONDITIONS.some((name) => isDirective(attr, name));
/** `key="x"`, `:key="x"` and `v-bind:key="x"`. */
const isKey = (attr) =>
  attr.directive
    ? attr.key.name.name === 'bind' && attr.key.argument?.type === 'VIdentifier' && attr.key.argument.name === 'key'
    : attr.key.name === 'key';

/** Whether `attr` is `v-bind="{ ..., key: ..., ... }"`, an object written out with a `key` in it. */
function bindsKey(attr) {
  const expression = isDirective(attr, 'bind') && !attr.key.argument ? attr.value?.expression : null;
  if (expression?.type !== 'ObjectExpression') return false;
  return expression.properties.some(
    (property) => property.type === 'Property' && !property.computed && (property.key.name === 'key' || property.key.value === 'key'),
  );
}

/** The text of the value of the attribute `attr`, without its quotes and the whitespace around it ('' for an attribute with no value). */
function valueText(attr, source) {
  if (!attr.value) return '';
  const raw = source.slice(...attr.value.range);
  const quote = /^["']/.test(raw) ? 1 : 0;
  return raw.slice(quote, raw.length - quote).trim();
}

/** What a key says, so that two ways of writing the same key are one: how it is bound, and its text without quotes or margins. */
function identity(attr, source) {
  return `${attr.directive ? 'bound' : 'static'}:${valueText(attr, source)}`;
}

/** The place of `node`: line from 1, column from 0. */
const placeOf = (node) => ({ line: node.loc.start.line, column: node.loc.start.column });

/**
 * A `<template v-for>` and what is in it: its key attributes, whether it is a slot, the condition directive it
 * has, and each child element with its key attributes and what kind of element it is to Vue 3.
 * @returns {null | object} null for any other element
 */
function loopOf(element) {
  const attrs = element.startTag.attributes;
  const vFor = attrs.find((attr) => isDirective(attr, 'for'));
  if (element.name !== 'template' || !vFor) return null;
  return {
    element,
    vFor,
    keys: attrs.filter(isKey),
    slot: attrs.some((attr) => isDirective(attr, 'slot')),
    condition: attrs.find(isCondition),
    children: element.children
      .filter((child) => child.type === 'VElement')
      .map((child) => {
        const childAttrs = child.startTag.attributes;
        const loop = childAttrs.some((attr) => isDirective(attr, 'for'));
        const condition = childAttrs.some(isCondition);
        return {
          element: child,
          keys: childAttrs.filter(isKey),
          loop,
          plain: !loop && !condition,
          bindsKey: childAttrs.some(bindsKey),
        };
      }),
  };
}

/** Every `<template v-for>` under `element` (itself included), in document order. */
function loopsUnder(element, found = []) {
  const loop = loopOf(element);
  if (loop) found.push(loop);
  for (const child of element.children) if (child.type === 'VElement') loopsUnder(child, found);
  return found;
}

/** The range that takes `attr` off its tag: the whitespace before it, and a tag left with no attribute is closed up. */
function removal(source, element, attr) {
  let start = attr.range[0];
  while (start > 0 && /\s/.test(source[start - 1])) start--;
  let end = attr.range[1];
  if (element.startTag.attributes.length === 1) {
    let stop = end;
    while (/\s/.test(source[stop] ?? '')) stop++;
    if (/[\r\n]/.test(source.slice(end, stop))) {
      end = stop;
      return { start, end, text: source.startsWith('/>', stop) ? ' ' : '' };
    }
  }
  return { start, end, text: '' };
}

const REASON_LOOP = 'it has a `v-for` of its own, and the key belongs to its loop';
const REASON_TEMPLATE_LOOP = 'it is a `<template v-for>` itself, and the key is its own';
const REASON_CONDITION = 'it has a `v-if`, `v-else-if`, `v-else` or `v-for` of its own, and Vue 3 accepts its key there';
const REASON_SLOT = 'the template is a slot, which Vue 3 does not check for keys';

/** The name of the first slot variable that the key `attr` of `child` uses and `child` itself declares, or null. */
function ownVariable(child, attr) {
  const reference = (attr.value?.references ?? []).find(({ variable }) => variable && child.variables.includes(variable));
  return reference ? reference.id.name : null;
}

/**
 * Whether Vue 3 takes `attr` for a key that two branches of a chain cannot share: a static key, a literal, or a bare
 * variable of the template, written as nothing else (`(a)` is an expression it accepts).
 */
function isSimpleKey(attr, source) {
  if (!attr.directive) return Boolean(attr.value);
  const expression = attr.value?.expression;
  const text = valueText(attr, source);
  if (expression?.type === 'Literal') return text === expression.raw;
  return expression?.type === 'Identifier' && text === expression.name && attr.value.references.some(({ variable }) => variable);
}

/** The chains of `v-if`, `v-else-if` and `v-else` among the children of `element`, each an array of elements; comments and whitespace do not end a chain. */
function chainsOf(element) {
  const chains = [];
  let chain = null;
  for (const node of element.children) {
    if (node.type === 'VText' && node.value.trim() === '') continue;
    const attrs = node.type === 'VElement' ? node.startTag.attributes : [];
    if (attrs.some((attr) => isDirective(attr, 'if'))) {
      chain = [node];
      chains.push(chain);
    } else if (chain && attrs.some((attr) => isDirective(attr, 'else-if') || isDirective(attr, 'else'))) {
      chain.push(node);
    } else {
      chain = null;
    }
  }
  return chains;
}

/**
 * What to do with one `<template v-for>`: `{ edits, moved }` for a template that gets its key, or `{}`. What a person
 * has to decide goes to `left` (a place and a reason), and the keys that stay on a child to `kept`.
 */
function planLoop(loop, source, { kept, left }) {
  const place = placeOf(loop.element);
  const leave = (reason) => {
    left.push({ ...place, reason });
    return {};
  };
  const keep = (child, reason) => kept.push({ ...placeOf(child.element), tag: child.element.rawName, reason });

  // Vue 3 refuses two branches of a chain that have the same key, when it is a simple one. It is no placement matter,
  // so the template can still take the keys of its plain children; the chain is for a person.
  for (const chain of chainsOf(loop.element)) {
    const shared = new Map();
    for (const branch of chain) {
      const key = branch.startTag.attributes.find(isKey);
      if (!key || !isSimpleKey(key, source)) continue;
      const found = shared.get(identity(key, source)) ?? { text: source.slice(...key.range), lines: [] };
      found.lines.push(branch.loc.start.line);
      shared.set(identity(key, source), found);
    }
    for (const { text, lines } of shared.values()) {
      if (lines.length < 2) continue;
      left.push({
        ...placeOf(chain[0]),
        reason: `the branches of this ${code('v-if')} chain on lines ${lines.join(', ')} have the same key ${code(text)}, which Vue 3 rejects for a bare loop or slot variable, a literal or a static key (${code('v-if/else branches must use unique keys')}); look at it by hand`,
      });
    }
  }

  // A slot is checked by nothing else in Vue 3: every key in it is as valid as it was.
  if (loop.slot) {
    for (const child of loop.children) if (child.keys.length > 0) keep(child, REASON_SLOT);
    return {};
  }
  for (const child of loop.children) {
    if (child.plain || child.keys.length === 0) continue;
    keep(child, child.loop ? (child.element.name === 'template' ? REASON_TEMPLATE_LOOP : REASON_LOOP) : REASON_CONDITION);
  }

  const plain = loop.children.filter((child) => child.plain);
  const bound = plain.find((child) => child.bindsKey);
  if (bound) return leave(`${code(`<${bound.element.rawName}>`)} sets a key through ${code('v-bind="{ ... }"')}, which Vue 3 does not check; look at it by hand`);
  const keyed = plain.filter((child) => child.keys.length > 0);
  if (keyed.length === 0) return {};

  if (loop.condition) return leave(`the template has a ${code(`v-${loop.condition.key.name.name}`)} of its own`);
  for (const child of keyed) {
    const tag = code(`<${child.element.rawName}>`);
    if (child.keys.length > 1) return leave(`${tag} has more than one key`);
    if (!child.keys[0].value) return leave(`${tag} has a key without a value`);
    // A plain child has no `v-for` of its own: what it declares is a slot variable.
    const variable = ownVariable(child.element, child.keys[0]);
    if (variable) return leave(`the key of ${tag} uses its own slot variable ${code(variable)}`);
  }

  const texts = new Map();
  for (const { keys } of keyed) if (!texts.has(identity(keys[0], source))) texts.set(identity(keys[0], source), source.slice(...keys[0].range));
  if (texts.size > 1) return leave(`the children have different keys: ${[...texts.values()].map((text) => code(text)).join(', ')}`);

  const [templateKey] = loop.keys;
  const [text] = texts.values();
  if (templateKey) {
    // The key of the template is the one that stays; a child that says the same is a duplicate.
    if (identity(templateKey, source) !== [...texts.keys()][0]) return leave(`the template has ${code(source.slice(...templateKey.range))}, a child has ${code(text)}`);
  } else {
    // A key that does not use the loop's own variables would be the same on every iteration.
    const variables = loop.element.variables;
    if (!(keyed[0].keys[0].value.references ?? []).some(({ variable }) => variable && variables.includes(variable))) {
      return leave(`the key ${code(text)} uses none of the loop variables (${variables.map(({ id }) => code(id.name)).join(', ')}), so it would be the same on every iteration`);
    }
  }

  const edits = keyed.map(({ element, keys }) => removal(source, element, keys[0]));
  if (!templateKey) edits.push({ start: loop.vFor.range[1], end: loop.vFor.range[1], text: ` ${text}` });
  const key = templateKey ? source.slice(...templateKey.range) : text;
  return { edits, moved: { ...place, key, from: keyed.map(({ element }) => element.rawName), removed: keyed.length } };
}

const byPlace = (a, b) => a.line - b.line || a.column - b.column;

/**
 * Moves the keys of the children of every `<template v-for>` in the `.vue` file `source` onto the template (see
 * the top of this file).
 * @param {string} source
 * @param {string} file the file's name, for the parser
 * @returns {{ source: string,
 *   moved: { line: number, column: number, key: string, from: string[], removed: number }[],
 *   left: { line: number, column: number, reason: string }[],
 *   kept: { line: number, column: number, tag: string, reason: string }[] }}
 *   one `moved` for each template that has its key now (`removed` keys taken off its children, `from` their tags),
 *   `left` for each template (or template block) a person has to look at, `kept` for each key that stays on a child
 *   of a template; each in document order
 */
export function moveKeys(source, file) {
  const unchanged = { source, moved: [], left: [], kept: [] };
  if (!source.includes('v-for') && !/<template\b[^>]*\bsrc\b/.test(source)) return unchanged;

  const parsed = parse(source, file);
  const moved = [];
  const left = [];
  const kept = [];
  const edits = [];

  // A template this script cannot read: another language, or another file.
  for (const block of parsed.services?.getDocumentFragment?.().children ?? []) {
    if (block.type !== 'VElement' || block.name !== 'template') continue;
    const attr = (name) => block.startTag.attributes.find((a) => !a.directive && a.key.name === name);
    const place = placeOf(block);
    const lang = attr('lang')?.value?.value;
    if (attr('src')) {
      left.push({ ...place, reason: 'the template is in another file (`src`), which this script does not read' });
    } else if (lang && lang.toLowerCase() !== 'html' && source.slice(...block.range).includes('v-for')) {
      left.push({ ...place, reason: `the template is written in ${code(lang)}, which this script does not read` });
    }
  }

  const body = parsed.ast.templateBody;
  for (const loop of body ? loopsUnder(body) : []) {
    const plan = planLoop(loop, source, { kept, left });
    if (plan.moved) {
      moved.push(plan.moved);
      edits.push(...plan.edits);
    }
  }

  return {
    source: edits.length > 0 ? splice(source, edits) : source,
    moved: moved.sort(byPlace),
    left: left.sort(byPlace),
    kept: kept.sort(byPlace),
  };
}

// ---- the checks of a changed file -------------------------------------------------------------

/**
 * What the template says apart from the keys of its loops: each element with its attributes, each text and
 * interpolation, and the comments. A key attribute of a `<template v-for>` or of one of its plain children is left out.
 */
function fingerprint(parsed, source) {
  const body = parsed.ast.templateBody;
  if (!body) return [];
  const skipped = new Set();
  for (const { keys, children } of loopsUnder(body)) {
    for (const key of keys) skipped.add(key);
    for (const child of children) if (child.plain) for (const key of child.keys) skipped.add(key);
  }
  const lines = [];
  const walk = (node) => {
    if (node.type !== 'VElement') {
      lines.push(source.slice(...node.range));
      return;
    }
    const attrs = node.startTag.attributes.filter((attr) => !skipped.has(attr)).map((attr) => ` ${source.slice(...attr.range)}`);
    lines.push(`<${node.rawName}${attrs.join('')}${node.startTag.selfClosing ? ' /' : ''}>`);
    node.children.forEach(walk);
    lines.push(`</${node.rawName}>`);
  };
  walk(body);
  for (const comment of body.comments) lines.push(`<!--${comment.value}-->`);
  return lines;
}

/** For each `<template v-for>`: the key it has, and the keys of its plain children, as `identity` says them. */
function keySummaries(parsed, source) {
  const body = parsed.ast.templateBody;
  if (!body) return [];
  return loopsUnder(body).map(({ keys, children }) => ({
    own: keys.length > 0 ? identity(keys[0], source) : null,
    kids: children.filter((child) => child.plain && child.keys.length > 0).map((child) => identity(child.keys[0], source)),
  }));
}

/** The messages of the parse errors of the template of `parsed`, in order. */
const parseErrors = (parsed) => (parsed.ast.templateBody?.errors ?? []).map((error) => error.message);

/** `messages` less the ones in `known`, each counted as often as it is in `known`. */
function without(messages, known) {
  const left = new Map();
  for (const message of known) left.set(message, (left.get(message) ?? 0) + 1);
  return messages.filter((message) => {
    const count = left.get(message) ?? 0;
    left.set(message, count - 1);
    return count <= 0;
  });
}

/** Throws when `after`, the new text of `file`, differs from `before` by more than the keys of its loops moved as `moved` says. */
function assertOnlyKeys(file, before, after) {
  const now = parse(after, file);
  const was = parse(before, file);
  const added = without(parseErrors(now), parseErrors(was));
  if (added.length > 0) throw new Error(`the template parser reports: ${added.join('; ')}`);

  const bodyOf = (parsed) => parsed.ast.templateBody;
  const [wasBody, nowBody] = [bodyOf(was), bodyOf(now)];
  if (!wasBody || !nowBody) throw new Error('it lost its template');
  if (before.slice(0, wasBody.range[0]) !== after.slice(0, nowBody.range[0]) || before.slice(wasBody.range[1]) !== after.slice(nowBody.range[1])) {
    throw new Error('it changed outside its template');
  }
  if (JSON.stringify(fingerprint(was, before)) !== JSON.stringify(fingerprint(now, after))) throw new Error('it changed more than key attributes');

  const wasKeys = keySummaries(was, before);
  const nowKeys = keySummaries(now, after);
  const fail = () => {
    throw new Error('a key was lost or changed');
  };
  if (wasKeys.length !== nowKeys.length) fail();
  wasKeys.forEach((b, index) => {
    const a = nowKeys[index];
    const same = JSON.stringify(a) === JSON.stringify(b);
    const moved = b.kids.length > 0 && a.kids.length === 0 && a.own !== null && b.kids.every((kid) => kid === a.own) && (b.own === null || b.own === a.own);
    if (!same && !moved) fail();
  });
}

// ---- the Vue 3 check ---------------------------------------------------------------------------

/**
 * The Vue 3 compiler of the tree at `root`, when there is one: `@vue/compiler-sfc` 3.x as `root` resolves it.
 * @returns {{ version: string, check: (source: string, file: string) => { message: string, line: number | null }[] } | { reason: string }}
 *   `check` gives the errors Vue 3 reports for the template of a `.vue` file, each with its message and its line in
 *   the file; without a Vue 3 compiler, `reason` says why not
 */
export function findVue3(root) {
  const requireFromRoot = createRequire(join(resolve(root), 'package.json'));
  let entry;
  try {
    entry = requireFromRoot.resolve('@vue/compiler-sfc');
  } catch {
    return { reason: '`@vue/compiler-sfc` is not installed in the root' };
  }
  let manifest;
  for (let dir = dirname(entry); dir !== dirname(dir); dir = dirname(dir)) {
    try {
      manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    } catch {
      continue;
    }
    if (manifest.name === '@vue/compiler-sfc') break;
    manifest = undefined;
  }
  const version = manifest?.version ?? '';
  if (!/^3\./.test(version)) return { reason: `\`@vue/compiler-sfc\` ${version || 'of an unknown version'} in the root is not 3.x` };

  const { parse: parseSfc, compileTemplate } = requireFromRoot('@vue/compiler-sfc');
  return {
    version,
    check(source, file) {
      const { template } = parseSfc(source, { filename: file }).descriptor;
      if (!template || template.src || (template.lang && template.lang !== 'html')) return [];
      const { errors } = compileTemplate({ source: template.content, filename: file, id: 'template-keys' });
      // The position of an error is in the template block; the block's content starts on `template.loc.start.line`.
      return errors.map((error) =>
        typeof error === 'string' ? { message: error, line: null } : { message: error.message, line: error.loc ? template.loc.start.line + error.loc.start.line - 1 : null },
      );
    },
  };
}

/**
 * Throws when Vue 3 has an error for `after` that it had not for `before`, or when, for the `moved` templates of the
 * file, it still has as many key placement errors as before.
 * @returns {{ before: number, after: number, left: { line: number | null, message: string }[] }} the key placement errors Vue 3
 *   reports for `before` and for `after`, and the key errors of every kind that it reports for `after`
 */
function assertCompilesOnVue3(vue3, file, before, after, movedCount) {
  const was = vue3.check(before, file);
  const now = vue3.check(after, file);
  const added = without(now.map(({ message }) => message), was.map(({ message }) => message));
  if (added.length > 0) throw new Error(`Vue 3 reports an error that the file had not: ${added.join('; ')}`);
  const placement = [was, now].map((errors) => errors.filter(({ message }) => PLACEMENT_ERROR.test(message)).length);
  if (placement[0] - placement[1] !== movedCount) {
    throw new Error(`Vue 3 reports ${placement[1]} key placement error(s) after ${movedCount} template(s) got their key, where it reported ${placement[0]} before`);
  }
  return { before: placement[0], after: placement[1], left: now.filter(({ message }) => KEY_ERROR.test(message)) };
}

// ---- the tree -----------------------------------------------------------------------------------

/**
 * Moves the keys in the `.vue` files under `<root>/src`, and writes them unless `dryRun`.
 *
 * Returns
 *  - `moved`, `left` and `kept`: each place, as in `moveKeys`, with its `file`;
 *  - `planned`: how many files have a key to move;
 *  - `changed`: the files (relative to `root`, sorted) written, or in a dry run the files a real run would write.
 *    Empty when any file failed its checks;
 *  - `failures`: `{ file, message }` of the files that failed, sorted. A file fails when it does not parse or does
 *    not pass its checks, in which case nothing is written at all, or when its write throws, in which case the
 *    other files are still written;
 *  - `placement`: the key placement errors Vue 3 reports for the changed files, `{ before, after }`, or null when
 *    the Vue 3 check did not run;
 *  - `residual`: the key errors of every kind that Vue 3 reports for what the files will be after the run, in each
 *    file that is changed or has something left or kept, `{ file, line, message }`, or null when the check did not run.
 */
function keyTree({ root, dryRun, write, move, vue3 }) {
  const moved = [];
  const left = [];
  const kept = [];
  const failures = [];
  const outputs = [];
  const placement = vue3?.check ? { before: 0, after: 0 } : null;
  const residual = vue3?.check ? [] : null;
  for (const [file, source] of readSources(root)) {
    if (!file.endsWith('.vue')) continue;
    try {
      const result = move(source, file);
      let errors = [];
      if (result.source !== source) {
        assertOnlyKeys(file, source, result.source);
        if (vue3?.check) {
          const counts = assertCompilesOnVue3(vue3, file, source, result.source, result.moved.length);
          placement.before += counts.before;
          placement.after += counts.after;
          errors = counts.left;
        }
        outputs.push({ file, text: result.source });
      } else if (vue3?.check && (result.left.length > 0 || result.kept.length > 0)) {
        errors = vue3.check(source, file).filter(({ message }) => KEY_ERROR.test(message));
      }
      residual?.push(...errors.map(({ line, message }) => ({ file, line, message })));
      moved.push(...result.moved.map((place) => ({ file, ...place })));
      left.push(...result.left.map((place) => ({ file, ...place })));
      kept.push(...result.kept.map((place) => ({ file, ...place })));
    } catch (error) {
      failures.push(failure(file, error));
    }
  }

  // One file that fails its checks stops the run: the others were changed by the same rules.
  const changed = [];
  if (failures.length === 0) {
    for (const { file, text } of outputs) {
      try {
        if (!dryRun) write(join(root, file), text);
        changed.push(file);
      } catch (error) {
        failures.push(failure(file, `write failed: ${error instanceof Error ? error.message : error}`));
      }
    }
  }
  failures.sort((a, b) => byCodeUnit(a.file, b.file));
  return { moved, left, kept, planned: outputs.length, changed, failures, placement, residual };
}

const LEFT_NOTE =
  'Vue 3 needs the key on the template, and a template here has more than one way to do it, or a key that cannot go there: it is left whole, no key of it moved. Decide by hand: keep one key on the template, take the others off the children. A chain with one simple key on two branches is rejected by Vue 3 as it is: give the branches different keys, or none where the identity does not need one.';
const KEPT_NOTE =
  'Vue 3 does not look at where a key is on an element with a `v-if`, `v-else-if`, `v-else` or `v-for` of its own, or anywhere in a slot template, and the key keeps what 2.7 gives the element. They are not edited. (Two branches of one chain with the same simple key are another matter: they are under Left.)';

const tags = (names) => [...new Set(names)].map((name) => code(`<${name}>`)).join(', ');

function table(header, rows) {
  if (rows.length === 0) return ['None.'];
  return [`| ${header.join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`, ...rows.map((row) => `| ${row.join(' | ')} |`)];
}

function vue3Line(vue3, placement) {
  if (vue3 === null) return 'Vue 3 check: not run (turned off)';
  if (!vue3.check) return `Vue 3 check: not run (${vue3.reason})`;
  return `Vue 3 check: ran with \`@vue/compiler-sfc\` ${vue3.version} from the root; key placement errors in the changed files: ${placement.before} before, ${placement.after} after`;
}

function renderReport({ dryRun, vue3, moved, left, kept, planned, changed, failures, placement, residual }) {
  const at = ({ file, line }) => cell(code(`${file}:${line}`));
  const lines = [
    `# Template keys${dryRun ? ' (dry run)' : ''}`,
    '',
    '| Total | Count |',
    '| --- | ---: |',
    `| Templates | ${moved.length} |`,
    `| Keys moved | ${moved.reduce((sum, { removed }) => sum + removed, 0)} |`,
    `| Files to change | ${planned} |`,
    `| Left | ${left.length} |`,
    `| Kept | ${kept.length} |`,
    `| Key errors left on Vue 3 | ${residual ? residual.length : 'n/a'} |`,
    '',
    vue3Line(vue3, placement),
    '',
    '## Moved',
    '',
    ...table(['file:line', 'key', 'from'], moved.map((place) => [at(place), cell(code(place.key)), cell(tags(place.from))])),
    '',
    '## Left',
    '',
  ];
  if (left.length > 0) lines.push(LEFT_NOTE, '');
  lines.push(...table(['file:line', 'reason'], left.map((place) => [at(place), cell(place.reason)])));
  lines.push('', '## Kept', '');
  if (kept.length > 0) lines.push(KEPT_NOTE, '');
  lines.push(...table(['file:line', 'element', 'reason'], kept.map((place) => [at(place), cell(code(`<${place.tag}>`)), cell(place.reason)])));
  lines.push('', '## Key errors left on Vue 3', '');
  if (!residual) {
    lines.push('Not looked at: the Vue 3 check did not run.');
  } else {
    if (residual.length > 0) lines.push('What Vue 3 still says about keys, in each file that is changed or has something left or kept, once the run is done.', '');
    const where = ({ file, line }) => cell(code(line ? `${file}:${line}` : file));
    lines.push(...table(['file:line', 'error'], [...residual].sort((a, b) => byCodeUnit(a.file, b.file) || (a.line ?? 0) - (b.line ?? 0)).map((error) => [where(error), cell(error.message)])));
  }

  if (failures.length > 0) {
    lines.push('', '## Failed', '');
    for (const { file, message } of failures) lines.push(`- ${code(file)}: ${message}`);
    if (changed.length === 0) lines.push('', dryRun ? 'A real run would write nothing.' : 'Nothing was written.');
  }

  lines.push('', dryRun ? '## Files that would change' : '## Changed files', '');
  if (changed.length === 0) lines.push('None.');
  for (const file of changed) lines.push(`- ${code(file)}`);
  return `${lines.join('\n')}\n`;
}

/**
 * Moves the keys in the tree under `root`, and writes them unless `--dry-run`.
 *
 * `root` defaults to the repo root and `--root <dir>` overrides it. `write(absPath, contents)`, `move(source, file)`
 * and `vue3` default to `fs.writeFileSync`, `moveKeys` and `findVue3(root)`; they are seams for tests (`vue3: null`
 * turns the Vue 3 check off). The report goes to `out`, usage errors and a one-line summary of what failed go to `err`.
 *
 * @param {string[]} argv
 * @param {{ root?: string, write?: (path: string, contents: string) => void, move?: typeof moveKeys,
 *   vue3?: ReturnType<typeof findVue3> | null,
 *   out?: { write: (text: string) => unknown }, err?: { write: (text: string) => unknown } }} [deps]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, deps = {}) {
  const { root: defaultRoot = repoRoot, write = writeFileSync, move = moveKeys, out = process.stdout, err = process.stderr } = deps;

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

  const vue3 = deps.vue3 === undefined ? findVue3(root) : deps.vue3;
  const tree = keyTree({ root, dryRun: options.dryRun, write, move, vue3 });
  out.write(renderReport({ dryRun: options.dryRun, vue3, ...tree }));

  if (tree.failures.length > 0) {
    const effect = tree.changed.length > 0 ? '' : options.dryRun ? '; a real run would write nothing' : '; nothing was written';
    err.write(`template-keys: ${tree.failures.length} file(s) failed${effect}; see the Failed section of the report\n`);
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
