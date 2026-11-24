import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findVue3, moveKeys, run } from './template-keys.mjs';

const SCRIPT = fileURLToPath(new URL('./template-keys.mjs', import.meta.url));
const FILE = 'src/components/Thing.vue';

const lines = (...parts) => parts.join('\n');
/** A `.vue` file with `template` as the content of its template block. */
const sfc = (template) => `<template>\n${template}\n</template>\n\n<script>\nexport default { name: "thing" };\n</script>\n`;
const templateOf = (source) => source.slice('<template>\n'.length, source.indexOf('\n</template>\n\n<script>'));

/** The template after `moveKeys`, which must change nothing around it and nothing on a second run. */
function moved(template) {
  const source = sfc(template);
  const result = moveKeys(source, FILE);
  const after = templateOf(result.source);
  assert.equal(result.source, sfc(after), 'only the template changed');
  const again = moveKeys(result.source, FILE);
  assert.equal(again.source, result.source, 'a second run changes nothing');
  assert.deepEqual(again.moved, [], 'a second run moves nothing');
  return after;
}

/** What `moveKeys` makes of a file with this template, as it is, without the checks of `moved`. */
const resultOf = (template) => moveKeys(sfc(template), FILE);

// ---- what moves -----------------------------------------------------------------------------

test('moves the key of the only child to the template', () => {
  assert.equal(
    moved('<ul><template v-for="a in as"><li :key="a.id">{{ a }}</li></template></ul>'),
    '<ul><template v-for="a in as" :key="a.id"><li>{{ a }}</li></template></ul>',
  );
  const result = resultOf('<ul>\n  <template v-for="a in as"><li :key="a.id">{{ a }}</li></template></ul>');
  assert.deepEqual(result.moved, [{ line: 3, column: 2, key: ':key="a.id"', from: ['li'], removed: 1 }]);
  assert.deepEqual(result.left, []);
  assert.deepEqual(result.kept, []);
});

test('one key when every child has the same key', () => {
  assert.equal(
    moved('<dl><template v-for="a in as"><dt :key="a.id">1</dt><dd :key="a.id">2</dd></template></dl>'),
    '<dl><template v-for="a in as" :key="a.id"><dt>1</dt><dd>2</dd></template></dl>',
  );
  // The same key written another way is the same key.
  assert.equal(
    moved('<dl><template v-for="a in as"><dt :key="a.id">1</dt><dd v-bind:key=\'a.id\'>2</dd></template></dl>'),
    '<dl><template v-for="a in as" :key="a.id"><dt>1</dt><dd>2</dd></template></dl>',
  );
  assert.deepEqual(resultOf('<dl><template v-for="a in as"><dt :key="a.id">1</dt><dd :key="a.id">2</dd></template></dl>').moved[0].removed, 2);
});

test('leaves and reports children with different keys', () => {
  const template = '<dl>\n<template v-for="a in as"><dt :key="a.id + \'-dt\'">1</dt><dd :key="a.id + \'-dd\'">2</dd></template></dl>';
  assert.equal(moved(template), template);
  const result = resultOf(template);
  assert.deepEqual(result.moved, []);
  assert.deepEqual(result.left, [
    { line: 3, column: 0, reason: 'the children have different keys: `:key="a.id + \'-dt\'"`, `:key="a.id + \'-dd\'"`' },
  ]);
  // One template left does not hold back another.
  const two = `${template}\n<ul><template v-for="b in bs"><li :key="b">{{ b }}</li></template></ul>`;
  const both = resultOf(two);
  assert.equal(both.left.length, 1);
  assert.equal(both.moved.length, 1);
  assert.match(both.source, /<dt :key="a\.id \+ '-dt'">1<\/dt>/);
  assert.match(both.source, /<template v-for="b in bs" :key="b"><li>/);
});

test('keeps a key already on the template', () => {
  // The same key on a child is a duplicate: it goes, the template's stays where it is.
  assert.equal(
    moved('<ul><template v-for="a in as" :key="a.id" class="x"><li :key="a.id">{{ a }}</li></template></ul>'),
    '<ul><template v-for="a in as" :key="a.id" class="x"><li>{{ a }}</li></template></ul>',
  );
  // A key already there is not copied a second time.
  const result = resultOf('<ul><template :key="a.id" v-for="a in as"><li :key="a.id">{{ a }}</li></template></ul>');
  assert.equal(templateOf(result.source), '<ul><template :key="a.id" v-for="a in as"><li>{{ a }}</li></template></ul>');
  // A different key on the child is a decision for a person, so nothing changes.
  const template = '<ul><template v-for="a in as" :key="a.id"><li :key="a.name">{{ a }}</li></template></ul>';
  assert.equal(moved(template), template);
  assert.match(resultOf(template).left[0].reason, /^the template has `:key="a\.id"`, a child has `:key="a\.name"`$/);
  // A template that has its key and whose children have none is not touched.
  const done = '<ul><template v-for="a in as" :key="a.id"><li>{{ a }}</li></template></ul>';
  assert.deepEqual(resultOf(done), { source: sfc(done), moved: [], left: [], kept: [] });
});

test("a key that uses the child's own slot or v-for variable is reported", () => {
  // A slot variable of the child is not in scope on the template.
  for (const slot of ['v-slot="{ item }"', 'v-slot="item"', 'slot-scope="item"', '#default="{ item }"']) {
    const template = `<div><template v-for="a in as"><comp ${slot} :key="item.id">{{ a }}</comp></template></div>`;
    assert.equal(moved(template), template, slot);
    const result = resultOf(template);
    assert.deepEqual(result.moved, [], slot);
    assert.match(result.left[0].reason, /^the key of `<comp>` uses its own slot variable `item`$/, slot);
  }
  // Another child that has no such trouble does not make it move: the template is left whole.
  const both = '<div><template v-for="a in as"><p :key="a.id">x</p><comp v-slot="item" :key="item.id">{{ a }}</comp></template></div>';
  assert.equal(moved(both), both);
  assert.equal(resultOf(both).left.length, 1);

  // A child with a v-for of its own keeps its key, which belongs to its own loop; it is listed as kept.
  const loop = '<table><template v-for="g in groups"><tr v-for="r in g.rows" :key="g.id + r.id"><td>{{ r }}</td></tr></template></table>';
  const looped = resultOf(loop);
  assert.equal(looped.source, sfc(loop));
  assert.deepEqual(looped.moved, []);
  assert.deepEqual(looped.left, []);
  assert.deepEqual(looped.kept, [{ line: 2, column: loop.indexOf('<tr'), tag: 'tr', reason: 'it has a `v-for` of its own, and the key belongs to its loop' }]);
});

