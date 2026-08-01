const assert = require("node:assert/strict");

const host = process.env.BIOINDEX_HOST_PRIVATE;
const gene = String(process.argv[2] || "ADCY10").trim().toUpperCase();
const variant = String(process.argv[3] || "chr1:167845562:CT:C").replace(/,/g, "").toLowerCase();

assert(host, "Set BIOINDEX_HOST_PRIVATE to the private BioIndex base URL.");

async function main() {
    let url = `${host.replace(/\/$/, "")}/api/bio/query/gene-samples?q=${encodeURIComponent(gene)}`;
    const carriers = new Set();
    const variantCarriers = new Map();
    let matchedRows = 0;

    while (url) {
        const response = await fetch(url);
        assert.equal(response.status, 200, `BioIndex returned ${response.status}`);
        const page = await response.json();
        for (const row of page.data || []) {
            const rowVariant = String(row.variant_id || "").toLowerCase();
            if (rowVariant && row.sample_id) {
                if (!variantCarriers.has(rowVariant)) variantCarriers.set(rowVariant, new Set());
                variantCarriers.get(rowVariant).add(row.sample_id);
            }
            if (rowVariant !== variant) continue;
            matchedRows += 1;
            if (row.sample_id) carriers.add(row.sample_id);
        }
        url = page.continuation
            ? `${host.replace(/\/$/, "")}/api/bio/cont?token=${encodeURIComponent(page.continuation)}`
            : null;
    }

    assert(matchedRows > 0, `${variant} was not returned for ${gene}`);
    assert(carriers.size > 0, `${variant} had no distinct carriers`);
    const sameGeneCoVariants = Array.from(variantCarriers.entries())
        .filter(([id]) => id !== variant)
        .map(([id, ids]) => ({ id, carriers: Array.from(ids).filter(sampleId => carriers.has(sampleId)).length }))
        .filter(row => row.carriers)
        .sort((a, b) => b.carriers - a.carriers || a.id.localeCompare(b.id));
    console.log(JSON.stringify({ gene, variant, matchedRows, distinctCarriers: carriers.size, sameGeneCoVariants }));
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
