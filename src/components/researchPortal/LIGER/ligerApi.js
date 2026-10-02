// The LIGER data layer: host resolution, tissue identity, URL building and response
// normalization. No presentation, no Vue -- everything here is a property of the API
// rather than of any one interface, which is why it sits at the root of LIGER/
// rather than inside a version folder.
//
// **Every index is keyed on the tissue key** (`vat`, `pancreas`) and none of them
// take a model argument any more. That replaced a large amount of machinery here:
// a hardcoded tissue -> dataset table, its reverse index, per-portal dataset-ID
// observation, and a runtime sniff of which of two keying conventions each portal
// used. All of it is gone. See ../README.md for the history, and
// ../BACKEND_REQUEST_TISSUE_KEYS.md for the request that produced the change.
//
// Two consequences worth keeping in mind:
//
// 1. **Dataset IDs drift continuously** as source data is rebuilt -- between two
//    observations `FNIH_Heart_scRNA_v3.2` became `v4.0` and artery and pancreas
//    both moved to `v3`. Nothing here may hold a dataset ID as a constant. Where a
//    dataset ID is needed (naming the source, linking to the single-cell browser)
//    it comes from the `dataset` field of a row we just loaded.
// 2. **`v1/` is deprecated** and carries its own inline copy of the OLD query
//    shapes, so it no longer talks to a live API. It is not mounted anywhere.

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

// Used as a significance flag only. p_value underflows to 5e-324 for the strongest
// hits, so it can never order them.
export const SIGNIFICANCE_P = 0.05;

// Display labels for the tissue keys the API reports. **This is temporary**, and it
// is the last remnant of the old hardcoded tissue table -- it exists only because
// the labels cannot be derived from the keys: `bonemarrow` title-cases to
// "Bonemarrow", and `sat` / `vat` to "Sat" / "Vat", where the right answers are
// "Bone Marrow", "SAT" and "VAT".
//
// `tissue_label` has been requested on the two gene-level expression endpoints.
// **When it lands, delete this map and `tissueLabel()` falls back to the field.**
//
// Deliberately NOT a gate: a tissue missing from here still renders, via
// formatDisplayLabel(). The old table dropped any tissue it did not list, which is
// how `bone`, `bonemarrow` and `tendon` stayed invisible after the API gained them.
const TISSUE_LABELS = {
    artery: "Artery",
    bone: "Bone",
    bonemarrow: "Bone Marrow",
    heart: "Heart",
    hypothalamus: "Hypothalamus",
    kidney: "Kidney",
    liver: "Liver",
    muscle: "Muscle",
    pancreas: "Pancreas",
    sat: "SAT",
    tendon: "Tendon",
    vat: "VAT"
};

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

// --- tissue identity -----------------------------------------------------------
//
// One key per tissue, straight off the row. There is nothing to resolve any more:
// every index takes the tissue key, and every row reports the key it was served
// under. The query string already carried keys, so links keep resolving.

export function rowTissueKey(row) {
    return normalizeKey(field(row, ["tissue"]));
}

// The dataset the row was actually served from -- for naming the source and linking
// to the single-cell browser, never for querying. Dataset IDs drift as source data
// is rebuilt, so this is only ever read from a response, never held as a constant.
export function rowDatasetId(row) {
    return String(field(row, ["dataset", "dataset_id"]) || "");
}

