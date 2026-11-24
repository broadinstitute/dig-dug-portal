import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderOf } from './compare-render.mjs';
import { addSpaces, run } from './explicit-spaces.mjs';

const require = createRequire(import.meta.url);
const Vue = require('vue/dist/vue.runtime.common.dev.js');
Vue.config.productionTip = false;

const SCRIPT = fileURLToPath(new URL('./explicit-spaces.mjs', import.meta.url));
const FILE = 'src/components/Thing.vue';

const lines = (...parts) => parts.join('\n');
/** A `.vue` file with `template` as the content of its template block. */
const sfc = (template) => `<template>\n${template}\n</template>\n\n<script>\nexport default { name: "thing" };\n</script>\n`;
const templateOf = (source) => source.slice('<template>\n'.length, source.indexOf('\n</template>\n\n<script>'));

/** The template after `addSpaces`, which must change nothing around it and nothing on a second run. */
function spaced(template) {
  const source = sfc(template);
  const result = addSpaces(source, FILE);
  const after = templateOf(result.source);
  assert.equal(result.source, sfc(after), 'only the template changed');
  const again = addSpaces(result.source, FILE);
  assert.deepEqual(again, { source: result.source, added: [], left: result.left }, 'a second run changes nothing');
  return after;
}

/** The place of each space added to a file with this template. */
const addedTo = (template) => addSpaces(sfc(template), FILE).added;

/** The VNodes Vue 2.7 renders for a template, as `[tag, text of the element]` in document order. */
function renderedText(template) {
  const { render, staticRenderFns, errors } = renderOf(template);
  assert.deepEqual(errors, []);
  const compiled = new Function(`return { render: ${render}, staticRenderFns: [${staticRenderFns.join(',')}] };`)();
  const vm = new Vue({ data: () => ({ x: 'X', y: 'Y', xs: ['A', 'B'], yes: true, empty: '', none: null }), ...compiled });
  const found = [];
  const textOf = (vnode) => {
    if (vnode.tag === undefined) return vnode.isComment ? '' : vnode.text;
    const entry = [vnode.tag, ''];
    found.push(entry);
    entry[1] = (vnode.children ?? []).map(textOf).join('');
    return entry[1];
  };
  textOf(vm._render());
  return found;
}

// ---- what is added --------------------------------------------------------------------------

test('adds a leading and a trailing space', () => {
  assert.equal(spaced('<p><b>a</b><span> {{ x }} </span><b>c</b></p>'), '<p><b>a</b><span>{{ " " }}{{ x }}{{ " " }}</span><b>c</b></p>');
  assert.equal(spaced('<p><b>a</b><span> {{ x }}</span><b>c</b></p>'), '<p><b>a</b><span>{{ " " }}{{ x }}</span><b>c</b></p>');
  assert.equal(spaced('<p><b>a</b><span>{{ x }} </span><b>c</b></p>'), '<p><b>a</b><span>{{ x }}{{ " " }}</span><b>c</b></p>');
  assert.deepEqual(addedTo('<p>\n<b>a</b><span> {{ x }} </span><b>c</b></p>'), [
    { line: 3, column: 8, tag: 'span', side: 'leading' },
    { line: 3, column: 8, tag: 'span', side: 'trailing' },
  ]);
});

test('keeps a line break and its indentation, inside the braces', () => {
  const before = lines('    <p>', '        <b>a</b><span class="n">', '            {{ x }}', '        </span><b>c</b>', '    </p>');
  const after = lines('    <p>', '        <b>a</b><span class="n">{{', '            " " }}{{ x }}{{ " "', '        }}</span><b>c</b>', '    </p>');
  assert.equal(spaced(before), after);

  const tabs = '\t<p>\n\t\t<b>a</b><span>\n\t\t\t{{ x }}\n\t\t</span><b>c</b>\n\t</p>';
  assert.equal(spaced(tabs), '\t<p>\n\t\t<b>a</b><span>{{\n\t\t\t" " }}{{ x }}{{ " "\n\t\t}}</span><b>c</b>\n\t</p>');
});

