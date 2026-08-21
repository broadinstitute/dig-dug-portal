/*
    debug-only memory accounting, enabled with mem=1 in the url.

    DevTools' "JS heap" line reports V8's heap only, so everything this browser keeps in
    typed arrays (packed metadata, coordinates, the hover grid, the draw order) and
    everything the page keeps in canvas backing stores is invisible to it. On a 1.6M cell
    dataset the tab reported ~1.2 GB peak / ~700 MB settled against a 471 MB / 251 MB JS
    heap, and the gap was unaccounted for. This prints what we actually hold, so the
    remainder can be attributed instead of modelled.

    Prints with console.table rather than llog so the output is copy-pasteable without
    turning on the rest of the dev logging.
*/

const MB = bytes => Math.round(bytes / 1e5) / 10;

function isTypedArray(value) {
    return value && ArrayBuffer.isView(value) && !(value instanceof DataView);
}

//a plain JS array of numbers is 8 bytes per element for doubles, 4 for small integers
//in chrome (pointer compression); strings are counted separately
function plainNumberArrayBytes(array, doubles = true) {
    return array.length * (doubles ? 8 : 4);
}

function stringArrayBytes(array) {
    //chrome: ~12 byte header + 4 byte array slot + one byte per char for ascii,
    //rounded up to the allocation granularity. close enough to compare against a
    //packed representation
    let chars = 0;
    for (let i = 0; i < array.length; i++) chars += array[i] ? array[i].length : 0;
    return { count: array.length, chars, bytes: array.length * 20 + chars };
}

