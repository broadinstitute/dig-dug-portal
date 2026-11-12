// Private, source-versioned cache. No cached records are published to the browser.
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

async function openCarrierDiskCache(root, namespace, now = Date.now) {
    const directory = path.join(root, namespace);
    await fsp.mkdir(directory, { recursive: true, mode: 0o700 });
    await fsp.chmod(directory, 0o700);
    const metadataPath = path.join(directory, 'metadata.jsonl');
    const samples = new Map();
    try {
        const stat = await fsp.stat(metadataPath);
        if (stat.size <= 128 * 1024 * 1024) {
            for (const line of (await fsp.readFile(metadataPath, 'utf8')).split('\n')) {
                if (!line) continue;
                try {
                    const row = JSON.parse(line);
                    if (typeof row.id === 'string' && row.info && now() - row.savedAt < MAX_AGE_MS) {
                        samples.set(row.id, row);
                    }
                } catch (_) { /* Ignore an interrupted final append. */ }
            }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    // Compact expired/duplicate entries once at startup, retaining private permissions.
    const compactedPath = metadataPath + '.tmp';
    await fsp.writeFile(compactedPath, [...samples.values()].map(row => JSON.stringify(row) + '\n').join(''), { mode: 0o600 });
    await fsp.chmod(compactedPath, 0o600);
    await fsp.rename(compactedPath, metadataPath);
    let writes = Promise.resolve();
    function save(name, value) {
        writes = writes.then(async () => {
            const dest = path.join(directory, name + '.json.gz');
            const temporary = dest + '.tmp';
            await fsp.writeFile(temporary, await gzip(JSON.stringify({ savedAt: now(), value })), { mode: 0o600 });
            await fsp.rename(temporary, dest);
        }).catch(() => {});
    }
    async function load(name) {
        try {
            const record = JSON.parse((await gunzip(await fsp.readFile(path.join(directory, name + '.json.gz')))).toString());
            return now() - record.savedAt < MAX_AGE_MS ? record.value : null;
        } catch (_) { return null; }
    }
    return {
        getSample(id) {
            const row = samples.get(id);
            return row && now() - row.savedAt < MAX_AGE_MS ? row.info : null;
        },
        putSample(id, info) {
            if (!info) return;
            const row = { id, info, savedAt: now() };
            samples.set(id, row);
            writes = writes.then(() => fsp.appendFile(metadataPath, JSON.stringify(row) + '\n', { mode: 0o600 })).catch(() => {});
        },
        async getCarriers(gene) {
            const rows = await load('carriers-' + gene);
            if (!rows) return null;
            const byVariant = new Map(rows.map(([id, ids]) => [id, new Set(ids)]));
            return { byVariant, all: new Set([...byVariant.values()].flatMap(ids => [...ids])) };
        },
        putCarriers(gene, sets) { save('carriers-' + gene, [...sets.byVariant].map(([id, ids]) => [id, [...ids]])); },
        getSummary(gene) { return load('summary-' + gene); },
        putSummary(gene, result) { save('summary-' + gene, result); },
        flush() { return writes; },
    };
}
module.exports = { openCarrierDiskCache };
