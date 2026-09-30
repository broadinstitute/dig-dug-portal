// The LIGER data layer: host resolution, tissue/dataset identity, URL building and
// response normalization. No presentation, no Vue -- everything here is a property
// of the API rather than of any one interface, which is why it sits at the root of
// LIGER/ rather than inside a version folder.
//
// NOTE: `v1/LigerBrowser.vue` still carries its own inline copy of all of this and
// does NOT import from here. Until it is migrated, the tissue config below and the
// one in v1 have to be changed together. See ../README.md.

const DEV_HUGEAMP_BIOINDEX_HOST = "https://bioindex-dev.hugeamp.org";
const PROD_HUGEAMP_BIOINDEX_HOST = "https://bioindex.hugeamp.org";
const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "0.0.0.0"];
const RUNTIME_HOSTNAME = typeof window !== "undefined" ? window.location.hostname : "";

// Dev when served locally, or when any label of the hostname other than the TLD
// says dev -- so dev.pankbase.org, cmd.dev.hugeamp.org, bioindex-dev.hugeamp.org
// and kp4cd-dev.org all count, while hugeamp.org does not. Checking only the first
// label would miss cmd.dev.hugeamp.org, where dev sits in the middle.
export const USE_DEV_HOST =
    LOCAL_HOSTNAMES.includes(RUNTIME_HOSTNAME) ||
    RUNTIME_HOSTNAME.split(".").slice(0, -1).some((part) => part.includes("dev"));

// /api/portal/phenotypes and /api/bio/match/gene are only served by the hugeamp
// bioindex (other portals return 501), so they stay pinned to hugeamp regardless of
// the configured prod/dev hosts -- routing them through config.prodHost /
// config.devHost would drag them to a host that does not serve them.
export const HUGEAMP_HOST = USE_DEV_HOST
    ? DEV_HUGEAMP_BIOINDEX_HOST
    : PROD_HUGEAMP_BIOINDEX_HOST;

// The program endpoints all query a single factorization model. Anything that
// counts or filters program rows has to apply the same filter or it overcounts.
export const PROGRAM_MODEL = "mouse_msigdb";

// Used as a significance flag only. p_value underflows to 5e-324 for the strongest
// hits, so it can never order them.
export const SIGNIFICANCE_P = 0.05;

// Portals do not agree on how a tissue is identified. Some return a tissue label on
// the gene-level expression rows, others return only a dataset ID, and the dataset
// IDs themselves differ between portals for the same tissue. So each tissue lists
// every dataset ID we know it by, and resolution runs in whichever direction the
// response happens to support.
//
// Keep this on `datasetIds` (an array) only -- do not mix in `datasetId` /
// `datasetID` -- and add a new portal's ID to the existing tissue entry rather than
// adding a new tissue.
export const TISSUE_CONFIG = {
    artery: { label: "Artery", datasetIds: ["FNIH_Artery_scRNA_v2.2"] },
    heart: { label: "Heart", datasetIds: ["FNIH_Heart_scRNA_v3.2"] },
    hypothalamus: { label: "Hypothalamus", datasetIds: ["FNIH_Hypothalamus_scRNA_v2.2"] },
    kidney: { label: "Kidney", datasetIds: ["FNIH_Kidney_scRNA_v2.2"] },
    liver: { label: "Liver", datasetIds: ["FNIH_Liver_scRNA_v3.2"] },
    muscle: { label: "Muscle", datasetIds: ["FNIH_Muscle_scRNA_v2.2"] },
    pancreas: { label: "Pancreas", datasetIds: ["FNIH_Pancreas_scRNA_v2.2", "islet_of_Langerhans_scRNA_v3-4"] },
    sat: { label: "SAT", datasetIds: ["FNIH_SAT_scRNA_v2.2"] },
    vat: { label: "VAT", datasetIds: ["FNIH_VAT_scRNA_v2.2"] }
};

export const DATASET_TISSUE_MAP = Object.keys(TISSUE_CONFIG).reduce((map, tissueKey) => {
    (TISSUE_CONFIG[tissueKey].datasetIds || []).forEach((datasetId) => {
        map[datasetId] = tissueKey;
    });
    return map;
}, {});

// --- generic row / field access ------------------------------------------------

