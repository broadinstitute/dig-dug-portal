// Counts code that runs on Vue 2.7 and on Vue 3 but does something else on Vue 3, without an error. Report only:
// nothing is written. Run it from the repo root:
//
//   npm run tool:semantics-scan                       # markdown report
//   npm run tool:semantics-scan -- --json             # the hits and errors as JSON
//   npm run tool:semantics-scan -- --root <dir>       # another checkout (a portal branch)
//
// Six kinds of hit, each `{ file, line, text }` (see `KINDS` for what each one does on Vue 3):
//
//   structuredClone  a call `structuredClone(...)` in code, or `window.`/`globalThis.` `structuredClone(...)`.
//                    Comments and strings are not code, so they never count.
//   chartObjects     a chart or graph object stored where Vue makes it reactive: `this.<x> = <object>` (or a
//                    property of `this.<x>`), or a property of the object `data()` returns (nested objects and
//                    arrays too), where `<object>` is one of
//                      new Network(...), new DataSet(...)        from `vis-network`, `vis-data`
//                      am4core.create(...)                       from `@amcharts/amcharts4/core`
//                      c3.generate(...)                          from `c3`
//                      LocusZoom.populate(...), new LocusZoom.DataSources(...)   from `locuszoom`
//                      new <class>(...)                          from a module under `@/components/lz/panels/`,
//                                                                or declared in a file under that folder
//                    Names are resolved by their import binding, so `import { Network as VisNetwork }` counts
//                    and a local `class Network` does not. The value has to be the creating expression itself:
//                    `markRaw(...)` around it is not a hit, and neither is a local `const chart = ...` that is
//                    assigned later (a person reads those). Whether `<x>` is declared in `data()` is not
//                    checked: a mixin can declare it, and an undeclared one turns reactive the day it is.
//                    `this` inside a class body is that class's instance, not a component, so it is skipped.
//   computedParams   a computed function, or the `get` of a computed object, with a parameter. Vue 2.7 passes
//                    the instance, Vue 3 (3.4 and later) the previous value.
//   extraScripts     a `.vue` file with more than one plain `<script>` block (`<script setup>` is not plain).
//   unknownTags      an element that is a real but non-standard HTML tag (a fixed list, `NON_STANDARD_TAGS`:
//                    `center`, `font`, `tt`, `big`, `strike`, `marquee`, `acronym` and their kind), that is in
//                    neither Vue 3's HTML tag list nor its SVG tag list (copied as `HTML_TAGS`/`SVG_TAGS`; no
//                    Vue 3 package is installed here) and that no component is named after (a
//                    `Vue.component("name", ...)`, a `components: { Name }` key or a `.vue` file's `name`
//                    anywhere in the tree). Every other unknown tag is a component, found by the lint.
//   inlineSpaces     an inline element (`INLINE_TAGS`) whose first or last child is whitespace-only text next to
//                    an interpolation, when the neighbour on that side is inline content (text, an
//                    interpolation or an inline element) or the element has `v-for`. Content under `<pre>` and
//                    elements with `v-text`, `v-html` or `v-pre` are skipped.
//
// Scripts are read with Babel, as in `component-graph.mjs`, templates with `vue-eslint-parser`, the parser
// `eslint-plugin-vue` brings and the lint already uses. Vue 2's own template compiler would not do here: it
// condenses whitespace and drops comments before anyone can look, and whitespace is what `inlineSpaces` counts.
// The lint rule `vue/no-side-effects-in-computed-properties` finds the seventh pattern, computed properties
// with side effects, and counts it in `npm run lint:vue3`.
//
// A file that does not parse (a script Babel cannot read, a template that is not plain HTML) is listed under
// Errors, with the line when there is one, and the rest of the tree is still scanned. Its hits are not counted.
//
// Exit codes: 0 always (hits and errors are what the report is for), 2 usage error.
import { realpathSync } from 'node:fs';
import { dirname, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';
import { parse as parseBabel } from '@babel/parser';
import vueEslintParser from 'vue-eslint-parser';
import { BABEL_OPTIONS, isLookup, isVueComponentCall, readSources, scriptBlocks, toKey, walk } from './component-graph.mjs';
import { cell, code, hasSrc, oneLine } from './register-components.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const USAGE = 'usage: node scripts/vue3-migration/semantics-scan.mjs [--root <dir>] [--json]';

/** The kinds of hit, in report order, with what each one does on Vue 3. */
export const KINDS = [
  { key: 'structuredClone', why: 'Throws a DataCloneError when given reactive data, which Vue 3 wraps in a Proxy.' },
  {
    key: 'chartObjects',
    why: 'Vue 3 makes what a component stores reactive, deeply, which breaks chart and graph objects: an amCharts chart overflowed the stack and stopped the page update partway. `markRaw` keeps one out.',
  },
  { key: 'computedParams', why: 'Vue 2.7 passes the instance to a computed function; Vue 3 (3.4 and later) passes the previous value.' },
  { key: 'extraScripts', why: 'A Vue 3 single-file component has one plain `<script>` block; a file with two does not compile.' },
  { key: 'unknownTags', why: 'Vue 3 does not know these as HTML tags, so it looks for a component of that name first.' },
  { key: 'inlineSpaces', why: 'Vue 3 drops a whitespace-only text at the start or end of an element, where Vue 2 rendered a space, so "up 3.06" runs together as "up3.06".' },
];

// Vue 3's `isHTMLTag` and `isSVGTag` lists (`@vue/shared`, `domTagConfig`, as of 3.5): the tags its compiler treats as
// native elements. Anything else is resolved as a component first.
const HTML_TAGS = new Set(
  'html,body,base,head,link,meta,style,title,address,article,aside,footer,header,hgroup,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot'.split(','),
);
const SVG_TAGS = new Set(
  'svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistantLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,text,textPath,title,tspan,unknown,use,view'.split(','),
);
// Real HTML elements that are obsolete or non-standard, so that browsers render them and Vue 3 does not list them.
// Reporting every tag Vue 3 does not know would list every component, so this fixed list is all that is reported.
const NON_STANDARD_TAGS = new Set(
  'acronym,applet,basefont,bgsound,big,blink,center,dir,font,frame,frameset,isindex,keygen,listing,marquee,menuitem,nobr,noembed,noframes,plaintext,rb,rtc,spacer,strike,tt,xmp'.split(','),
);
const INLINE_TAGS = new Set(['span', 'a', 'strong', 'em', 'b', 'i', 'small', 'sup', 'sub', 'u', 'code', 'label', 'b-badge', 'b-link']);

/** What counts as a chart or graph object: what a module exports (`names`), and whether it is called or `new`ed. */
const CHART_APIS = [
  { source: /^vis-(network|data)(\/|$)/, names: new Set(['Network', 'DataSet']), how: 'new' },
  { source: /^@amcharts\/amcharts4\/core$/, names: new Set(['create']), how: 'call' },
  { source: /^c3$/, names: new Set(['generate']), how: 'call' },
  { source: /^locuszoom$/, names: new Set(['populate']), how: 'call' },
  { source: /^locuszoom$/, names: new Set(['DataSources']), how: 'new' },
];
const PANELS_DIRECTORY = 'src/components/lz/panels/';

// What `vue-eslint-parser` reports for `<div />`, which is valid in a single-file component.
const SELF_CLOSING = 'non-void-html-element-start-tag-with-trailing-solidus';
// Babel node keys that hold positions or comments rather than child nodes.
const NOT_CHILDREN = new Set(['loc', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'errors']);
const FUNCTIONS = new Set(['FunctionExpression', 'ArrowFunctionExpression', 'ObjectMethod', 'FunctionDeclaration', 'ClassMethod']);
const MAX_TEXT = 100;

/**
 * @typedef {{ file: string, line: number, text: string }} Hit
 * @typedef {{ file: string, kind: 'parse' | 'template', message: string, line?: number }} ScanError
 */

const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const shorten = (text) => {
  const line = oneLine(text);
  return line.length > MAX_TEXT ? `${line.slice(0, MAX_TEXT - 3)}...` : line;
};

/** The key of a non-computed object property or method as written (`name` and `"name"` alike), else null. */
const keyName = (property) => {
  if (property.computed) return null;
  return property.key.type === 'Identifier' ? property.key.name : property.key.type === 'StringLiteral' ? property.key.value : null;
};

/** A function node of a property or method: the method itself, or the function the property holds. */
function functionOf(property) {
  if (property.type === 'ObjectMethod') return property;
  return property.type === 'ObjectProperty' && FUNCTIONS.has(property.value.type) ? property.value : null;
}

/** `local name -> { source, imported }` for every import in `program`; `imported` is `default` or `*` for those. */
function importBindings(program) {
  const bindings = new Map();
  for (const node of program.body) {
    if (node.type !== 'ImportDeclaration') continue;
    for (const specifier of node.specifiers) {
      const imported =
        specifier.type === 'ImportDefaultSpecifier' ? 'default'
        : specifier.type === 'ImportNamespaceSpecifier' ? '*'
        : specifier.imported.name ?? specifier.imported.value;
      bindings.set(specifier.local.name, { source: node.source.value, imported });
    }
  }
  return bindings;
}

/**
 * The module and export a callee or constructor names through an import: `X` for a named import, `X.name` for a
 * default or namespace import `X`. Null for anything else (a local, a global, a deeper path).
 */
function importedApi(node, bindings) {
  if (node.type === 'Identifier') {
    const binding = bindings.get(node.name);
    return binding === undefined ? null : { source: binding.source, name: binding.imported };
  }
  if (node.type === 'MemberExpression' && !node.computed && node.object.type === 'Identifier' && node.property.type === 'Identifier') {
    const binding = bindings.get(node.object.name);
    return binding?.imported === 'default' || binding?.imported === '*' ? { source: binding.source, name: node.property.name } : null;
  }
  return null;
}

/** The path under `src/` that a module specifier (`@/...`, `./...`, `../...`) names, or null for a package. */
function localPath(from, specifier) {
  if (specifier.startsWith('@/')) return posix.join('src', specifier.slice(2));
  return specifier.startsWith('.') ? posix.join(posix.dirname(from), specifier) : null;
}

/** Whether `node` is `this`, or a member access that starts at it (`this.a.b`, `this.a[b]`). */
function startsAtThis(node) {
  let current = node;
  while (current.type === 'MemberExpression') current = current.object;
  return current.type === 'ThisExpression';
}

/** The objects a data function returns: its arrow body, or the `return` statements of its own body. */
function returnedObjects(fn) {
  if (fn.body.type !== 'BlockStatement') return fn.body.type === 'ObjectExpression' ? [fn.body] : [];
  const found = [];
  const visit = (node) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
    } else if (node && typeof node.type === 'string' && !FUNCTIONS.has(node.type)) {
      if (node.type === 'ReturnStatement' && node.argument?.type === 'ObjectExpression') found.push(node.argument);
      for (const [key, child] of Object.entries(node)) if (!NOT_CHILDREN.has(key) && child && typeof child === 'object') visit(child);
    }
  };
  visit(fn.body.body);
  return found;
}

