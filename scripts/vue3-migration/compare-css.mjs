// Compare CSS: confirm each built page still loads the same CSS in the same order as a baseline build.
//
//   npm run tool:compare-css -- [--base dist-baseline] [--head dist]
//
// Both directories are production builds (`npm run deploy`; `build-baseline.mjs` writes `dist-baseline`). Only a
// production build extracts CSS into linked files: a development build keeps it in the JavaScript, where this tool
// sees just the stylesheets of the HTML shell.
//
// Pages are every `.html` file under either directory, nested ones such as `pigean/index.html` included. For each
// page the local stylesheets it links (see `pageCss`) are read in link order and their text is joined. A page is:
//
//   same       the joined text is equal, however it is split into files (chunk splitting may change)
//   reordered  the same top-level rules (a rule, an at-rule such as `@media {...}`, a comment), in another order
//   differs    anything else
//   missing    the page exists in one directory only
//
// A `reordered` page lists the rules that moved (`movedRules`): those of the base order that are not in a longest
// common subsequence of the two orders, so a rule moved past many others is one move. Each is shown, shortened to
// one line, with the rules next to it in the base and in the head. Of two rules that swapped, the later one in the
// base order is the one listed. Pages that moved the same rules are one entry in the report (named when there are
// few); the same pair of rules out of place in a shared chunk is one line, not one per page. When the part of the
// two lists that differs is too long to compare, the page is `reordered` without the list.
//
// Nothing is normalised beyond that and the scoped ids below: whitespace, comments and declaration order all count.
// The cascade depends on the order, so a `reordered` page is a failure to look at, not a pass.
//
// Scoped ids (`data-v-` and 8 hex digits, see `maskScopedIds`) are replaced by one constant before anything is
// compared. In a production build vue-loader makes an id from a hash of the component's path and source, so two
// builds from different checkouts never agree on a vendor component's id, and a branch changes the id of every
// component it edits; compared as they are, every page would differ. What this cannot see: two rules that differ
// only in their scoped id, such as the same selector scoped to another component, or a rule that moved from one
// component's styles to another's. Both read as the same rule.
//
// The comparison cannot vouch for a page whose CSS it could not read, so a page is never `same` when a linked local
// file does not exist or a file does not parse: it is `differs`, with a `problems` list on its result.
//
// The report is markdown on stdout, usage errors go to stderr. Paths resolve against the current directory.
//
// Exit codes: 0 every page is same, 1 some page is not, 2 usage error (bad arguments, a directory that does not
// exist, no pages in either directory) or a page or directory that could not be read (the message goes to stderr).
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';
import { code, oneLine } from './register-components.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// postcss is not a dependency of this package: Vue CLI brings it. Resolving from the repo root finds that copy
// whatever directory the tool is run from.
const postcss = createRequire(join(repoRoot, 'package.json'))('postcss');

const USAGE = 'usage: node scripts/vue3-migration/compare-css.mjs [--base <dir>] [--head <dir>]';

// ---- which stylesheets a page links ---------------------------------------------------------

const COMMENT = /<!--[\s\S]*?-->/g;
const LINK = /<link\b[^>]*>/gi;
const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

// Any origin works: a href that resolves to another one is not a file of this build.
const SITE = 'http://site.invalid';

/** The attributes of one `<link ...>` tag, names lower-cased; the first of a repeated attribute wins, as in HTML. */
function attributesOf(tag) {
  const attributes = new Map();
  for (const [, name, double, single, bare] of tag.slice('<link'.length, -1).matchAll(ATTRIBUTE)) {
    const key = name.toLowerCase();
    if (!attributes.has(key)) attributes.set(key, double ?? single ?? bare ?? '');
  }
  return attributes;
}

/**
 * The `href` of every link that applies a stylesheet to the screen, in document order. A `rel` is a list of
 * tokens: the shell links write `rel="stylesheet preload prefetch"`, which is a stylesheet, while a link whose
 * `rel` is only `preload` or `prefetch` loads nothing into the page. Commented-out links are not links.
 */
