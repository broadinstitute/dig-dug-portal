import * as d3 from 'd3';
import {llog} from "./llog.js";

const MISSING_METADATA_LABELS = new Set([
    "",
    "na",
    "n/a",
    "n.a.",
    "n\\a",
    "missing",
    "null",
    "none",
    "-",
    "--",
    ".",
    "..",
]);

export function isMissingMetadataValue(value) {
    if (value === null || value === undefined) return true;
    return MISSING_METADATA_LABELS.has(String(value).trim().toLowerCase());
}

/* fetch utils */
export async function fetchMetadata(url) {
    llog('getting metadata', url);
    try {
        const response = await fetch(url);
        //returns line json
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const metadata = lines.map(line => JSON.parse(line));
        return metadata;
    } catch (error) {
        llog('Error fetching metadata:', error);
        return null;
    }
}
export async function fetchFields(url, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId);
    llog('getting fields', replacedUrl);
    try {
        const response = await fetch(replacedUrl);
        const fields = await response.json();
        //drop before packing, so the dropped field never gets an index array built for it
        return packMetadataIndices(dropDuplicateIdFields(fields));
    } catch (error) {
        llog('Error fetching fields:', error);
        return null;
    }
}

/*
    metadata holds one label index per cell per annotation. parsed from JSON those are
    plain arrays, which cost a full tagged slot per value - on a 2M cell dataset with 60
    annotations that is over a hundred million slots, and it is the single largest thing
    the browser keeps in memory.

    the values are only ever used as indices into metadata_labels, so they fit in the
    narrowest typed array that can hold the label count (a Uint8Array for most fields).
    each array is replaced in place so the original can be collected.
*/
/*
    some datasets ship a metadata field whose labels are the cell barcodes - one distinct
    label per cell, identical to fields.NAME. measured on FNIH_SAT_scRNA_v2.2 (1.69M cells)
    that field cost 85 MB of label strings plus a 6.7 MB Uint32 index array, against 85 MB
    for NAME holding the same strings: ~92 MB of exact duplicate, a third of everything the
    browser held.

    the field is useless either way. filterDisplayFields marks anything over
    MAX_PLOTTABLE_LABELS as tooManyValues, so it can never be grouped, stratified, coloured
    or plotted, and its only other appearance is a hover tooltip row that repeats the Cell
    ID row already rendered from NAME.

    the field name varies between datasets (barcode, cell_id, ...), so this identifies it
    structurally instead: over the label cap, one label per cell, and every cell resolving
    through its own index array to the string NAME already holds. a field that fails any of
    those is left alone, so an over-cap field carrying something other than the barcodes
    keeps its tooltip row.

    the comparison is every cell rather than a sample, because the only thing that makes
    deleting a field safe is that it is provably a duplicate, and a sample cannot prove it.
    it costs nothing in the common case - a field that is not a copy of NAME mismatches
    almost immediately and exits - and the full scan only runs when it is about to free
    tens of MB.
*/
export function dropDuplicateIdFields(fields) {
    const names = fields?.NAME || fields?.ID;
    if(!names || !fields.metadata || !fields.metadata_labels) return fields;

    const cellCount = names.length;
    const dropped = [];
    const idFieldLabelCounts = {};

    Object.keys(fields.metadata_labels).forEach(key => {
        const labels = fields.metadata_labels[key];
        const values = fields.metadata[key];
        if(!labels || labels.length <= MAX_PLOTTABLE_LABELS) return;
        //one label per cell is what makes it a copy of NAME rather than a coarse grouping
        if(labels.length !== cellCount || !values || values.length !== cellCount) return;

        for(let i = 0; i < cellCount; i++){
            if(labels[values[i]] !== names[i]) return;
        }

        //the key is emptied rather than removed, and the original label count recorded,
        //because calcLabelColors walks metadata_labels in insertion order and advances a
        //running counter by each field's label count - that is what keeps every other
        //field's colors identical (see A6). removing the key would shift them all.
        idFieldLabelCounts[key] = labels.length;
        fields.metadata_labels[key] = [];
        delete fields.metadata[key];
        dropped.push(`${key} (${labels.length.toLocaleString()} labels)`);
    });

    if(dropped.length){
        fields.idFieldLabelCounts = idFieldLabelCounts;
        llog(`dropped id field(s) duplicating NAME: ${dropped.join(', ')}`);
    }
    return fields;
}

function packMetadataIndices(fields) {
    if(!fields?.metadata || !fields?.metadata_labels) return fields;

    let packedFields = 0;
    Object.keys(fields.metadata).forEach(key => {
        const values = fields.metadata[key];
        const labelCount = fields.metadata_labels[key]?.length;
        if(!Array.isArray(values) || !labelCount) return;

        const IndexArray = labelCount <= 256 ? Uint8Array
            : labelCount <= 65536 ? Uint16Array
            : Uint32Array;

        const packed = new IndexArray(values.length);
        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            //a null or out-of-range value would be silently coerced to 0 here, which would
            //relabel those cells as the first label. leave the field alone instead.
            if(!Number.isInteger(value) || value < 0 || value >= labelCount){
                llog(`   leaving ${key} unpacked, unexpected index at ${i}:`, value);
                return;
            }
            packed[i] = value;
        }

        fields.metadata[key] = packed;
        packedFields++;
    });

    llog(`packed ${packedFields}/${Object.keys(fields.metadata).length} metadata fields`);
    return fields;
}
/*
    coordinates used to be parsed by the generic tsv2Json into one plain object per
    cell. that is ~52 bytes per cell in chrome for what is really two floats, and it
    also forced a Map keyed by those objects and a d3 quadtree built over them.

    parsed straight into Float32Arrays instead, a cell costs 8 bytes (12 in 3D) and
    the object identity that the Map and the quadtree existed to resolve is replaced
    by the array index. see sharedUmapData for the hover lookup that replaces the
    quadtree.

    shape returned: { count, X: Float32Array, Y: Float32Array, Z: Float32Array|null }
    Z is null unless the file has a Z column with at least one non-zero value, which
    is exactly the condition the plot used to call 3D mode.
*/
export function parseCoordinates(text) {
    const length = text.length;
    let headerEnd = text.indexOf('\n');
    if (headerEnd === -1) headerEnd = length;

    const headers = text.slice(0, headerEnd).split('\t');
    const xCol = headers.findIndex(h => h.trim() === 'X');
    const yCol = headers.findIndex(h => h.trim() === 'Y');
    const zCol = headers.findIndex(h => h.trim() === 'Z');
    if (xCol === -1 || yCol === -1) {
        llog('coordinates: no X/Y columns in', headers);
        return null;
    }
    const lastCol = Math.max(xCol, yCol, zCol);

    //one newline per row at most. rows that are blank are skipped, so this is an
    //upper bound and the arrays get trimmed at the end if it was not exact.
    let rowCap = 0;
    for (let i = headerEnd; i < length; i++) {
        if (text.charCodeAt(i) === 10) rowCap++;
    }
    if (length > headerEnd && text.charCodeAt(length - 1) !== 10) rowCap++;

    let X = new Float32Array(rowCap);
    let Y = new Float32Array(rowCap);
    let Z = zCol === -1 ? null : new Float32Array(rowCap);
    let hasZ = false;
    let count = 0;

    let pos = headerEnd + 1;
    while (pos < length) {
        let eol = text.indexOf('\n', pos);
        if (eol === -1) eol = length;

        if (eol > pos) {
            //walk the tab separated fields once, picking off only the columns we need
            let col = 0;
            let fieldStart = pos;
            let x = NaN;
            let y = NaN;
            let z = 0;
            let seen = 0;
            for (let i = pos; i <= eol; i++) {
                if (i === eol || text.charCodeAt(i) === 9) {
                    if (col === xCol) { x = +text.slice(fieldStart, i); seen++; }
                    else if (col === yCol) { y = +text.slice(fieldStart, i); seen++; }
                    else if (col === zCol) { z = +text.slice(fieldStart, i); seen++; }
                    if (col === lastCol) break;
                    col++;
                    fieldStart = i + 1;
                }
            }

            if (seen > 0) {
                X[count] = x;
                Y[count] = y;
                if (Z) {
                    Z[count] = z;
                    if (z !== 0) hasZ = true;
                }
                count++;
            }
        }

        pos = eol + 1;
    }

    if (count !== rowCap) {
        X = X.slice(0, count);
        Y = Y.slice(0, count);
        if (Z) Z = Z.slice(0, count);
    }

    //a Z column of all zeros is a 2D embedding; drop it rather than carry 4 bytes
    //per cell that only ever read back as 0.
    if (Z && !hasZ) Z = null;

    //frozen so Vue's observe() skips it - it is assigned straight to reactive data.
    return Object.freeze({ count, X, Y, Z });
}