/**
 * Finds the hits of one script. `names` receives the component names the script registers or uses.
 * @param {string} file
 * @param {import('@babel/types').File} ast
 * @param {string} text the script block, which the nodes' offsets index
 * @param {Record<string, Hit[]>} hits
 * @param {Set<string>} names
 */
function scanScript(file, ast, text, hits, names) {
  const bindings = importBindings(ast.program);
  const inPanels = file.startsWith(PANELS_DIRECTORY);
  const declaredClasses = new Set();
  // `this` in a class body is the instance of that class, not a component, so what it stores is not component state.
  const classBodies = [];
  walk(ast.program, (node) => {
    if ((node.type === 'ClassDeclaration' || node.type === 'ClassExpression') && node.id) declaredClasses.add(node.id.name);
    if (node.type === 'ClassBody') classBodies.push(node);
  });
  const inClass = (node) => classBodies.some((body) => body.start <= node.start && node.end <= body.end);
  const source = (node) => text.slice(node.start, node.end);
  const add = (kind, node, label) => hits[kind].push({ file, line: node.loc.start.line, text: shorten(label) });

  /** `new X(...)` or `x.y(...)`, the callee as written, when `node` makes a chart object (see `CHART_APIS`); else null. */
  const chartCreation = (node) => {
    if (node.type !== 'NewExpression' && node.type !== 'CallExpression') return null;
    const how = node.type === 'NewExpression' ? 'new' : 'call';
    const api = importedApi(node.callee, bindings);
    const known = api !== null && CHART_APIS.some((chart) => chart.how === how && chart.source.test(api.source) && chart.names.has(api.name));
    const fromPanels = how === 'new' && api !== null && (localPath(file, api.source) ?? '').startsWith(PANELS_DIRECTORY);
    const inFile = how === 'new' && inPanels && node.callee.type === 'Identifier' && declaredClasses.has(node.callee.name);
    return known || fromPanels || inFile ? `${how === 'new' ? 'new ' : ''}${source(node.callee)}(...)` : null;
  };

  /** The chart objects among the properties of an object `data()` returns, nested ones included. */
  const dataCharts = (object, path) => {
    for (const property of object.properties) {
      if (property.type !== 'ObjectProperty') continue;
      const key = keyName(property) ?? source(property.key);
      const made = chartCreation(property.value);
      if (made !== null) add('chartObjects', property, `data(): ${[...path, key].join('.')} = ${made}`);
      else if (property.value.type === 'ObjectExpression') dataCharts(property.value, [...path, key]);
      else if (property.value.type === 'ArrayExpression') {
        for (const element of property.value.elements) if (element?.type === 'ObjectExpression') dataCharts(element, [...path, key]);
      }
    }
  };

  /** A hit when `property` of a `computed` object is a function, or has a `get`, that takes a parameter. */
  const computedFunction = (property) => {
    // A spread brings in whatever it brings; `get foo() {}` is an accessor of the computed object, not a computed function.
    if (property.type === 'SpreadElement' || (property.type === 'ObjectMethod' && property.kind !== 'method')) return;
    const name = keyName(property) ?? source(property.key);
    const fn = functionOf(property);
    if (fn !== null) {
      if (fn.params.length > 0) add('computedParams', property, `${name}(${oneLine(text.slice(fn.params[0].start, fn.params.at(-1).end))})`);
    } else if (property.type === 'ObjectProperty' && property.value.type === 'ObjectExpression') {
      for (const member of property.value.properties) {
        if (member.type === 'SpreadElement' || keyName(member) !== 'get') continue;
        const getter = functionOf(member);
        if (getter !== null && getter.params.length > 0) {
          add('computedParams', member, `${name}.get(${oneLine(text.slice(getter.params[0].start, getter.params.at(-1).end))})`);
        }
      }
    }
  };

  walk(ast.program, (node) => {
    if (node.type === 'CallExpression') {
      const { callee } = node;
      const called = callee.type === 'MemberExpression' && !callee.computed && ['window', 'globalThis'].includes(callee.object.name) ? callee.property : callee;
      if (called.type === 'Identifier' && called.name === 'structuredClone') add('structuredClone', node, source(node));
      if (isVueComponentCall(node) && !isLookup(node) && node.arguments[0]?.type === 'StringLiteral') names.add(toKey(node.arguments[0].value));
    } else if (node.type === 'AssignmentExpression') {
      const made = node.operator === '=' && startsAtThis(node.left) && !inClass(node) ? chartCreation(node.right) : null;
      if (made !== null) add('chartObjects', node, `${source(node.left)} = ${made}`);
    } else if (node.type === 'ObjectProperty' || node.type === 'ObjectMethod') {
      const name = keyName(node);
      if (name === 'data' && functionOf(node) !== null) {
        for (const object of returnedObjects(functionOf(node))) dataCharts(object, []);
      } else if (name === 'computed' && node.type === 'ObjectProperty' && node.value.type === 'ObjectExpression') {
        node.value.properties.forEach(computedFunction);
      } else if (name === 'components' && node.type === 'ObjectProperty' && node.value.type === 'ObjectExpression') {
        for (const property of node.value.properties) {
          const key = property.type === 'SpreadElement' ? null : keyName(property);
          if (key) names.add(toKey(key));
        }
      }
    } else if (node.type === 'ExportDefaultDeclaration' && node.declaration.type === 'ObjectExpression') {
      const named = node.declaration.properties.find((property) => property.type === 'ObjectProperty' && keyName(property) === 'name');
      if (named?.value.type === 'StringLiteral') names.add(toKey(named.value.value));
    }
  });
}