test('v-slot templates with v-for keep their slot name', () => {
  for (const slot of ['#[name(p)]="r"', 'v-slot:[name(p)]="r"', 'v-slot:cell(x)="r"', '#default="r"']) {
    const template = `<b-table><template v-for="p in ps" ${slot}><span :key="p.name">{{ r }}</span><span>{{ p }}</span></template></b-table>`;
    // Vue 3 reads the template as a dynamic slot and checks no key there; a key on it would be dropped.
    assert.equal(moved(template), template, slot);
    const result = resultOf(template);
    assert.deepEqual(result.moved, [], slot);
    assert.deepEqual(result.left, [], slot);
    assert.equal(result.kept.length, 1, slot);
    assert.equal(result.kept[0].tag, 'span', slot);
    assert.match(result.kept[0].reason, /^the template is a slot, which Vue 3 does not check for keys$/, slot);
  }
  // The slot's own children that are templates of a loop are still looked at.
  assert.equal(
    moved('<b-table><template v-for="p in ps" #[name(p)]="r"><ul><template v-for="q in qs"><li :key="q">{{ q }}</li></template></ul></template></b-table>'),
    '<b-table><template v-for="p in ps" #[name(p)]="r"><ul><template v-for="q in qs" :key="q"><li>{{ q }}</li></template></ul></template></b-table>',
  );
});

test('a second run changes nothing', () => {
  const template = lines(
    '<div>',
    '  <template v-for="a in as"><p :key="a.id">1</p><p :key="a.id">2</p></template>',
    '  <template v-for="a in as"><p :key="a.id + 1">1</p><p :key="a.id + 2">2</p></template>',
    '  <template v-for="a in as"><li v-if="a.x" :key="a.id">1</li></template>',
    '</div>',
  );
  const first = moveKeys(sfc(template), FILE);
  const second = moveKeys(first.source, FILE);
  assert.equal(second.source, first.source);
  assert.deepEqual(second.moved, []);
  assert.deepEqual(second.left, first.left);
  assert.deepEqual(second.kept, first.kept);
});

test('keeps CRLF', () => {
  const crlf = (text) => text.replaceAll('\n', '\r\n');
  const before = crlf(
    sfc(lines(
      '<ul>',
      '  <template v-for="a in as">',
      '    <li',
      '      class="x"',
      '      :key="a.id"',
      '    >{{ a }}</li>',
      '    <li :key="a.id">{{ a }}</li>',
      '  </template>',
      '</ul>',
    )),
  );
  const after = crlf(
    sfc(lines(
      '<ul>',
      '  <template v-for="a in as" :key="a.id">',
      '    <li',
      '      class="x"',
      '    >{{ a }}</li>',
      '    <li>{{ a }}</li>',
      '  </template>',
      '</ul>',
    )),
  );
  const result = moveKeys(before, FILE);
  assert.equal(result.source, after);
  assert.equal(result.source.replaceAll('\r\n', '').includes('\n'), false, 'no bare LF');
  assert.equal(moveKeys(result.source, FILE).source, after);
});

// ---- the rulings: what moves, what stays, and why ---------------------------------------------

test('children of which only some have a key: the one key moves, the keyless need none', () => {
  // On 2.7 an element with no key in a <template v-for> has none (it gets no `__vlist` key), so the key
  // that the template carries is more than it had.
  assert.equal(
    moved('<dl><template v-for="a in as"><dt>{{ a }}</dt><dd :key="a.id">{{ a }}</dd><dd>x</dd></template></dl>'),
    '<dl><template v-for="a in as" :key="a.id"><dt>{{ a }}</dt><dd>{{ a }}</dd><dd>x</dd></template></dl>',
  );
  // Keyless children do not hide that the keys that there are differ.
  const different = '<dl><template v-for="a in as"><dt>{{ a }}</dt><dd :key="a.id">1</dd><dd :key="a.name">2</dd></template></dl>';
  assert.equal(moved(different), different);
  assert.equal(resultOf(different).left.length, 1);
});

test('a nested <template v-for> takes the key of its own children, and an inner template is no keyed child of the outer one', () => {
  assert.equal(
    moved('<ul><template v-for="a in as"><template v-for="b in a.bs"><li :key="b.id">{{ b }}</li></template></template></ul>'),
    '<ul><template v-for="a in as"><template v-for="b in a.bs" :key="b.id"><li>{{ b }}</li></template></template></ul>',
  );
  assert.equal(
    moved('<ul><template v-for="a in as"><h2 :key="a.id">{{ a }}</h2><template v-for="b in a.bs"><li :key="b.id">{{ b }}</li></template></template></ul>'),
    '<ul><template v-for="a in as" :key="a.id"><h2>{{ a }}</h2><template v-for="b in a.bs" :key="b.id"><li>{{ b }}</li></template></template></ul>',
  );
  // An inner template with its key (valid on 3, and what the first run leaves) is its own matter: the outer
  // template takes nothing from it and is not left over it.
  const inner = '<ul><template v-for="a in as"><template v-for="b in a.bs" :key="b.id"><li>{{ b }}</li></template></template></ul>';
  const result = resultOf(inner);
  assert.equal(result.source, sfc(inner));
  assert.deepEqual(result.moved, []);
  assert.deepEqual(result.left, []);
  assert.deepEqual(result.kept, [{ line: 2, column: inner.indexOf('<template v-for="b'), tag: 'template', reason: 'it is a `<template v-for>` itself, and the key is its own' }]);
});