export async function fetchCoordinates(url, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId);
    llog('getting coordinates', replacedUrl);
    try {
        const response = await fetch(replacedUrl);
        return parseCoordinates(await response.text());
    }catch (error){
        llog('Error fetching coordinates:', error);
        return null;
    }
}
export async function fetchMarkers(url, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId);
    llog('getting markers', replacedUrl);
    try {
        const response = await fetch(replacedUrl);
        //likely temporary, but currently the marker_genes api
        //may send a json object or line-json
        //here we catch that and return a json object either way
        const text = await response.text();
        let markers;
        try{
            markers = JSON.parse(text);
        }catch{
            const lines = text.split('\n').filter(line => line.trim() !== '');
            markers = lines.map(line => JSON.parse(line));
        }
        return markers;
    } catch (error) {
        llog('Error fetching markers:', error);
        return null;
    }
}
export async function fetchGeneExpression(url, gene, datasetId){
    const replacedUrl = url.replace('$datasetId', datasetId).replace('$gene', gene);
    llog(`getting ${gene} expression`, replacedUrl)
    try{
        const response = await fetch(replacedUrl);
        const json = await response.json();
        if(json.data.length===0){
            llog(`${gene} not found`);
            return null;
        }
        const expression = json.data[0]['expression'];
        //one value per cell, and it lands on reactive state via Vue.set. unfrozen, every
        //read during a render walks all of it through dependArray - and the template reads
        //it once per stratify value via min/maxExpressionValue. never mutated after load.
        return Object.freeze(expression);
    }catch(error){
        llog('   Error fetching gene expression', error);
        return null;
    }
}

/*
    a download filename from its meaningful parts, e.g.
    buildDownloadFilename(['FNIH_Artery_scRNA_v1', 'PDE3B', 'expression_violin'])
      -> 'FNIH_Artery_scRNA_v1_PDE3B_expression_violin'

    empty and null parts are dropped rather than leaving '__' where an optional part - a
    gene on a plot that has none - was absent.

    the sanitising is not cosmetic: dataset ids and gene names both reach here from data
    rather than from a list this code controls, and '/' in a name would be read as a path
    separator by the download. anything outside word characters, dot and dash becomes an
    underscore, runs are collapsed, and the extension is left to the caller.
*/
export function buildDownloadFilename(parts){
    const name = (parts || [])
        .filter(part => part !== null && part !== undefined && String(part).trim() !== '')
        .map(part => String(part).trim().replace(/[^\w.-]+/g, '_'))
        .join('_')
        .replace(/_{2,}/g, '_')
        .replace(/^[_.]+|[_.]+$/g, '');

    return name || 'chart';
}

export function calcFieldsDisplayList(fields){
    const list = [];
    for(const [key, value] of Object.entries(fields.metadata_labels)){
        list.push({"raw field": key, "field label": key.replaceAll("_", " ")});
    }
    llog('   calcFieldsDisplayList', list);
    return list;
}

/*
    a field with more distinct values than this cannot be plotted or colored usefully -
    it would mean thousands of bars/violins and a legend nobody can read. in practice a
    field over this size is an id column (barcode, cell id), which has one distinct value
    per cell.
*/
export const MAX_PLOTTABLE_LABELS = 1000;

export function calcLabelColors(fields, colors){
    let colorIndex = 0;
    const labelColors = {};
    for(const [key, value] of Object.entries(fields.metadata_labels)){
        labelColors[key] = {};

        //an id-like field builds a color map with one entry per cell. those colors can
        //never be displayed, but reactively they cost tens of MB. the empty object is
        //kept so callers can still do labelColors[key][label] without throwing.
        //colorIndex is still advanced so every other field keeps the color it has today -
        //including past a field dropDuplicateIdFields emptied, whose original label count
        //is recorded for exactly this reason.
        const labelCount = fields.idFieldLabelCounts?.[key] ?? value.length;
        if(labelCount > MAX_PLOTTABLE_LABELS){
            llog(`   skipping colors for ${key}, ${labelCount} labels`);
            colorIndex += labelCount;
            continue;
        }

        for(var i=0; i<value.length; i++){
            //this used to be a d3.scaleOrdinal fed a running counter, which for
            //sequential inputs returns exactly this - minus the scale's internal
            //one-entry-per-label map
            labelColors[key][value[i]] = colors[colorIndex % colors.length];
            colorIndex++;
        }
    }
    llog('calcLabelColors', labelColors);
    //read-only after this point, so keep Vue from walking it (one Dep + accessor pair
    //per label otherwise)
    return Object.freeze(labelColors);
}

/*
    combinatorial cell filtering.

    a filter is a set of allowed labels per field, ANDed across fields: gender in {male}
    AND disease in {healthy} keeps the cells satisfying both. within one field the allowed
    labels are a disjunction by construction (a cell has exactly one value per field), so
    no and/or modifier is ever needed - the model is the standard faceted one.

    the result is a mask with one byte per cell rather than a compacted list of surviving
    indices. that matters here: A2/A4 left every per-cell structure parallel by index -
    fields.metadata[key][i], expressionData[gene][i], points.X[i], and the values inside
    the shared draw order are all the same i. a mask composes with all of them for one
    byte per cell (1.7 MB at 1.7M cells), while compacting would need a remap in every
    consumer and would force the position/colour buffers to be rebuilt and re-uploaded on
    every filter change - measured at ~390 ms and 18 MB at 1.5M cells when the draw order
    used to change per gene.

    the pass is fused rather than one pass per field ANDed together: each field gets a
    tiny allow table indexed by label (labels are capped at MAX_PLOTTABLE_LABELS, so this
    is bytes), and the cell loop checks the active fields with an early exit. the cost is
    therefore cells x (fields checked before the first rejection), which *falls* as the
    filter narrows.

    failCount / firstFail exist for the facet counts in computeFacetCounts - see there.
*/