/** Whether a template node is whitespace-only text. */
const isBlank = (node) => node?.type === 'VText' && node.value.trim() === '';
const hasDirective = (element, name) => element.startTag.attributes.some((attribute) => attribute.directive && attribute.key.name.name === name);

/** Which sides of an inline element lose a space on Vue 3: `'leading'`, `'trailing'`, both or `null`. */
function lostSpace(siblings, index) {
  const element = siblings[index];
  const { children } = element;
  if (!children.some((child) => child.type === 'VExpressionContainer')) return null;
  const leading = isBlank(children[0]) && children[1]?.type === 'VExpressionContainer';
  const trailing = isBlank(children.at(-1)) && children.at(-2)?.type === 'VExpressionContainer';
  const inline = (node) => node !== undefined && (node.type !== 'VElement' || INLINE_TAGS.has(node.rawName));
  const repeated = hasDirective(element, 'for');
  const before = siblings.slice(0, index).reverse().find((node) => !isBlank(node));
  const after = siblings.slice(index + 1).find((node) => !isBlank(node));
  const sides = [];
  if (leading && (inline(before) || repeated)) sides.push('leading');
  if (trailing && (inline(after) || repeated)) sides.push('trailing');
  return sides.length > 0 ? sides.join(' and ') : null;
}