function stylesheetHrefs(html) {
  const hrefs = [];
  for (const [tag] of html.replace(COMMENT, '').matchAll(LINK)) {
    const attributes = attributesOf(tag);
    const rel = (attributes.get('rel') ?? '').toLowerCase().split(/\s+/);
    const href = (attributes.get('href') ?? '').trim();
    const media = (attributes.get('media') ?? '').trim().toLowerCase();
    if (rel.includes('stylesheet') && href !== '' && media !== 'print') hrefs.push(href);
  }
  return hrefs;
}

/**
 * The path under the build directory that `href` names when linked from `page`, or null when it is not a file
 * of this build (another origin, `//cdn...`, a `data:` URL, a href that is not a URL at all: a browser loads nothing
 * for it). Query and fragment are dropped, as a static server does.
 */
function localPath(href, page) {
  let url;
  try {
    url = new URL(href, `${SITE}/${page}`);
  } catch {
    return null;
  }
  if (url.origin !== SITE) return null;
  try {
    return decodeURIComponent(url.pathname).slice(1);
  } catch {
    return url.pathname.slice(1);
  }
}

/** `css/chunk-vendors.1a2b3c4d.css` as `css/chunk-vendors.css`: Vue CLI puts an 8-digit hex content hash before `.css`. */
const withoutHash = (file) => file.replace(/\.[0-9a-f]{8}(?=\.css$)/, '');

// vue-loader scopes a component's styles with `data-v-<8 hex digits>`, in selectors (`.a[data-v-1a2b3c4d]`) and
// at the end of a scoped keyframes name (`spin-data-v-1a2b3c4d`). A production build derives the id from a hash of
// the component's path and source, so builds from two checkouts disagree on every vendor component's id, and a
// branch gets a new id for each component it edits. Left alone, that made every page differ.
const SCOPED_ID = /data-v-[0-9a-f]{8}/g;
// The same length as an id, so a parse error's line and column still point into the file on disk.
const MASKED_ID = 'data-v-00000000';

/** `text` with each scoped id replaced by one constant. */
const maskScopedIds = (text) => text.replace(SCOPED_ID, MASKED_ID);

/**
 * Reads the local stylesheets `html` links, in link order. `cache` (path -> `{ text, masked, rules }`) saves
 * reading the large shared files once per page. Returns the files as `{ file, sheet }`, `file` being the name as
 * linked, `sheet.text` what is on disk and `sheet.masked` the text the comparison uses (see `maskScopedIds`).
 * @throws {Error} when a linked local file does not exist or cannot be read
 */
function readLinked(dir, html, page, cache) {
  const linked = [];
  for (const href of stylesheetHrefs(html)) {
    const file = localPath(href, page);
    if (file === null) continue;
    const path = join(resolve(dir), file);
    let sheet = cache.get(path);
    if (sheet === undefined) {
      try {
        const text = readFileSync(path, 'utf8');
        sheet = { text, masked: maskScopedIds(text), rules: undefined };
      } catch {
        throw new Error(`${file} is linked but is not a readable file in ${dir}`);
      }
      cache.set(path, sheet);
    }
    linked.push({ file, sheet });
  }
  return linked;
}

/**
 * The local stylesheets a page links and their text.
 *
 * `files` are the stylesheets' paths relative to `dir`, in link order, with the content hash removed from each
 * name; `text` is the files' text joined in that order. External links (another origin), links that are not
 * stylesheets (`rel=preload`, `rel=prefetch` alone), and `media="print"` links are left out. A relative `href`
 * resolves against `page`, the page's path under `dir` (default: the site root).
 *
 * @param {string} dir the build directory
 * @param {string} html the page's HTML
 * @param {string} [page]
 * @returns {{ files: string[], text: string }}
 * @throws {Error} when a linked local file does not exist
 */
export function pageCss(dir, html, page = '') {
  const linked = readLinked(dir, html, page, new Map());
  return { files: linked.map(({ file }) => withoutHash(file)), text: linked.map(({ sheet }) => sheet.text).join('') };
}

// ---- comparing ------------------------------------------------------------------------------

