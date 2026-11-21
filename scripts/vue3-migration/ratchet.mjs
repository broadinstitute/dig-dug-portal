// Pure helpers for the Vue 3 lint ratchet. No I/O here so they stay unit-testable.

/**
 * Count lint messages per rule across ESLint results.
 * A message with a null ruleId (a parser/fatal error) counts under "fatal".
 */
export function countByRule(results) {
  const counts = {};
  for (const result of results) {
    for (const message of result.messages) {
      const rule = message.ruleId ?? 'fatal';
      counts[rule] = (counts[rule] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * Compare per-rule counts. A rule missing from either side counts as 0.
 * Both returned arrays are sorted by rule name.
 */
export function compareCounts(base, head) {
  const increased = [];
  const decreased = [];
  const rules = [...new Set([...Object.keys(base), ...Object.keys(head)])].sort();
  for (const rule of rules) {
    const b = base[rule] ?? 0;
    const h = head[rule] ?? 0;
    if (h > b) increased.push({ rule, base: b, head: h });
    else if (h < b) decreased.push({ rule, base: b, head: h });
  }
  return { increased, decreased };
}

/**
 * Pick the ref to compare against: an explicit --base wins, then the PR's
 * base branch (as set by GitHub Actions), else null (report counts only).
 */
export function resolveBaseRef(env, cliBase) {
  if (cliBase) return cliBase;
  if (env.GITHUB_BASE_REF) return `origin/${env.GITHUB_BASE_REF}`;
  return null;
}