/** Finds `unknownTags` and `inlineSpaces` in the template tree `body` of a `.vue` file. */
function scanTemplate(file, body, names, hits) {
  const visit = (parent, skipSpaces) => {
    parent.children.forEach((child, index) => {
      if (child.type !== 'VElement') return;
      const tag = child.rawName;
      const skip = skipSpaces || tag.toLowerCase() === 'pre' || ['pre', 'text', 'html'].some((name) => hasDirective(child, name));
      if (NON_STANDARD_TAGS.has(tag.toLowerCase()) && !HTML_TAGS.has(tag) && !SVG_TAGS.has(tag) && !names.has(toKey(tag))) {
        hits.unknownTags.push({ file, line: child.loc.start.line, text: `<${tag}>` });
      }
      if (!skip && INLINE_TAGS.has(tag)) {
        const sides = lostSpace(parent.children, index);
        if (sides !== null) hits.inlineSpaces.push({ file, line: child.loc.start.line, text: `<${tag}>: ${sides} space` });
      }
      visit(child, skip);
    });
  };
  visit(body, false);
}

/** Finds the template and `<script>` block hits of a `.vue` file; `errors` gets the template problems. */
function scanSfc(file, source, names, hits, errors) {
  let parsed;
  try {
    // `parser: false` leaves the scripts to Babel, which reads JSX and the rest of what the codebase writes.
    parsed = vueEslintParser.parseForESLint(source, { parser: false, ecmaVersion: 2022, sourceType: 'module', filePath: file });
  } catch (error) {
    errors.push({ file, kind: 'parse', message: oneLine(error.message), line: error.lineNumber });
    return;
  }
  const top = parsed.services.getDocumentFragment().children.filter((node) => node.type === 'VElement');
  const scripts = top.filter((node) => node.name === 'script' && !node.startTag.attributes.some((attribute) => !attribute.directive && attribute.key.name === 'setup'));
  if (scripts.length > 1) hits.extraScripts.push({ file, line: scripts[1].loc.start.line, text: `${scripts.length} <script> blocks` });
  const body = parsed.ast.templateBody;
  if (!body) {
    if (top.some((node) => node.name === 'template')) errors.push({ file, kind: 'template', message: 'the <template> is not plain HTML, so it was not scanned' });
    return;
  }
  for (const error of body.errors) {
    if (error.code !== SELF_CLOSING) errors.push({ file, kind: 'template', message: oneLine(error.message), line: error.lineNumber });
  }
  scanTemplate(file, body, names, hits);
}

