import { ageBand, cohortSampleSummary, sortTableRows } from './phenotypeModel';

export function isSinglePhenotypeView(state) {
    return state.ids.length === 1 && !state.excluded.length &&
        !state.advancedRules.some(row => row.field !== 'phenotype' || row.operator === 'exclude') &&
        !state.ageBandFilter && !state.sexFilter && !state.affectedFilter && !state.selectedProjects.length;
}

export function ancestorsOf(id, terms) {
    const found = new Set(), pending = [...(terms[id]?.[2] || [])];
    while (pending.length) {
        const parent = pending.pop();
        if (found.has(parent)) continue;
        found.add(parent); pending.push(...(terms[parent]?.[2] || []));
    }
    return found;
}

export function recordedTerms(samples, query, terms) {
    const omit = new Set(); (Array.isArray(query) ? query : [query]).forEach(id => { omit.add(id); ancestorsOf(id, terms).forEach(parent => omit.add(parent)); });
    const counts = new Map();
    for (const sample of samples) for (const id of new Set(sample.terms)) {
        if (!omit.has(id) && terms[id]) counts.set(id, (counts.get(id) || 0) + 1);
    }
    return [...counts].map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

export function separatingTerms(diseases, query, terms) {
    const omit = new Set(); (Array.isArray(query) ? query : [query]).forEach(id => { omit.add(id); ancestorsOf(id, terms).forEach(parent => omit.add(parent)); });
    const counts = new Map(), total = diseases.length;
    for (const disease of diseases) for (const id of new Set(disease.profile.map(row => row.hpoId))) {
        if (!omit.has(id) && terms[id]) counts.set(id, (counts.get(id) || 0) + 1);
    }
    return [...counts].filter(([, count]) => count < total).map(([id, count]) => {
        const p = count / total;
        return { id, count, total, gain: -p * Math.log2(p) - (1 - p) * Math.log2(1 - p) };
    }).sort((a, b) => b.gain - a.gain || b.count - a.count || a.id.localeCompare(b.id));
}

export function summarizeProjects(samples) {
    const statuses = new Map();
    for (const sample of samples) {
        const name = sample.project || 'Unknown';
        if (!statuses.has(name)) statuses.set(name, { unaffected: 0, affectedUnknown: 0 });
        if (sample.affected === 'N') statuses.get(name).unaffected++;
        else if (sample.affected !== 'Y') statuses.get(name).affectedUnknown++;
    }
    return cohortSampleSummary(samples, {
        cohortOf: row => row.project, investigatorOf: row => row.investigator,
        ageOf: row => row.age, sexOf: row => row.sex, affectedOf: row => row.affected,
        scoreOf: row => row.z,
    }).map(row => ({ ...row, ...statuses.get(row.name) }));
}

// This filter affects the sample table only, leaving the search cohort unchanged.
export function filterSampleProjects(samples, projects) {
    if (projects === null) return samples;
    const selected = new Set(projects);
    return samples.filter(row => selected.has(row.project || 'Unknown'));
}

// Checkboxes select query phenotypes, including samples matching several of them.
export function filterSamplePhenotypes(samples, ids) {
    if (ids === null) return samples;
    return samples.filter(row => ids.some(id => row.terms.includes(id)));
}

// Open the displayed paths to query terms, including paths deeper than two levels.
export function selectedHierarchyBranches(nodes, selected) {
    const queries = new Set(selected), branches = new Set();
    const visit = node => {
        const childMatches = node.children.map(visit).some(Boolean);
        if (childMatches) branches.add(node.id);
        return queries.has(node.id) || childMatches;
    };
    nodes.forEach(visit);
    return branches;
}

export function filterHierarchyCategories(nodes, categories) {
    if (categories === null) return nodes;
    const selected = new Set(categories);
    return nodes.filter(node => node.id === 'HP:0000118').map(node => ({ ...node,
        children: node.children.filter(child => selected.has(child.id)),
    })).filter(node => node.children.length);
}

// Sort siblings, keeping query paths first and every child under its parent.
export function orderPhenotypeHierarchy(nodes, sort, counts, total, queryIds) {
    const branches = selectedHierarchyBranches(nodes, queryIds), queries = new Set(queryIds);
    const selectors = { phenotype: row => row.label, count: row => row.count,
        all: row => counts?.[row.id] ?? null, exclude: row => total - row.count };
    const order = rows => {
        const sorted = sortTableRows(rows, sort, selectors);
        return [...sorted.filter(row => queries.has(row.id) || branches.has(row.id)),
            ...sorted.filter(row => !queries.has(row.id) && !branches.has(row.id))]
            .map(row => ({ ...row, children: order(row.children) }));
    };
    return order(nodes);
}

export function hierarchyRows(nodes) {
    return nodes.flatMap(node => [node, ...hierarchyRows(node.children)]);
}

// Count each sample once at every ancestor, even in HPO's multiple-parent graph.
// A deterministic single parent presents that graph as a browsable tree.
export function projectPhenotypeTree(samples, terms) {
    const counts = new Map(), ancestorCache = new Map();
    for (const sample of samples) {
        const present = new Set();
        for (const id of sample.terms) {
            if (!terms[id]) continue;
            if (!ancestorCache.has(id)) ancestorCache.set(id, ancestorsOf(id, terms));
            present.add(id);
            ancestorCache.get(id).forEach(parent => { if (terms[parent]) present.add(parent); });
        }
        present.forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
    }
    const nodes = new Map([...counts].filter(([id]) => id !== 'HP:0000001').map(([id, count]) => [id, { id, label: terms[id][0], count, children: [] }]));
    const parents = new Map();
    for (const id of nodes.keys()) {
        const parent = [...(terms[id][2] || [])].filter(candidate => nodes.has(candidate) && candidate !== id).sort()[0];
        parents.set(id, parent);
    }
    const roots = [];
    for (const node of nodes.values()) {
        const seen = new Set([node.id]);
        let parent = parents.get(node.id), current = parent;
        while (current) {
            if (seen.has(current)) { parent = null; break; }
            seen.add(current); current = parents.get(current);
        }
        (parent ? nodes.get(parent).children : roots).push(node);
    }
    const order = rows => { rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)); rows.forEach(row => order(row.children)); };
    order(roots);
    return roots;
}

