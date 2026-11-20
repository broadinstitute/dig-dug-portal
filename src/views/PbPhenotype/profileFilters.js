const FIELDS = Object.freeze([
    { value: 'phenotype', label: 'Phenotype' },
    { value: 'age', label: 'Age' },
    { value: 'sex', label: 'Sex' },
    { value: 'affected', label: 'Affected' },
    { value: 'investigator', label: 'Investigator' },
    { value: 'project', label: 'Project name' },
]);

function operators(field) {
    if (field === 'phenotype') return [{ value: 'contains', label: 'includes' }, { value: 'exclude', label: 'does not include' }];
    if (field === 'age') return [{ value: 'between', label: 'is between' }, { value: 'contains', label: 'is' }, { value: 'gte', label: 'is at least' }, { value: 'lte', label: 'is at most' }, { value: 'exclude', label: 'is not' }];
    return [{ value: 'is', label: 'is' }, { value: 'exclude', label: 'is not' },
        ...(['investigator', 'project'].includes(field) ? [{ value: 'contains', label: 'contains' }] : [{ value: 'contains', label: 'is' }])];
}

function normalizeRules(rows, resolveTerm) {
    if (!Array.isArray(rows) || rows.length > 50) throw new Error('Use up to 50 filter conditions.');
    return rows.filter(row => String(row.value == null ? '' : row.value).trim() || String(row.max == null ? '' : row.max).trim()).map((row, index) => {
        const field = FIELDS.find(item => item.value === row.field);
        if (!field || !operators(row.field).some(item => item.value === row.operator)) throw new Error(`Check condition ${index + 1}.`);
        let value = String(row.value).trim();
        if (row.field === 'phenotype') {
            value = resolveTerm(value);
            if (!value) throw new Error(`Choose a valid phenotype for condition ${index + 1}.`);
        }
        if (row.field === 'age' && !(value === 'Unknown' && ['contains', 'exclude'].includes(row.operator))) {
            if (!value) throw new Error('Enter both ends of the age range.');
            const age = Number(value);
            if (!Number.isFinite(age) || age < 0 || age > 100) throw new Error('Enter an age from 0 to 100 years.');
            value = String(age);
        }
        if (row.field === 'sex' && !['female', 'male', 'unknown'].includes(value)) throw new Error('Choose a sex.');
        if (row.field === 'affected' && !['Y', 'N', 'unknown'].includes(value)) throw new Error('Choose an affected status.');
        if (row.field === 'age' && row.operator === 'between') {
            const maximum = String(row.max == null ? '' : row.max).trim();
            if (!maximum || !Number.isFinite(Number(maximum)) || Number(maximum) < Number(value) || Number(maximum) > 100) throw new Error('Enter an age range from 0 to 100, with the minimum first.');
            return { field: row.field, operator: row.operator, value, max: String(Number(maximum)) };
        }
        return { field: row.field, operator: row.operator, value, ...(row.field === 'phenotype' && row.operator === 'contains' && row.required === true ? { required: true } : {}) };
    });
}

function readRules(value, resolveTerm) {
    try { return value ? normalizeRules(JSON.parse(value), resolveTerm) : []; } catch (_) { return []; }
}

function matchesRules(row, rules, access) {
    return rules.every(rule => {
        // Exclusions are applied separately so before/after exclusion charts stay valid.
        if (rule.field === 'phenotype' && rule.operator === 'exclude') return true;
        let matched;
        if (rule.field === 'phenotype') matched = access.termsOf(row).includes(rule.value);
        else if (rule.field === 'age') {
            const age = access.ageOf(row);
            if (rule.value === 'Unknown') matched = age == null;
            else {
                if (age == null) return false;
                matched = rule.operator === 'between' ? age >= Number(rule.value) && age <= Number(rule.max)
                    : rule.operator === 'gte' ? age >= Number(rule.value)
                    : rule.operator === 'lte' ? age <= Number(rule.value) : age === Number(rule.value);
            }
        } else {
            const value = String(access[`${rule.field}Of`](row) || '').trim();
            matched = ['investigator', 'project'].includes(rule.field) && rule.operator === 'contains'
                ? value.toLowerCase().includes(rule.value.toLowerCase())
                : (value || 'unknown').toLowerCase() === rule.value.toLowerCase();
        }
        return rule.operator === 'exclude' ? !matched : matched;
    });
}

function ruleLabel(rule, name = value => value) {
    const field = FIELDS.find(item => item.value === rule.field)?.label || rule.field;
    const operator = operators(rule.field).find(item => item.value === rule.operator)?.label || rule.operator;
    const value = rule.field === 'phenotype' ? name(rule.value)
        : rule.field === 'affected' ? ({ Y: 'Yes', N: 'No', unknown: 'Unknown' }[rule.value] || rule.value)
            : rule.field === 'sex' ? ({ female: 'Female', male: 'Male', unknown: 'Unknown' }[rule.value] || rule.value)
            : rule.value;
    if (rule.field === 'age' && rule.operator === 'between') return `${field} ${value}–${rule.max}`;
    if (rule.operator === 'is' || rule.operator === 'contains' && !['investigator', 'project', 'phenotype'].includes(rule.field)) return `${field} ${value}`;
    return `${field} · ${operator.toLowerCase()} · ${value}`;
}

module.exports = { FIELDS, operators, normalizeRules, readRules, matchesRules, ruleLabel };