/**
 * Finds the hits of every kind (see `KINDS`) in the `.vue` and `.js` files of a tree. Each list is sorted by file,
 * then line. `sources` is what `readSources` returns; the tree's component names come from all of it, so the order
 * of the files does not matter.
 *
 * Errors are collected, not thrown, and the rest of the tree is still scanned: a script Babel cannot read, a
 * template that is not plain HTML or that the template parser rejects each give one `ScanError`, and that script
 * or template gives no hits. `errors` is sorted by file too.
 * @param {Map<string, string>} sources file path -> source text
 * @param {ScanError[]} [errors] receives the files that did not parse
 * @returns {Record<'structuredClone' | 'chartObjects' | 'computedParams' | 'extraScripts' | 'unknownTags' | 'inlineSpaces', Hit[]>}
 */
export function scan(sources, errors = []) {
  const hits = Object.fromEntries(KINDS.map(({ key }) => [key, []]));
  const names = new Set();
  const files = [...sources.keys()].sort(byCodeUnit);
  for (const file of files) {
    for (const block of scriptBlocks(file, sources.get(file), errors)) {
      try {
        const ast = parseBabel(block.content, { ...BABEL_OPTIONS, startLine: block.startLine });
        scanScript(file, ast, block.content, hits, names);
      } catch (error) {
        errors.push({ file, kind: 'parse', message: oneLine(error.message), line: error.loc?.line });
      }
    }
  }
  // Templates come second: which names the tree registers is known only after every script is read.
  for (const file of files.filter((name) => name.endsWith('.vue'))) scanSfc(file, sources.get(file), names, hits, errors);
  for (const list of Object.values(hits)) list.sort((a, b) => byCodeUnit(a.file, b.file) || a.line - b.line);
  errors.sort((a, b) => byCodeUnit(a.file, b.file) || (a.line ?? 0) - (b.line ?? 0));
  return hits;
}

