import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Vue from 'vue';

const UTILS = new URL('../../src/utils/', import.meta.url);

// src/utils/lodashUtils.js is the file the app ships, so the test loads that
// file. Webpack resolves its extensionless `import ... from "./sortUtils"`,
// Node does not, and Node also takes a `.js` file in this package for CommonJS.
// Two small in-process hooks cover both, so the source stays as webpack wants it
// (`registerHooks` needs Node 22.15 or later; CI runs Node 22).
registerHooks({
  resolve(specifier, context, nextResolve) {
    const local = specifier.startsWith('./') && context.parentURL?.startsWith(UTILS.href);
    return nextResolve(local && !/\.\w+$/.test(specifier) ? `${specifier}.js` : specifier, context);
  },
  load(url, context, nextLoad) {
    if (!url.startsWith(UTILS.href)) return nextLoad(url, context);
    return { format: 'module', source: readFileSync(fileURLToPath(url), 'utf8'), shortCircuit: true };
  },
});

let cloneDeep;

before(async () => {
  ({ cloneDeep } = await import(new URL('lodashUtils.js', UTILS).href));
});

test('copies nested arrays and objects', () => {
  const source = { name: 'a', rows: [{ id: 1, tags: ['x', 'y'] }, { id: 2, tags: [] }], meta: { deep: { n: 3 } } };
  const copy = cloneDeep(source);
  assert.deepEqual(copy, source);
  assert.notEqual(copy, source);
  assert.notEqual(copy.rows, source.rows);
  assert.notEqual(copy.rows[0], source.rows[0]);
  assert.notEqual(copy.rows[0].tags, source.rows[0].tags);
  assert.notEqual(copy.meta.deep, source.meta.deep);
  copy.rows[0].tags.push('z');
  copy.meta.deep.n = 4;
  assert.deepEqual(source.rows[0].tags, ['x', 'y']);
  assert.equal(source.meta.deep.n, 3);
});

test('copies Date, Map and Set', () => {
  const when = new Date(2026, 10, 23);
  const inner = { n: 1 };
  const copy = cloneDeep({ when, map: new Map([['k', inner]]), set: new Set([inner]) });
  assert.ok(copy.when instanceof Date);
  assert.notEqual(copy.when, when);
  assert.equal(copy.when.getTime(), when.getTime());
  assert.ok(copy.map instanceof Map);
  assert.deepEqual(copy.map.get('k'), inner);
  assert.notEqual(copy.map.get('k'), inner);
  assert.ok(copy.set instanceof Set);
  assert.notEqual([...copy.set][0], inner);
  assert.deepEqual([...copy.set][0], inner);
});

test('keeps undefined values and functions as they are', () => {
  const fn = () => 1;
  const copy = cloneDeep({ a: undefined, b: null, fn, list: [undefined, fn] });
  assert.ok('a' in copy);
  assert.equal(copy.a, undefined);
  assert.equal(copy.b, null);
  assert.equal(copy.fn, fn);
  assert.equal(copy.list.length, 2);
  assert.equal(copy.list[0], undefined);
  assert.equal(copy.list[1], fn);
});

test('copies a typed array', () => {
  const source = new Float32Array([1.5, 2.5, 3.5]);
  const copy = cloneDeep({ values: source }).values;
  assert.ok(copy instanceof Float32Array);
  assert.deepEqual([...copy], [1.5, 2.5, 3.5]);
  assert.notEqual(copy.buffer, source.buffer);
  copy[0] = 9;
  assert.equal(source[0], 1.5);
});

test('copies a DataView over its own bytes', () => {
  const buffer = new Uint8Array([1, 2, 3, 4, 5, 6]).buffer;
  const source = new DataView(buffer, 2, 3);
  const copy = cloneDeep(source);
  assert.ok(copy instanceof DataView);
  assert.equal(copy.byteLength, 3);
  assert.equal(copy.getUint8(0), 3);
  assert.notEqual(copy.buffer, buffer);
  copy.setUint8(0, 99);
  assert.equal(source.getUint8(0), 3);
});

test('a 2.7 observed object clones without __ob__', () => {
  const observed = Vue.observable({ rows: [{ id: 1, nested: { n: 2 } }], when: new Date(0) });
  assert.ok(observed.__ob__, 'the source is observed');
  const copy = cloneDeep(observed);
  assert.equal(Object.getOwnPropertyDescriptor(copy, '__ob__'), undefined);
  assert.equal(Object.getOwnPropertyDescriptor(copy.rows, '__ob__'), undefined);
  assert.equal(Object.getOwnPropertyDescriptor(copy.rows[0].nested, '__ob__'), undefined);
  assert.deepEqual(copy.rows, [{ id: 1, nested: { n: 2 } }]);
  assert.equal(copy.when.getTime(), 0);
  // plain data again: assigning to it adds no reactive accessor
  const descriptor = Object.getOwnPropertyDescriptor(copy.rows[0], 'id');
  assert.equal(descriptor.get, undefined);
});
