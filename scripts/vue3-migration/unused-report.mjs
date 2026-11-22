// Cross-branch unused-component report. Report only: nothing is deleted.
//
//   node scripts/vue3-migration/unused-report.mjs > /tmp/unused-components.md
//
// Write it outside test-results/, which every Playwright run empties: to /tmp, or to
// unused-components.md at the repo root. Don't commit the output.
//
// A component is "unused everywhere" only when no file under `src/` imports it on
// origin/master AND on every live portal branch (portal branches merge down from
// master, but may still register components master has stopped using). Run
// `git fetch origin` first so the origin/<branch> refs are current.
//
// Importers are found with `git grep` against the git objects, so no checkout is
// needed. Only static import specifiers are matched (see importPattern); dynamic,
// string-built imports are not detected, and an importer may itself be unused.
//
// Exit codes: 0 ok, 2 usage error, missing ref, or git failure.
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const MASTER_REF = 'origin/master';
export const PORTAL_BRANCHES = [
  'adipose_gw-main',
  'cancerkp-main',
  'cfde-liver-main',
  'cfde-main',
  'matkp-main',
  'mouse-main',
  'mskkp-main',
  'nephkp-main',
  'pankbase-main',
  'radiant-main',
  'sysbio-main',
];
export const PORTAL_REFS = PORTAL_BRANCHES.map((b) => `origin/${b}`);

const AMBIGUOUS_LABEL = 'ambiguous: check by hand';
const MASTER_IMPORTERS_SHOWN = 3;
// `git grep` output can be large when a basename is common; never truncate it.
const MAX_BUFFER = 256 * 1024 * 1024;

const USAGE = 'usage: node scripts/vue3-migration/unused-report.mjs';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const vueBasename = (path) => basename(path, '.vue');

/**
 * Extended regex (usable with `git grep -E` and `new RegExp`) matching a quoted
 * import specifier ending in `/<basename>` or `/<basename>.vue`. That covers
 * `import X from "@/a/<basename>.vue"`, relative paths, extensionless imports,
 * `require(...)` and `import(...)`. Quote characters are excluded from the path
 * part so a match never spans two strings.
 * @param {string} name component basename, without `.vue`
 * @returns {string}
 */
export function importPattern(name) {
  return `["'\`][^"'\`]*/${escapeRegExp(name)}(\\.vue)?["'\`]`;
}

/**
 * Paths from `git grep -l` output with the `<ref>:` prefix stripped. Lines for
 * other refs are ignored, so one multi-ref output can be split ref by ref.
 * @param {string} stdout
 * @param {string} ref
 * @returns {string[]}
 */
export function parseGitGrep(stdout, ref) {
  const prefix = `${ref}:`;
  return stdout
    .split('\n')
    .filter((line) => line.startsWith(prefix))
    .map((line) => line.slice(prefix.length));
}

/**
 * Basenames (without `.vue`) shared by more than one `.vue` file. Their import
 * patterns cannot tell the files apart, so their rows need a manual check.
 * @param {string[]} paths
 * @returns {Set<string>}
 */
export function ambiguousNames(paths) {
  const seen = new Set();
  const dupes = new Set();
  for (const path of paths) {
    if (!path.endsWith('.vue')) continue;
    const name = vueBasename(path);
    if (seen.has(name)) dupes.add(name);
    seen.add(name);
  }
  return dupes;
}

/**
 * One report row. The component file itself never counts as its own importer.
 * @param {string} component path of the `.vue` file on master
 * @param {Record<string, string[]>} hitsByRef files matching the import pattern, per ref
 * @param {string} masterRef
 * @param {string[]} portalRefs
 * @param {Set<string>} ambiguous see ambiguousNames
 */
