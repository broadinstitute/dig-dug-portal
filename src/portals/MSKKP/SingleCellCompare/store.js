import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import defaultPalette from "@/utils/colors";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import {
    fetchMetadata,
    fetchFields,
    fetchCoordinates,
    fetchGeneExpression,
    fetchMarkers,
    calcLabelColors,
    calcExpressionStats,
} from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js";

Vue.use(Vuex);

/*
    This view replaces the mskkp_mockup static-JSON demo (public/data/**\/*.json,
    built offline by build_static_api.py from a local `singlecell_ingest_10/processed`
    checkout) with the real single-cell BioIndex API that the rest of dig-dug-portal
    already uses in production for single-cell data - see
    src/components/researchPortal/singleCellBrowser/ResearchSingleCellBrowser.vue and
    the `getSingleCellDatasets` action in src/views/Tissue/store.js, which this module
    follows closely.

    VERIFIED DIRECTLY AGAINST THE LIVE SERVERS (2026-09-23, via browser fetch - not
    guessed):
      - Dataset identity field is `datasetId`. Metadata rows also carry a `portals`
        array (e.g. ["a2f","md","msk"]); "msk" is the real, authoritative signal for
        "this dataset belongs to the musculoskeletal portal" - confirmed on
        FNIH_Bone_scRNA_v1.0, FNIH_BoneMarrow_scRNA_v1, FNIH_Muscle_scRNA_v2.2,
        FNIH_Tendon_scRNA_v1, FNIH_TendonLigament_scRNA_v2. The mskkp_mockup's dataset
        ids (scRNA_Su2022_Human_SubchondralBone_OA etc.) do NOT exist on any live
        BioIndex host that was checked; they were an offline demo's own naming and are
        not used here anymore.
      - `data_type === "single_cell"` correctly identifies single-cell rows.
      - The per-cell grouping field is `cell_type__kp` (a KP-normalized field,
        confirmed present on every dataset checked), NOT plain `cell_type` - the
        earlier version of this file guessed wrong here. `cell_type` is kept as a
        fallback in case a future dataset only has that key.
      - As of this check, production `bioindex.hugeamp.org` has exactly ONE
        "msk"-portal dataset (FNIH_Muscle_scRNA_v2.2) out of 25 single-cell datasets
        total (the rest are FNIH organ atlases: artery, heart, kidney, liver,
        pancreas, hypothalamus, SAT/VAT). The fuller MSK set (bone, bone marrow,
        tendon/ligament, more muscle versions) currently only exists on the dev
        BioIndex (`bioindex-dev.hugeamp.org`, i.e. run with `BIOINDEX_DEV=1` per
        AGENTS.md) - so a useful side-by-side comparison needs a dev build until more
        MSK datasets are promoted to production. `usingMskDatasets` below reflects
        whether any "msk"-portal datasets were found at all on whichever host this was
        built against.
*/

const SC_ENDPOINTS = {
    metadata: `${BIO_INDEX_HOST}/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz`,
    fields: `${BIO_INDEX_HOST}/api/raw/file/single_cell/$datasetId/fields.json.gz`,
    coordinates: `${BIO_INDEX_HOST}/api/raw/file/single_cell/$datasetId/coordinates.tsv.gz`,
    expression: `${BIO_INDEX_HOST}/api/bio/query/single-cell-lognorm?q=$datasetId,$gene`,
    // Verified live (2026-09-23) on FNIH_Artery_scRNA_v2.2 (prod, 245 rows / 35 genes),
    // FNIH_Bone_scRNA_v1.0 and FNIH_BoneMarrow_scRNA_v1 (dev, 44 / 72 genes): an array
    // of {gene, cell_type, log_fold_change, mean_expression_raw, pct_cells_expression,
    // p_value, ...} rows, one per marker gene per cell type. This is the real, live,
    // per-dataset "available genes" list the gene selector auto-loads - see
    // MAX_GENE_PANEL_SIZE / refreshGenePanel.
    markers: `${BIO_INDEX_HOST}/api/raw/file/single_cell/$datasetId/marker_genes.json.gz`,
};

// Upper bound on how many genes the auto-loaded gene panel keeps (across both
// datasets combined), so switching cell types in the "Cell-Type Comparison" scatter
// doesn't fan out into hundreds of expression queries. Genes are ranked by
// |log fold change| first, so the most dataset-defining markers survive the cap.
const MAX_GENE_PANEL_SIZE = 60;
// Keep cached per-cell vectors bounded on large single-cell datasets.
const GENE_ROWS_CACHE_BYTES = 100 * 1024 * 1024;