test('a v-if / v-else chain keeps its keys: Vue 3 accepts them there, and they keep the identity 2.7 gives the elements', () => {
  // 2.7 patches the two branches of a chain in place when their keys are the same, and replaces the element
  // when they differ. Vue 3 keeps a key written on a branch and numbers only a branch without one, so the keys
  // as written give the same identity. A key moved to the template would leave the branches the numbers 0 and
  // 1, and the same-key chain would be replaced on every switch. (Vue 3 does not take the same key on two
  // branches when it is a bare variable, a literal or a static key: the next test.)
  const same = '<div><template v-for="a in as"><p v-if="a.x" :key="a.id">1</p><p v-else :key="a.id">2</p></template></div>';
  assert.equal(moved(same), same);
  const sameResult = resultOf(same);
  assert.deepEqual(sameResult.moved, []);
  assert.deepEqual(sameResult.left, []);
  assert.deepEqual(
    sameResult.kept.map(({ tag, reason }) => [tag, reason]),
    [
      ['p', 'it has a `v-if`, `v-else-if`, `v-else` or `v-for` of its own, and Vue 3 accepts its key there'],
      ['p', 'it has a `v-if`, `v-else-if`, `v-else` or `v-for` of its own, and Vue 3 accepts its key there'],
    ],
  );
  const different = '<div><template v-for="a in as"><p v-if="a.x" :key="a.id + \'a\'">1</p><p v-else-if="a.y" :key="a.id + \'b\'">2</p><p v-else :key="a.id + \'c\'">3</p></template></div>';
  assert.equal(moved(different), different);
  assert.equal(resultOf(different).left.length, 0);
  assert.equal(resultOf(different).kept.length, 3);
  // A plain keyed child beside a chain moves, and the chain keeps its own.
  assert.equal(
    moved('<div><template v-for="a in as"><h2 :key="a.id">{{ a }}</h2><p v-if="a.x" :key="a.id + \'a\'">1</p><p v-else :key="a.id + \'b\'">2</p></template></div>'),
    '<div><template v-for="a in as" :key="a.id"><h2>{{ a }}</h2><p v-if="a.x" :key="a.id + \'a\'">1</p><p v-else :key="a.id + \'b\'">2</p></template></div>',
  );
});

test('two branches of one chain with the same simple key are reported: Vue 3 rejects them (v-if/else branches must use unique keys)', () => {
  // Vue 3 compares the keys of the branches of a chain, and rejects two that are the same bare variable of the
  // template (a loop or slot variable), the same literal, or the same static key. A member (`a.id`), a call or a
  // sum it does not reject (the test above), and neither a bare name that is no variable of the template.
  const chain = (key) => lines('<div>', '<template v-for="(a, i) in as">', `<p v-if="a.x" ${key}>1</p>`, `<p v-else ${key}>2</p>`, '</template>', '</div>');
  for (const key of [':key="a"', ':key="i"', ':key="1"', ':key="\'x\'"', 'key="k"', 'v-bind:key="a"']) {
    const template = chain(key);
    assert.equal(moved(template), template, key);
    const result = resultOf(template);
    assert.deepEqual(result.moved, [], key);
    assert.equal(result.left.length, 1, key);
    assert.deepEqual([result.left[0].line, result.left[0].column], [4, 0], key);
    assert.equal(
      result.left[0].reason,
      `the branches of this \`v-if\` chain on lines 4, 5 have the same key \`${key}\`, which Vue 3 rejects for a bare loop or slot variable, a literal or a static key (\`v-if/else branches must use unique keys\`); look at it by hand`,
      key,
    );
    assert.equal(result.kept.length, 2, key);
  }
  // Not rejected by Vue 3, so not reported: a member, a sum, a call, and a name that is no variable of the template.
  for (const key of [':key="a.id"', ':key="a + 1"', ':key="f(a)"', ':key="k"', ':key="(a)"']) {
    const template = chain(key);
    assert.equal(moved(template), template, key);
    assert.deepEqual(resultOf(template).left, [], key);
  }
});

test('the chain with the same key may have three branches, other tags and comments between them; two chains are two chains', () => {
  const three = lines('<div>', '<template v-for="a in as">', '<p v-if="a.x" :key="a">1</p>', '<!-- c -->', '<p v-else-if="a.y" :key="b">2</p>', '<p v-else :key="a">3</p>', '</template>', '</div>');
  const result = resultOf(three);
  assert.equal(result.source, sfc(three));
  assert.equal(result.left.length, 1);
  assert.match(result.left[0].reason, /^the branches of this `v-if` chain on lines 4, 7 have the same key `:key="a"`, /);
  // Another tag changes nothing for Vue 3.
  const tags = '<div><template v-for="a in as"><a v-if="a.x" :key="a">1</a><span v-else :key="a">2</span></template></div>';
  assert.equal(resultOf(tags).left.length, 1);
  // Two chains side by side: the second v-if starts a chain of its own.
  const two = '<div><template v-for="a in as"><p v-if="a.x" :key="a">1</p><p v-if="a.y" :key="a">2</p></template></div>';
  assert.deepEqual(resultOf(two).left, []);
  // An element that is no branch ends the chain.
  const split = '<div><template v-for="a in as"><p v-if="a.x" :key="a">1</p><i></i><p v-else :key="a">2</p></template></div>';
  assert.deepEqual(resultOf(split).left, []);
  // The report of a chain does not hold back a plain keyed child of the same template.
  const both = '<div><template v-for="a in as"><h2 :key="a.id">{{ a }}</h2><p v-if="a.x" :key="a">1</p><p v-else :key="a">2</p></template></div>';
  const mixed = resultOf(both);
  assert.equal(mixed.moved.length, 1);
  assert.equal(mixed.left.length, 1);
  assert.match(mixed.source, /<template v-for="a in as" :key="a\.id"><h2>\{\{ a \}\}<\/h2><p v-if="a\.x" :key="a">1<\/p><p v-else :key="a">2<\/p>/);
});

test('a child with its own v-for keeps its key; a plain keyed sibling moves its own', () => {
  assert.equal(
    moved('<div><template v-for="g in gs"><h3 :key="g.id">{{ g }}</h3><li v-for="r in g.rows" :key="r.id">{{ r }}</li></template></div>'),
    '<div><template v-for="g in gs" :key="g.id"><h3>{{ g }}</h3><li v-for="r in g.rows" :key="r.id">{{ r }}</li></template></div>',
  );
});