export function distribution(samples, key, labels) {
    const counts = new Map(labels.map(label => [label, 0]));
    for (const sample of samples) {
        const label = key === 'age' ? ageBand(sample.age) : key === 'affected'
            ? sample.affected === 'Y' ? 'Yes' : sample.affected === 'N' ? 'No' : 'Unknown'
            : sample.sex === 'F' ? 'Female' : sample.sex === 'M' ? 'Male' : 'Unknown';
        counts.set(label, (counts.get(label) || 0) + 1);
    }
    const max = Math.max(1, ...counts.values());
    return [...counts].filter(([label, count]) => count || label !== 'Unknown')
        .map(([label, count]) => ({ label, count, width: count / max * 100 }));
}

export function pageRows(rows, page, size) {
    return rows.slice((page - 1) * size, page * size);
}

export function sortSamples(samples, sort) {
    return sortTableRows(samples, sort, {
        project: row => `${row.project}\u0000${row.investigator}\u0000${row.id}`,
        sample: row => row.id, age: row => row.age, z: row => row.z,
        affected: row => row.affected, matched: row => row.matchedCount,
    });
}

// Pinned rows stay above five unpinned page results and never duplicate a page row.
export function splitPinnedRows(rows, ids, keyOf, page, size = 5) {
    const keys = new Set(ids);
    const pinned = rows.filter(row => keys.has(keyOf(row)));
    const unpinned = rows.filter(row => !keys.has(keyOf(row)));
    const current = pageRows(unpinned, page, size);
    return { pinned, unpinned, page: current, display: [...pinned, ...current] };
}

export function matchingCombinations(samples, ids) {
    const groups = new Map();
    for (const sample of samples) {
        const matches = ids.map(id => sample.terms.includes(id));
        const key = matches.map(value => value ? '1' : '0').join('');
        if (!groups.has(key)) groups.set(key, { key, matches, count: 0, matched: matches.filter(Boolean).length });
        groups.get(key).count++;
    }
    return [...groups.values()].sort((a,b) => b.matched - a.matched || b.count - a.count || a.key.localeCompare(b.key));
}