export async function reportSingleCellMemory(context) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mem') !== '1') return;

    const { fields, coordinates, expressionData, expressionStatsAll, expressionStatsCache,
        expressionLRU, markers, sharedUmapData, datasetId } = context;

    const rows = [];
    const add = (what, bytes, detail = '') => rows.push({ what, MB: MB(bytes), detail });

    // --- fields ---
    if (fields) {
        let packedBytes = 0, packedCount = 0, plainBytes = 0, plainCount = 0;
        Object.values(fields.metadata || {}).forEach(values => {
            if (isTypedArray(values)) { packedBytes += values.byteLength; packedCount++; }
            else if (Array.isArray(values)) { plainBytes += plainNumberArrayBytes(values, false); plainCount++; }
        });
        add('fields.metadata (packed)', packedBytes, `${packedCount} fields, typed arrays`);
        if (plainCount) add('fields.metadata (UNPACKED)', plainBytes, `${plainCount} fields - A2 refused these, check why`);

        let labelBytes = 0, labelCount = 0;
        Object.values(fields.metadata_labels || {}).forEach(labels => {
            if (!Array.isArray(labels)) return;
            labelCount += labels.length;
            labelBytes += stringArrayBytes(labels).bytes;
        });
        add('fields.metadata_labels', labelBytes, `${labelCount} labels`);

        //metadata_labels_sorted shares the array for over-cap fields (B4) and holds a
        //sorted copy for the rest
        let sortedBytes = 0, shared = 0;
        Object.entries(fields.metadata_labels_sorted || {}).forEach(([key, labels]) => {
            if (!Array.isArray(labels)) return;
            if (labels === fields.metadata_labels?.[key]) { shared++; return; }
            sortedBytes += stringArrayBytes(labels).bytes;
        });
        add('fields.metadata_labels_sorted', sortedBytes, `${shared} fields share the unsorted array`);

        const names = fields.NAME || fields.ID;
        if (Array.isArray(names)) {
            const n = stringArrayBytes(names);
            add('fields.NAME', n.bytes, `${n.count.toLocaleString()} strings, ${n.chars.toLocaleString()} chars ` +
                `(packed as one string + offsets: ~${MB(n.chars + n.count * 4)} MB)`);
        }
    }

    // --- coordinates ---
    if (coordinates) {
        const bytes = (coordinates.X?.byteLength || 0) + (coordinates.Y?.byteLength || 0)
            + (coordinates.Z?.byteLength || 0);
        add('coordinates', bytes, `${coordinates.count?.toLocaleString()} cells, ${coordinates.Z ? '3D' : '2D'}`);
    }

    // --- sharedUmapData: hover grid + draw order ---
    if (sharedUmapData?.getMemoryUsage) {
        const usage = sharedUmapData.getMemoryUsage();
        usage.forEach(g => {
            add(`sharedUmapData[${g.group}] hover grid`, g.hoverGrid, g.hoverGrid ? 'built' : 'not built yet');
            add(`sharedUmapData[${g.group}] draw order`, g.drawOrder, `${g.instances} panel(s)`);
        });
    }

    // --- cell filter: mask + the two arrays behind the facet counts ---
    if (context.cellFilter) {
        const f = context.cellFilter;
        add('cellFilter', f.mask.byteLength + f.failCount.byteLength + f.firstFail.byteLength,
            `${f.activeKeys.length} field(s): ${f.activeKeys.join(', ')} - ` +
            `keeps ${f.keptCount.toLocaleString()} of ${f.totalCount.toLocaleString()}`);
    }
    if (context.facetCounts) {
        const keys = Object.keys(context.facetCounts);
        if (keys.length) {
            let entries = 0;
            keys.forEach(k => { entries += Object.keys(context.facetCounts[k]).length; });
            add('facetCounts', entries * 40, `${keys.length} field(s), ${entries.toLocaleString()} labels`);
        }
    }

    // --- expression ---
    let exprBytes = 0;
    const genes = Object.keys(expressionData || {});
    genes.forEach(gene => {
        const values = expressionData[gene];
        if (isTypedArray(values)) exprBytes += values.byteLength;
        else if (Array.isArray(values)) exprBytes += plainNumberArrayBytes(values, true);
    });
    //genes.length is how many gene expression arrays are held right now, after C1 eviction.
    //listedGenes is the size of the gene picker, which is the marker gene list plus whatever
    //has been searched - it is NOT a count of fetches, and calling it one sent a reading of
    //'1 of 111 fetched genes held' up as a bug when only one gene had ever been fetched
    add('expressionData', exprBytes, `${genes.length} held of ${context.listedGenes ?? '?'} listed` +
        `${genes.length ? `: ${genes.join(', ')}` : ''}${expressionLRU ? ` (LRU ${expressionLRU.length})` : ''}`);

    add('expressionStatsAll', (expressionStatsAll?.length || 0) * 120,
        `${expressionStatsAll?.length || 0} rows`);
    if (expressionStatsCache) {
        let cachedRows = 0;
        expressionStatsCache.forEach(v => { cachedRows += v.length; });
        add('expressionStatsCache', cachedRows * 120, `${expressionStatsCache.size} genes, ${cachedRows} rows`);
    }
    if (Array.isArray(markers)) {
        add('markers', markers.length * 200, `${markers.length.toLocaleString()} records`);
    }

    // --- canvas backing stores: width x height x 4, invisible to the JS heap line ---
    let canvasBytes = 0;
    const canvases = Array.from(document.querySelectorAll('canvas'));
    const canvasDetail = canvases.map(c => {
        canvasBytes += c.width * c.height * 4;
        return `${c.width}x${c.height}`;
    });
    add('canvas backing stores', canvasBytes, `${canvases.length} canvases: ${canvasDetail.join(', ')}`);

    const total = rows.reduce((sum, r) => sum + r.MB, 0);

    console.log(`%c--- single cell memory report: ${datasetId} ---`, 'font-weight:bold');
    console.table(rows);
    console.log(`accounted for: ${Math.round(total)} MB`);

    if (performance.memory) {
        const m = performance.memory;
        console.log(`performance.memory: used ${MB(m.usedJSHeapSize)} MB / ` +
            `total ${MB(m.totalJSHeapSize)} MB / limit ${MB(m.jsHeapSizeLimit)} MB ` +
            `(V8 heap only - excludes every typed array above)`);
    }
    if (performance.measureUserAgentSpecificMemory) {
        try {
            const detailed = await performance.measureUserAgentSpecificMemory();
            console.log(`measureUserAgentSpecificMemory: ${MB(detailed.bytes)} MB total`);
            console.table(detailed.breakdown
                .filter(b => b.bytes > 0)
                .map(b => ({ MB: MB(b.bytes), types: b.types.join('+'), scope: b.attribution?.[0]?.scope || '' })));
        } catch (error) {
            console.log('measureUserAgentSpecificMemory unavailable:', error.message);
        }
    } else {
        console.log('measureUserAgentSpecificMemory needs a cross-origin-isolated page ' +
            '(COOP/COEP headers on the dev server) - use Chrome Task Manager (Shift+Esc) instead, ' +
            'which shows Memory footprint next to JavaScript memory');
    }
}