test('a child <template v-if> with the key on its children is left as it is', () => {
  const template = '<ul><template v-for="a in as"><template v-if="a.x"><li :key="a.id">{{ a }}</li></template></template></ul>';
  assert.equal(moved(template), template);
  const result = resultOf(template);
  assert.deepEqual([result.moved, result.left, result.kept], [[], [], []]);
  // Beside a plain keyed child it does not change what that child does.
  assert.equal(
    moved('<ul><template v-for="a in as"><h2 :key="a.id">{{ a }}</h2><template v-if="a.x"><li :key="a.id + 1">{{ a }}</li></template></template></ul>'),
    '<ul><template v-for="a in as" :key="a.id"><h2>{{ a }}</h2><template v-if="a.x"><li :key="a.id + 1">{{ a }}</li></template></template></ul>',
  );
});

test('a key on a <slot> outlet moves like any other: 2.7 ignores it there and Vue 3 would pass it as a slot prop', () => {
  assert.equal(
    moved('<div><template v-for="a in as"><slot :key="a.id" name="x" :a="a"></slot></template></div>'),
    '<div><template v-for="a in as" :key="a.id"><slot name="x" :a="a"></slot></template></div>',
  );
});

test('v-bind:key moves as it is written, and a static key is reported: it is the same on every iteration', () => {
  assert.equal(
    moved('<ul><template v-for="a in as"><li v-bind:key="a.id">{{ a }}</li></template></ul>'),
    '<ul><template v-for="a in as" v-bind:key="a.id"><li>{{ a }}</li></template></ul>',
  );
  const template = '<ul><template v-for="a in as"><li key="x">{{ a }}</li></template></ul>';
  assert.equal(moved(template), template);
  assert.match(resultOf(template).left[0].reason, /^the key `key="x"` uses none of the loop variables \(`a`\), so it would be the same on every iteration$/);
  // A static key and a bound one with the same words are two keys.
  const two = '<ul><template v-for="a in as"><li :key="a">1</li><li key="a">2</li></template></ul>';
  assert.equal(moved(two), two);
  assert.equal(resultOf(two).left.length, 1);
});

test('a key that uses no variable of the template loop is reported: it would be the same on every iteration', () => {
  for (const key of [':key="other"', ':key="1"', ':key="\'row\'"', ':key="prefix + 1"']) {
    const template = `<ul><template v-for="(a, i) in as"><li ${key}>{{ a }}</li></template></ul>`;
    assert.equal(moved(template), template, key);
    assert.deepEqual(resultOf(template).moved, [], key);
    assert.equal(resultOf(template).left[0].reason, `the key \`${key}\` uses none of the loop variables (\`a\`, \`i\`), so it would be the same on every iteration`, key);
  }
  // Any one of the variables will do, the index, the key of an object, or a call that has one.
  for (const [loop, key] of [['(a, i) in as', 'i'], ['(a, k) in obj', 'k'], ['(a, k, i) in obj', 'i'], ['a in as', 'rowKey(a)'], ['a in as', 'a[itemKey]']]) {
    const template = `<ul><template v-for="${loop}"><li :key="${key}">{{ a }}</li></template></ul>`;
    assert.equal(moved(template), `<ul><template v-for="${loop}" :key="${key}"><li>{{ a }}</li></template></ul>`, loop);
  }
  // The variable of an outer loop is the same for every iteration of the inner one.
  const nested = '<ul><template v-for="a in as"><template v-for="b in a.bs"><li :key="a.id">{{ b }}</li></template></template></ul>';
  assert.equal(moved(nested), nested);
  assert.match(resultOf(nested).left[0].reason, /uses none of the loop variables \(`b`\)/);
  // A key already on the template is not judged again: the duplicate on the child goes.
  assert.equal(
    moved('<ul><template v-for="a in as" :key="other"><li :key="other">{{ a }}</li></template></ul>'),
    '<ul><template v-for="a in as" :key="other"><li>{{ a }}</li></template></ul>',
  );
});

test('a key set by v-bind="{ key }" is reported, and the template is left whole', () => {
  for (const bind of ['{ key: a.id }', "{ 'key': a.id }", '{ ...rest, key: a.id }', '{ key }']) {
    const template = `<ul><template v-for="a in as"><li v-bind="${bind}">{{ a }}</li></template></ul>`;
    assert.equal(moved(template), template, bind);
    const result = resultOf(template);
    assert.deepEqual(result.moved, [], bind);
    assert.match(result.left[0].reason, /^`<li>` sets a key through `v-bind="\{ \.\.\. \}"`, which Vue 3 does not check; look at it by hand$/, bind);
  }
  // Another key beside it makes the template left, for it cannot be known which one is the one.
  const both = '<ul><template v-for="a in as"><li v-bind="{ key: a.id }">1</li><li :key="a.id">2</li></template></ul>';
  assert.equal(moved(both), both);
  assert.equal(resultOf(both).left.length, 1);
  // A v-bind object without a key, or a variable, is not a key.
  const none = '<ul><template v-for="a in as"><li v-bind="{ id: a.id }" :key="a.id">1</li><li v-bind="props">2</li></template></ul>';
  assert.equal(moved(none), '<ul><template v-for="a in as" :key="a.id"><li v-bind="{ id: a.id }">1</li><li v-bind="props">2</li></template></ul>');
});

test('a template with v-if of its own is left: Vue 3 reads the v-if first, where the key variables are not yet there', () => {
  const template = '<ul><template v-for="a in as" v-if="show"><li :key="a.id">{{ a }}</li></template></ul>';
  assert.equal(moved(template), template);
  assert.match(resultOf(template).left[0].reason, /^the template has a `v-if` of its own$/);
});

test('comments and text between the children are no children, and stay', () => {
  assert.equal(
    moved('<ul><template v-for="a in as"><!-- :key="x" --><li :key="a.id">1</li> text <!-- b --><li :key="a.id">2</li>{{ a }}</template></ul>'),
    '<ul><template v-for="a in as" :key="a.id"><!-- :key="x" --><li>1</li> text <!-- b --><li>2</li>{{ a }}</template></ul>',
  );
  // A key inside a comment is not a key.
  const comment = '<ul><template v-for="a in as"><!-- <li :key="a.id"> --><li>1</li></template></ul>';
  assert.equal(moved(comment), comment);
});

