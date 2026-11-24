// Legacy (ESLint 8) config for the Vue 3 lint ratchet. Lints the Vue 2 codebase
// with the Vue 3 "essential" rule set so migration blockers show up as counts.
// Loaded via overrideConfigFile with useEslintrc: false (the repo's own
// .eslintrc files are gitignored), so it must be self-contained.
module.exports = {
  root: true,
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  env: { browser: true, es2022: true },
  plugins: ['vue'],
  extends: ['plugin:vue/vue3-essential'],
  rules: {
    // Not migration rules: noisy in Vue 2 code and unaffected by the upgrade.
    'vue/multi-word-component-names': 'off',
    'vue/no-mutating-props': 'off',
    'vue/require-v-for-key': 'off',
    'vue/no-unused-components': 'off',
    'vue/no-unused-vars': 'off',
    'vue/valid-v-for': 'off',
    'vue/return-in-computed-property': 'off',
    'vue/no-async-in-computed-properties': 'off',

    // Migration blockers, made errors explicitly (some are not in vue3-essential).
    'vue/no-use-v-if-with-v-for': 'error',
    'vue/require-explicit-emits': 'error',
    'vue/no-deprecated-v-on-native-modifier': 'error',
    'vue/no-deprecated-dollar-scopedslots-api': 'error',
    'vue/no-undef-components': ['error', { ignorePatterns: ['^b-', '^B[A-Z]'] }],
    // Not only style: a computed that sets data or sorts in place runs when its value is first read, and Vue 3
    // renders slot content lazily, in the child, so that moment moves. A region table whose computed sorted its
    // rows in place came out unsorted.
    'vue/no-side-effects-in-computed-properties': 'error',
  },
};
