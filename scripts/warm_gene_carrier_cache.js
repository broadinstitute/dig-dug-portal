// Read the same private BioIndex source as the portal, without opening a listener.
// Only aggregate progress is printed; records stay in the private disk cache.
const register = require('./gene_carrier_summary_endpoint');
const gene = String(process.argv[2] || '').trim().toUpperCase();
const base = process.env.BIOINDEX_HOST_PRIVATE;
if (!base || !/^[A-Z0-9][A-Z0-9.-]{0,31}$/.test(gene)) {
    console.error('Usage: BIOINDEX_HOST_PRIVATE=<url> node scripts/warm_gene_carrier_cache.js <gene>');
    process.exitCode = 1;
} else {
    const handlers = {};
    register({get(route, handler) { handlers[route] = handler; }, post() {}}, base);
    const started = Date.now();
    const inspect = () => handlers['/__gene_carrier_summary__']({query: {gene}, headers: {}}, {
        set() {},
        status(code) { throw new Error(`Unexpected status ${code}`); },
        json(result) {
            console.log(JSON.stringify({gene, status: result.status, completed: result.completed,
                total: result.total, matched: result.matchedMetadataCount,
                elapsedSeconds: Math.round((Date.now() - started) / 1000)}));
            if (result.status === 'error') {
                console.error(result.error);
                process.exitCode = 1;
            } else if (result.status !== 'ready') {
                setTimeout(inspect, 10000);
            }
        },
    });
    inspect();
}