test('a template written in another language is reported, not read', () => {
  const pug = '<template lang="pug">\ntemplate(v-for="a in as")\n  li(:key="a.id") {{ a }}\n</template>\n\n<script>\nexport default {};\n</script>\n';
  const result = moveKeys(pug, FILE);
  assert.equal(result.source, pug);
  assert.deepEqual(result.moved, []);
  assert.deepEqual(result.left, [{ line: 1, column: 0, reason: 'the template is written in `pug`, which this script does not read' }]);
  // Without a v-for there is nothing to look for.
  assert.deepEqual(moveKeys('<template lang="pug">\np {{ a }}\n</template>\n', FILE).left, []);
  // An html template says its language too, and is read.
  const html = '<template lang="html">\n<ul><template v-for="a in as"><li :key="a.id">1</li></template></ul>\n</template>\n';
  assert.match(moveKeys(html, FILE).source, /<template v-for="a in as" :key="a\.id"><li>1<\/li>/);
  // A template in another file cannot be read at all.
  assert.deepEqual(moveKeys('<template src="./a.html"></template>\n', FILE).left, [
    { line: 1, column: 0, reason: 'the template is in another file (`src`), which this script does not read' },
  ]);
});

test('takes the key away with the whitespace that led to it, and tidies a tag that has no attribute left', () => {
  const template = lines(
    '<ul>',
    '  <template',
    '    v-for="a in as"',
    '    class="c"',
    '  >',
    '    <li :key="a.id" class="x">1</li>',
    '    <li',
    '      :key="a.id"',
    '    >2</li>',
    '    <comp',
    '      :key="a.id"',
    '    />',
    '    <comp :key="a.id" />',
    '  </template>',
    '</ul>',
  );
  assert.equal(
    moved(template),
    lines(
      '<ul>',
      '  <template',
      '    v-for="a in as" :key="a.id"',
      '    class="c"',
      '  >',
      '    <li class="x">1</li>',
      '    <li>2</li>',
      '    <comp />',
      '    <comp />',
      '  </template>',
      '</ul>',
    ),
  );
});

test('a key with no value is left, and so is a file with no template or no v-for', () => {
  const template = '<ul><template v-for="a in as"><li :key>{{ a }}</li></template></ul>';
  assert.equal(moved(template), template);
  assert.match(resultOf(template).left[0].reason, /has a key without a value/);
  const noTemplate = '<script>\nexport default {};\n</script>\n';
  assert.deepEqual(moveKeys(noTemplate, FILE), { source: noTemplate, moved: [], left: [], kept: [] });
  const noLoop = sfc('<ul><li :key="a">1</li></ul>');
  assert.deepEqual(moveKeys(noLoop, FILE), { source: noLoop, moved: [], left: [], kept: [] });
});

test('only the template block changes', () => {
  const file = (template) => lines(
    '<script>',
    'const html = `<ul><template v-for="a in as"><li :key="a.id">{{ a }}</li></template></ul>`;',
    'export default { name: "thing", template: \'<template v-for="a in as"><li :key="a.id"></li></template>\' };',
    '</script>',
    '<template>',
    template,
    '</template>',
    '<style>',
    '/* <template v-for="a in as"><li :key="a.id"></li></template> */',
    '</style>',
    '',
  );
  assert.equal(
    moveKeys(file('  <ul><template v-for="a in as"><li :key="a.id">{{ a }}</li></template></ul>'), FILE).source,
    file('  <ul><template v-for="a in as" :key="a.id"><li>{{ a }}</li></template></ul>'),
  );
});

// ---- the command ----------------------------------------------------------------------------

async function withRoot(files, fn) {
  const root = mkdtempSync(join(tmpdir(), 'template-keys-'));
  try {
    for (const [file, contents] of Object.entries(files)) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      writeFileSync(join(root, file), contents);
    }
    return await fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const read = (root, file) => readFileSync(join(root, file), 'utf8');

/** A writable that keeps what it is given, like process.stdout. */
function sink() {
  const chunks = [];
  return {
    write(chunk) {
      chunks.push(chunk);
      return true;
    },
    get text() {
      return chunks.join('');
    },
  };
}

/** `run` against `root` with its output collected and the Vue 3 check off; `writes` lists the paths `write` was asked to write. */
async function cli(root, argv = [], deps = {}) {
  const out = sink();
  const err = sink();
  const writes = [];
  const code = await run(['--root', root, ...argv], {
    write: (path, contents) => {
      writes.push(path);
      writeFileSync(path, contents);
    },
    vue3: null,
    ...deps,
    out,
    err,
  });
  return { code, out: out.text, err: err.text, writes };
}

/** The lines of one `## <heading>` section of a report, up to the next heading. */
const section = (report, heading) => report.split(`## ${heading}\n`)[1].split('\n## ')[0];

const A = sfc('  <ul><template v-for="a in as"><li :key="a.id">{{ a }}</li></template></ul>');
const A_AFTER = sfc('  <ul><template v-for="a in as" :key="a.id"><li>{{ a }}</li></template></ul>');
const B = sfc(lines('  <dl>', '    <template v-for="b in bs">', '      <dt :key="b.id">1</dt>', '      <dd :key="b.id">2</dd>', '    </template>', '  </dl>'));
const B_AFTER = sfc(lines('  <dl>', '    <template v-for="b in bs" :key="b.id">', '      <dt>1</dt>', '      <dd>2</dd>', '    </template>', '  </dl>'));
const MIXED = sfc('  <dl><template v-for="c in cs"><dt :key="c + 1">1</dt><dd :key="c + 2">2</dd></template></dl>');
const CHAIN = sfc('  <p><template v-for="d in ds"><i v-if="d.x" :key="d.id">1</i><i v-else :key="d.id">2</i></template></p>');
const CLEAN = sfc('  <p>{{ x }}</p>');
const FIXTURE = {
  'src/components/A.vue': A,
  'src/views/B/Template.vue': B,
  'src/components/Mixed.vue': MIXED,
  'src/components/Chain.vue': CHAIN,
  'src/components/Clean.vue': CLEAN,
  'src/components/markup.js': 'export default "<template v-for=\\"a in as\\"><li :key=\\"a.id\\"></li></template>";\n',
};

test('a dry run writes nothing and reports; a real run writes the same files; a second run changes nothing', async () => {
  await withRoot(FIXTURE, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 0, dry.err);
    assert.deepEqual(dry.writes, []);
    for (const [file, contents] of Object.entries(FIXTURE)) assert.equal(read(root, file), contents);
    assert.match(dry.out, /^# Template keys \(dry run\)$/m);
    assert.match(section(dry.out, 'Files that would change'), /^- `src\/components\/A\.vue`\n- `src\/views\/B\/Template\.vue`$/m);

    const real = await cli(root);
    assert.equal(real.code, 0, real.err);
    assert.equal(real.err, '');
    assert.deepEqual(real.writes, [join(root, 'src/components/A.vue'), join(root, 'src/views/B/Template.vue')]);
    for (const [file, contents] of Object.entries({ ...FIXTURE, 'src/components/A.vue': A_AFTER, 'src/views/B/Template.vue': B_AFTER })) {
      assert.equal(read(root, file), contents);
    }

    const second = await cli(root);
    assert.equal(second.code, 0, second.err);
    assert.deepEqual(second.writes, []);
    assert.match(second.out, /^\| Keys moved \| 0 \|$/m);
    assert.match(second.out, /^\| Left \| 1 \|$/m);
    assert.equal(section(second.out, 'Changed files').trim(), 'None.');
  });
});