/**
 * @param {string[]} argv
 * @returns {{ root: string | undefined, json: boolean }}
 * @throws {Error} on an unknown option, a positional argument, or `--root` without a value
 */
export function parseArgs(argv) {
  const { values } = parseNodeArgs({
    args: argv,
    options: { root: { type: 'string' }, json: { type: 'boolean' } },
    allowPositionals: false,
  });
  return { root: values.root, json: values.json === true };
}

/**
 * The report as markdown: totals, each kind with its hits, and the errors.
 * @param {ReturnType<typeof scan>} hits
 * @param {ScanError[]} errors
 * @returns {string}
 */
export function renderReport(hits, errors) {
  const lines = ['# Semantics scan', '', '| Pattern | Hits | Files |', '| --- | ---: | ---: |'];
  for (const { key } of KINDS) lines.push(`| ${key} | ${hits[key].length} | ${new Set(hits[key].map(({ file }) => file)).size} |`);
  for (const { key, why } of KINDS) {
    lines.push('', `## ${key}`, '', why, '');
    if (hits[key].length === 0) {
      lines.push('None.');
      continue;
    }
    lines.push('| file:line | text |', '| --- | --- |');
    for (const { file, line, text } of hits[key]) lines.push(`| ${cell(code(`${file}:${line}`))} | ${cell(code(text))} |`);
  }
  lines.push('', '## Errors', '');
  if (errors.length === 0) lines.push('None.');
  for (const { file, kind, message, line } of errors) lines.push(`- ${code(line === undefined ? file : `${file}:${line}`)} (${kind}): ${oneLine(message)}`);
  return `${lines.join('\n')}\n`;
}

/**
 * Scans the tree under `root` (default: the repo root) and prints the report, or with `--json` the hits and the
 * errors. The report goes to `out`, usage errors to `err`. Exit 0 whatever is found.
 * @param {string[]} argv
 * @param {{ root?: string, out?: { write: (text: string) => unknown }, err?: { write: (text: string) => unknown } }} [deps]
 * @returns {number} the exit code
 */
export function run(argv, { root: defaultRoot = repoRoot, out = process.stdout, err = process.stderr } = {}) {
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
  const errors = [];
  const hits = scan(readSources(root), errors);
  out.write(options.json ? `${JSON.stringify({ ...hits, errors }, null, 2)}\n` : renderReport(hits, errors));
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

// Run the CLI only when executed directly, so tests can import `scan`.
if (isMain()) {
  process.exitCode = run(process.argv.slice(2));
}