test('a space written as an entity is replaced whole, for it is no code', () => {
  assert.equal(spaced('<p><b>a</b><span>&#32;{{ x }}</span></p>'), '<p><b>a</b><span>{{ " " }}{{ x }}</span></p>');
  assert.equal(spaced('<p><b>a</b><span>\n  &#32;{{ x }}</span></p>'), '<p><b>a</b><span>{{ " " }}{{ x }}</span></p>');
});

test('adds one for a v-for item', () => {
  assert.equal(
    spaced('<div><span v-for="i in xs" :key="i">{{ i }} </span></div>'),
    '<div><span v-for="i in xs" :key="i">{{ i }}{{ " " }}</span></div>',
  );
  // The same element without the loop stands alone in its block, where no space is drawn.
  assert.equal(spaced('<div><span>{{ x }} </span></div>'), '<div><span>{{ x }} </span></div>');
});

test('adds one in a template that is no slot, and in nested elements, in their own places', () => {
  assert.equal(
    spaced('<p>a<template v-if="yes"> {{ x }}</template></p>'),
    '<p>a<template v-if="yes">{{ " " }}{{ x }}</template></p>',
  );
  const nested = '<p><i>1</i><span> {{ x }}<i>2</i><b> {{ y }} </b><i>3</i>{{ x }} </span><i>4</i></p>';
  assert.equal(spaced(nested), '<p><i>1</i><span>{{ " " }}{{ x }}<i>2</i><b>{{ " " }}{{ y }}{{ " " }}</b><i>3</i>{{ x }}{{ " " }}</span><i>4</i></p>');
});

test('adds one in the slot of a component with v-if, which 2.7 compiles with a hash of the slot', () => {
  const before = '<div><b-table v-if="yes"><template #cell(x)="r"><b>a</b><span> {{ r.value }}</span></template></b-table></div>';
  assert.match(renderOf(before).render, /,null,false,\d+\)/);
  assert.equal(spaced(before), before.replace('<span> {{', '<span>{{ " " }}{{'));
});

test('leaves an element whose neighbours are blocks', () => {
  const template = '<div><div>a</div> <span> {{ x }} </span> <p>b</p><br><span> {{ y }} </span></div>';
  assert.equal(spaced(template), template);
  assert.deepEqual(addSpaces(sfc(template), FILE), { source: sfc(template), added: [], left: [] });
});

test('leaves pre, v-text and v-html alone', () => {
  for (const template of [
    '<pre><b>a</b><span> {{ x }} </span><b>c</b></pre>',
    '<p><b>a</b><span v-pre> {{ x }} </span><b>c</b></p>',
    '<p><b>a</b><span v-text="y"> {{ x }} </span><b>c</b></p>',
    '<p><b>a</b><span v-html="y"> {{ x }} </span><b>c</b></p>',
  ]) {
    assert.equal(spaced(template), template);
  }
});

test('leaves a non-breaking space, and text that brings its own space', () => {
  for (const template of ['<p><b>a</b><span>&nbsp;{{ x }}&nbsp;</span><b>c</b></p>', '<p>a <span> {{ x }} </span> c</p>']) {
    assert.equal(spaced(template), template);
  }
});

test('only the template block changes', () => {
  const block = (space) => lines(
    '<script>',
    'const html = `<p><b>a</b><span> {{ x }} </span><b>c</b></p>`;',
    'export default { name: "thing", template: "<p><b>a</b><span> {{ x }} </span></p>" };',
    '</script>',
    '<template>',
    `  <p><b>a</b><span>${space}{{ x }}</span></p>`,
    '</template>',
    '<style>',
    '/* <b>a</b><span> {{ x }} </span> */',
    '</style>',
    '<docs><b>a</b><span> {{ x }} </span></docs>',
    '',
  );
  assert.equal(addSpaces(block(' '), FILE).source, block('{{ " " }}'));
});

test('a file with no template, or with nothing to add, comes back as it is', () => {
  for (const source of ['<script>\nexport default {};\n</script>\n', '', sfc('<p>{{ x }}</p>')]) {
    assert.deepEqual(addSpaces(source, FILE), { source, added: [], left: [] });
  }
});