test('only .vue files are read', async () => {
  await withRoot(FIXTURE, async (root) => {
    const seen = [];
    const move = (source, file) => {
      seen.push(file);
      return moveKeys(source, file);
    };
    assert.equal((await cli(root, ['--dry-run'], { move })).code, 0);
    assert.deepEqual(seen, Object.keys(FIXTURE).filter((file) => file.endsWith('.vue')).sort());
  });
});

test('the report gives the totals, each template, what is left and kept, and the files changed', async () => {
  await withRoot(FIXTURE, async (root) => {
    const { out } = await cli(root);
    assert.match(out, /^# Template keys$/m);
    assert.match(out, /^\| Templates \| 2 \|$/m);
    assert.match(out, /^\| Keys moved \| 3 \|$/m);
    assert.match(out, /^\| Files to change \| 2 \|$/m);
    assert.match(out, /^\| Left \| 1 \|$/m);
    assert.match(out, /^\| Kept \| 2 \|$/m);
    assert.deepEqual(section(out, 'Moved').trim().split('\n').slice(2), [
      '| `src/components/A.vue:2` | `:key="a.id"` | `<li>` |',
      '| `src/views/B/Template.vue:3` | `:key="b.id"` | `<dt>`, `<dd>` |',
    ]);
    const left = section(out, 'Left');
    assert.match(left, /Vue 3 needs the key on the template/);
    assert.match(left, /^\| `src\/components\/Mixed\.vue:2` \| the children have different keys: `:key="c \+ 1"`, `:key="c \+ 2"` \|$/m);
    const kept = section(out, 'Kept');
    assert.match(kept, /^\| `src\/components\/Chain\.vue:2` \| `<i>` \| it has a `v-if`/m);
    assert.equal(kept.match(/^\| `src\/components\/Chain\.vue:2`/gm).length, 2);
    assert.equal(section(out, 'Changed files').trim(), '- `src/components/A.vue`\n- `src/views/B/Template.vue`');
    assert.doesNotMatch(out, /^## Failed$/m);
    assert.match(out, /^Vue 3 check: not run \(turned off\)$/m);
  });
  await withRoot({ 'src/components/Clean.vue': CLEAN }, async (root) => {
    const { out, code } = await cli(root);
    assert.equal(code, 0);
    for (const heading of ['Moved', 'Left', 'Kept', 'Changed files']) assert.equal(section(out, heading).trim(), 'None.');
  });
});

test('a changed file that is not what it should be is reported under Failed; nothing at all is written; exit 1', async () => {
  const breaks = [
    ['the template parser reports', (source) => source.replace('</li>', '</li></li>')],
    ['it changed more than key attributes', (source) => source.replace('{{ a }}', '{{ b }}')],
    ['it changed outside its template', (source) => source.replace('"thing"', '"other"')],
    ['a key was lost or changed', (source) => source.replace(' :key="a.id"', '')],
    ['a key was lost or changed', (source) => source.replace(' :key="a.id"', ' :key="a.name"')],
  ];
  for (const [message, damage] of breaks) {
    await withRoot(FIXTURE, async (root) => {
      const move = (source, file) => {
        const result = moveKeys(source, file);
        return file.endsWith('A.vue') ? { ...result, source: damage(result.source) } : result;
      };
      const dry = await cli(root, ['--dry-run'], { move });
      assert.equal(dry.code, 1, message);
      assert.deepEqual(dry.writes, [], message);
      assert.match(dry.out, /^A real run would write nothing\.$/m, message);
      assert.match(dry.err, /1 file\(s\) failed; a real run would write nothing/, message);

      const real = await cli(root, [], { move });
      assert.equal(real.code, 1, message);
      assert.deepEqual(real.writes, [], message);
      for (const [file, contents] of Object.entries(FIXTURE)) assert.equal(read(root, file), contents, message);
      assert.match(section(real.out, 'Failed'), new RegExp(`^- \`src/components/A\\.vue\`: .*${message}`, 'm'));
      assert.match(real.out, /^Nothing was written\.$/m, message);
      assert.equal(section(real.out, 'Changed files').trim(), 'None.', message);
      assert.match(real.err, /1 file\(s\) failed; nothing was written/, message);
    });
  }
});

test('a file that does not parse fails the run', async () => {
  await withRoot(FIXTURE, async (root) => {
    const move = (source, file) => {
      if (file.endsWith('Mixed.vue')) throw new Error('the file does not parse');
      return moveKeys(source, file);
    };
    const result = await cli(root, [], { move });
    assert.equal(result.code, 1);
    assert.deepEqual(result.writes, []);
    assert.match(section(result.out, 'Failed'), /^- `src\/components\/Mixed\.vue`: the file does not parse$/m);
  });
});

test('a write that throws is a failure with its message; the other files are still written', async () => {
  await withRoot(FIXTURE, async (root) => {
    const result = await cli(root, [], {
      write: (path, contents) => {
        if (path.endsWith('A.vue')) throw new Error('EACCES: permission denied');
        writeFileSync(path, contents);
      },
    });
    assert.equal(result.code, 1);
    assert.match(section(result.out, 'Failed'), /`src\/components\/A\.vue`: write failed: EACCES/);
    assert.equal(read(root, 'src/components/A.vue'), A);
    assert.equal(read(root, 'src/views/B/Template.vue'), B_AFTER);
    assert.equal(section(result.out, 'Changed files').trim(), '- `src/views/B/Template.vue`');
  });
});

test('usage errors exit 2 with the usage line on stderr and nothing on stdout', async () => {
  await withRoot(FIXTURE, async (root) => {
    await withRoot({ 'README.md': 'no src here\n' }, async (noSrc) => {
      const cases = {
        'an unknown option': ['--root', root, '--bogus'],
        'a positional argument': ['--root', root, 'extra'],
        '--root without a value': ['--root'],
        '--root that does not exist': ['--root', join(root, 'missing')],
        '--root without a src/ folder': ['--root', noSrc],
      };
      for (const [label, argv] of Object.entries(cases)) {
        const out = sink();
        const err = sink();
        const writes = [];
        const code = await run(argv, { out, err, write: (path) => writes.push(path), vue3: null });
        assert.equal(code, 2, label);
        assert.equal(out.text, '', label);
        assert.match(err.text, /usage: node scripts\/vue3-migration\/template-keys\.mjs \[--root <dir>\] \[--dry-run\]/, label);
        assert.deepEqual(writes, [], label);
      }
    });
  });
});

test('the script runs as a command', async () => {
  await withRoot(FIXTURE, async (root) => {
    const { status, stdout, stderr } = spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8' });
    assert.equal(status, 0, stderr);
    assert.match(stdout, /^\| Keys moved \| 3 \|$/m);
    assert.equal(read(root, 'src/components/A.vue'), A_AFTER);
    const dry = spawnSync(process.execPath, [SCRIPT, '--root', root, '--dry-run'], { encoding: 'utf8' });
    assert.equal(dry.status, 0, dry.stderr);
    assert.match(dry.stdout, /^# Template keys \(dry run\)$/m);
  });
});

// ---- no Vue 2.7 compiler ---------------------------------------------------------------------

test('imports nothing that needs a Vue 2.7 compiler of its own: the parser and the shared helpers only', () => {
  const source = readFileSync(SCRIPT, 'utf8');
  const specifiers = [...source.matchAll(/^import\s[^;]*?from\s+'([^']+)';$/gm)].map(([, specifier]) => specifier);
  assert.ok(specifiers.length > 0);
  const allowed = new Set(['vue-eslint-parser', './component-graph.mjs', './register-components.mjs', './register-write.mjs']);
  for (const specifier of specifiers) assert.ok(specifier.startsWith('node:') || allowed.has(specifier), `unexpected import ${specifier}`);
  // The Vue 3 compiler is looked up from the root of the tree, never imported by name.
  assert.doesNotMatch(source, /from\s+'(?:vue\/compiler-sfc|@vue\/compiler-sfc|vue-template-compiler)'/);
});

/** A fake `@vue/compiler-sfc` of `version` in `root/node_modules`: it rejects what Vue 3 rejects, a keyed child of a <template v-for>. */
function installFakeCompiler(root, version) {
  const dir = join(root, 'node_modules', '@vue', 'compiler-sfc');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: '@vue/compiler-sfc', version, main: 'index.js' }));
  writeFileSync(
    join(dir, 'index.js'),
    [
      'exports.parse = (source) => ({ descriptor: { template: { content: source.slice(source.indexOf("<template>") + 10, source.lastIndexOf("</template>")) } }, errors: [] });',
      'exports.compileTemplate = ({ source }) => ({',
      '  errors: [...source.matchAll(/<template v-for[^>]*>\\s*<[a-z-]+ [^>]*:key=/g)].map(() => ({ message: "<template v-for> key should be placed on the <template> tag." })),',
      '});',
      '',
    ].join('\n'),
  );
}