/**
 * The top-level nodes of a stylesheet as text, in order. `toString()` leaves out the whitespace before a node, so
 * two files that differ only between rules have equal lists; the text comparison is what sees that.
 *
 * `map: { prev: false }` stops postcss from following a `sourceMappingURL` comment: it reads files relative to
 * the current directory, and rejects a non-base64 inline map outright.
 * @throws {Error} naming `file`, the line and the reason, when the text does not parse
 */
function topLevelRules(text, file) {
  let root;
  try {
    root = postcss.parse(text, { map: { prev: false } });
  } catch (error) {
    throw new Error(`${file}:${error.line}:${error.column}: ${error.reason ?? error.message}`);
  }
  return root.nodes.map((node) => node.toString());
}

/**
 * What one side of a page loads: its text and top-level rules, both with the scoped ids masked, or the problems
 * that kept it from being read.
 */
function loadSide(dir, page, cache) {
  const html = readFileSync(join(dir, page), 'utf8');
  let linked;
  try {
    linked = readLinked(dir, html, page, cache);
  } catch (error) {
    return { text: '', rules: [], problems: [error.message] };
  }
  const rules = [];
  const problems = [];
  for (const { file, sheet } of linked) {
    try {
      sheet.rules ??= topLevelRules(sheet.masked, file);
      for (const rule of sheet.rules) rules.push(rule);
    } catch (error) {
      problems.push(error.message);
    }
  }
  return { text: linked.map(({ sheet }) => sheet.masked).join(''), rules, problems };
}

const sameList = (a, b) => a.length === b.length && a.every((item, index) => item === b[index]);

function statusOf(base, head) {
  if (base.text === head.text) return 'same';
  // Equal rules in the same order with different text differ in the spacing between rules: not a reorder.
  if (!sameList(base.rules, head.rules) && sameList([...base.rules].sort(), [...head.rules].sort())) return 'reordered';
  return 'differs';
}

// The longest-common-subsequence table has one cell per pair of rules in the part of the two lists that differs.
// The real case is a window of a few hundred rules (about 250,000 cells). Past this many cells the table would take
// seconds and tens of megabytes for a list nobody can read anyway, so the moves are not worked out. The cap also
// keeps every table entry (at most the shorter side, so at most 2,000) within 16 bits.
const MAX_WINDOW_CELLS = 4_000_000;

/**
 * The rules that moved between two orderings of the same rules: those of `base` that are not in a longest common
 * subsequence of the two lists, in base order (a rule moved past many others is one move, not many). The equal
 * head and tail of the lists are trimmed first, so the table covers only the part that differs.
 *
 * Each move has the rule before and after it (`null` at an end of the list) in `base` and in `head`. A repeated
 * rule is matched to its place in `head` in order of occurrence. Ties in the subsequence go to the later rule of
 * the base order, so two neighbours that swapped report the second one.
 *
 * @param {string[]} base
 * @param {string[]} head the same rules as `base`, in another order
 * @returns {{ rule: string, base: [string | null, string | null], head: [string | null, string | null] }[] | undefined}
 *   undefined when the window is past `MAX_WINDOW_CELLS`
 */
function movedRules(base, head) {
  let start = 0;
  while (start < base.length && start < head.length && base[start] === head[start]) start++;
  let tail = 0;
  while (tail < base.length - start && tail < head.length - start && base[base.length - 1 - tail] === head[head.length - 1 - tail]) tail++;
  const x = base.slice(start, base.length - tail);
  const y = head.slice(start, head.length - tail);
  if (x.length * y.length > MAX_WINDOW_CELLS) return undefined;

  // Numbers compare faster than rule texts, which can be long, and the table compares each pair.
  const ids = new Map();
  const idOf = (text) => {
    if (!ids.has(text)) ids.set(text, ids.size);
    return ids.get(text);
  };
  const a = x.map(idOf);
  const b = y.map(idOf);

  const width = b.length + 1;
  const table = new Uint16Array((a.length + 1) * width);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const up = table[(i - 1) * width + j];
      const left = table[i * width + j - 1];
      table[i * width + j] = a[i - 1] === b[j - 1] ? table[(i - 1) * width + j - 1] + 1 : Math.max(up, left);
    }
  }

  const keptBase = new Array(a.length).fill(false);
  const keptHead = new Array(b.length).fill(false);
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      keptBase[i - 1] = true;
      keptHead[j - 1] = true;
      i--;
      j--;
    } else if (table[(i - 1) * width + j] >= table[i * width + j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  // The two lists hold the same rules, so the rules left out of the subsequence are the same on both sides.
  const places = new Map();
  keptHead.forEach((kept, offset) => {
    if (kept) return;
    if (!places.has(b[offset])) places.set(b[offset], []);
    places.get(b[offset]).push(start + offset);
  });
  const around = (list, index) => [list[index - 1] ?? null, list[index + 1] ?? null];
  const moved = [];
  keptBase.forEach((kept, offset) => {
    if (kept) return;
    moved.push({ rule: x[offset], base: around(base, start + offset), head: around(head, places.get(a[offset]).shift()) });
  });
  return moved;
}

/** Every `.html` file under `dir`, as a forward-slash path relative to it. */
function htmlPages(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split(sep).join('/'));
}