export function normalizeKey(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

// Reads the first of `names` the row actually carries. Treats null / undefined / ""
// as absent, so a real 0 still comes back.
export function field(row, names = []) {
    if (!row || typeof row !== "object") {
        return null;
    }

    let normalizedRow = {};
    Object.keys(row).forEach((key) => {
        normalizedRow[normalizeKey(key)] = row[key];
    });

    for (let i = 0; i < names.length; i++) {
        let key = names[i];
        if (key in row && row[key] !== undefined && row[key] !== null && row[key] !== "") {
            return row[key];
        }

        let normalizedName = normalizeKey(key);
        let candidate = normalizedRow[normalizedName];
        if (normalizedName in normalizedRow && candidate !== undefined && candidate !== null && candidate !== "") {
            return candidate;
        }
    }

    return null;
}

// `field()` returns null when it finds nothing, and Number(null) is 0, which is
// finite -- so without this guard every absent numeric field silently becomes a
// real zero. That is what put a column of "0.00" under cell-type specificity (the
// API sends null there on every row) and made a missing p_value read as maximally
// significant. Do not remove the guard.
export function numericField(row, names = []) {
    let value = field(row, names);

    if (value === null || value === undefined || value === "") {
        return null;
    }

    let numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
}

// `gene-program-cell-state-metadata-extended` rows are NESTED -- the interesting
// fields live under `summary.`, `state.`, `curation.`, `quality.` and
// `marker_set.`. `field()` only looks at top-level keys, so reading those needs a
// path. Returns null for any missing segment, and treats "" as missing the same way
// field() does.
export function pathValue(row, path) {
    let current = row;
    let segments = String(path || "").split(".");

    for (let i = 0; i < segments.length; i++) {
        if (current === null || current === undefined || typeof current !== "object") {
            return null;
        }

        current = current[segments[i]];
    }

    return current === undefined || current === "" ? null : current;
}

// First non-empty of several paths, for fields whose home moved between pipeline
// versions.
export function firstPathValue(row, paths = []) {
    for (let i = 0; i < paths.length; i++) {
        let value = pathValue(row, paths[i]);

        if (value !== null) {
            return value;
        }
    }

    return null;
}

// The program `label` from gene-program-factor is the factorization's own verdict on
// itself, and for islet beta 7 of 10 programs call themselves QC or artifact
// programs. That is real, reportable information -- and it is the honest replacement
// for the fabricated quality badge v1 used to show.
export function programSelfLabelsAsQc(label) {
    return /\b(qc|artifact|ambient|contamination|doublet)\b/i.test(String(label || ""));
}

// The bioindex returns rows several different ways depending on the endpoint, and
// sometimes as a columns + row-arrays pair.
export function rowsFromResponse(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (!payload || typeof payload !== "object") {
        return [];
    }

    let collections = [payload.data, payload.results, payload.rows, payload.items, payload.values, payload.result];

    for (let i = 0; i < collections.length; i++) {
        let collection = collections[i];

        if (!Array.isArray(collection)) {
            continue;
        }

        if (collection.length > 0 && Array.isArray(collection[0]) && Array.isArray(payload.columns)) {
            return collection.map((row) => {
                let mapped = {};
                payload.columns.forEach((column, columnIndex) => {
                    mapped[column] = row[columnIndex];
                });
                return mapped;
            });
        }

        return collection;
    }

    return [payload];
}

export async function fetchJson(url) {
    let response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
}

// `/api/raw/file/...` responses are **JSONL**, not JSON: one complete object per
// line, no enclosing array and no commas. `response.json()` throws on them.
//
// The `.gz` is handled by the browser through Content-Encoding, so `text()` already
// yields decompressed text -- there is nothing to inflate here.
export async function fetchJsonLines(url) {
    let response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    let text = await response.text();

    return text
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
            try {
                return JSON.parse(line);
            } catch (error) {
                // One malformed line should not lose the whole file.
                return null;
            }
        })
        .filter((row) => !!row);
}

// Appends a query parameter to a URL that may be relative or absolute and may
// already carry a query string or a hash. Used for the configurable single-cell
// browser link, where the portal supplies the base and we supply the dataset.
export function withQueryParam(baseUrl, key, value) {
    let base = String(baseUrl || "").trim();

    if (!base) {
        return "";
    }

    let [beforeHash, hash] = base.split("#");
    let separator = beforeHash.includes("?") ? "&" : "?";
    let withParam = `${beforeHash}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;

    return hash ? `${withParam}#${hash}` : withParam;
}