test('the Vue 3 check is looked up from the root: used when @vue/compiler-sfc there is 3.x, and said not to have run otherwise', async () => {
  await withRoot({ 'src/a.js': '' }, async (root) => {
    assert.match(findVue3(root).reason, /^`@vue\/compiler-sfc` is not installed in the root$/);
    installFakeCompiler(root, '2.7.16');
    assert.match(findVue3(root).reason, /^`@vue\/compiler-sfc` 2\.7\.16 in the root is not 3\.x$/);
    installFakeCompiler(root, '3.5.45');
    const found = findVue3(root);
    assert.equal(found.version, '3.5.45');
    assert.equal(found.check(A, 'x.vue').length, 1);
  });
});

test('with the Vue 3 check, a changed file that Vue 3 still rejects fails the run; one it accepts is written', async () => {
  await withRoot(FIXTURE, async (root) => {
    installFakeCompiler(root, '3.5.45');
    const ok = await cli(root, ['--dry-run'], { vue3: undefined });
    assert.equal(ok.code, 0, ok.err);
    assert.match(ok.out, /^Vue 3 check: ran with `@vue\/compiler-sfc` 3\.5\.45 from the root; key placement errors in the changed files: 2 before, 0 after$/m);

    // A result that leaves the keyed child where it was: Vue 3 still reports it.
    const move = (source, file) => (file.endsWith('A.vue') ? { ...moveKeys(source, file), source: A.replace('<li :key="a.id">', '<li :key="a.id" class="x">') } : moveKeys(source, file));
    const bad = await cli(root, [], { vue3: undefined, move });
    assert.equal(bad.code, 1);
    assert.deepEqual(bad.writes, []);
    assert.match(section(bad.out, 'Failed'), /^- `src\/components\/A\.vue`: /m);
    assert.equal(read(root, 'src/components/A.vue'), A);

    // Vue 3 that reports the same placement error before and after the move: the move did not cure it.
    const stubborn = { version: '3.5.0', check: () => [{ message: '<template v-for> key should be placed on the <template> tag.', line: 2 }] };
    const still = await cli(root, [], { vue3: stubborn });
    assert.equal(still.code, 1);
    assert.deepEqual(still.writes, []);
    assert.match(section(still.out, 'Failed'), /^- `src\/components\/A\.vue`: Vue 3 reports 1 key placement error\(s\) after 1 template\(s\) got their key, where it reported 1 before$/m);

    // Vue 3 that reports an error the file had not.
    const strict = { version: '3.5.0', check: (source) => (source.includes('<li>') ? [{ message: 'Unexpected token', line: 2 }] : []) };
    const fresh = await cli(root, [], { vue3: strict });
    assert.equal(fresh.code, 1);
    assert.match(section(fresh.out, 'Failed'), /^- `src\/components\/A\.vue`: Vue 3 reports an error that the file had not: Unexpected token$/m);

    const real = await cli(root, [], { vue3: undefined });
    assert.equal(real.code, 0, real.err);
    assert.equal(read(root, 'src/components/A.vue'), A_AFTER);
  });
});