test('keeps CRLF', () => {
  const crlf = (text) => text.replaceAll('\n', '\r\n');
  const before = sfc('  <p>\n    <b>a</b><span>\n      {{ x }}\n    </span><b>c</b><i> {{ y }}</i>\n  </p>');
  const after = sfc('  <p>\n    <b>a</b><span>{{\n      " " }}{{ x }}{{ " "\n    }}</span><b>c</b><i>{{ " " }}{{ y }}</i>\n  </p>');
  assert.equal(addSpaces(before, FILE).source, after);
  assert.equal(addSpaces(crlf(before), FILE).source, crlf(after));
  assert.deepEqual(addSpaces(crlf(after), FILE), { source: crlf(after), added: [], left: [] });
});

test('a second run changes nothing', () => {
  const first = addSpaces(sfc('<p><b>a</b><span>\n  {{ x }}\n</span><b>c</b></p>'), FILE);
  assert.equal(first.added.length, 2);
  assert.deepEqual(addSpaces(first.source, FILE), { source: first.source, added: [], left: [] });
});

// ---- Vue 2.7 renders the same ---------------------------------------------------------------

test('text renders the same on 2.7', () => {
  const templates = [
    '<p><b>a</b><span> {{ x }} </span><b>c</b></p>',
    '<p><b>a</b><span>\n    {{ x }}\n  </span><b>c</b></p>',
    '<p><b>a</b><span>\r\n    {{ x }}\r\n  </span><b>c</b></p>',
    '<p><b>a</b><span>\n\n\t\t{{ x }}, {{ y }}\n\n</span><b>c</b></p>',
    '<p><b>a</b><span>\n    {{\n        yes ? x : y\n    }}\n  </span><b>c</b></p>',
    '<p><b>a</b><span>&#32;{{ x }}&#32;</span><b>c</b></p>',
    '<p><b>a</b><span> {{ empty }} </span><span> {{ none }} </span><b>c</b></p>',
    '<p><span v-for="i in xs" :key="i">\n  {{ i }}\n</span></p>',
    '<p>a<template v-if="yes">\n  {{ x }}\n</template><template v-else> {{ y }} </template></p>',
    '<p><i>1</i><span> {{ x }}<i>2</i><b> {{ y }} </b><i>3</i>{{ x }} </span><i>4</i></p>',
    '<p><b>a</b><span> {{ x }} tail</span><label>\n{{ y }} <input>\n</label></p>',
    '<p><b>a</b><span> {{ " " }} </span><b>c</b></p>',
  ];
  for (const template of templates) {
    const after = spaced(template);
    assert.notEqual(after, template, template);
    assert.deepEqual(renderedText(after), renderedText(template), template);
  }
  assert.deepEqual(renderedText(templates[1]), [['p', 'a X c'], ['b', 'a'], ['span', ' X '], ['b', 'c']]);
});

test('whitespace beside the added space would be a second space on 2.7, so none is left there', () => {
  assert.deepEqual(renderedText('<span>{{ " " }}\n  {{ x }}{{ " " }}\n</span>'), [['span', '  X  ']]);
  assert.deepEqual(renderedText('<span>\n  {{ " " }}{{ x }}\n  {{ " " }}</span>'), [['span', '  X  ']]);
  assert.deepEqual(renderedText('<span>{{\n  " " }}{{ x }}{{ " "\n}}</span>'), [['span', ' X ']]);
});

test('a place where 2.7 renders no space is left as it is and listed', () => {
  // A comment cuts the text in two, and 2.7 drops a whitespace-only piece at the edge of an element.
  const template = '<p><b>a</b><span> <!-- c -->{{ x }} </span><b>c</b></p>';
  const result = addSpaces(sfc(template), FILE);
  assert.equal(templateOf(result.source), '<p><b>a</b><span> <!-- c -->{{ x }}{{ " " }}</span><b>c</b></p>');
  assert.deepEqual(result.added, [{ line: 2, column: 11, tag: 'span', side: 'trailing' }]);
  assert.deepEqual(result.left, [{ line: 2, column: 11, tag: 'span', side: 'leading' }]);
  assert.deepEqual(renderedText(templateOf(result.source)), renderedText(template));

  // The same in a part that 2.7 compiles to a static render function.
  const once = '<div><p v-once><b>a</b><span> <!-- c -->{{ x }}</span><i> {{ y }}</i></p></div>';
  assert.equal(renderOf(once).staticRenderFns.length, 1);
  assert.equal(spaced(once), once.replace('<i> ', '<i>{{ " " }}'));
});

