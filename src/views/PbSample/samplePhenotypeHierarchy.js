const { hpoPath } = require('../PbVariant/hpoHierarchy');
const ontology = require('../PbVariant/hpoTree.generated.json');

// Intermediate ontology nodes provide context; they are not sample observations.
function samplePhenotypeTree(group) {
    const recorded = new Set((group.terms || []).map(term => ontology.aliases[term.id] || term.id));
    const nodes = new Map();
    for (const term of group.terms || []) {
        const id = ontology.aliases[term.id] || term.id;
        const fullPath = hpoPath(id);
        const groupIndex = fullPath.indexOf(group.id);
        const path = groupIndex >= 0 ? fullPath.slice(groupIndex + 1) : [id];
        for (let index = 0; index < path.length; index++) {
            const nodeId = path[index];
            if (!nodes.has(nodeId)) nodes.set(nodeId, { id: nodeId,
                label: ontology.nodes[nodeId] ? ontology.nodes[nodeId][0] : term.label || nodeId,
                parentId: index ? path[index - 1] : group.id,
                recorded: recorded.has(nodeId), children: [] });
        }
    }
    const roots = [];
    for (const node of nodes.values()) {
        const parent = nodes.get(node.parentId);
        (parent ? parent.children : roots).push(node);
    }
    const sort = rows => { rows.sort((a,b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id)); rows.forEach(row => sort(row.children)); };
    sort(roots);
    return roots;
}

module.exports = { samplePhenotypeTree };