test('the Vue 3 check covers every file with something left or kept, and lists the key errors that are left', async () => {
  await withRoot(FIXTURE, async (root) => {
    const calls = new Set();
    const vue3 = {
      version: '3.5.0',
      check(source, file) {
        calls.add(file);
        const errors = [];
        if (/<(?:li|dt) :key/.test(source)) errors.push({ message: '<template v-for> key should be placed on the <template> tag.', line: 2 });
        if (file.endsWith('Chain.vue')) errors.push({ message: 'v-if/else branches must use unique keys.', line: 4 }, { message: 'Unexpected token', line: 3 });
        return errors;
      },
    };
    const { code, out } = await cli(root, ['--dry-run'], { vue3 });
    assert.equal(code, 0);
    // The changed files, those with a place left, those with a key kept; not the clean one, not a .js file.
    assert.deepEqual([...calls].sort(), ['src/components/A.vue', 'src/components/Chain.vue', 'src/components/Mixed.vue', 'src/views/B/Template.vue']);
    assert.match(out, /^\| Key errors left on Vue 3 \| 2 \|$/m);
    assert.deepEqual(section(out, 'Key errors left on Vue 3').split('\n').filter((line) => line.startsWith('| `')), [
      '| `src/components/Chain.vue:4` | v-if/else branches must use unique keys. |',
      '| `src/components/Mixed.vue:2` | <template v-for> key should be placed on the <template> tag. |',
    ]);
    assert.match(out, /^Vue 3 check: ran with `@vue\/compiler-sfc` 3\.5\.0 from the root; key placement errors in the changed files: 2 before, 0 after$/m);
  });
  await withRoot({ 'src/components/Clean.vue': CLEAN }, async (root) => {
    const { out } = await cli(root, ['--dry-run'], { vue3: { version: '3.5.0', check: () => [] } });
    assert.equal(section(out, 'Key errors left on Vue 3').trim(), 'None.');
    assert.match(out, /^\| Key errors left on Vue 3 \| 0 \|$/m);
  });
  // Without the check the report says that it has not looked.
  await withRoot(FIXTURE, async (root) => {
    const { out } = await cli(root, ['--dry-run']);
    assert.match(out, /^\| Key errors left on Vue 3 \| n\/a \|$/m);
    assert.equal(section(out, 'Key errors left on Vue 3').trim(), 'Not looked at: the Vue 3 check did not run.');
  });
});

test('a root with no Vue 3 compiler runs without the check, and the report says so', async () => {
  await withRoot(FIXTURE, async (root) => {
    const { code, out } = await cli(root, ['--dry-run'], { vue3: undefined });
    assert.equal(code, 0);
    assert.match(out, /^Vue 3 check: not run \(`@vue\/compiler-sfc` is not installed in the root\)$/m);
  });
});

// With a Vue 3 compiler in the tree (the switch branch has one), the real thing: after the move, no key placement error.
const REAL_VUE3 = findVue3(fileURLToPath(new URL('../..', import.meta.url)));
test('the output compiles on Vue 3 without a key placement error', { skip: REAL_VUE3.check ? false : REAL_VUE3.reason }, () => {
  const before = sfc('<ul><template v-for="a in as"><li :key="a.id">{{ a }}</li></template><template v-for="b in bs"><dt :key="b.id + 1">1</dt><dd :key="b.id + 2">2</dd></template></ul>');
  const after = moveKeys(before, FILE).source;
  const placement = (source) => REAL_VUE3.check(source, FILE).filter(({ message }) => /key should be placed on the <template> tag/.test(message));
  assert.equal(placement(before).length, 2);
  assert.equal(placement(after).length, 1, 'only the template that was left');
});

test('what the script reports as the same simple key on a chain is what Vue 3 rejects', { skip: REAL_VUE3.check ? false : REAL_VUE3.reason }, () => {
  const chain = (key, branches) => lines('<div>', '<template v-for="(a, i) in as">', ...branches.map((branch) => `<p ${branch} ${key}>1</p>`), '</template>', '</div>');
  const keys = [':key="a"', ':key="i"', ':key="1"', ':key="\'x\'"', 'key="k"', 'v-bind:key="a"', ':key="a.id"', ':key="a + 1"', ':key="f(a)"', ':key="k"', ':key="(a)"'];
  for (const key of keys) {
    for (const branches of [['v-if="a.x"', 'v-else'], ['v-if="a.x"', 'v-else-if="a.y"', 'v-else']]) {
      const template = chain(key, branches);
      const rejected = REAL_VUE3.check(sfc(template), FILE).some(({ message }) => /branches must use unique keys/.test(message));
      assert.equal(resultOf(template).left.length > 0, rejected, `${key} on ${branches.length} branches`);
    }
  }
});