//how many cells the fields object describes. metadata arrays are all this long
function cellCountOf(fields){
    const names = fields?.NAME || fields?.ID;
    if(names) return names.length;
    const first = fields?.metadata && Object.values(fields.metadata)[0];
    return first ? first.length : 0;
}

/*
    which fields can be filtered on. deliberately NOT the same set that can be grouped or
    stratified: a field over MAX_PLOTTABLE_LABELS cannot be an axis (a bar per cell) but is
    a perfectly good filter target - "one donor out of 2000". two structural exclusions,
    both of which have to be detected by shape rather than by name because the field name
    varies between datasets:
      - a field dropDuplicateIdFields emptied has no labels and no index array at all
      - a single-valued field is a no-op as a filter
    continuous fields are included: their values are still label indices, so a range
    selection resolves to the same allow table (see rangeToLabels).
*/
export function isFilterableField(fields, key){
    const labels = fields?.metadata_labels?.[key];
    const values = fields?.metadata?.[key];
    return !!(labels && labels.length > 1 && values && values.length);
}

/*
    the label list a filter control offers for a field. unlike getPlotMetadataLabels this
    keeps the missing-value labels, so a cell with no value for the field can be included
    deliberately instead of vanishing the moment the field is filtered at all.
*/
export function filterLabelsFor(fields, key){
    if(!isFilterableField(fields, key)) return [];
    return fields.metadata_labels_sorted?.[key] || fields.metadata_labels[key];
}

/*
    the label indices of a continuous field whose values fall in [min, max]. a continuous
    field is still stored as indices into string labels, so a range filter reduces to the
    same allow table as a categorical one and costs nothing extra in the cell loop.
*/
export function rangeToLabels(fields, key, min, max){
    const labels = fields?.metadata_labels?.[key] || [];
    const kept = [];
    for(let i = 0; i < labels.length; i++){
        const value = Number(labels[i]);
        if(!Number.isFinite(value)) continue;
        if(value >= min && value <= max) kept.push(labels[i]);
    }
    return kept;
}

//below this many distinct values a slider is worse than a list of checkboxes - you cannot
//reliably land on one of four ages by dragging
export const MIN_RANGE_FILTER_VALUES = 5;

/*
    whether a field should be filtered with a range rather than a value list, and the
    extent to offer if so. returns null for anything that is not numeric.

    this deliberately does NOT read displayFields[key].dataType. that inference is about
    plotting, and it marks every field over MAX_PLOTTABLE_LABELS as categorical regardless
    of content - but a numeric column with thousands of distinct values is exactly the case
    where a slider beats a list most. the test here is only "are all the labels numbers".

    one non-numeric label disqualifies the field and exits immediately, so this is cheap on
    the string fields it rejects, and O(labels) - never O(cells) - on the ones it accepts.
*/
export function numericRangeFor(fields, key){
    if(!isFilterableField(fields, key)) return null;

    const labels = fields.metadata_labels[key];
    let min = Infinity;
    let max = -Infinity;
    let valueCount = 0;
    let allIntegers = true;

    for(let i = 0; i < labels.length; i++){
        const label = labels[i];
        //a missing value is not a number and must not disqualify the field. it simply
        //cannot be selected by a range, which matches the rule that filtering a field
        //excludes cells with no value for it
        if(isMissingMetadataValue(label)) continue;

        const value = Number(label);
        if(!Number.isFinite(value)) return null;

        if(!Number.isInteger(value)) allIntegers = false;
        if(value < min) min = value;
        if(value > max) max = value;
        valueCount++;
    }

    if(valueCount < MIN_RANGE_FILTER_VALUES) return null;
    //a single distinct value has nothing to drag between
    if(!(max > min)) return null;

    /*
        integers covering every value from min to max with no gaps are an enumeration, not a
        quantity - cluster ids, resolutions, batch numbers. dragging a range over them is
        meaningless ("clusters 5 to 20"), so they get a value list instead.

        completeness is the signal rather than density, because density cannot separate the
        two: on the islet dataset RNA_snn_res.1.8 is 1..48 with all 48 present, and age is
        1..66 with 56 present - 100% against 85%, close enough that any density threshold
        would be a guess. requiring EVERY integer in the range makes it exact, and it holds
        because a measured quantity hitting every integer in its span with none missing gets
        less likely the wider the span is.

        labels are distinct, so valueCount is the distinct non-missing count and no second
        pass is needed to know the run is complete.
    */
    if(allIntegers && valueCount === (max - min + 1)) return null;

    /*
        a step of the largest power of ten that still gives at least ~200 stops. that keeps
        the numbers the slider can land on readable (0.01, 0.1, 1, 10) instead of the
        span/200 an even division would give, which shows up as 23.456789 in the readout.
    */
    const span = max - min;
    const step = allIntegers
        ? 1
        : Math.pow(10, Math.floor(Math.log10(span / 200)));
    //how many decimals to render, derived from the step so the two always agree
    const decimals = step >= 1 ? 0 : Math.min(6, Math.ceil(-Math.log10(step)));

    return Object.freeze({ min, max, step, decimals, allIntegers, valueCount });
}

/*
    builds the allow table for one field's selection. two selection shapes are accepted, and
    both reduce to the same table so the cell loop never has to know which it was:

      string[]        - the allowed labels, for a value list
      {min, max}      - a numeric range, for a slider

    a range excludes the field's missing-value labels by construction, since they are not
    finite numbers. that is the same rule a value list follows: filtering a field at all
    excludes cells with no value for it unless that value is picked deliberately.
*/
function buildAllowTable(labels, selected){
    const allow = new Uint8Array(labels.length);
    let allowed = 0;

    if(Array.isArray(selected)){
        if(selected.length === 0) return null;
        const wanted = new Set(selected);
        for(let i = 0; i < labels.length; i++){
            if(wanted.has(labels[i])){
                allow[i] = 1;
                allowed++;
            }
        }
    }else if(selected && Number.isFinite(selected.min) && Number.isFinite(selected.max)){
        for(let i = 0; i < labels.length; i++){
            const value = Number(labels[i]);
            if(Number.isFinite(value) && value >= selected.min && value <= selected.max){
                allow[i] = 1;
                allowed++;
            }
        }
    }else{
        return null;
    }

    return { allow, allowed };
}