test('a template that does not compile on 2.7 throws', () => {
  assert.throws(() => addSpaces(sfc('<p><b>a</b><span> {{ x }} </span></p><p></p>'), FILE), /does not compile on Vue 2\.7: .*one root element/);
  assert.throws(() => addSpaces(sfc('<p><b>a</b><span v-if="x +"> {{ y }} </span></p>'), FILE), /does not compile on Vue 2\.7: /);
});

// ---- command line ---------------------------------------------------------------------------

async function withRoot(files, fn) {
  const root = mkdtempSync(join(tmpdir(), 'explicit-spaces-'));
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

/** `run` against `root` with its output collected; `writes` lists the paths `write` was asked to write. */
async function cli(root, argv = [], deps = {}) {
  const out = sink();
  const err = sink();
  const writes = [];
  const code = await run(['--root', root, ...argv], {
    write: (path, contents) => {
      writes.push(path);
      writeFileSync(path, contents);
    },
    ...deps,
    out,
    err,
  });
  return { code, out: out.text, err: err.text, writes };
}

/** The lines of one `## <heading>` section of a report, up to the next heading. */
const section = (report, heading) => report.split(`## ${heading}\n`)[1].split('\n## ')[0];

const A = sfc('  <p><b>a</b><span> {{ x }} </span><b>c</b></p>');
const A_AFTER = sfc('  <p><b>a</b><span>{{ " " }}{{ x }}{{ " " }}</span><b>c</b></p>');
const B = sfc('  <p><b>a</b><b-badge> {{ x }}</b-badge><b-badge>{{ x }} </b-badge>c</p>');
const B_AFTER = sfc('  <p><b>a</b><b-badge>{{ " " }}{{ x }}</b-badge><b-badge>{{ x }}{{ " " }}</b-badge>c</p>');
const COMMENT = sfc('  <p><b>a</b><span> <!-- c -->{{ x }}</span></p>');
const CLEAN = sfc('  <p>{{ x }}</p>');
const FIXTURE = {
  'src/components/A.vue': A,
  'src/views/B/Template.vue': B,
  'src/components/Comment.vue': COMMENT,
  'src/components/Clean.vue': CLEAN,
  'src/components/markup.js': 'export default "<p><b>a</b><span> {{ x }} </span></p>";\n',
};

test('a dry run writes nothing and reports; a real run writes the same files; a second run changes nothing', async () => {
  await withRoot(FIXTURE, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 0, dry.err);
    assert.deepEqual(dry.writes, []);
    for (const [file, contents] of Object.entries(FIXTURE)) assert.equal(read(root, file), contents);
    assert.match(dry.out, /^# Explicit spaces \(dry run\)$/m);
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
    assert.match(second.out, /^\| Spaces \| 0 \|$/m);
    assert.match(second.out, /^\| Left \| 1 \|$/m);
    assert.equal(section(second.out, 'Changed files').trim(), 'None.');
  });
});

test('only .vue files are read', async () => {
  await withRoot(FIXTURE, async (root) => {
    const seen = [];
    const add = (source, file) => {
      seen.push(file);
      return addSpaces(source, file);
    };
    assert.equal((await cli(root, ['--dry-run'], { add })).code, 0);
    assert.deepEqual(seen, Object.keys(FIXTURE).filter((file) => file.endsWith('.vue')).sort());
  });
});