// When both are present among the discovered "msk"-portal datasets, default the two
// pickers to this pair (bone vs. its marrow) since it's the most on-topic comparison.
// Purely a nicer default - any other combination works fine, and this is skipped
// harmlessly if either id isn't found on whichever host this build points at.
const SOFT_DEFAULT_PAIR = ["FNIH_Bone_scRNA_v1.0", "FNIH_BoneMarrow_scRNA_v1"];

// Fallback only, used when neither selected dataset has a marker_genes.json.gz file
// to auto-load from (see refreshGenePanel). Under normal conditions the gene
// selector's datalist and the "Cell-Type Comparison" panel are populated live from
// each dataset's real marker genes instead of this static list. Typing any other
// gene symbol into the search box still issues a real fetchGeneExpression() query
// regardless of what's in the panel/datalist.
export const DEFAULT_GENE_PANEL = [
    "CXCL12", "LEPR", "PDGFRA", "VCAM1", "COL1A1", "COL2A1", "ACAN", "SOX9", "RUNX2", "SP7",
    "ALPL", "BGLAP", "IBSP", "SOST", "DMP1", "PECAM1", "VWF", "KDR", "LYZ", "S100A8",
    "S100A9", "MPO", "MS4A1", "CD79A", "CD3D", "NKG7", "HBB", "GYPA", "PPBP", "PF4",
];

// Broad-label color legend from the mockup, applied when a dataset's cell-type labels
// match these names. Any other label falls back to utils/colors.js, cycled.
const KNOWN_CELL_TYPE_COLORS = {
    b_cell: "#B07AA1",
    chondrocyte: "#59A14F",
    endothelial: "#76B7B2",
    erythroid_or_mk: "#9C755F",
    myeloid: "#E15759",
    osteoblast: "#4E79A7",
    osteocyte: "#A0CBE8",
    other: "#BAB0AC",
    stromal_mesenchymal: "#F28E2B",
    t_cell_or_nk: "#EDC948",
};

const MAX_OVERVIEW_POINTS = 4000;

function resolveDatasetId(d) {
    return d.datasetId || d.dataset_id || d.id || d.name || null;
}
function resolveDatasetLabel(d) {
    return d.display_name || d.dataset_name || d.short_label || d.datasetName || resolveDatasetId(d);
}
function resolveSpecies(d) {
    return d.species || d.organism || "";
}
function resolveOrgan(d) {
    return d.tissue_a2fkp || d.organ || d.tissue || "";
}
// The specific tissue/organ name for the "Select Tissue(s) to Compare" pickers.
// Prefers the concrete `organ` value ("bone", "artery") over the KP-normalized
// system label (`tissue_a2fkp`, e.g. "skeletal system"), since a tissue comparison
// wants the specific tissue, not its parent anatomical system.
function resolveTissue(d) {
    return d.organ || d.tissue_a2fkp || d.tissue || "";
}
function resolveCellCount(d) {
    return d.n_cells || d.cell_count || d.num_cells || null;
}

function primaryCellTypeKey(fields) {
    if (!fields || !fields.metadata_labels) return null;
    // cell_type__kp is the KP-normalized grouping field BioIndex actually ships
    // (confirmed on every FNIH single-cell dataset checked); plain "cell_type" is
    // kept only as a fallback for a hypothetical dataset that lacks it.
    if (fields.metadata_labels.cell_type__kp) return "cell_type__kp";
    if (fields.metadata_labels.cell_type) return "cell_type";
    const keys = Object.keys(fields.metadata_labels);
    return keys.length ? keys[0] : null;
}

function emptySummary() {
    return { n: 0, avg_expression: 0, pct_expressing: 0, median: 0 };
}

// Extracts a ranked, deduped gene list from a marker_genes.json.gz payload. Handles
// both the current array-of-records shape (verified live: {gene, log_fold_change,
// ...}) and the older { cellTypeLabel: [gene, ...] } shape some datasets may still
// carry (same fallback ResearchSingleCellBrowser.vue's initMarkers() uses).
function genesFromMarkers(markersRaw) {
    if (Array.isArray(markersRaw)) {
        const bestByGene = new Map();
        markersRaw.forEach((row) => {
            if (!row || !row.gene) return;
            const score = Math.abs(Number(row.log_fold_change) || 0);
            const existing = bestByGene.get(row.gene);
            if (!existing || score > existing) bestByGene.set(row.gene, score);
        });
        return [...bestByGene.entries()].sort((a, b) => b[1] - a[1]).map(([gene]) => gene);
    }
    if (markersRaw && typeof markersRaw === "object") {
        return [...new Set(Object.values(markersRaw).flat().filter(Boolean))];
    }
    return [];
}

