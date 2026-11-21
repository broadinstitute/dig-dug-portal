import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countByRule, compareCounts, resolveBaseRef } from './ratchet.mjs';

test('countByRule counts by ruleId and puts parser failures under "fatal"', () => {
  const results = [
    { messages: [{ ruleId: 'vue/a' }, { ruleId: 'vue/a' }, { ruleId: null }] },
    { messages: [{ ruleId: 'vue/b' }] },
  ];
  assert.deepEqual(countByRule(results), { 'vue/a': 2, 'vue/b': 1, fatal: 1 });
});

test('compareCounts reports increases and decreases, missing keys as 0, sorted by rule', () => {
  const r = compareCounts({ 'vue/a': 5, 'vue/b': 2 }, { 'vue/c': 1, 'vue/a': 6, 'vue/b': 1 });
  assert.deepEqual(r.increased, [
    { rule: 'vue/a', base: 5, head: 6 },
    { rule: 'vue/c', base: 0, head: 1 },
  ]);
  assert.deepEqual(r.decreased, [{ rule: 'vue/b', base: 2, head: 1 }]);
});

test('resolveBaseRef: --base wins, then the PR base branch, else no comparison', () => {
  assert.equal(resolveBaseRef({ GITHUB_BASE_REF: 'cfde-main' }, 'abc123'), 'abc123');
  assert.equal(resolveBaseRef({ GITHUB_BASE_REF: 'cfde-main' }), 'origin/cfde-main');
  assert.equal(resolveBaseRef({}), null);
});