test('the report gives the totals, each element, what is left and the files changed', async () => {
  await withRoot(FIXTURE, async (root) => {
    const { out } = await cli(root);
    assert.match(out, /^# Explicit spaces$/m);
    assert.match(out, /^\| Spaces \| 4 \|$/m);
    assert.match(out, /^\| Elements \| 3 \|$/m);
    assert.match(out, /^\| Files to change \| 2 \|$/m);
    assert.match(out, /^\| Left \| 1 \|$/m);
    assert.deepEqual(section(out, 'Spaces').trim().split('\n').slice(2), [
      '| `src/components/A.vue:2` | `<span>` | leading and trailing |',
      '| `src/views/B/Template.vue:2` | `<b-badge>` | leading |',
      '| `src/views/B/Template.vue:2` | `<b-badge>` | trailing |',
    ]);
    const left = section(out, 'Left');
    assert.match(left, /Vue 2\.7 renders no space/);
    assert.match(left, /^\| `src\/components\/Comment\.vue:2` \| `<span>` \| leading \|$/m);
    assert.equal(section(out, 'Changed files').trim(), '- `src/components/A.vue`\n- `src/views/B/Template.vue`');
    assert.doesNotMatch(out, /^## Failed$/m);
  });
  await withRoot({ 'src/components/Clean.vue': CLEAN }, async (root) => {
    const { out, code } = await cli(root);
    assert.equal(code, 0);
    for (const heading of ['Spaces', 'Left', 'Changed files']) assert.equal(section(out, heading).trim(), 'None.');
  });
});

test('a changed file that is not what it should be is reported under Failed; nothing at all is written; exit 1', async () => {
  const breaks = {
    'the SFC parser reports': (source) => source.replace('</template>', ''),
    'does not compile on Vue 2\\.7': (source) => source.replace('</template>', '<p/></template>'),
    'renders something else on Vue 2\\.7': (source) => source.replace('{{ " " }}{{ x }}', '{{ " " }} {{ x }}'),
    'changed outside its template': (source) => source.replace('"thing"', '"other"'),
  };
  for (const [message, damage] of Object.entries(breaks)) {
    await withRoot(FIXTURE, async (root) => {
      const add = (source, file) => {
        const result = addSpaces(source, file);
        return file.endsWith('A.vue') ? { ...result, source: damage(result.source) } : result;
      };
      const dry = await cli(root, ['--dry-run'], { add });
      assert.equal(dry.code, 1, message);
      assert.deepEqual(dry.writes, [], message);
      assert.match(dry.out, /^A real run would write nothing\.$/m, message);
      assert.match(dry.err, /1 file\(s\) failed; a real run would write nothing/, message);

      const real = await cli(root, [], { add });
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

test('a template with a place and a compile error fails the run; one without a place does not matter', async () => {
  await withRoot({ ...FIXTURE, 'src/components/Bad.vue': sfc('<p><b>a</b><span> {{ x }} </span></p><p></p>') }, async (root) => {
    const result = await cli(root);
    assert.equal(result.code, 1);
    assert.deepEqual(result.writes, []);
    assert.match(section(result.out, 'Failed'), /^- `src\/components\/Bad\.vue`: the template does not compile on Vue 2\.7: /m);
  });
  await withRoot({ ...FIXTURE, 'src/components/Bad.vue': sfc('<p>a</p><p></p>') }, async (root) => {
    const result = await cli(root);
    assert.equal(result.code, 0);
    assert.equal(result.writes.length, 2);
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
        const code = await run(argv, { out, err, write: (path) => writes.push(path) });
        assert.equal(code, 2, label);
        assert.equal(out.text, '', label);
        assert.match(err.text, /usage: node scripts\/vue3-migration\/explicit-spaces\.mjs \[--root <dir>\] \[--dry-run\]/, label);
        assert.deepEqual(writes, [], label);
      }
    });
  });
});

test('the script runs as a command, and refuses NODE_ENV=production, where 2.7 drops compile errors', async () => {
  await withRoot(FIXTURE, async (root) => {
    const production = spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8', env: { ...process.env, NODE_ENV: 'production' } });
    assert.equal(production.status, 2);
    assert.match(production.stderr, /NODE_ENV=production/);
    assert.equal(read(root, 'src/components/A.vue'), A);

    const { status, stdout } = spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8', env: { ...process.env, NODE_ENV: '' } });
    assert.equal(status, 0);
    assert.match(stdout, /^\| Spaces \| 4 \|$/m);
    assert.equal(read(root, 'src/components/A.vue'), A_AFTER);
  });
});
