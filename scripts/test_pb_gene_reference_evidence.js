const assert = require('node:assert/strict');
const { buildGeneReferenceEvidence } = require('../src/views/PbPhenotype/geneReferenceEvidence');
const row = (source, code, genes, extra = {}) => ({ source, code, referenceId: `${source}:${code}`,
    name: `${source} disease ${code}`, genes: genes.map(gene => [gene]), excludedBy: [],
    matchedIds: ['HP:0000001'], score: .3, ...extra });
const orphanet = [row('orphanet', 1, ['X'], { rank: 1 }), row('orphanet', 2, ['LOW'], { score: .05, rank: 2 })];
const additional = [
    row('omim', 1, ['x', 'X', 'Y']), // A record ID can exist in another DB.
    row('ddg2p', 1, ['X', 'Z']),
    row('omim', 2, ['EXCLUDED'], { excludedBy: ['HP:0000002'] }),
    row('omim', 3, ['Y']),
    row('decipher', 1, []), // An unmapped disease must not imply gene evidence.
];
const result = buildGeneReferenceEvidence(orphanet, additional, { multi: true });
assert.deepEqual(result.X.map(link => link.source), ['orphanet', 'omim', 'ddg2p']);
assert.equal(new Set(result.X.map(link => link.key)).size, 3, 'Records from different DBs stay distinct');
assert.deepEqual(result.Y.map(link => link.rank), [1, 2], 'Ranks are per source after Exclude');
assert.equal(result.X.filter(link => link.source === 'omim').length, 1, 'Duplicate gene annotations do not duplicate a record');
assert.equal(result.EXCLUDED, undefined);
assert.equal(result.LOW, undefined, 'Preserve the existing multi-HPO Orphanet cutoff');
assert.ok(buildGeneReferenceEvidence(orphanet, additional).LOW, 'Single-HPO references preserve their existing criteria');
assert.ok(Object.values(result).flat().every(link => link.source !== 'decipher'));
assert.equal(result.Z[0].source, 'ddg2p', 'DDG2P-only genes must be discoverable');
assert.deepEqual(additional[0].genes, [['x'], ['X'], ['Y']], 'Do not mutate source annotations');
console.log('Gene reference evidence: OMIM/DDG2P links, source-specific ranks, namespace/deduplication, Exclude, unmapped records and existing Orphanet criteria PASS');