// Chooses the initial left/right dataset pair from the full (msk-only) dataset list:
// the hand-picked bone/marrow pair if both are present, else the first two datasets.
// With only one dataset available it is paired with itself so both pickers still work.
function pickDefaultPair(datasets) {
    const byId = (id) => datasets.find((d) => d.id === id);
    const soft = SOFT_DEFAULT_PAIR.map(byId).filter(Boolean);
    if (soft.length === 2) return [soft[0].id, soft[1].id];

    if (datasets.length >= 2) return [datasets[0].id, datasets[1].id];
    return [datasets[0].id, datasets[0].id];
}

// Resolves the $datasetId / $gene placeholders in an SC_ENDPOINTS template, e.g.
// resolveUrl(SC_ENDPOINTS.expression, { datasetId: "foo", gene: "CXCL12" }).
function resolveUrl(template, replacements) {
    let url = template;
    Object.keys(replacements || {}).forEach((key) => {
        url = url.split(`$${key}`).join(replacements[key]);
    });
    return url;
}

// Dev-only visibility into every real network call this view makes, so it's obvious
// in the browser console which single-cell BioIndex endpoint is being hit and when.
function logFetch(kind, url) {
    // eslint-disable-next-line no-console
    console.log(`[SingleCellCompare] fetching ${kind}: ${url}`);
}

// Adapts calcExpressionStats() (the same aggregation the live single-cell browser
// uses) into the {cell_type, summary, values} shape the mockup's UI expects.
// Called both after a fresh fetch and on expression-cache hits (see ensureGeneRows),
// so it must stay cheap enough to run per cell-type switch.
function rowsFromExpressionStats(fields, labelColors, expression, gene, cellTypeKey, includeValues = true) {
    const stats = calcExpressionStats(fields, labelColors, expression, gene, cellTypeKey, null, !includeValues);
    return (stats || []).map((row) => ({
        cell_type: row[cellTypeKey],
        summary: {
            n: row.n || (row.exprValues ? row.exprValues.length : 0),
            avg_expression: row.mean || 0,
            pct_expressing: (row.pctExpr || 0) / 100,
            median: row.median || 0,
        },
        values: includeValues ? (row.exprValues || []) : [],
    }));
}

