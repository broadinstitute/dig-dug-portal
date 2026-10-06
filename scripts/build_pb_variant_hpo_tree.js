const fs = require("fs");
const path = require("path");

const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/build_pb_variant_hpo_tree.js /path/to/hp.obo");

const source = fs.readFileSync(input, "utf8");
const version = (source.match(/^data-version: (.+)$/m) || [])[1];
if (!version) throw new Error("HPO OBO data-version is missing");

const terms = new Map();
for (const stanza of source.split(/\n\[Term\]\n/).slice(1)) {
    const lines = stanza.split("\n");
    const id = (stanza.match(/^id: (HP:\d{7})$/m) || [])[1];
    const name = (stanza.match(/^name: (.+)$/m) || [])[1];
    if (!id || !name || /^is_obsolete: true$/m.test(stanza)) continue;
    terms.set(id, {
        name,
        parents: lines.map(line => (line.match(/^is_a: (HP:\d{7})/) || [])[1]).filter(Boolean),
        aliases: lines.map(line => (line.match(/^alt_id: (HP:\d{7})$/) || [])[1]).filter(Boolean),
    });
}

const root = "HP:0000118";
const paths = new Map();
function resolve(id, visiting = new Set()) {
    if (paths.has(id)) return paths.get(id);
    if (id === root) return { depth: 0, parent: null };
    if (visiting.has(id)) return null;
    const term = terms.get(id);
    if (!term) return null;
    const nextVisiting = new Set(visiting);
    nextVisiting.add(id);
    const candidates = term.parents.map(parent => {
        const result = resolve(parent, nextVisiting);
        return result && { depth: result.depth + 1, parent };
    }).filter(Boolean).sort((a, b) => a.depth - b.depth || a.parent.localeCompare(b.parent));
    const result = candidates[0] || null;
    paths.set(id, result);
    return result;
}

const nodes = {};
const aliases = {};
for (const id of [...terms.keys()].sort()) {
    const pathInfo = resolve(id);
    if (!pathInfo) continue;
    const term = terms.get(id);
    nodes[id] = [term.name, pathInfo.parent];
    for (const alias of term.aliases) aliases[alias] = id;
}
nodes[root] = [terms.get(root).name, null];

const output = path.join(__dirname, "../src/views/PbVariant/hpoTree.generated.json");
fs.writeFileSync(output, JSON.stringify({
    version,
    source: "https://purl.obolibrary.org/obo/hp.obo",
    root,
    nodes,
    aliases,
}) + "\n");
process.stdout.write(`Wrote ${Object.keys(nodes).length} HPO hierarchy nodes from ${version}\n`);