// Prefers the API's own label once it sends one, so this needs no change when
// `tissue_label` lands on the expression endpoints -- the row wins, TISSUE_LABELS
// covers the gap, and formatDisplayLabel() keeps an unknown tissue visible rather
// than dropping it.
export function tissueLabel(tissueKey, row = null) {
    let fromRow = row ? field(row, ["tissue_label"]) : null;

    if (fromRow) {
        return String(fromRow);
    }

    let key = normalizeKey(tissueKey);

    return TISSUE_LABELS[key] || formatDisplayLabel(key);
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

// The `qc_signature_id` values from gene-program-qc-metadata-extended, as a lookup.
// That dictionary is the authoritative list of QC signatures, and its ids are
// exactly the `state_name` values the heatmap mixes in with curated states -- 36
// `qc_bad_*` against 6 real states for vat/adipocyte.
export function buildQcSignatureIndex(qcMetadataRows = []) {
    return qcMetadataRows.reduce((index, row) => {
        let id = field(row, ["qc_signature_id"]);

        if (id) {
            index[normalizeKey(id)] = true;
        }

        return index;
    }, {});
}

// gene-program-heatmap's `state_name` MIXES curated cell states and QC signatures,
// and no field on those rows separates them.
//
// Three tests, in order of how much they can be trusted:
//
// 1. `state_type === "qc_state"`, for if the index ever sends it. It does not today
//    -- filtering on it is the bug that shipped once, because no row carries the
//    field, so the filter passed everything and QC signatures were presented as
//    curated matches.
// 2. The QC dictionary, when the caller has loaded it. This is the authoritative
//    test and the reason it is plumbed through.
// 3. The `qc_` name prefix. Kept as a fallback, NOT replaced by the dictionary: the
//    heatmap can resolve before the dictionary does, and a filter that silently
//    stops filtering is worse than a crude one. A QC signature not named `qc_*`
//    would slip past this and is exactly what test 2 is for.
export function isQcStateRow(row, qcSignatureIndex = null) {
    if (field(row, ["state_type"]) === "qc_state") {
        return true;
    }

    let key = String(stateKey(row) || "");

    if (qcSignatureIndex && qcSignatureIndex[normalizeKey(key)]) {
        return true;
    }

    return /^qc[_-]/i.test(key);
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

// Returns the URL builders bound to one resolved host.
//
// **Every `tissueKey` argument is the tissue key**, the same string the rows report
// in their `tissue` field. There is no second convention and no model argument --
// both are gone from the API, which is what let the identity section above shrink to
// three functions.
export function createLigerApi(config = {}) {
    let host = resolveApiHost(config);

    return {
        host,

        // pinned to hugeamp -- other portals return 501
        matchGene: (prefix) => `${HUGEAMP_HOST}/api/bio/match/gene?q=${encodeURIComponent(prefix)}`,

        // Unscoped, deliberately. `?q=md` scoped this to the metabolic disease group
        // and silently failed to resolve every trait outside it -- ADHD, telomere
        // length and brain volume all missed, 4 of 20 sampled, and the Traits tabs
        // hide unmatched rows by default. LIGER now spans 12 tissues including bone,
        // bonemarrow, tendon and hypothalamus, so its traits are not metabolic.
        traitPhenotypes: () => `${HUGEAMP_HOST}/api/portal/phenotypes`,

        // gene-level, and the source of the tissue list
        geneCellStates: (gene) => query(host, "gene-program-expression-cell-state", gene),
        genePrograms: (gene) => query(host, "gene-program-expression-program", gene),

        cellTypeExpression: (tissueKey, gene) => query(host, "gene-program-expression-cell-type", tissueKey, gene),

        cellStateExpression: (tissueKey, cellType, gene) =>
            query(host, "gene-program-expression-cell-state", tissueKey, cellType, gene),
        cellStateMetadata: (tissueKey, cellType) =>
            query(host, "gene-program-cell-state-metadata-extended", tissueKey, cellType),

        programExpression: (tissueKey, cellType, gene) =>
            query(host, "gene-program-expression-program", tissueKey, cellType, gene),
        programInfo: (tissueKey, cellType) => query(host, "gene-program-factor", tissueKey, cellType),
        programGenes: (tissueKey, cellType, programId) =>
            query(host, "gene-program-gene-factor", tissueKey, cellType, programId),
        programGeneSets: (tissueKey, cellType, programId) =>
            query(host, "gene-program-gene-set-factor", tissueKey, cellType, programId),
        programQc: (tissueKey, cellType, programId) =>
            query(host, "gene-program-qc-factor", tissueKey, cellType, programId),
        programTraits: (tissueKey, cellType, programId) =>
            query(host, "gene-program-trait-factor", tissueKey, cellType, programId),

        // The single-cell dataset metadata the programs were generated from. JSONL,
        // not JSON -- read it with fetchJsonLines(). It covers every single-cell
        // dataset the portal has, so the caller matches on `datasetId`.
        //
        // Routed through the resolved host rather than BIO_INDEX_HOST, like every
        // other LIGER request: a portal serving LIGER from its own bioindex serves
        // its own single-cell metadata from the same place.
        datasetMetadata: () => `${host}/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz`,

        qcMetadata: () => query(host, "gene-program-qc-metadata-extended", "1"),
        relationshipHeatmap: (tissueKey, cellType) => query(host, "gene-program-heatmap", tissueKey, cellType),
        cellStateTraits: (tissueKey, cellType, stateId) =>
            query(host, "gene-program-cell-state-trait-factor", tissueKey, cellType, stateId)
    };
}
