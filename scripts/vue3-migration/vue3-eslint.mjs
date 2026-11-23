// One ESLint setup for the Vue 3 migration tools that lint `src`: the lint ratchet (`lint-ratchet.mjs`) and the
// autofix codemod (`lint-fix.mjs`) both use the Vue 3 rule set in `eslint-vue3.cjs` through it.
//
//   const results = await vue3Linter({ cwd: root }).lintFiles(['src']);
//   const fixed = await vue3Linter({ cwd: root, fix: (message) => message.ruleId === 'vue/x' }).lintFiles(['src']);
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import eslint from 'eslint';

const { ESLint } = eslint;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const configFile = resolve(here, 'eslint-vue3.cjs');

/**
 * An `ESLint` that lints `.js` and `.vue` files under `cwd` with `eslint-vue3.cjs` and no `.eslintrc`.
 * Plugins resolve from this repo, so `cwd` may be a checkout without `node_modules`. `fix`, when given, is
 * ESLint's own option (`true`, or a predicate over a lint message): the results then carry `output`.
 * @param {{ cwd: string, fix?: boolean | ((message: { ruleId: string | null }) => boolean) }} options
 */
export function vue3Linter({ cwd, fix }) {
  return new ESLint({
    cwd,
    useEslintrc: false,
    overrideConfigFile: configFile,
    // Worktrees have no node_modules, so always resolve plugins from the real repo.
    resolvePluginsRelativeTo: repoRoot,
    extensions: ['.js', '.vue'],
    ...(fix === undefined ? {} : { fix }),
  });
}