function downsampleCells(coords, fields, cellTypeKey, maxPoints) {
    const total = coords.count;
    if (!total) return [];
    const labels = cellTypeKey ? fields.metadata_labels[cellTypeKey] : null;
    const values = cellTypeKey ? fields.metadata[cellTypeKey] : null;
    const stride = Math.max(1, Math.floor(total / maxPoints));
    const cells = [];
    for (let i = 0; i < total; i += stride) {
        cells.push({
            x: coords.X[i],
            y: coords.Y[i],
            cell_type: labels && values ? labels[values[i]] : null,
        });
    }
    return cells;
}

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
    },
    state: {
        loading: true,
        metadataError: null,
        usingMskDatasets: false,
        datasetCount: 0,

        datasets: [],
        leftId: null,
        rightId: null,

        // "Select Tissue(s) to Compare" pickers. Each is a single tissue name, or the
        // sentinel "All tissues", which places no constraint on the dataset pickers below.
        // Defaulting to "All tissues" keeps the initial view identical to before these
        // pickers existed; choosing a specific tissue narrows the dataset options.
        tissues: [],
        leftTissue: "All tissues",
        rightTissue: "All tissues",

        cellTypes: [],
        cellTypeColors: {},

        genePanel: DEFAULT_GENE_PANEL,
        usingLiveGenePanel: false,
        selectedGene: DEFAULT_GENE_PANEL[0],
        selectedCellType: null,

        geneStatus: "Loading",
        cellTypeStatus: "Loading",
        overviewStatus: {},

        geneComparison: null,
        cellTypeComparison: null,
        overview: {},

        // datasetId -> { fields, labelColors, cellTypeKey }
        fieldsCache: {},
        // "datasetId:GENE" -> { fields, labelColors, cellTypeKey, expression } - the
        // raw per-cell expression vector plus everything rowsFromExpressionStats needs.
        // Caching the vector (not derived rows) lets includeValues:false callers - the
        // "Cell-Type Comparison" panel - hit it too, so cell-type switches never refetch.
        expressionCache: {},
        expressionCacheBytes: 0,
        expressionCacheOrder: [],
        geneComparisonRequest: 0,
        cellTypeComparisonRequest: 0,
        // datasetId -> ranked gene[] from marker_genes.json.gz, or null if unavailable
        markersCache: {},
    },
    mutations: {
        setLoading(state, value) {
            state.loading = value;
        },
    },
    actions: {
        async init(context) {
            const state = context.state;
            state.loading = true;
            let raw = null;
            try {
                logFetch("metadata", SC_ENDPOINTS.metadata);
                raw = await fetchMetadata(SC_ENDPOINTS.metadata);
            } catch (error) {
                raw = null;
            }
            if (!raw) {
                state.metadataError = `Could not reach the single-cell BioIndex metadata endpoint (${SC_ENDPOINTS.metadata}).`;
                state.loading = false;
                return;
            }

            const singleCell = raw.filter((d) => !d.data_type || d.data_type === "single_cell");
            const mskTagged = singleCell.filter((d) => Array.isArray(d.portals) && d.portals.includes("msk"));
            state.usingMskDatasets = mskTagged.length > 0;

            // Only single-cell datasets whose `portals` array includes "msk" are loaded.
            // This is the authoritative signal that a dataset belongs to the musculoskeletal
            // portal, so non-MSK datasets (FNIH organ atlases: artery, heart, kidney, etc.)
            // are excluded from the pickers entirely. If no msk-tagged datasets exist on
            // whichever host this build points at, the page shows its empty state.
            const datasets = mskTagged
                .map((d) => ({
                    id: resolveDatasetId(d),
                    label: resolveDatasetLabel(d),
                    species: resolveSpecies(d),
                    organ: resolveOrgan(d),
                    tissue: resolveTissue(d),
                    nCells: resolveCellCount(d),
                    isMsk: true,
                    raw: d,
                }))
                .filter((d) => !!d.id);

            state.datasetCount = datasets.length;
            state.datasets = datasets;
            // Distinct tissue names across every selectable dataset, in first-seen order.
            // This is what the "Select Tissue(s) to Compare" pickers offer - derived
            // live from the metadata rather than hardcoded, so it always matches what
            // the single-cell BioIndex actually has on whichever host this build points at.
            const tissueSet = new Set();
            datasets.forEach((d) => {
                if (d.tissue) tissueSet.add(d.tissue);
            });
            state.tissues = [...tissueSet].sort((a, b) => a.localeCompare(b));
            if (!datasets.length) {
                state.metadataError = "The single-cell BioIndex metadata endpoint returned no musculoskeletal (\"msk\") single-cell datasets.";
                state.loading = false;
                return;
            }

            const [defaultLeft, defaultRight] = pickDefaultPair(datasets);
            state.leftId = defaultLeft;
            state.rightId = defaultRight;

            state.loading = false;
            await context.dispatch("refreshAll");
        },

        async ensureFields(context, datasetId) {
            const state = context.state;
            if (!datasetId || state.fieldsCache[datasetId]) return state.fieldsCache[datasetId] || null;
            let fields = null;
            try {
                logFetch("fields", resolveUrl(SC_ENDPOINTS.fields, { datasetId }));
                fields = await fetchFields(SC_ENDPOINTS.fields, datasetId);
            } catch (error) {
                fields = null;
            }
            if (!fields) return null;

            const cellTypeKey = primaryCellTypeKey(fields);
            const labelColors = calcLabelColors(fields, defaultPalette);
            if (cellTypeKey && labelColors[cellTypeKey]) {
                Object.keys(KNOWN_CELL_TYPE_COLORS).forEach((label) => {
                    if (label in labelColors[cellTypeKey]) {
                        labelColors[cellTypeKey][label] = KNOWN_CELL_TYPE_COLORS[label];
                    }
                });
            }

            const entry = { fields, labelColors, cellTypeKey };
            Vue.set(state.fieldsCache, datasetId, entry);
            return entry;
        },

        async ensureGeneRows(context, { datasetId, gene, includeValues = true }) {
            const state = context.state;
            const cacheKey = `${datasetId}:${gene}`;

            // The expression vector is the expensive part (one BioIndex query per
            // dataset+gene), and it does not depend on includeValues - so cache the
            // RAW vector, then derive rows from it. This is what makes switching the
            // "Cell-Type Comparison" cell type a pure client-side filter: every gene's
            // per-cell values for both datasets are already in hand, and only the
            // local stats recompute. Without this, includeValues:false calls skipped
            // both the cache read and write below (both were gated on includeValues),
            // so each cell-type switch re-issued up to 60x2 identical expression
            // queries.
            if (cacheKey in state.expressionCache) {
                const entry = state.expressionCache[cacheKey];
                if (entry.expression) {
                    state.expressionCacheOrder = state.expressionCacheOrder.filter((key) => key !== cacheKey);
                    state.expressionCacheOrder.push(cacheKey);
                }
                return rowsFromExpressionStats(
                    entry.fields,
                    entry.labelColors,
                    entry.expression,
                    gene,
                    entry.cellTypeKey,
                    includeValues
                );
            }

            const fieldsEntry = await context.dispatch("ensureFields", datasetId);
            if (!fieldsEntry || !fieldsEntry.cellTypeKey) {
                return null;
            }

            let expression = null;
            try {
                logFetch("expression", resolveUrl(SC_ENDPOINTS.expression, { datasetId, gene }));
                expression = await fetchGeneExpression(SC_ENDPOINTS.expression, gene, datasetId);
            } catch (error) {
                expression = null;
            }

            // Another comparison may have cached this vector while our fetch was
            // pending. Reuse it through the cache-hit path so LRU bytes/order are
            // updated only once, preserving this caller's includeValues setting.
            if (cacheKey in state.expressionCache) {
                return context.dispatch("ensureGeneRows", { datasetId, gene, includeValues });
            }

            // A failed/empty fetch is not cached: the next call retries it.
            if (!expression) {
                return null;
            }

            const entry = { fields: fieldsEntry.fields, labelColors: fieldsEntry.labelColors, cellTypeKey: fieldsEntry.cellTypeKey, expression };
            const bytes = entry.expression.length * 8;
            while (state.expressionCacheOrder.length && state.expressionCacheBytes + bytes > GENE_ROWS_CACHE_BYTES) {
                const oldest = state.expressionCacheOrder.shift();
                const evicted = state.expressionCache[oldest];
                if (evicted) state.expressionCacheBytes -= evicted.expression.length * 8;
                Vue.delete(state.expressionCache, oldest);
            }
            // A single gene may exceed the budget; use it for this call but do not retain it.
            if (bytes <= GENE_ROWS_CACHE_BYTES) {
                Vue.set(state.expressionCache, cacheKey, entry);
                state.expressionCacheOrder.push(cacheKey);
                state.expressionCacheBytes += bytes;
            }

            return rowsFromExpressionStats(
                entry.fields,
                entry.labelColors,
                expression,
                gene,
                fieldsEntry.cellTypeKey,
                includeValues
            );
        },

        async ensureMarkerGenes(context, datasetId) {
            const state = context.state;
            if (!datasetId) return null;
            if (datasetId in state.markersCache) return state.markersCache[datasetId];

            let markersRaw = null;
            try {
                logFetch("markers", resolveUrl(SC_ENDPOINTS.markers, { datasetId }));
                markersRaw = await fetchMarkers(SC_ENDPOINTS.markers, datasetId);
            } catch (error) {
                markersRaw = null;
            }
            const genes = markersRaw ? genesFromMarkers(markersRaw) : null;
            Vue.set(state.markersCache, datasetId, genes && genes.length ? genes : null);
            return state.markersCache[datasetId];
        },

        // Auto-loads the gene selector's suggestion list (and the "Cell-Type
        // Comparison" gene panel) from whichever real marker genes the two selected
        // datasets actually have, instead of a fixed hardcoded list.
        async refreshGenePanel(context) {
            const state = context.state;
            const [leftGenes, rightGenes] = await Promise.all([
                context.dispatch("ensureMarkerGenes", state.leftId),
                context.dispatch("ensureMarkerGenes", state.rightId),
            ]);

            const merged = [];
            const seen = new Set();
            // interleave left/right rankings so both datasets are represented once
            // the MAX_GENE_PANEL_SIZE cap kicks in, rather than one side crowding
            // the other out.
            const maxLen = Math.max((leftGenes || []).length, (rightGenes || []).length);
            for (let i = 0; i < maxLen && merged.length < MAX_GENE_PANEL_SIZE; i++) {
                [leftGenes, rightGenes].forEach((list) => {
                    const gene = list && list[i];
                    if (gene && !seen.has(gene) && merged.length < MAX_GENE_PANEL_SIZE) {
                        seen.add(gene);
                        merged.push(gene);
                    }
                });
            }

            state.usingLiveGenePanel = merged.length > 0;
            state.genePanel = merged.length ? merged : DEFAULT_GENE_PANEL;
            if (!state.selectedGene || !state.genePanel.includes(state.selectedGene)) {
                state.selectedGene = state.genePanel[0] || null;
            }
        },

        async loadOverview(context, datasetId) {
            const state = context.state;
            if (!datasetId) return;
            Vue.set(state.overviewStatus, datasetId, "Loading");
            const fieldsEntry = await context.dispatch("ensureFields", datasetId);
            let coords = null;
            try {
                logFetch("coordinates", resolveUrl(SC_ENDPOINTS.coordinates, { datasetId }));
                coords = await fetchCoordinates(SC_ENDPOINTS.coordinates, datasetId);
            } catch (error) {
                coords = null;
            }
            if (!coords || !fieldsEntry) {
                Vue.set(state.overviewStatus, datasetId, "No coordinate/field data available for this dataset.");
                return;
            }
            const cells = downsampleCells(coords, fieldsEntry.fields, fieldsEntry.cellTypeKey, MAX_OVERVIEW_POINTS);
            Vue.set(state.overview, datasetId, { nCellsTotal: coords.count, cells });
            Vue.set(state.overviewStatus, datasetId, "");
        },

        async refreshCellTypes(context) {
            const state = context.state;
            const [leftEntry, rightEntry] = await Promise.all([
                context.dispatch("ensureFields", state.leftId),
                context.dispatch("ensureFields", state.rightId),
            ]);

            const labelSet = new Set();
            [leftEntry, rightEntry].forEach((entry) => {
                if (!entry || !entry.cellTypeKey) return;
                (entry.fields.metadata_labels[entry.cellTypeKey] || []).forEach((label) => labelSet.add(label));
            });

            const known = Object.keys(KNOWN_CELL_TYPE_COLORS).filter((label) => labelSet.has(label));
            const rest = [...labelSet].filter((label) => !known.includes(label)).sort();
            const cellTypes = [...known, ...rest];

            const colors = {};
            let paletteIndex = 0;
            cellTypes.forEach((label) => {
                if (KNOWN_CELL_TYPE_COLORS[label]) {
                    colors[label] = KNOWN_CELL_TYPE_COLORS[label];
                } else {
                    colors[label] = defaultPalette[paletteIndex % defaultPalette.length];
                    paletteIndex += 1;
                }
            });

            state.cellTypes = cellTypes;
            state.cellTypeColors = colors;
            if (!state.selectedCellType || !cellTypes.includes(state.selectedCellType)) {
                state.selectedCellType = cellTypes.includes("osteoblast") ? "osteoblast" : (cellTypes[0] || null);
            }
        },

        async loadGeneComparison(context, gene) {
            const state = context.state;
            const request = ++state.geneComparisonRequest;
            const [leftId, rightId] = [state.leftId, state.rightId];
            const targetGene = gene || state.selectedGene;
            if (!targetGene) return;
            state.selectedGene = targetGene;
            state.geneStatus = "Loading";

            const [leftRows, rightRows] = await Promise.all([
                context.dispatch("ensureGeneRows", { datasetId: leftId, gene: targetGene }),
                context.dispatch("ensureGeneRows", { datasetId: rightId, gene: targetGene }),
            ]);

            if (request !== state.geneComparisonRequest || leftId !== state.leftId || rightId !== state.rightId) return;

            if (!leftRows && !rightRows) {
                state.geneComparison = null;
                state.geneStatus = `${targetGene} was not found in either dataset via the single-cell BioIndex.`;
                return;
            }

            state.geneComparison = {
                gene: targetGene,
                datasets: {
                    [leftId]: leftRows || [],
                    [rightId]: rightRows || [],
                },
            };
            state.geneStatus = "";
        },

        async loadCellTypeComparison(context, cellType) {
            const state = context.state;
            const request = ++state.cellTypeComparisonRequest;
            const [leftId, rightId] = [state.leftId, state.rightId];
            const targetCellType = cellType || state.selectedCellType;
            if (!targetCellType) return;
            state.selectedCellType = targetCellType;
            state.cellTypeStatus = "Loading";

            const points = [];
            for (const gene of state.genePanel) {
                // eslint-disable-next-line no-await-in-loop
                const [leftRows, rightRows] = await Promise.all([
                    context.dispatch("ensureGeneRows", { datasetId: leftId, gene, includeValues: false }),
                    context.dispatch("ensureGeneRows", { datasetId: rightId, gene, includeValues: false }),
                ]);
                if (request !== state.cellTypeComparisonRequest || leftId !== state.leftId || rightId !== state.rightId) return;
                const leftSummary = (leftRows || []).find((row) => row.cell_type === targetCellType)?.summary || emptySummary();
                const rightSummary = (rightRows || []).find((row) => row.cell_type === targetCellType)?.summary || emptySummary();
                if (!leftSummary.n && !rightSummary.n) continue;
                points.push({
                    gene,
                    x: Number(leftSummary.avg_expression) || 0,
                    y: Number(rightSummary.avg_expression) || 0,
                    leftSummary,
                    rightSummary,
                });
            }

            if (request !== state.cellTypeComparisonRequest || leftId !== state.leftId || rightId !== state.rightId) return;
            state.cellTypeComparison = { cellType: targetCellType, points, leftId, rightId };
            state.cellTypeStatus = points.length ? "" : `No expression data found for ${targetCellType} in the current gene panel.`;
        },

        async refreshAll(context) {
            const state = context.state;
            if (!state.leftId || !state.rightId) return;
            await Promise.all([
                context.dispatch("refreshCellTypes"),
                context.dispatch("refreshGenePanel"),
            ]);
            await Promise.all([
                context.dispatch("loadOverview", state.leftId),
                context.dispatch("loadOverview", state.rightId),
                context.dispatch("loadGeneComparison", state.selectedGene),
                context.dispatch("loadCellTypeComparison", state.selectedCellType),
            ]);
        },

        async setLeftDataset(context, datasetId) {
            context.state.leftId = datasetId;
            await context.dispatch("refreshAll");
        },
        async setRightDataset(context, datasetId) {
            context.state.rightId = datasetId;
            await context.dispatch("refreshAll");
        },
        // Choosing a tissue narrows the dataset pickers on that side. If the currently
        // selected dataset is no longer in the narrowed set, fall back to the first
        // available one for that tissue (or "All tissues" if none) and refresh. Picking
        // "All tissues" restores the full dataset list without touching the selection.
        async setLeftTissue(context, tissue) {
            context.state.leftTissue = tissue;
            const filtered = tissue === "All tissues"
                ? context.state.datasets
                : context.state.datasets.filter((d) => d.tissue === tissue);
            if (!filtered.some((d) => d.id === context.state.leftId)) {
                const fallback = filtered[0];
                if (fallback) context.state.leftId = fallback.id;
            }
            await context.dispatch("refreshAll");
        },
        async setRightTissue(context, tissue) {
            context.state.rightTissue = tissue;
            const filtered = tissue === "All tissues"
                ? context.state.datasets
                : context.state.datasets.filter((d) => d.tissue === tissue);
            if (!filtered.some((d) => d.id === context.state.rightId)) {
                const fallback = filtered[0];
                if (fallback) context.state.rightId = fallback.id;
            }
            await context.dispatch("refreshAll");
        },
        async setGene(context, gene) {
            await context.dispatch("loadGeneComparison", gene);
        },
        async setCellType(context, cellType) {
            await context.dispatch("loadCellTypeComparison", cellType);
        },
    },
    getters: {
        datasetById: (state) => (id) => state.datasets.find((d) => d.id === id) || null,
        // Datasets offered by the "Select datasets" pickers after the tissue filter is
        // applied. "All tissues" (the default) returns every dataset, so the pickers
        // behave exactly as before until a specific tissue is chosen.
        leftDatasets: (state) => {
            if (!state.leftTissue || state.leftTissue === "All tissues") return state.datasets;
            return state.datasets.filter((d) => d.tissue === state.leftTissue);
        },
        rightDatasets: (state) => {
            if (!state.rightTissue || state.rightTissue === "All tissues") return state.datasets;
            return state.datasets.filter((d) => d.tissue === state.rightTissue);
        },
    },
});