/**
 * Compares the CSS each page loads in `baseDir` and in `headDir`, for every `.html` file in either, sorted by page.
 * A page whose stylesheets could not be read or parsed on a side is `differs` and carries `problems`, one line per
 * problem naming the side, so an unreadable page is never `same`. A `reordered` page carries `moved`, the rules that
 * changed place (see `movedRules`), unless the part of its rule lists that differs is too long to compare.
 *
 * @param {string} baseDir
 * @param {string} headDir
 * @returns {{
 *   page: string,
 *   status: 'same' | 'reordered' | 'differs' | 'missing',
 *   problems?: string[],
 *   moved?: { rule: string, base: [string | null, string | null], head: [string | null, string | null] }[],
 * }[]}
 * @throws {Error} when a directory cannot be read
 */
export function comparePages(baseDir, headDir) {
  const basePages = new Set(htmlPages(baseDir));
  const headPages = new Set(htmlPages(headDir));
  // Keyed by absolute path, so the two directories share it; the big vendor stylesheet is read and parsed once.
  const cache = new Map();
  return [...new Set([...basePages, ...headPages])].sort().map((page) => {
    if (!basePages.has(page) || !headPages.has(page)) return { page, status: 'missing' };
    const base = loadSide(baseDir, page, cache);
    const head = loadSide(headDir, page, cache);
    const problems = [...base.problems.map((line) => `base: ${line}`), ...head.problems.map((line) => `head: ${line}`)];
    if (problems.length > 0) return { page, status: 'differs', problems };
    const status = statusOf(base, head);
    if (status !== 'reordered') return { page, status };
    const moved = movedRules(base.rules, head.rules);
    return moved === undefined ? { page, status } : { page, status, moved };
  });
}

// ---- the command line -----------------------------------------------------------------------

/**
 * @param {string[]} argv
 * @returns {{ base: string, head: string }}
 * @throws {Error} on an unknown option, a positional argument, or an option without a value
 */
export function parseArgs(argv) {
  const { values } = parseNodeArgs({
    args: argv,
    options: { base: { type: 'string' }, head: { type: 'string' } },
    allowPositionals: false,
  });
  return { base: values.base ?? 'dist-baseline', head: values.head ?? 'dist' };
}

const STATUSES = ['same', 'reordered', 'differs', 'missing'];

const isDirectory = (path) => statSync(path, { throwIfNoEntry: false })?.isDirectory() === true;
const isFile = (path) => statSync(path, { throwIfNoEntry: false })?.isFile() === true;

/** A group of pages is named when it has no more than this many; a larger one is only counted. */
const MAX_NAMED_PAGES = 5;
/** The most characters of a rule the report shows. */
const MAX_RULE_CHARS = 160;

/** `text` on one line, cut to `MAX_RULE_CHARS` with `...` when longer. */
function shorten(text) {
  const line = oneLine(text);
  return line.length > MAX_RULE_CHARS ? `${line.slice(0, MAX_RULE_CHARS - 3)}...` : line;
}

/** Where a moved rule sits: between its two neighbours, `null` being an end of the list. */
function between([before, after]) {
  const neighbour = (rule, end) => (rule === null ? `the ${end}` : code(shorten(rule)));
  return `between ${neighbour(before, 'start')} and ${neighbour(after, 'end')}`;
}

