const ontology = require("./hpoTree.generated.json");

function hpoPath(rawId) {
    const id = ontology.aliases[String(rawId || "").toUpperCase()] || String(rawId || "").toUpperCase();
    const path = [];
    const seen = new Set();
    let current = id;
    while (current && ontology.nodes[current] && !seen.has(current)) {
        seen.add(current);
        path.push(current);
        current = ontology.nodes[current][1];
    }
    return path[path.length - 1] === ontology.root ? path.reverse() : [];
}

function observedPhenotypeCategories(rows) {
    if (!Array.isArray(rows)) return null;
    const categories = new Map();
    const observed = new Set(rows
        .filter(row => row && row.is_observed === true && /^HP:\d{7}$/i.test(String(row.hpo_id || "")))
        .map(row => String(row.hpo_id).toUpperCase()));
    for (const id of observed) {
        const path = hpoPath(id);
        if (path.length < 2) continue;
        const categoryId = path[1];
        if (!categories.has(categoryId)) categories.set(categoryId, {
            key: categoryId,
            id: categoryId,
            label: ontology.nodes[categoryId][0],
            terms: new Map(),
        });
        const terms = categories.get(categoryId).terms;
        for (let index = 2; index < path.length; index += 1) {
            const termId = path[index];
            terms.set(termId, {
                key: termId,
                id: termId,
                label: ontology.nodes[termId][0],
                parentId: path[index - 1],
            });
        }
    }
    return [...categories.values()].map(category => ({ ...category, terms: [...category.terms.values()] }));
}

function orderHierarchyTerms(terms, categoryId) {
    const children = new Map();
    for (const term of terms) {
        const parent = term.parentId || categoryId;
        if (!children.has(parent)) children.set(parent, []);
        children.get(parent).push(term);
    }
    for (const siblings of children.values()) siblings.sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
    const ordered = [];
    const visit = (parentId, depth) => {
        for (const term of children.get(parentId) || []) {
            ordered.push({ ...term, depth, hasChildren: children.has(term.id) });
            visit(term.id, depth + 1);
        }
    };
    visit(categoryId, 1);
    return ordered;
}

module.exports = {
    hpoPath,
    observedPhenotypeCategories,
    orderHierarchyTerms,
    hpoVersion: ontology.version.split("/").pop(),
};