export function summarizeComponent(component, hitsByRef, masterRef, portalRefs, ambiguous) {
  const importersOn = (ref) => (hitsByRef[ref] ?? []).filter((path) => path !== component);
  const masterImporters = importersOn(masterRef);
  const portalBranches = portalRefs.filter((ref) => importersOn(ref).length > 0).map((ref) => ref.replace(/^origin\//, ''));
  const isAmbiguous = ambiguous.has(vueBasename(component));
  return {
    component,
    masterImporters,
    portalBranches,
    ambiguous: isAmbiguous,
    unusedEverywhere: !isAmbiguous && masterImporters.length === 0 && portalBranches.length === 0,
  };
}

const cell = (text) => text.replaceAll('|', '\\|');

function masterImportersCell(importers) {
  if (importers.length === 0) return '0';
  const shown = importers.slice(0, MASTER_IMPORTERS_SHOWN).map((p) => `\`${p}\``);
  const more = importers.length - shown.length;
  return cell(`${importers.length}: ${shown.join(', ')}${more > 0 ? `, +${more} more` : ''}`);
}

function portalsCell(branches, total) {
  if (branches.length === 0) return 'none';
  return branches.length === total ? `all ${total}` : branches.join(', ');
}

/**
 * Markdown report: a header with the caveats and counts, then one table row per component.
 * @param {ReturnType<typeof summarizeComponent>[]} rows
 * @param {{ masterRef: string, portalRefs: string[], shas?: Record<string, string> }} meta
 */
export function renderReport(rows, { masterRef, portalRefs, shas = {} }) {
  const refs = [masterRef, ...portalRefs];
  const unused = rows.filter((r) => r.unusedEverywhere).length;
  const ambiguousRows = rows.filter((r) => r.ambiguous);
  const ambiguousCount = new Set(ambiguousRows.map((r) => vueBasename(r.component))).size;
  const refList = refs.map((ref) => (shas[ref] ? `${ref} (${shas[ref]})` : ref)).join(', ');

  const lines = [
    '# Unused components across master and portal branches',
    '',
    'Report only (static imports only): a component is "unused everywhere" when no file under `src/` imports it on master or on any live portal branch. Dynamic, string-built imports are not detected, and an importer may itself be unused.',
    '',
    `Refs searched: ${refList}`,
    '',
    `- Components checked: ${rows.length}`,
    `- Unused everywhere: ${unused}`,
    `- Ambiguous names: ${ambiguousCount} (${ambiguousRows.length} files; their rows read "${AMBIGUOUS_LABEL}")`,
    '',
    '| component | importers on master | portal branches importing it | unused everywhere? |',
    '| --- | --- | --- | --- |',
  ];
  for (const row of rows) {
    const verdict = row.ambiguous ? AMBIGUOUS_LABEL : row.unusedEverywhere ? 'yes' : 'no';
    const portals = portalsCell(row.portalBranches, portalRefs.length);
    lines.push(`| ${cell(`\`${row.component}\``)} | ${masterImportersCell(row.masterImporters)} | ${portals} | ${verdict} |`);
  }
  return `${lines.join('\n')}\n`;
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: MAX_BUFFER, stdio: ['ignore', 'pipe', 'pipe'] });
}

/** `git grep` exits 1 when nothing matches, which is "no importers", not an error. */
function gitGrepFiles(pattern, refs) {
  try {
    return git(['grep', '-lE', '-e', pattern, ...refs, '--', 'src']);
  } catch (err) {
    if (err.status === 1) return '';
    throw err;
  }
}

/** Every `.vue` file under master's `src/` except the per-page `src/views/**\/Template.vue` entry layouts. */
function listComponents(masterRef) {
  return git(['ls-tree', '-r', '--name-only', '-z', masterRef, '--', 'src'])
    .split('\0')
    .filter((path) => path.endsWith('.vue') && !/^src\/views\/.*\/Template\.vue$/.test(path))
    .sort();
}

function resolveSha(ref) {
  try {
    return git(['rev-parse', '--verify', '--quiet', '--short', `${ref}^{commit}`]).trim();
  } catch {
    return null;
  }
}

function main(argv) {
  try {
    parseArgs({ args: argv, options: {}, allowPositionals: false });
  } catch (err) {
    console.error(`${err.message}\n${USAGE}`);
    return 2;
  }

  // git runs against the process cwd, so anchor it to this repo.
  process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..'));

  const refs = [MASTER_REF, ...PORTAL_REFS];
  const shas = {};
  const missing = [];
  for (const ref of refs) {
    shas[ref] = resolveSha(ref);
    if (!shas[ref]) missing.push(ref);
  }
  if (missing.length > 0) {
    console.error(`ref not found: ${missing.join(', ')} (run \`git fetch origin\`)`);
    return 2;
  }

  const started = Date.now();
  const components = listComponents(MASTER_REF);
  const ambiguous = ambiguousNames(components);

  const rows = components.map((component, i) => {
    const stdout = gitGrepFiles(importPattern(vueBasename(component)), refs);
    const hitsByRef = Object.fromEntries(refs.map((ref) => [ref, parseGitGrep(stdout, ref)]));
    if ((i + 1) % 50 === 0) console.error(`${i + 1}/${components.length} components scanned`);
    return summarizeComponent(component, hitsByRef, MASTER_REF, PORTAL_REFS, ambiguous);
  });

  process.stdout.write(renderReport(rows, { masterRef: MASTER_REF, portalRefs: PORTAL_REFS, shas }));
  console.error(`${components.length} components x ${refs.length} refs in ${((Date.now() - started) / 1000).toFixed(1)}s`);
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

// Run the CLI only when executed directly, so tests can import the pure helpers.
if (isMain()) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(`unused-report failed: ${String(err.stderr || err.message).trim()}`);
    process.exitCode = 2;
  }
}