/*
    selections: { [fieldKey]: string[] | {min, max} } - the allowed values per field, ANDed
    across fields. a field that is absent, empty, or admits every one of its labels places
    no constraint and is dropped, so activeKeys is always the set that actually narrows
    anything.

    returns null when nothing is constrained. that is load bearing: a null filter means
    every consumer below takes the exact code path it took before this existed, so the
    unfiltered case is unchanged rather than merely equivalent.
*/
export function buildCellFilter(fields, selections){
    if(!fields || !selections) return null;

    const totalCount = cellCountOf(fields);
    if(!totalCount) return null;

    const active = [];
    Object.keys(selections).forEach(key => {
        if(!isFilterableField(fields, key)) return;

        const labels = fields.metadata_labels[key];
        const table = buildAllowTable(labels, selections[key]);
        if(!table) return;

        const { allow, allowed } = table;
        //admitting everything is not a filter
        if(allowed === 0 || allowed === labels.length) return;

        active.push({ key, allow, values: fields.metadata[key] });
    });

    if(active.length === 0) return null;

    const fieldCount = active.length;
    const mask = new Uint8Array(totalCount);
    //how many active filters the cell fails, saturating at 2 - nothing downstream needs
    //to tell 2 from 7, and stopping at 2 is what keeps the inner loop short
    const failCount = new Uint8Array(totalCount);
    //which filter it failed, meaningful only where failCount is 1. it holds an index into
    //`active`, so it has to be wide enough for the field count or the facet counts would
    //silently attribute failures to the wrong field
    const firstFail = fieldCount <= 256
        ? new Uint8Array(totalCount)
        : new Uint16Array(totalCount);
    let keptCount = 0;

    for(let i = 0; i < totalCount; i++){
        let fails = 0;
        let first = 0;
        for(let f = 0; f < fieldCount; f++){
            const filter = active[f];
            if(!filter.allow[filter.values[i]]){
                if(fails === 0) first = f;
                fails++;
                if(fails > 1) break;
            }
        }
        failCount[i] = fails;
        firstFail[i] = first;
        if(fails === 0){
            mask[i] = 1;
            keptCount++;
        }
    }

    const activeIndexByKey = {};
    //the allow tables are kept, not just used and dropped. when a field is BOTH filtered
    //and used as a plot axis, the values it excludes are empty by construction - filtering
    //disease to healthy and stratifying by disease can only ever draw an empty bar for
    //every other disease. the aggregation skips those rows using these tables, which is
    //exact and needs no pass over the cells. a group that is empty because the data says
    //so is a different thing and is still emitted - see the note on calcCellCounts.
    const allowByKey = {};
    active.forEach((filter, index) => {
        activeIndexByKey[filter.key] = index;
        allowByKey[filter.key] = filter.allow;
    });

    llog('buildCellFilter', {
        fields: active.map(f => f.key),
        kept: keptCount,
        of: totalCount
    });

    //frozen so it can be used as a cache identity and so Vue never observes the per-cell
    //arrays inside it
    return Object.freeze({
        mask,
        keptCount,
        totalCount,
        activeKeys: Object.freeze(active.map(f => f.key)),
        activeIndexByKey: Object.freeze(activeIndexByKey),
        allowByKey: Object.freeze(allowByKey),
        failCount,
        firstFail
    });
}

/*
    the allow table for one field, indexed by its label index, or null when the field
    places no constraint. label indices here are into metadata_labels[key] - the unsorted
    array - which is exactly what the aggregation emit loops iterate.
*/
function allowTableFor(cellFilter, key){
    return (key && cellFilter?.allowByKey?.[key]) || null;
}

/*
    how many cells each label of each requested field would keep.

    for a field that is not itself filtered this is just a count over the mask. for one
    that IS filtered the count has to ignore that field's own constraint, otherwise every
    unselected value of a field you have already narrowed reads as 0 and there is no way
    to see what switching to it would give you - which is exactly how a compounding filter
    turns into a dead end.

    that leave-one-out would be a pass per field, but failCount/firstFail collapse it to
    one: a cell counts towards field g when it fails nothing, or when the single thing it
    fails IS g. so all the requested fields are counted in a single sweep, over only the
    cells that fail at most one filter.

    the caller passes the fields it is actually rendering options for rather than all of
    them, because the sweep is cells x requested fields.

    fields over MAX_PLOTTABLE_LABELS are skipped. a donor or barcode field has one label
    per cell, so a count per label would be an object with one entry per cell - the same
    shape A6 removed for costing tens of MB - and a per-value count is not the useful
    signal there anyway, since you are looking for one known value rather than comparing
    them. callers render no count for those.
*/
export function computeFacetCounts(fields, cellFilter, fieldKeys){
    const result = {};
    const targets = [];

    (fieldKeys || []).forEach(key => {
        if(!isFilterableField(fields, key)) return;
        const labels = fields.metadata_labels[key];
        if(labels.length > MAX_PLOTTABLE_LABELS){
            llog(`   no facet counts for ${key}, ${labels.length} labels`);
            return;
        }
        const counts = new Uint32Array(labels.length);
        targets.push({
            key,
            labels,
            counts,
            values: fields.metadata[key],
            //-1 when this field places no constraint, so only failCount 0 cells count
            activeIndex: cellFilter ? (cellFilter.activeIndexByKey[key] ?? -1) : -1
        });
    });

    if(targets.length === 0) return result;

    const totalCount = cellCountOf(fields);
    const targetCount = targets.length;

    if(!cellFilter){
        for(let i = 0; i < totalCount; i++){
            for(let t = 0; t < targetCount; t++){
                const target = targets[t];
                target.counts[target.values[i]]++;
            }
        }
    }else{
        const { failCount, firstFail } = cellFilter;
        for(let i = 0; i < totalCount; i++){
            const fails = failCount[i];
            if(fails > 1) continue;
            const failed = fails === 1 ? firstFail[i] : -1;
            for(let t = 0; t < targetCount; t++){
                const target = targets[t];
                if(fails === 0 || target.activeIndex === failed){
                    target.counts[target.values[i]]++;
                }
            }
        }
    }

    targets.forEach(target => {
        const byLabel = {};
        for(let i = 0; i < target.labels.length; i++){
            byLabel[target.labels[i]] = target.counts[i];
        }
        result[target.key] = byLabel;
    });

    return result;
}

/*
    counting helpers.

    these all make a single pass over the cells. the previous versions looped the label
    list on the outside and every cell on the inside, building an index array per label and
    then re-filtering it once per subset label - O(cells x labels) time, and worse,
    O(cells x subset labels) allocation. stratifying 2M cells by a 191-value sample field
    churned through well over a gigabyte of temporary arrays.

    combinations are packed into a single numeric key so only combinations that actually
    occur are stored, rather than allocating the full label1 x label2 grid up front.

    mask is the optional cell filter (buildCellFilter().mask). a null mask keeps the loop
    exactly as it was.
*/
function countByLabel(groupValues, groupCount, mask = null) {
    //out-of-range values fall outside the array and are dropped, which matches the old
    //behaviour of never matching any label index
    const counts = new Uint32Array(groupCount);
    for (let i = 0; i < groupValues.length; i++) {
        if (mask && !mask[i]) continue;
        counts[groupValues[i]]++;
    }
    return counts;
}