// --- labels --------------------------------------------------------------------

export function formatDisplayLabel(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .split(" ")
        .filter((part) => !!part)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function normalizeGeneLabel(gene) {
    if (gene == null) {
        return "";
    }

    if (typeof gene === "string") {
        return gene.toUpperCase();
    }

    return String(field(gene, ["symbol", "gene_symbol", "name", "gene", "id"]) || "").toUpperCase();
}

// --- tissue / dataset identity -------------------------------------------------

export function tissueKeyFromLabel(label) {
    return Object.keys(TISSUE_CONFIG).find((tissueKey) => TISSUE_CONFIG[tissueKey].label === label) || null;
}

// The inverse, for restoring a tissue from a query string. Returns null for a key
// the config does not know, which the caller has to handle -- an unrecognized
// tissue can still be present in a response and therefore in a link.
export function tissueLabelFromKey(tissueKey) {
    let config = TISSUE_CONFIG[normalizeKey(tissueKey)];
    return config ? config.label : null;
}

export function rowDatasetId(row) {
    return String(field(row, ["dataset_id", "dataset"]) || "");
}

export function rowTissueKey(row) {
    let tissue = field(row, ["tissue_label", "tissue"]);

    if (tissue) {
        let normalized = normalizeKey(tissue);
        if (TISSUE_CONFIG[normalized]) {
            return normalized;
        }
    }

    return DATASET_TISSUE_MAP[rowDatasetId(row)] || null;
}

export function tissueLabelForRow(row) {
    let tissueKey = rowTissueKey(row);

    if (tissueKey) {
        return TISSUE_CONFIG[tissueKey].label;
    }

    // Unrecognized tissue with no dataset ID we can map: show it as-is rather than
    // dropping the row.
    let tissue = field(row, ["tissue_label", "tissue"]);
    return tissue ? formatDisplayLabel(tissue) : "";
}

// The cell-state family of endpoints keys on a tissue on some portals and on a
// dataset ID on others. The gene-level cell-state response tells us which: if its
// rows carry a tissue the portal speaks tissue, if they carry only a dataset ID it
// speaks dataset. The program payload is no help -- it reports dataset IDs on both
// kinds of portal, so including it makes every portal look dataset-keyed.
export function detectCellStateDatasetKeying(rows = []) {
    let hasTissue = rows.some((row) => !!field(row, ["tissue_label", "tissue"]));
    let hasDataset = rows.some((row) => !!rowDatasetId(row));

    return !hasTissue && hasDataset;
}

// Records the dataset ID a portal reported for each tissue, so the dataset-keyed
// endpoints downstream query the ID this portal actually serves rather than the
// first one in the static config. Returns a new object; the first ID seen wins.
export function collectObservedDatasetIds(rows = [], observed = {}) {
    let next = { ...observed };

    rows.forEach((row) => {
        let datasetId = rowDatasetId(row);
        let tissueKey = rowTissueKey(row);

        if (datasetId && tissueKey && !next[tissueKey]) {
            next[tissueKey] = datasetId;
        }
    });

    return next;
}

// Prefer the dataset ID this portal actually used for the current gene; fall back
// to the first configured ID when the response only gave us tissue labels.
export function tissueDatasetId(label, observedDatasetIds = {}) {
    let tissueKey = tissueKeyFromLabel(label);

    if (!tissueKey) {
        return null;
    }

    return observedDatasetIds[tissueKey] || (TISSUE_CONFIG[tissueKey].datasetIds || [])[0] || null;
}

// Query key for the cell-state family only:
//   gene-program-expression-cell-type
//   gene-program-expression-cell-state (3-arg form)
//   gene-program-heatmap
//   gene-program-cell-state-trait-factor
//
// Do NOT use it for gene-program-cell-state-metadata / -extended, which are
// tissue-keyed on every portal, and not for the program endpoints, which take a
// dataset ID via tissueDatasetId().
//
// On a dataset-keyed portal, passing a tissue name to a cell-state endpoint returns
// HTTP 500 rather than an empty result, so getting this wrong surfaces as a load
// error rather than an empty state.
export function tissueQueryKey(label, { observedDatasetIds = {}, usesDatasetKey = false } = {}) {
    let tissueKey = tissueKeyFromLabel(label);

    if (!tissueKey) {
        return "";
    }

    if (!usesDatasetKey) {
        return tissueKey;
    }

    return tissueDatasetId(label, observedDatasetIds) || tissueKey;
}

// --- row accessors -------------------------------------------------------------

export function cellTypeKey(row) {
    return String(field(row, ["cell_type", "annotated_cell_type", "celltype", "cell_type_label"]) || "");
}

export function cellTypeLabel(row) {
    return formatDisplayLabel(field(row, ["cell_type_label", "annotated_cell_type", "cell_type", "celltype"]));
}

export function stateKey(row) {
    return String(field(row, ["state_id", "state", "cell_state_id", "state_name", "display_name"]) || "");
}

// `metadataRow` is the matching gene-program-cell-state-metadata-extended row. Its
// `display_name` is the readable label and should be preferred whenever one loaded.
export function stateLabel(row, metadataRow = null) {
    return formatDisplayLabel(
        field(metadataRow || row, ["display_name", "state_label", "cell_state", "state_name", "state_id"])
    );
}

// gene-program-heatmap's `state_name` MIXES curated cell states and QC signatures,
// and no field separates them -- for islet beta, 36 of 45 distinct values are
// `qc_bad_*`. This was once filtered on `state_type === "qc_state"`, which no row
// carries, so the filter passed everything and QC signatures were presented as
// curated state matches. The id prefix is the only real signal; the `state_type`
// test is kept first in case the index starts sending it.
export function isQcStateRow(row) {
    if (field(row, ["state_type"]) === "qc_state") {
        return true;
    }

    return /^qc[_-]/i.test(String(stateKey(row) || ""));
}

export function programKey(row) {
    return String(field(row, ["program_id", "factor", "factor_id", "program", "label"]) || "");
}

// `infoRow` is the matching gene-program-factor row, when one has been loaded.
// gene-program-factor returns only dataset / cell_type / model / factor / label /
// top_genes, so `label` is where a readable name actually comes from; the earlier
// names in this chain are kept for portals that grow them.
export function programLabel(row, infoRow = null) {
    return formatDisplayLabel(
        field(infoRow || row, ["suggested_program_label", "program_label", "label", "display_name", "program_id", "factor"])
    );
}

// The only expression field any of these endpoints returns. It is a log of a log
// (see ../README.md) -- do not relabel it as CPK.
export function absoluteExpressionValue(row) {
    return numericField(row, ["log10_cpk"]);
}

// The program <-> state association strength, from gene-program-heatmap. GSEA P and
// q are the ONLY metrics that index returns -- there is no correlation, no NES, no
// combined match score, no cell/donor Spearman. Do not add a metric selector over
// fields that do not exist.
//
// Both are `null` on a substantial fraction of rows (190 of 450 for islet beta), so
// every consumer has to treat "not reported" as its own case rather than as zero.
export function gseaPValue(row) {
    return numericField(row, ["gsea_p", "loading_mwu_p", "p_value"]);
}

export function gseaQValue(row) {
    return numericField(row, ["gsea_q", "loading_mwu_q", "q_value"]);
}

// --- traits -------------------------------------------------------------------
//
// Both trait endpoints return `trait`, `beta`, `beta_uncorrected` and nothing else.
// The trait value is a raw internal code -- `BSandFG` and the like -- which is not
// readable on its own, so every display goes through the phenotype join below.
//
// Trait identity stays keyed by the raw API value internally. Only the DISPLAY is
// the phenotype description.

export function traitKey(row) {
    return String(field(row, ["trait", "trait_label", "trait_internal", "phenotype"]) || "");
}

export function traitBeta(row) {
    return numericField(row, ["beta"]);
}

export function traitBetaUncorrected(row) {
    return numericField(row, ["beta_uncorrected"]);
}

// Index of /api/portal/phenotypes?q=md rows, keyed every way a trait might name
// them, so the join survives the two pipelines disagreeing about which field is the
// identifier.
export function buildPhenotypeIndex(phenotypeRows = []) {
    let index = {};

    phenotypeRows.forEach((row) => {
        [row.name, row.description, row.label, row.trait]
            .filter((value) => !!value)
            .forEach((value) => {
                index[normalizeKey(value)] = row;
            });
    });

    return index;
}

export function phenotypeForTrait(index, traitValue) {
    return index[normalizeKey(traitValue)] || null;
}

export function specificityValue(row) {
    return numericField(row, [
        "log2fc_weighted_vs_all_parent",
        "log2fc_vs_all_parent",
        "specificity_log2fc",
        "log2_fold_change",
        "specificity",
        "spec"
    ]);
}

// --- URL building --------------------------------------------------------------

// Every LIGER index URL is built from the resolved host: `devHost` when the page is
// served locally or from a dev subdomain, `prodHost` otherwise. Both default to the
// hugeamp bioindexes, so a page reading LIGER from hugeamp needs no configuration.
//
// BIO_INDEX_HOST is deliberately not used: it is compile-time injected per portal
// build, which made the resolved host depend on how the bundle was built rather
// than on the page config, and it is not overridable per page.
export function resolveApiHost({ prodHost, devHost } = {}) {
    let configured = USE_DEV_HOST ? devHost : prodHost;
    let host = String(configured || "").trim().replace(/\/+$/, "");

    return host || (USE_DEV_HOST ? DEV_HUGEAMP_BIOINDEX_HOST : PROD_HUGEAMP_BIOINDEX_HOST);
}

function query(host, index, ...args) {
    return `${host}/api/bio/query/${index}?q=${encodeURIComponent(args.join(","))}`;
}

// Returns the URL builders bound to one resolved host. `tissueQuery` arguments come
// from tissueQueryKey(); `datasetId` arguments from tissueDatasetId().
export function createLigerApi(config = {}) {
    let host = resolveApiHost(config);

    return {
        host,

        // pinned to hugeamp -- other portals return 501
        matchGene: (prefix) => `${HUGEAMP_HOST}/api/bio/match/gene?q=${encodeURIComponent(prefix)}`,
        traitPhenotypes: () => `${HUGEAMP_HOST}/api/portal/phenotypes?q=md`,

        // gene-level, used to derive the tissue list and detect the keying convention
        geneCellStates: (gene) => query(host, "gene-program-expression-cell-state", gene),
        genePrograms: (gene) => query(host, "gene-program-expression-program", gene),

        cellTypeExpression: (tissueQuery, gene) => query(host, "gene-program-expression-cell-type", tissueQuery, gene),

        cellStateExpression: (tissueQuery, cellType, gene) =>
            query(host, "gene-program-expression-cell-state", tissueQuery, cellType, gene),
        cellStateMetadata: (tissueKey, cellType) =>
            query(host, "gene-program-cell-state-metadata-extended", tissueKey, cellType),

        programExpression: (datasetId, cellType, gene) =>
            query(host, "gene-program-expression-program", datasetId, cellType, PROGRAM_MODEL, gene),
        programInfo: (datasetId, cellType) => query(host, "gene-program-factor", datasetId, cellType, PROGRAM_MODEL),
        programGenes: (datasetId, cellType, programId) =>
            query(host, "gene-program-gene-factor", datasetId, cellType, PROGRAM_MODEL, programId),
        programGeneSets: (datasetId, cellType, programId) =>
            query(host, "gene-program-gene-set-factor", datasetId, cellType, PROGRAM_MODEL, programId),
        programQc: (datasetId, cellType, programId) =>
            query(host, "gene-program-qc-factor", datasetId, cellType, PROGRAM_MODEL, programId),
        programTraits: (datasetId, cellType, programId) =>
            query(host, "gene-program-trait-factor", datasetId, cellType, PROGRAM_MODEL, programId),

        // The single-cell dataset metadata the programs were generated from. JSONL,
        // not JSON -- read it with fetchJsonLines(). It covers every single-cell
        // dataset the portal has, so the caller matches on `datasetId`.
        //
        // Routed through the resolved host rather than BIO_INDEX_HOST, like every
        // other LIGER request: a portal serving LIGER from its own bioindex serves
        // its own single-cell metadata from the same place.
        datasetMetadata: () => `${host}/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz`,

        qcMetadata: () => query(host, "gene-program-qc-metadata-extended", "1"),
        relationshipHeatmap: (tissueQuery, cellType) => query(host, "gene-program-heatmap", tissueQuery, cellType),
        cellStateTraits: (tissueQuery, cellType, stateId) =>
            query(host, "gene-program-cell-state-trait-factor", tissueQuery, cellType, stateId)
    };
}
