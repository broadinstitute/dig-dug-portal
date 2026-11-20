function describeMatchingRule(mode, minimum, count) {
    const k = Math.max(1, Math.min(count || 1, Number(minimum) || 2));
    if (mode === 'any' || (mode !== 'all' && k === 1)) return {
        label: 'Any (OR)', description: `At least 1 of the ${count} selected phenotypes must be recorded.`, short: `at least 1 of ${count} phenotypes`,
    };
    if (mode === 'all' || k >= count) return {
        label: 'All (AND)', description: `All ${count} selected phenotypes must be recorded in the same sample.`, short: `all ${count} phenotypes`,
    };
    return { label: 'Custom', description: `At least ${k} of the ${count} selected phenotypes must be recorded in the same sample.`, short: `at least ${k} of ${count} phenotypes` };
}

module.exports = { describeMatchingRule };