function countByLabelPair(aValues, bValues, bCount, mask = null) {
    const counts = new Map();
    for (let i = 0; i < aValues.length; i++) {
        if (mask && !mask[i]) continue;
        const key = aValues[i] * bCount + bValues[i];
        counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
}

function countByLabelTriple(aValues, bValues, cValues, bCount, cCount, mask = null) {
    const counts = new Map();
    for (let i = 0; i < aValues.length; i++) {
        if (mask && !mask[i]) continue;
        const key = (aValues[i] * bCount + bValues[i]) * cCount + cValues[i];
        counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
}

/*
    cellFilter is the optional filter from buildCellFilter. it does two separate things
    here, and the difference is the whole design:

      - its mask drops filtered-out cells from the counts.
      - its allow table for an axis key drops that axis's excluded LABELS entirely. those
        rows are empty by construction, not by observation: stratifying by disease while
        filtered to healthy can only ever draw an empty bar for every other disease, and
        the user already said they did not want them.

    a label that survives the filter but happens to have no cells still gets its row, with
    a count of 0. "no cells here" is a finding, and dropping it would also let the axis
    reorder as filters move, so bars would change position instead of height.
*/
export function calcCellCounts(fields, labelColors, primaryKey, subsetKey, cellFilter = null){
    llog('calcCellCounts', {fields, labelColors, primaryKey, subsetKey})
    const keys = fields.metadata_labels;
    const values = fields.metadata;

    const mask = cellFilter ? cellFilter.mask : null;
    const primaryAllow = allowTableFor(cellFilter, primaryKey);
    const subsetAllow = allowTableFor(cellFilter, subsetKey);

    const primaryLabels = keys[primaryKey];
    const primaryValues = values[primaryKey];

    const result = [];

    if (!subsetKey) {
        // calculate counts by primary key only
        const counts = countByLabel(primaryValues, primaryLabels.length, mask);

        primaryLabels.forEach((label, index) => {
            if (isMissingMetadataValue(label)) return;
            if (primaryAllow && !primaryAllow[index]) return;
            result.push({
                [primaryKey]: label,
                count: counts[index],
                color: labelColors[primaryKey][label]
            });
        });
    } else {
        // calculate counts grouped by primary key and subset key
        const subsetValues = values[subsetKey];
        const subsetLabels = keys[subsetKey];
        const subsetCount = subsetLabels.length;
        const counts = countByLabelPair(primaryValues, subsetValues, subsetCount, mask);

        primaryLabels.forEach((primaryLabel, primaryIndex) => {
            if (isMissingMetadataValue(primaryLabel)) return;
            if (primaryAllow && !primaryAllow[primaryIndex]) return;

            subsetLabels.forEach((subsetLabel, subsetIndex) => {
                if (isMissingMetadataValue(subsetLabel)) return;
                if (subsetAllow && !subsetAllow[subsetIndex]) return;
                result.push({
                    [primaryKey]: primaryLabel,
                    [subsetKey]: subsetLabel,
                    count: counts.get(primaryIndex * subsetCount + subsetIndex) || 0,
                    color: labelColors[subsetKey][subsetLabel]
                })
            });
        });
    }

    return sortGroupedResults(fields, result, [primaryKey, subsetKey].filter(Boolean));
}

export function calcCellCounts2(fields, labelColors, primaryKey, subsetKey, facetKey, cellFilter = null){
    llog('calcCellCounts2', {fields, labelColors, primaryKey, subsetKey, facetKey})
    const keys = fields.metadata_labels;
    const values = fields.metadata;

    const mask = cellFilter ? cellFilter.mask : null;
    const primaryAllow = allowTableFor(cellFilter, primaryKey);
    const subsetAllow = allowTableFor(cellFilter, subsetKey);
    const facetAllow = allowTableFor(cellFilter, facetKey);

    const primaryLabels = keys[primaryKey];
    const primaryValues = values[primaryKey];

    const result = [];

    if (!facetKey && !subsetKey) {
        // calculate counts by primary key only
        const counts = countByLabel(primaryValues, primaryLabels.length, mask);

        primaryLabels.forEach((label, index) => {
            if (isMissingMetadataValue(label)) return;
            if (primaryAllow && !primaryAllow[index]) return;
            result.push({
                [primaryKey]: label,
                count: counts[index],
                color: labelColors[primaryKey][label]
            });
        });
    } else if(!facetKey){
        // calculate counts grouped by primary key and subset key
        const subsetValues = values[subsetKey];
        const subsetLabels = keys[subsetKey];
        const subsetCount = subsetLabels.length;
        const counts = countByLabelPair(primaryValues, subsetValues, subsetCount, mask);

        primaryLabels.forEach((primaryLabel, primaryIndex) => {
            if (isMissingMetadataValue(primaryLabel)) return;
            if (primaryAllow && !primaryAllow[primaryIndex]) return;

            subsetLabels.forEach((subsetLabel, subsetIndex) => {
                if (isMissingMetadataValue(subsetLabel)) return;
                if (subsetAllow && !subsetAllow[subsetIndex]) return;
                result.push({
                    [primaryKey]: primaryLabel,
                    [subsetKey]: subsetLabel,
                    count: counts.get(primaryIndex * subsetCount + subsetIndex) || 0,
                    color: labelColors[subsetKey][subsetLabel]
                })
            });
        });
    }else{
        // calculate counts grouped by primary key, subset key, and facet key
        const subsetValues = values[subsetKey];
        const subsetLabels = keys[subsetKey];
        const subsetCount = subsetLabels.length;

        const facetValues = values[facetKey];
        const facetLabels = keys[facetKey];
        const facetCount = facetLabels.length;

        //keyed primary -> facet -> subset, matching the emit order below
        const counts = countByLabelTriple(primaryValues, facetValues, subsetValues, facetCount, subsetCount, mask);

        primaryLabels.forEach((primaryLabel, primaryIndex) => {
            if (isMissingMetadataValue(primaryLabel)) return;
            if (primaryAllow && !primaryAllow[primaryIndex]) return;

            facetLabels.forEach((facetLabel, facetIndex) => {
                if (isMissingMetadataValue(facetLabel)) return;
                if (facetAllow && !facetAllow[facetIndex]) return;

                subsetLabels.forEach((subsetLabel, subsetIndex) => {
                    if (isMissingMetadataValue(subsetLabel)) return;
                    if (subsetAllow && !subsetAllow[subsetIndex]) return;
                    result.push({
                        [primaryKey]: primaryLabel,
                        [subsetKey]: subsetLabel,
                        [facetKey]: facetLabel,
                        count: counts.get((primaryIndex * facetCount + facetIndex) * subsetCount + subsetIndex) || 0,
                        color: labelColors[subsetKey][subsetLabel]
                    });
                });
            });
        });
    }

    return sortGroupedResults(fields, result, [primaryKey, facetKey, subsetKey].filter(Boolean));
}

/**
 * computeProportions - pooled proportions normalized within group(s)
 * @param {Object} metadata - key: annotation name, value: array of numeric indices
 * @param {Object} metadataLabels - key: annotation name, value: array of string labels
 * @param {Array} groupBy - 1-3 keys to group proportions by, in order: x, stack, facet
 * @param {Boolean} debug - optional flag to log intermediate keys
 * @returns {Object} - { data: Array of results, roles: { x, stack, facet } }
 */
export function computeCellProportions(metadata, metadataLabels, groupBy = [], debug = false) {
    if (groupBy.length < 1 || groupBy.length > 3) {
      throw new Error("You must group by 1 to 3 metadata keys.");
    }
  
    const [xKey, stackKey, facetKey] = groupBy;
    const roles = {
      x: xKey || null,
      stack: stackKey || null,
      facet: facetKey || null,
    };
  
    const numCells = metadata[groupBy[0]].length;
    const counts = {};
    const totals = {};
  
    for (let i = 0; i < numCells; i++) {
      const labelParts = groupBy.map(k => metadataLabels[k][metadata[k][i]]);
      const compositeKey = labelParts.join("|||");
  
      // Group key determines the denominator group: everything that shares x + facet
      const denominatorKey = groupBy.length === 1
        ? "ALL"
        : [xKey, facetKey]
            .filter(Boolean)
            .map(k => metadataLabels[k][metadata[k][i]])
            .join("|||");
  
      counts[compositeKey] = (counts[compositeKey] || 0) + 1;
      totals[denominatorKey] = (totals[denominatorKey] || 0) + 1;
  
      if (debug) {
        console.log("compositeKey:", compositeKey, "groupKey:", denominatorKey);
      }
    }
  
    const data = Object.entries(counts).map(([compositeKey, count]) => {
      const parts = compositeKey.split("|||");
      const row = {};
      groupBy.forEach((k, i) => row[k] = parts[i]);
  
      const denominatorKey = groupBy.length === 1
        ? "ALL"
        : [xKey, facetKey]
            .filter(Boolean)
            .map(k => row[k])
            .join("|||");
  
      row.Count = count;
      row.GroupTotal = totals[denominatorKey];
      row.Proportion = count / row.GroupTotal;
  
      return row;
    });
  
    return { data, roles };
  }
  

function computePerSampleProportions(metadata, metadataLabels, groupBy, sampleKey, conditionKey = null) {
    const numCells = metadata[groupBy[0]].length;
    const resultMap = {}, totalMap = {};
  
    for (let i = 0; i < numCells; i++) {
      const sample = metadataLabels[sampleKey][metadata[sampleKey][i]];
      const groupVals = groupBy.map(k => metadataLabels[k][metadata[k][i]]);
      const condition = conditionKey ? metadataLabels[conditionKey][metadata[conditionKey][i]] : null;
  
      const compositeKey = [sample, ...groupVals, condition].filter(Boolean).join("|||");
      const totalKey = [sample, condition].filter(Boolean).join("|||");
  
      resultMap[compositeKey] = (resultMap[compositeKey] || 0) + 1;
      totalMap[totalKey] = (totalMap[totalKey] || 0) + 1;
    }
  
    return Object.entries(resultMap).map(([key, count]) => {
      const parts = key.split("|||");
      const sample = parts[0];
      const groupValues = parts.slice(1, 1 + groupBy.length);
      const condition = parts.length > groupBy.length + 1 ? parts[parts.length - 1] : null;
      const totalKey = [sample, condition].filter(Boolean).join("|||");
  
      const row = { [sampleKey]: sample, Count: count, Total: totalMap[totalKey], Proportion: count / totalMap[totalKey] };
      groupBy.forEach((k, i) => row[k] = groupValues[i]);
      if (conditionKey) row[conditionKey] = condition;
      return row;
    });
  }
  

export function computeCellStats(metadata, metadataLabels, groupBy, sampleKey, conditionKey = null) {
    const sampleData = computePerSampleProportions(metadata, metadataLabels, groupBy, sampleKey, conditionKey);
    const groupMap = {};
  
    for (const row of sampleData) {
      const keyParts = groupBy.map(k => row[k]);
      if (conditionKey) keyParts.push(row[conditionKey]);
      const groupKey = keyParts.join("|||");
  
      if (!groupMap[groupKey]) {
        groupMap[groupKey] = { exprValues: [], rawPoints: [] };
        groupBy.forEach((k, i) => groupMap[groupKey][k] = keyParts[i]);
        if (conditionKey) groupMap[groupKey][conditionKey] = keyParts[keyParts.length - 1];
      }
  
      groupMap[groupKey].exprValues.push(row.Proportion);
      groupMap[groupKey].rawPoints.push({ sample: row[sampleKey], proportion: row.Proportion, count: row.Count, total: row.Total });
    }
  
    const q = (arr, p) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const pos = (sorted.length - 1) * p;
      const base = Math.floor(pos);
      const rest = pos - base;
      return rest && sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
    };
  
    const result = Object.entries(groupMap).map(([_, g]) => {
      const sorted = g.exprValues.slice().sort((a, b) => a - b);
      return {
        ...g,
        min: sorted[0],
        q1: q(sorted, 0.25),
        median: q(sorted, 0.5),
        q3: q(sorted, 0.75),
        max: sorted[sorted.length - 1]
      };
    });

    return result.sort((a, b) => {
        const outerCompare = String(a[groupBy[0]]).localeCompare(String(b[groupBy[0]]));
        if (outerCompare !== 0) return outerCompare;
        if (conditionKey) {
            return String(a[conditionKey] || '').localeCompare(String(b[conditionKey] || ''));
        }
        return 0;
    });
}

export function parseCellCountScatterData(
  metadata,
  metadataLabels,
  groupKey,      // e.g. "cell_type"
  contKey,       // e.g. "custom__organism_age"
  aggregateKey,  // e.g. "donor_id"
  mask = null    // optional cell filter
) {
  const groupIndices = metadata[groupKey];
  const contIndices = metadata[contKey];
  const aggIndices = metadata[aggregateKey];

  const groupLabels = metadataLabels[groupKey];
  const contLabels = metadataLabels[contKey];
  const aggLabels = metadataLabels[aggregateKey];

  // Step 1: Count cells per (groupKey, aggregateKey), and store age
  const counts = {}; // { "B cell|TP01": { cell_count, age } }
  const totalPerAggregate = {};

  for (let i = 0; i < groupIndices.length; i++) {
    if (mask && !mask[i]) continue;
    const group = groupLabels[groupIndices[i]] ?? "unknown";
    const donor = aggLabels[aggIndices[i]];
    let age = contLabels[contIndices[i]];

    if (
      isMissingMetadataValue(group) ||
      isMissingMetadataValue(donor) ||
      donor === null || donor === undefined ||
      age === null || age === undefined || isNaN(Number(age))
    ) continue;

    age = Number(age);

    // Count total cells per donor
    if (!totalPerAggregate[donor]) totalPerAggregate[donor] = 0;
    totalPerAggregate[donor] += 1;

    const key = `${group}|${donor}`;
    if (!counts[key]) {
      counts[key] = {
        [groupKey]: group,
        [aggregateKey]: donor,
        [contKey]: age,
        cell_count: 0,
      };
    }

    counts[key].cell_count += 1;
  }

  for (const key in counts) {
      const entry = counts[key];
      const donor = entry[aggregateKey];
      const total = totalPerAggregate[donor];
      entry.cell_proportion = entry.cell_count / total;
    }

  // Step 2: Group by groupKey for faceted output
  const groupedByGroupKey = {};

  for (const entry of Object.values(counts)) {
    const group = entry[groupKey];
    if (!groupedByGroupKey[group]) groupedByGroupKey[group] = [];
    groupedByGroupKey[group].push(entry);
  }

  // Step 3: Convert to { groupKey, data } format
  return Object.entries(groupedByGroupKey).map(([group, data]) => ({
    groupKey: group,
    data
  }));
}

export function preprocessBoxPlotData(metadata, metadataLabels, groupKey, contKey) {
  const groupIndices = metadata[groupKey];
  const contIndices = metadata[contKey];
  const groupLabels = metadataLabels[groupKey];
  const contLabels = metadataLabels[contKey];

  // 1. Flatten data
  const records = [];
  for (let i = 0; i < groupIndices.length; i++) {
    const group = groupLabels[groupIndices[i]] ?? "unknown";
     //let cont = contValues[i];
     let cont = contLabels[contIndices[i]] ?? null;

        if (isMissingMetadataValue(group)) {
            continue;
        }

        if (typeof cont === "string") cont = cont.trim().toLowerCase();

        if (
            cont === null || cont === undefined ||
            cont === "na" || cont === "n/a" || cont === "" ||
            isNaN(Number(cont))
        ) {
            continue;
        }

        cont = Number(cont); // Now safe

        records.push({ [groupKey]: group, [contKey]: cont });
  }

  // 2. Manual groupBy
  const groupBy = (array, keyFn) => {
    const map = {};
    array.forEach(item => {
      const key = keyFn(item);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  };

  const grouped = groupBy(records, d => d[groupKey]);

  // 3. Compute boxplot stats per group
  const summary = Object.entries(grouped).map(([group, rows]) => {
    const conts = rows.map(r => r[contKey]);
    return {
      [groupKey]: group,
      ...calculateBoxPlotStats(conts),
    };
  });

  return summary;
}

function calculateBoxPlotStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = d3.quantile(sorted, 0.25);
  const median = d3.quantile(sorted, 0.5);
  const q3 = d3.quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerWhisker = d3.max([d3.min(sorted), q1 - 1.5 * iqr]);
  const upperWhisker = d3.min([d3.max(sorted), q3 + 1.5 * iqr]);

  // Optional: identify outliers
  const outliers = sorted.filter(d => d < lowerWhisker || d > upperWhisker);

  return {
    min: sorted[0] || 0,
    q1,
    median,
    q3,
    max: sorted[sorted.length-1] || 0,
    outliers,
    exprValues: sorted,
  };
}

export function parseFacetedScatterData(
  metadata,
  metadataLabels,
  groupKey,
  contKey,
  expression,
  expressionKey,
  aggregateKey = null,
  mask = null
) {
  const exprValues = expression;
  const contIndices = metadata[contKey];
  const contLabels = metadataLabels[contKey];
  const groupIndices = metadata[groupKey];
  const groupLabels = metadataLabels[groupKey];

  const aggregateIndices = aggregateKey ? metadata[aggregateKey] : null;
  const aggregateLabels = aggregateKey ? metadataLabels[aggregateKey] : null;

  const records = [];

  for (let i = 0; i < exprValues.length; i++) {
    if (mask && !mask[i]) continue;
    const expr = exprValues[i];
    const cont = contLabels[contIndices[i]];
    const group = groupLabels[groupIndices[i]];
    const aggregate = aggregateKey ? aggregateLabels[aggregateIndices[i]] : null;

    if (
      isMissingMetadataValue(group) ||
      (aggregateKey && isMissingMetadataValue(aggregate)) ||
      expr === null || expr === undefined || isNaN(expr) ||
      cont === null || cont === undefined || isNaN(cont)
    ) {
      continue;
    }

    records.push({
      [groupKey]: group,
      [contKey]: Number(cont),
      [expressionKey]: Number(expr),
      ...(aggregateKey ? { [aggregateKey]: aggregate } : {})
    });
  }

  // Group by groupKey and optionally aggregateKey
  const grouped = {};
  for (const r of records) {
    const group = r[groupKey];
    const aggregate = aggregateKey ? r[aggregateKey] : null;
    const subKey = aggregateKey ? `${group}|${aggregate}` : group;

    if (!grouped[subKey]) grouped[subKey] = { group, aggregate, values: [] };
    grouped[subKey].values.push({ [contKey]: r[contKey], [expressionKey]: r[expressionKey] });
  }

  // Aggregate within each (group, aggregateKey)
  const groupedByGroupKey = {};

  for (const [compositeKey, { group, aggregate, values }] of Object.entries(grouped)) {
    const avgCont = values.reduce((sum, v) => sum + v[contKey], 0) / values.length;
    const avgExpr = values.reduce((sum, v) => sum + v[expressionKey], 0) / values.length;

    if (!groupedByGroupKey[group]) groupedByGroupKey[group] = [];

    groupedByGroupKey[group].push({
      ...(aggregateKey ? { [aggregateKey]: aggregate } : {}),
      [contKey]: avgCont,
      [expressionKey]: avgExpr
    });
  }

  // Output in faceted format
  return Object.entries(groupedByGroupKey).map(([group, data]) => ({
    groupKey: group,
    data
  }));
}



export function parseFacetedScatterDataA(metadata, metadataLabels, groupKey, contKey, expression, expressionKey) {
  const exprValues = expression;
  const contIndices = metadata[contKey];
  const contLabels = metadataLabels[contKey];
  const groupIndices = metadata[groupKey];
  const groupLabels = metadataLabels[groupKey];

  const records = [];

  for (let i = 0; i < exprValues.length; i++) {
    let cont = contLabels[contIndices[i]];
    const expr = exprValues[i];
    const group = groupLabels[groupIndices[i]];

    if (
      isMissingMetadataValue(group) ||
      expr === null || expr === undefined || isNaN(expr) ||
      cont === null || cont === undefined || isNaN(cont)
    ) {
      continue;
    }

    records.push({
      [groupKey]: group,
      [contKey]: Number(cont),
      [expressionKey]: Number(expr)
    });
  }

  // Group by cell_type
  const grouped = {};
  for (const r of records) {
    if (!grouped[r[groupKey]]) grouped[r[groupKey]] = [];
    grouped[r[groupKey]].push({ [contKey]: r[contKey], [expressionKey]: r[expressionKey] });
  }

  //console.log(records, grouped);

  // Output in faceted format
  return Object.entries(grouped).map(([group, data]) => ({
    groupKey: group,
    data
  }));
}

  
  

/*
    groups values by whatever key groupKeyForCell returns for each cell, in two passes:
    one to size every bucket, one to fill it. returning -1 drops the cell.
    exact-sized buckets mean no array growth and no temporary index arrays.
*/
function bucketByGroup(values, cellCount, groupKeyForCell) {
    const sizes = new Map();
    for (let i = 0; i < cellCount; i++) {
        const key = groupKeyForCell(i);
        if (key < 0) continue;
        sizes.set(key, (sizes.get(key) || 0) + 1);
    }

    const buckets = new Map();
    const offsets = new Map();
    sizes.forEach((size, key) => {
        buckets.set(key, new Array(size));
        offsets.set(key, 0);
    });

    for (let i = 0; i < cellCount; i++) {
        const key = groupKeyForCell(i);
        if (key < 0) continue;
        const offset = offsets.get(key);
        buckets.get(key)[offset] = values[i];
        offsets.set(key, offset + 1);
    }

    return buckets;
}

//cellFilter as in calcCellCounts: the mask drops cells, and an axis key's allow table
//drops that axis's excluded labels, which are empty by construction
export function calcExpressionStats(fields, labelColors, expression, gene, primaryKey, subsetKey, partial=false, cellFilter=null) {
    //const expression = this.expressionData[gene];
    const keys = fields.metadata_labels;
    const values = fields.metadata;

    const mask = cellFilter ? cellFilter.mask : null;
    const primaryAllow = allowTableFor(cellFilter, primaryKey);
    const subsetAllow = allowTableFor(cellFilter, subsetKey);

    const primaryLabels = keys[primaryKey];
    const primaryValues = values[primaryKey];

    const result = [];

    /*
        expression values are bucketed by group in two passes over the cells: one to size
        each bucket, one to fill it. previously each label re-scanned every cell, and with
        a subset key each primary label's index array was re-filtered once per subset
        label - so a 2M cell dataset stratified by 191 samples allocated roughly
        cells x samples worth of temporary arrays before any stats were computed.
        total allocation here is now bounded by the number of cells.

        a cell filter needs no change to bucketByGroup: returning -1 is already how a cell
        is dropped, so the mask just joins the conditions the key function already tests.
    */
    if (!subsetKey) {
        // calculate stats grouped by primary key only
        const include = primaryLabels.map(label => !isMissingMetadataValue(label));
        const buckets = bucketByGroup(expression, primaryValues.length, i => {
            if (mask && !mask[i]) return -1;
            return include[primaryValues[i]] ? primaryValues[i] : -1;
        });

        primaryLabels.forEach((label, index) => {
            if (!include[index]) return;
            if (primaryAllow && !primaryAllow[index]) return;
            result.push({
                gene: gene,
                [primaryKey]: label,
                color: labelColors[primaryKey][label],
                ...calculateExpressionStats(buckets.get(index) || [], partial)
            });
        });
    } else {
        // calculate stats grouped by primary key and subset key
        const subsetValues = values[subsetKey];
        const subsetLabels = keys[subsetKey];
        const subsetCount = subsetLabels.length;
        const includePrimary = primaryLabels.map(label => !isMissingMetadataValue(label));
        const includeSubset = subsetLabels.map(label => !isMissingMetadataValue(label));

        const buckets = bucketByGroup(expression, primaryValues.length, i => {
            if (mask && !mask[i]) return -1;
            const primaryIndex = primaryValues[i];
            const subsetIndex = subsetValues[i];
            if (!includePrimary[primaryIndex] || !includeSubset[subsetIndex]) return -1;
            return primaryIndex * subsetCount + subsetIndex;
        });

        primaryLabels.forEach((primaryLabel, primaryIndex) => {
            if (!includePrimary[primaryIndex]) return;
            if (primaryAllow && !primaryAllow[primaryIndex]) return;

            subsetLabels.forEach((subsetLabel, subsetIndex) => {
                if (!includeSubset[subsetIndex]) return;
                if (subsetAllow && !subsetAllow[subsetIndex]) return;
                result.push({
                    gene: gene,
                    [primaryKey]: primaryLabel,
                    [subsetKey]: subsetLabel,
                    color: labelColors[subsetKey][subsetLabel],
                    ...calculateExpressionStats(buckets.get(primaryIndex * subsetCount + subsetIndex) || [])
                })
            });
        });
    }

    return sortGroupedResults(fields, result, [primaryKey, subsetKey].filter(Boolean));
}

/*
    every grouped result goes out through here, so this is also where they get frozen.

    these arrays land on reactive component state, and Vue's reactive getter calls
    dependArray() on any array value - which walks the entire array on every read during
    a render. with one entry per group, each carrying an exprValues array of every value
    in that group, and the template reading them once per stratify value, that walking
    measured 5.2s of a 11.95s stratified render. a frozen array is never observed, so the
    entries never get an __ob__ and dependArray never runs on them.

    freezing is shallow, so the entry objects and their exprValues arrays stay mutable -
    only in-place changes to the array itself (sort/push/splice) are blocked, and nothing
    downstream does that.
*/
function sortGroupedResults(fields, rows, keys) {
    if (!rows) return rows;
    if (rows.length === 0) return Object.freeze(rows);

    const sortedLabels = fields.metadata_labels_sorted || {};
    const orderMaps = {};

    keys.forEach(key => {
        const orderedValues = sortedLabels[key] || fields.metadata_labels[key];
        if (orderedValues) {
            orderMaps[key] = new Map(orderedValues.map((value, index) => [value, index]));
        }
    });

    return Object.freeze([...rows].sort((a, b) => {
        for (const key of keys) {
            const orderMap = orderMaps[key];
            if (!orderMap) continue;

            const aIndex = orderMap.get(a[key]);
            const bIndex = orderMap.get(b[key]);

            if (aIndex !== bIndex) {
                return (aIndex ?? Number.MAX_SAFE_INTEGER) - (bIndex ?? Number.MAX_SAFE_INTEGER);
            }
        }
        return 0;
    }));
}


function calculateExpressionStats(exprValues, partial=false) {
    const sortedValues = exprValues.sort(d3.ascending);

    const mean = d3.mean(sortedValues) || 0;
    const median = d3.quantile(sortedValues, 0.5) || 0;
    const pctExpr = (sortedValues.filter(v => v > 0).length / sortedValues.length) * 100 || 0;
    const q1 = d3.quantile(sortedValues, 0.25) || 0;
    const q3 = d3.quantile(sortedValues, 0.75) || 0;

    if(!partial){
        return {
            exprValues: sortedValues,
            interQuantileRange: q3 - q1,
            min: sortedValues[0] || 0,
            max: sortedValues[sortedValues.length-1] || 0,
            mean,
            median,
            pctExpr,
            q1,
            q3
        }
    }else{
        return {
            mean,
            pctExpr
        }
    }
}

export function groupByKey(arr, key){
    return arr.reduce((acc, item) => {
        if(!acc[item[key]]) acc[item[key]] = [];
        acc[item[key]].push(item);
        return acc;
    }, {});
}
  
  

export function inferDataType(values) {
    const maxSampleSize = 5000;
    const sampleValues = sampleArray(values, maxSampleSize);
    const cleaned = sampleValues.filter(v => !isMissingMetadataValue(v));

    if (cleaned.length === 0) return 'cat';

    const unique = [...new Set(cleaned)];
    const uniqueCount = unique.length;

    const isNumeric = v => {
        const n = Number(v);
        return Number.isFinite(n);
    };

    const isBinnedCategory = v => {
        if (typeof v !== 'string') return false;
        return /^(\d+)\s*[-–]\s*(\d+)$/.test(v) || /^\d+\s*\+$/.test(v) || /under|over|less|more|to/i.test(v);
    };

    const isMixedAlphaNumeric = v => typeof v === 'string' && /[a-zA-Z]/.test(v) && /\d/.test(v);
    const hasLeadingZeroCode = v => typeof v === 'string' && /^0\d+$/.test(v.trim());

    // These patterns are much more likely to be labels/codes than true continuous values.
    if (cleaned.some(isBinnedCategory) || cleaned.some(isMixedAlphaNumeric) || cleaned.some(hasLeadingZeroCode)) {
        return 'cat';
    }

    const allNumbers = cleaned.every(isNumeric);
    if (!allNumbers) {
        return 'cat';
    }

    const numericValues = unique.map(v => Number(v)).sort((a, b) => a - b);
    const allIntegers = numericValues.every(Number.isInteger);
    const min = numericValues[0];
    const max = numericValues[numericValues.length - 1];
    const span = max - min;

    // Integer-coded labels are a common source of false positives.
    if (allIntegers) {
        if (uniqueCount <= 12) return 'cat';
        if (span <= 12) return 'cat';

        const isDenseIntegerSequence = span > 0 && (uniqueCount / (span + 1)) >= 0.8;
        if (uniqueCount <= 24 && isDenseIntegerSequence) return 'cat';
    }

    const hasDecimalValues = numericValues.some(v => !Number.isInteger(v));
    if (hasDecimalValues) {
        return uniqueCount >= 5 ? 'cont' : 'cat';
    }

    // Larger numeric label sets are more likely to be true continuous metadata.
    return uniqueCount >= 15 ? 'cont' : 'cat';
}

function sampleArray(values, maxSampleSize = 5000) {
    if (!Array.isArray(values) || values.length <= maxSampleSize) {
        return Array.isArray(values) ? values : [];
    }

    const sampled = [];
    const step = values.length / maxSampleSize;

    for (let i = 0; i < maxSampleSize; i++) {
        const index = Math.min(values.length - 1, Math.floor(i * step));
        sampled.push(values[index]);
    }

    return sampled;
}
  
  
  
   