function renderReport(options, results) {
  const count = (status) => results.filter((result) => result.status === status).length;
  const notSame = results.filter(({ status }) => status !== 'same');
  const lines = [
    '# Compare CSS',
    '',
    `Base ${code(options.base)}, head ${code(options.head)}.`,
    '',
    '| Status | Pages |',
    '| --- | ---: |',
    ...STATUSES.map((status) => `| ${status} | ${count(status)} |`),
    '',
    `${results.length} page${results.length === 1 ? '' : 's'} compared, ${notSame.length === 0 ? 'all same.' : `${notSame.length} not same.`}`,
  ];
  if (notSame.length === 0) return `${lines.join('\n')}\n`;

  lines.push('', '## Not same', '');
  // Reordered pages that moved the same rules are one entry: a chunk shared by every page moves once, not 54 times.
  const groups = new Map();
  for (const { page, status, problems, moved } of notSame) {
    if (status === 'missing') {
      lines.push(`- ${code(page)}: missing (only in ${isFile(join(options.base, page)) ? 'base' : 'head'})`);
      continue;
    }
    if (moved) {
      const key = JSON.stringify(moved);
      if (!groups.has(key)) groups.set(key, { pages: [], moved });
      groups.get(key).pages.push(page);
      continue;
    }
    lines.push(`- ${code(page)}: ${status}`);
    if (problems) {
      for (const problem of problems) lines.push(`  - ${problem}`);
      continue;
    }
    if (status === 'reordered') lines.push('  - the moved rules are not listed: too many rules changed place to compare');
    // Both sides read cleanly, or comparePages would have listed problems.
    for (const [label, dir] of [['base', options.base], ['head', options.head]]) {
      const { files } = pageCss(dir, readFileSync(join(dir, page), 'utf8'), page);
      lines.push(`  - ${label}: ${files.length === 0 ? 'no stylesheets' : files.map(code).join(', ')}`);
    }
  }
  for (const { pages, moved } of groups.values()) {
    const names = pages.length <= MAX_NAMED_PAGES ? `: ${pages.map(code).join(', ')}` : '';
    lines.push(`- ${pages.length} page${pages.length === 1 ? '' : 's'} reordered${names}`);
    for (const { rule, base, head } of moved) {
      lines.push(`  - moved ${code(shorten(rule))}`, `    - base: ${between(base)}`, `    - head: ${between(head)}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

/** The comparison and its report for parsed `options`; the exit code. Throws when a directory or page cannot be read. */
function compare(options, out, err) {
  for (const [flag, dir] of [['--base', options.base], ['--head', options.head]]) {
    if (!isDirectory(dir)) {
      err.write(`${flag} ${dir} is not a directory\n${USAGE}\n`);
      return 2;
    }
  }

  const results = comparePages(options.base, options.head);
  // Two empty or mistyped directories would otherwise compare nothing and pass.
  if (results.length === 0) {
    err.write(`no .html files in ${options.base} or ${options.head}\n${USAGE}\n`);
    return 2;
  }
  out.write(renderReport(options, results));
  return results.every(({ status }) => status === 'same') ? 0 : 1;
}

/**
 * Compares the pages of `--base` (default `dist-baseline`) with those of `--head` (default `dist`). The report goes
 * to `out`, usage errors and the message of a failed read to `err`.
 *
 * @param {string[]} argv
 * @param {{ out?: { write: (text: string) => unknown }, err?: { write: (text: string) => unknown } }} [deps]
 * @returns {number} the exit code
 */
export function main(argv, { out = process.stdout, err = process.stderr } = {}) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    err.write(`${error.message}\n${USAGE}\n`);
    return 2;
  }
  try {
    return compare(options, out, err);
  } catch (error) {
    // A page that cannot be read is neither "same" nor "some page differs": say what failed and exit 2, so a caller
    // that tests for exit 1 does not take it for a CSS difference.
    err.write(`${error instanceof Error ? error.message : error}\n`);
    return 2;
  }
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

// Run the CLI only when executed directly, so tests can import `comparePages`.
if (isMain()) {
  process.exitCode = main(process.argv.slice(2));
}
