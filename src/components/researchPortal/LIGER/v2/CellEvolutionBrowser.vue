<script>
import Vue from "vue";
import CellStateInfographic from "../CellStateInfographic.vue";
import GeneSearch from "./GeneSearch.vue";
import ScopeSelect from "./ScopeSelect.vue";
import CanvasStage from "./CanvasStage.vue";
import ProgramRow from "./ProgramRow.vue";
import StateRow from "./StateRow.vue";
import MetadataCard from "./MetadataCard.vue";
import {
    createLigerApi,
    fetchJson,
    fetchJsonLines,
    withQueryParam,
    rowsFromResponse,
    field,
    numericField,
    normalizeGeneLabel,
    tissueLabel,
    rowTissueKey,
    rowDatasetId,
    buildQcSignatureIndex,
    cellTypeKey,
    cellTypeLabel,
    programKey,
    programLabel,
    stateKey,
    stateLabel,
    isQcStateRow,
    firstPathValue,
    absoluteExpressionValue,
    buildPhenotypeIndex,
    normalizeKey,
    SIGNIFICANCE_P
} from "../ligerApi";
import { buildTraitRows } from "./traits";
import {
    buildExpressionItems,
    expressionAxisMax,
    specificityAxisFor,
    formatExpressionValue,
    formatSignificance,
    formatRawMetric
} from "./programAxis";
import { buildEdges, buildGeneLinks, edgePath, stateColor, METRICS, EDGE_MIN_SCORE } from "./relationships";

const DEFAULT_CONFIG = {
    pageTitle: "Cell Evolution Browser",
    pageSubtitle: "Explore how genes influence cell states through coordinated programs of activity across tissues and cell types.",
    documentationUrl: "/research.html?pageid=kp_liger_documentation",
    exampleGenes: ["PPARG", "PCSK9", "INS"],
    // Base for the "View in Single Cell Browser" link. The dataset ID is appended
    // as a query param, so this may be relative or absolute and may already carry
    // its own query string. Set to "" to hide the link.
    singleCellBrowserUrl: "/r/scb"
};

const SUGGESTION_DEBOUNCE_MS = 200;
const MIN_SUGGESTION_LENGTH = 2;

// Line colors for the canvas SVG, as literals.
//
// These are NOT `var(--ce-ink)` and must not become it. A `var()` reference in an
// SVG *presentation attribute* (`stroke="..."`) is not reliably honored -- it
// resolves to an invalid value and the stroke silently disappears, which is exactly
// how the gene links came out invisible the first time while the program/state
// edges, which bind concrete hex values, drew fine. If these need to follow a theme,
// bind them through a computed that returns a real color.
const GENE_LINK_COLOR = "#17262b";
const STRUCTURAL_LINK_COLOR = "#d7e1e3";
const MUTED_LINK_COLOR = "#687a80";

// How many gene-loading requests are in flight at once during the hub-link fan-out.
// Low on purpose: each response is the program's full gene list, so this bounds
// bandwidth and open sockets rather than latency.
const GENE_LOADING_CONCURRENCY = 4;

// --- canvas layout -------------------------------------------------------------
//
// World coordinates, laid out as the infographic's left-to-right chain:
//
//     Gene hub  ->  Gene programs  ->  Cell states
//
// Three things are positioned absolutely -- the hub and the two list panels -- and
// each panel is centered vertically on the hub. The rows inside a panel are
// ordinary flow.
//
// `LIST_ROW_HEIGHT` and the two header heights are NOT estimates. The edge anchors are
// computed from them rather than measured from the DOM, so they have to be the exact
// rendered heights: both are published to CSS (`--ce-row-height`,
// `--ce-list-header-height`) and the elements take their height from those variables,
// which keeps one constant on both sides of the boundary.
const WORLD_WIDTH = 5200;
const WORLD_HEIGHT = 3600;
const HUB_X = 500;
const HUB_Y = WORLD_HEIGHT / 2;
const HUB_WIDTH = 220;
const HUB_HEIGHT = 128;

// The two panels' headers are DIFFERENT heights, because they carry different
// things: the programs header adds a row of column headings over its two numeric
// columns, and the states list has no numeric columns to head. One shared constant
// would leave a ~22px dead band under the cell-states description.
//
// Both are exact for the same reason `LIST_ROW_HEIGHT` is -- the edge anchors add
// them to the panel top rather than measuring -- so each is published to its own
// panel as `--ce-list-header-height` and the description is line-clamped, so text
// can never be the thing that decides the height.
//
// Title row (18) + description (2 x 13) + column heads (12) + gaps + padding.
const PROGRAM_HEADER_HEIGHT = 84;
// The same without the column heads.
const STATE_HEADER_HEIGHT = 68;
const LIST_ROW_HEIGHT = 46;

// One gap, used on both sides of the programs list: gene -> programs and
// programs -> states are the same kind of step in the chain, so an eye reading
// left to right should not see one of them as the wider relationship.
//
// The programs -> states gap is the edge bundle's drawing room, and it used to be
// 340 for that reason. 200 is still enough for a fan of a few hundred to separate;
// below roughly 150 the curves start collapsing into a band.
const COLUMN_GAP = 200;

const PROGRAM_LIST_X = HUB_X + HUB_WIDTH + COLUMN_GAP;
const PROGRAM_LIST_WIDTH = 340;
const STATE_LIST_X = PROGRAM_LIST_X + PROGRAM_LIST_WIDTH + COLUMN_GAP;
const STATE_LIST_WIDTH = 340;

// Extra world space above the content, so `Fit` does not tuck the top of the lists
// under the two boxes fixed across the top of the canvas -- the heading at the left
// and the edge legend at the right.
//
// Small on purpose. It inflates the height `fit()` is trying to frame, so every world
// pixel here is paid for in starting zoom -- and the starting zoom matters more than
// clearing both boxes completely, since the heading is two short lines and the legend
// now opens collapsed. This clears the heading; the reader pans for the rest.
const HEADING_CLEARANCE = 40;

// Margin `Fit` leaves around the content, overriding CanvasStage's more generous
// default. Counted twice per axis, so the default 80 was spending ~12% of the fitted
// scale on empty space -- too much for a card this short.
const FIT_PADDING = 40;

// --- line hover ----------------------------------------------------------------
//
// Minimum WORLD width of an edge's invisible hit stroke. A drawn edge is 2-11 world
// pixels, so at a fitted zoom the mark itself is 1-8 screen pixels -- not a target a
// pointer can be expected to land on.
const EDGE_HIT_WIDTH = 16;
// Screen pixels between the pointer and the tooltip's near corner.
const TOOLTIP_OFFSET = 14;
// How close to the canvas edge the pointer has to be before the tooltip flips to the
// other side of it. Roughly the tooltip's own footprint, so it is never the thing
// that gets clipped -- which is why the prose form, being both wider and taller than
// a line's readout, carries its own pair.
const TOOLTIP_EDGE_MARGIN_X = 260;
const TOOLTIP_EDGE_MARGIN_Y = 150;
const TOOLTIP_PROSE_MARGIN_X = 340;
const TOOLTIP_PROSE_MARGIN_Y = 260;

export default Vue.component("CellEvolutionBrowser", {
    components: {
        CellStateInfographic,
        GeneSearch,
        ScopeSelect,
        CanvasStage,
        ProgramRow,
        StateRow,
        MetadataCard
    },

    props: {
        // Nullable: the consuming page passes its own config through and may not
        // have one yet, so every read goes through `browserConfig`.
        config: {
            type: Object,
            default: null
        }
    },

    data() {
        return {
            // search
            searchedGene: "",
            selectedGene: "",
            geneSuggestions: [],
            isLoadingSuggestions: false,
            noGeneSuggestions: false,
            geneSearchError: "",
            isLoadingGeneData: false,
            // set when the input is being written programmatically, so picking a
            // suggestion does not immediately fire another lookup for it
            skipSuggestionLookup: false,
            suggestionTimer: null,

            // scope
            //
            // `availableTissues` is [{ key, label }] and `selectedTissueKey` is the
            // KEY, not the label. That is the whole shape of the tissue migration:
            // the key is the identity the API speaks and the query string carries,
            // and the label is presentation derived from it. It used to be the other
            // way round -- the label was state and every query re-derived a key from
            // it -- which is why there were four functions to convert between them.
            availableTissues: [],
            selectedTissueKey: "",
            cellTypeRows: [],
            selectedCellTypeKey: "",
            isLoadingCellTypes: false,
            cellTypeError: "",

            // programs
            programRows: [],
            programInfoRows: [],
            isLoadingPrograms: false,
            programError: "",
            selectedProgramKey: "",

            // cell states
            stateRows: [],
            stateMetadataRows: [],
            stateError: "",
            selectedStateKey: "",

            // source dataset metadata. Fetched once per host and cached for the
            // session: it is the whole portal's single-cell catalogue, not a
            // per-scope query, so refetching it on every tissue change would be
            // re-downloading the same file.
            datasetMetadataRows: [],
            isLoadingDatasetMetadata: false,
            datasetMetadataError: "",
            datasetMetadataLoaded: false,

            // Per-program detail, keyed by program id: { genes, geneSets, qc }.
            // Three requests per program, cached, so reopening one is free.
            programDetailCache: {},
            loadingProgramDetailKey: "",
            programDetailError: "",
            // gene-program-qc-metadata-extended, fetched once -- it is the whole QC
            // signature dictionary, not a per-program query.
            qcMetadataRows: [],

            // The searched gene's loading in each program, keyed by program id, for
            // the hub -> program line widths.
            //
            // This costs ONE REQUEST PER PROGRAM, because there is no gene-keyed
            // loading index: `gene-program-gene-factor` is keyed
            // dataset,cell_type,model,factor, so the only way to the gene's loading
            // in every program is to ask every program. See loadGeneLoadings().
            geneLoadingByProgram: {},
            geneLoadingsDone: 0,
            geneLoadingsTotal: 0,
            geneLoadingsAbsent: 0,
            geneLoadingsFailed: 0,
            // Bumped on every cell-type change so an in-flight fan-out for the
            // previous scope cannot write into the new one.
            geneLoadingRun: 0,

            // Trait associations, per entity, keyed "program:<id>" / "state:<id>".
            // Fetched when that entity is selected; there is no bulk trait matrix,
            // so nothing fans these out across every program and state up front.
            traitCache: {},
            loadingTraitKey: "",
            traitError: "",
            // /api/portal/phenotypes?q=md -- the readable labels and groups for the
            // raw trait codes. One fetch for the whole session, and it is pinned to
            // the hugeamp bioindex: no other portal serves it.
            phenotypeRows: [],
            phenotypesLoaded: false,

            // Which tab the metadata card is showing. Lifted out of the card so a
            // canvas selection can move it -- selecting a program on the canvas
            // while the card sits on Source data has to take the reader to the
            // program, or the selection looks like it did nothing.
            activeMetadataTab: "source",

            // program <-> state relationships
            relationshipRows: [],
            relationshipError: "",
            metricKey: METRICS[0].key,
            // Default to significant edges only. Drawing every reported association
            // is a hairball, and `gsea_p < 0.05` is the same rule v1 uses for its
            // linked filtering, so the two versions cannot disagree about what a
            // match is.
            significantEdgesOnly: true,
            // Starts collapsed. It occupies the top-right corner over the cell-state
            // list, and the first thing a reader wants is the picture -- the scales
            // are what they come back for once they are reading widths. The heading
            // stays visible, so the box does not have to be discovered.
            legendCollapsed: true,

            // The edge under the cursor, and what to say about it. Held apart from
            // `hovered` because it is a single line rather than a row's whole fan.
            hoveredEdgeKey: "",
            // { from, to, color, stats[], note, x, y, flipX, flipY } in screen
            // coordinates relative to `.browser-body`, or null.
            canvasTooltip: null,

            // { kind: "program" | "state", key } -- the row under the cursor. Drives
            // the edge and row dimming, which is what makes the fan readable.
            hovered: null,

            // True while restoring from the query string. Suppresses the param
            // writes that the selection methods would otherwise make on the way
            // through, so restoring a link does not rewrite the link it came from.
            isHydratingFromQuery: false
        };
    },

    computed: {
        browserConfig() {
            return this.config || {};
        },

        api() {
            return createLigerApi({
                prodHost: this.browserConfig.prodHost,
                devHost: this.browserConfig.devHost
            });
        },

        pageTitle() {
            return this.browserConfig.pageTitle || DEFAULT_CONFIG.pageTitle;
        },

        pageSubtitle() {
            return this.browserConfig.pageSubtitle || DEFAULT_CONFIG.pageSubtitle;
        },

        documentationUrl() {
            return this.browserConfig.documentationUrl || DEFAULT_CONFIG.documentationUrl;
        },

        exampleGenes() {
            return Array.isArray(this.browserConfig.exampleGenes)
                ? this.browserConfig.exampleGenes
                : DEFAULT_CONFIG.exampleGenes;
        },

        // Optional allowlist of tissue keys. Omitted or empty means all tissues.
        configuredTissueKeys() {
            let configured = Array.isArray(this.browserConfig.tissues) ? this.browserConfig.tissues : [];
            return configured.map((tissue) => normalizeKey(tissue)).filter((tissue) => !!tissue);
        },

        // --- header band options ---

        tissueOptions() {
            return this.availableTissues;
        },

        // For display only -- the hub, the canvas heading, the empty-state sentence.
        selectedTissueLabel() {
            let match = this.availableTissues.find((tissue) => tissue.key === this.selectedTissueKey);

            return match ? match.label : tissueLabel(this.selectedTissueKey);
        },

        cellTypeOptions() {
            return this.cellTypeRows
                .map((row) => {
                    let key = cellTypeKey(row);
                    let absolute = absoluteExpressionValue(row);
                    // Linear, for the same reason the bars are: 10^log10_cpk has a
                    // true zero and log10_cpk does not.
                    let linear = Number.isFinite(absolute) ? Math.pow(10, absolute) : null;

                    return {
                        key,
                        label: cellTypeLabel(row) || key,
                        // The expression reading travels with the option but is NOT
                        // rendered in the dropdown any more -- it is the cell-type
                        // table in the Source data tab. Kept here because this is
                        // the one place the cell-type rows are resolved to labels,
                        // and the sort below is by this value.
                        expressionText: formatExpressionValue(linear),
                        expressionRawText: formatRawMetric(absolute),
                        sortValue: Number.isFinite(linear) ? linear : -1
                    };
                })
                .filter((option) => !!option.key)
                .sort((a, b) => b.sortValue - a.sortValue || a.label.localeCompare(b.label));
        },

        // The same set, for the Source data tab. It is the dataset's cell-type
        // composition as this gene sees it, which is a property of the source data
        // rather than of the canvas -- and it is where the reading that used to sit
        // under the cell-type dropdown went.
        //
        // Already sorted strongest-expression-first by `cellTypeOptions`, so the tab
        // and the dropdown cannot disagree about the order.
        cellTypeTable() {
            return this.cellTypeOptions.map((option) => ({
                key: option.key,
                label: option.label,
                expressionText: option.expressionText,
                expressionRawText: option.expressionRawText,
                selected: option.key === this.selectedCellTypeKey
            }));
        },

        selectedCellTypeOption() {
            return this.cellTypeOptions.find((option) => option.key === this.selectedCellTypeKey) || null;
        },

        tissueDisabledReason() {
            if (!this.selectedGene) {
                return "Search a gene first";
            }

            if (!this.availableTissues.length) {
                return "No tissues for this gene";
            }

            return "";
        },

        cellTypeDisabledReason() {
            if (!this.selectedGene) {
                return "Search a gene first";
            }

            if (!this.selectedTissueKey) {
                return "Select a tissue first";
            }

            return "";
        },

        // --- source dataset ---

        // Read off the rows the canvas was actually built from, so the metadata card
        // describes the data on screen.
        //
        // This can only come from a response. Dataset IDs drift as source data is
        // rebuilt -- heart went v3.2 -> v4.0 and artery and pancreas both moved to
        // v3 between two observations -- so any ID held in config or in a constant
        // is a future wrong answer. The program rows are preferred because they are
        // what the programs list is built from; the cell-type rows are the fallback
        // for the window before a cell type is chosen.
        activeDatasetId() {
            let rows = this.programRows.length ? this.programRows : this.cellTypeRows;

            for (let i = 0; i < rows.length; i++) {
                let datasetId = rowDatasetId(rows[i]);

                if (datasetId) {
                    return datasetId;
                }
            }

            return "";
        },

        activeDataset() {
            let wanted = this.activeDatasetId;

            if (!wanted || !this.datasetMetadataRows.length) {
                return null;
            }

            // Exact first. The metadata file and the LIGER indexes are separate
            // pipelines, so the normalized fallback covers a case difference or a
            // `-` / `_` disagreement without matching two genuinely different
            // datasets to each other.
            let normalizedWanted = normalizeKey(wanted);

            return this.datasetMetadataRows.find((row) => row.datasetId === wanted)
                || this.datasetMetadataRows.find((row) => normalizeKey(row.datasetId) === normalizedWanted)
                || null;
        },

        singleCellBrowserUrl() {
            let base = this.browserConfig.singleCellBrowserUrl !== undefined
                ? this.browserConfig.singleCellBrowserUrl
                : DEFAULT_CONFIG.singleCellBrowserUrl;

            if (!base || !this.activeDatasetId) {
                return "";
            }

            return withQueryParam(base, "datasetId", this.activeDatasetId);
        },

        // --- canvas content ---

        // Shared by both lists, because it is the same metric in both. Specificity is
        // NOT shared -- see programAxis.js.
        expressionAxis() {
            return expressionAxisMax(
                [].concat(this.cellTypeRows, this.programRows, this.stateRows),
                this.browserConfig.expressionAxis
            );
        },

        programInfoByKey() {
            return this.programInfoRows.reduce((map, row) => {
                let key = programKey(row);

                if (key) {
                    map[key] = row;
                }

                return map;
            }, {});
        },

        stateMetadataByKey() {
            return this.stateMetadataRows.reduce((map, row) => {
                let key = stateKey(row);

                if (key) {
                    map[key] = row;
                }

                return map;
            }, {});
        },

        programItems() {
            let infoByKey = this.programInfoByKey;

            return buildExpressionItems(this.programRows, {
                axisMax: this.expressionAxis,
                specAxis: specificityAxisFor(this.programRows, this.browserConfig.specificityAxis),
                labelFor: (row) => {
                    let key = programKey(row);
                    return {
                        key,
                        label: programLabel(row, infoByKey[key] || null)
                    };
                }
            });
        },

        stateItems() {
            let metadataByKey = this.stateMetadataByKey;

            // Its own specificity axis, from its own rows: state specificity and
            // program specificity share a denominator (the parent cell type) but a
            // list whose values are all tiny must not scale up to fill the track.
            let items = buildExpressionItems(this.stateRows, {
                axisMax: this.expressionAxis,
                specAxis: specificityAxisFor(this.stateRows, this.browserConfig.specificityAxis),
                labelFor: (row) => {
                    let key = stateKey(row);
                    return {
                        key,
                        label: stateLabel(row, metadataByKey[key] || null)
                    };
                }
            });

            // The color is assigned by final list position, so it matches the swatch
            // on the row and the edges that land there.
            //
            // The lede comes along too. A state row carries it where a program row
            // carries its metrics: a cell state's name is a claim about biology
            // ("Stressed", "Mature identity") and the one-line summary is what makes
            // it mean anything, whereas a program's label is already descriptive.
            // Same two paths `StateInfo` reads, from the metadata row the canvas
            // already fetched for its labels -- so this costs no request.
            return items.map((item, index) => ({
                ...item,
                color: stateColor(index),
                lede: firstPathValue(metadataByKey[item.key] || null, [
                    "summary.portal_user_summary",
                    "summary.recommended_portal_summary"
                ]) || ""
            }));
        },

        programOrder() {
            return this.programItems.reduce((map, item, index) => {
                map[item.key] = index;
                return map;
            }, {});
        },

        stateOrder() {
            return this.stateItems.reduce((map, item, index) => {
                map[item.key] = index;
                return map;
            }, {});
        },

        // --- panel geometry ---

        programListHeight() {
            return PROGRAM_HEADER_HEIGHT + this.programItems.length * LIST_ROW_HEIGHT;
        },

        stateListHeight() {
            return STATE_HEADER_HEIGHT + this.stateItems.length * LIST_ROW_HEIGHT;
        },

        programListTop() {
            return HUB_Y - this.programListHeight / 2;
        },

        stateListTop() {
            return HUB_Y - this.stateListHeight / 2;
        },

        programListStyle() {
            return {
                left: `${PROGRAM_LIST_X}px`,
                top: `${this.programListTop}px`,
                width: `${PROGRAM_LIST_WIDTH}px`,
                "--ce-row-height": `${LIST_ROW_HEIGHT}px`,
                "--ce-list-header-height": `${PROGRAM_HEADER_HEIGHT}px`
            };
        },

        stateListStyle() {
            return {
                left: `${STATE_LIST_X}px`,
                top: `${this.stateListTop}px`,
                width: `${STATE_LIST_WIDTH}px`,
                "--ce-row-height": `${LIST_ROW_HEIGHT}px`,
                "--ce-list-header-height": `${STATE_HEADER_HEIGHT}px`
            };
        },

        // --- edges ---

        relationships() {
            return buildEdges(this.relationshipRows, {
                programOrder: this.programOrder,
                stateOrder: this.stateOrder,
                metricKey: this.metricKey,
                significantOnly: this.significantEdgesOnly,
                qcSignatureIndex: this.qcSignatureIndex
            });
        },

        // Edges with their endpoints resolved to world coordinates. Anchors are
        // computed from LIST_ROW_HEIGHT rather than measured, which is why that
        // constant also drives the rows' CSS height.
        //
        // Deliberately independent of `hovered`. Hovering changes only opacity, and
        // rebuilding a few hundred bezier path strings on every mouseenter is real
        // work for no reason -- the opacity is applied in the template instead, via
        // edgeOpacity().
        edgeGeometry() {
            let fromX = PROGRAM_LIST_X + PROGRAM_LIST_WIDTH;
            let toX = STATE_LIST_X;
            let programTop = this.programListTop;
            let stateTop = this.stateListTop;
            // Two offsets, not one: the panels' headers are different heights, so a
            // shared `rowCenter` would land every edge's program end correctly and
            // its state end 8px high.
            let programRowCenter = PROGRAM_HEADER_HEIGHT + LIST_ROW_HEIGHT / 2;
            let stateRowCenter = STATE_HEADER_HEIGHT + LIST_ROW_HEIGHT / 2;

            return this.relationships.edges.map((edge) => {
                let fromY = programTop + programRowCenter + this.programOrder[edge.programKey] * LIST_ROW_HEIGHT;
                let toY = stateTop + stateRowCenter + this.stateOrder[edge.stateKey] * LIST_ROW_HEIGHT;

                return {
                    ...edge,
                    path: edgePath(fromX, fromY, toX, toY)
                };
            });
        },

        // Both return a key -> true map of the rows to keep at full strength, or
        // `null` when nothing is hovered and every row is at full strength.
        // Everything absent from a non-null map is dimmed.
        //
        // Hovering a program keeps that program and every state it matches; hovering
        // a state keeps that state and every program matching it. That reciprocal
        // highlight is the whole point of the bipartite view -- it answers "what does
        // this row connect to" without tracing a line.
        highlightedProgramKeys() {
            if (!this.hovered) {
                return null;
            }

            if (this.hovered.kind === "program") {
                return { [this.hovered.key]: true };
            }

            return (this.relationships.byState[this.hovered.key] || []).reduce((keep, edge) => {
                keep[edge.programKey] = true;
                return keep;
            }, {});
        },

        highlightedStateKeys() {
            if (!this.hovered) {
                return null;
            }

            if (this.hovered.kind === "state") {
                return { [this.hovered.key]: true };
            }

            return (this.relationships.byProgram[this.hovered.key] || []).reduce((keep, edge) => {
                keep[edge.stateKey] = true;
                return keep;
            }, {});
        },

        // Counts the reader needs to trust the picture: how many associations are on
        // screen, and how many are not and why.
        edgeSummary() {
            let { edges, dropped, metric, ceiling } = this.relationships;

            return {
                shown: edges.length,
                metricLabel: metric.label,
                // Both ends of the width scale. The ceiling moves with the data, so
                // stating it is what makes the relative scaling honest -- the same
                // rule the expression axis follows. The floor is stated for a
                // different reason: the scale starts at the significance threshold,
                // so the thinnest line on screen is not a score of zero.
                floor: EDGE_MIN_SCORE.toFixed(1),
                ceiling: ceiling.toFixed(1),
                unreported: dropped.unreported,
                nonSignificant: dropped.nonSignificant,
                qc: dropped.qc
            };
        },

        metricOptions() {
            return METRICS;
        },

        significanceThreshold() {
            return SIGNIFICANCE_P;
        },

        // Hub -> program lines, one per program, width from the searched gene's
        // loading in that program.
        //
        // These replaced a single structural curve. That one was honest only because
        // it carried no measurement; now that there is a real per-program quantity,
        // a fan of weighted lines says something the single line could not.
        geneLinks() {
            return buildGeneLinks(
                this.programItems.map((item) => item.key),
                this.geneLoadingByProgram
            );
        },

        drawnGeneLinks() {
            let originX = HUB_X + HUB_WIDTH;
            let targetX = PROGRAM_LIST_X;
            let rowCenter = PROGRAM_HEADER_HEIGHT + LIST_ROW_HEIGHT / 2;
            let hovered = this.hovered;

            return this.geneLinks.links.map((link) => {
                let toY = this.programListTop + rowCenter + this.programOrder[link.programKey] * LIST_ROW_HEIGHT;

                return {
                    ...link,
                    path: edgePath(originX, HUB_Y, targetX, toY),
                    // Same three levels as the program/state edges, so hovering a
                    // program row lifts both of its links at once.
                    opacity: hovered
                        ? (hovered.kind === "program" && hovered.key === link.programKey ? 0.95 : 0.05)
                        : 0.5
                };
            });
        },

        // Shown until any loading resolves, and kept as the fallback when none do --
        // the gene still has to look connected to its programs. Purely structural,
        // carrying no measurement, which is why it is safe to draw unweighted.
        showStructuralConnector() {
            return this.geneLinks.resolved === 0;
        },

        connectorPath() {
            let originX = HUB_X + HUB_WIDTH;
            let originY = HUB_Y;
            let targetX = PROGRAM_LIST_X;
            let controlOffset = (targetX - originX) * 0.5;

            return `M ${originX} ${originY} C ${originX + controlOffset} ${originY}, ${targetX - controlOffset} ${originY}, ${targetX} ${originY}`;
        },

        geneLabelOrGene() {
            return this.selectedGene || "Gene";
        },

        geneLinkColor() {
            return GENE_LINK_COLOR;
        },

        structuralLinkColor() {
            return STRUCTURAL_LINK_COLOR;
        },

        mutedLinkColor() {
            return MUTED_LINK_COLOR;
        },

        geneLinkSummary() {
            let { resolved, ceiling } = this.geneLinks;

            return {
                resolved,
                ceiling: ceiling.toFixed(1),
                // Progress, so a fan-out that is still filling in does not look like
                // a finished picture with lines mysteriously absent.
                pending: Math.max(0, this.geneLoadingsTotal - this.geneLoadingsDone),
                total: this.geneLoadingsTotal,
                // Reported apart, because they mean opposite things: `absent` is the
                // API saying the gene is not in that program, `failed` is us not
                // having asked successfully. Collapsing them into one "missing" count
                // is what let a thrown ReferenceError read as real missing data.
                absent: this.geneLoadingsAbsent,
                failed: this.geneLoadingsFailed
            };
        },

        // What `Fit` frames. The whole world is mostly empty, so fitting to it would
        // leave the content unreadably small. Anything added to the canvas has to be
        // included here or it is cropped exactly when the user asks to see
        // everything.
        contentBounds() {
            let tops = [HUB_Y - HUB_HEIGHT / 2, this.programListTop];
            let bottoms = [HUB_Y + HUB_HEIGHT / 2, this.programListTop + this.programListHeight];
            let right = PROGRAM_LIST_X + PROGRAM_LIST_WIDTH;

            if (this.stateItems.length) {
                tops.push(this.stateListTop);
                bottoms.push(this.stateListTop + this.stateListHeight);
                right = STATE_LIST_X + STATE_LIST_WIDTH;
            }

            // The clearance is on the top only: the heading and the legend are both
            // up there, and nothing is fixed across the bottom except the zoom
            // controls and the gesture hint, which are small and in the corners.
            let top = Math.min(...tops) - HEADING_CLEARANCE;

            return {
                x: HUB_X,
                y: top,
                width: right - HUB_X,
                height: Math.max(...bottoms) - top
            };
        },

        hubStyle() {
            return {
                left: `${HUB_X}px`,
                top: `${HUB_Y - HUB_HEIGHT / 2}px`,
                width: `${HUB_WIDTH}px`,
                minHeight: `${HUB_HEIGHT}px`
            };
        },

        worldWidth() {
            return WORLD_WIDTH;
        },

        worldHeight() {
            return WORLD_HEIGHT;
        },

        fitPadding() {
            return FIT_PADDING;
        },

        // The EXP column head's tooltip.
        //
        // It carries the axis top, which is why the `max N` readout could come out
        // of the header: the bars are scaled to the strongest value on screen, and
        // that ceiling has to be stated SOMEWHERE or the relative scaling is
        // invisible. Moving it here keeps the property and buys back the space.
        //
        // The field is named rather than interpreted. `log10_cpk` is the only
        // expression field these endpoints return and its exact definition is an
        // open question -- it behaves like a log of a log, see ../README.md -- so
        // this reports the backend's own naming and does not assert CPK.
        expressionColumnHelp() {
            return {
                title: "EXP — expression",
                stats: [
                    { label: "Field", value: "log10_cpk" },
                    { label: "Axis top", value: String(this.expressionAxis) }
                ],
                paragraphs: [
                    `How strongly ${this.geneLabelOrGene} is expressed in this gene program.`,
                    "The number is the pipeline's log10_cpk as reported. The bar is the same value"
                        + " as 10^log10_cpk, on a linear scale from a true zero — a bar has to have"
                        + " one, and log10_cpk does not.",
                    "The scale is relative to these results, not global: the axis top is the"
                        + " strongest value on this canvas, floored so a barely-expressed gene"
                        + " cannot fill its own bar. Both lists share it, because it is the same"
                        + " measurement on both."
                ]
            };
        },

        // Kept separate from the expression tooltip, and separate from v1's
        // cell-type one: specificity's DENOMINATOR differs by card, and collapsing
        // the three into one string is how they come to disagree with the data.
        // Here it is the parent cell-type background.
        specificityColumnHelp() {
            return {
                title: "SPEC — specificity",
                stats: [
                    { label: "Field", value: "log2fc_weighted_vs_all_parent" },
                    { label: "Units", value: "log₂ fold change" }
                ],
                paragraphs: [
                    `How specific ${this.geneLabelOrGene}'s expression is to this program,`
                        + " measured against the rest of the parent cell type.",
                    "Negative means the gene is expressed less in this program than across the"
                        + " cell type as a whole — the program is not where this gene's signal"
                        + " sits. It is a fold change, not a p-value.",
                    "The gutter arrow carries the sign: blue up, red down, grey when the API"
                        + " reports no specificity at all, which is a third case rather than a"
                        + " zero. There is no bar, because specificity is signed and expression is"
                        + " not, and one shared track would read as though both were the same kind"
                        + " of quantity."
                ]
            };
        },

        // key -> label, for the tooltip. An edge carries only its endpoints' keys,
        // and a tooltip that named `Factor7` and `artery_fibroblast_adipogenic`
        // would be naming the wire rather than the two things it joins.
        programLabelByKey() {
            return this.programItems.reduce((map, item) => {
                map[item.key] = item.label;
                return map;
            }, {});
        },

        stateLabelByKey() {
            return this.stateItems.reduce((map, item) => {
                map[item.key] = item.label;
                return map;
            }, {});
        },

        // Offset off the pointer, flipped near an edge of the canvas so the tooltip
        // is never the thing clipped. The flips are decided when the tooltip is set,
        // not here, so this stays a pure style binding.
        canvasTooltipStyle() {
            if (!this.canvasTooltip) {
                return {};
            }

            let { x, y, flipX, flipY } = this.canvasTooltip;

            return {
                left: `${x + (flipX ? -TOOLTIP_OFFSET : TOOLTIP_OFFSET)}px`,
                top: `${y + (flipY ? -TOOLTIP_OFFSET : TOOLTIP_OFFSET)}px`
            };
        },

        // Which of the body's states to render. The canvas only earns its space once
        // there is something on it.
        bodyState() {
            if (this.isLoadingPrograms) {
                return "loading";
            }

            if (this.programError) {
                return "error";
            }

            if (this.programItems.length) {
                return "canvas";
            }

            if (!this.selectedGene) {
                return "empty-gene";
            }

            if (!this.selectedTissueKey) {
                return "empty-tissue";
            }

            if (!this.selectedCellTypeKey) {
                return "empty-cell-type";
            }

            return "empty-programs";
        },

        // --- metadata card ---

        selectedProgram() {
            return this.programItems.find((item) => item.key === this.selectedProgramKey) || null;
        },

        selectedState() {
            return this.stateItems.find((item) => item.key === this.selectedStateKey) || null;
        },

        selectedProgramFactor() {
            return this.selectedProgramKey ? (this.programInfoByKey[this.selectedProgramKey] || null) : null;
        },

        selectedStateMetadata() {
            return this.selectedStateKey ? (this.stateMetadataByKey[this.selectedStateKey] || null) : null;
        },

        programDetail() {
            return this.programDetailCache[this.selectedProgramKey] || null;
        },

        phenotypeIndex() {
            return buildPhenotypeIndex(this.phenotypeRows);
        },

        programTraits() {
            let rows = this.traitCache[`program:${this.selectedProgramKey}`];
            return rows ? buildTraitRows(rows, this.phenotypeIndex) : null;
        },

        stateTraits() {
            let rows = this.traitCache[`state:${this.selectedStateKey}`];
            return rows ? buildTraitRows(rows, this.phenotypeIndex) : null;
        },

        isLoadingProgramTraits() {
            return this.loadingTraitKey === `program:${this.selectedProgramKey}`;
        },

        isLoadingStateTraits() {
            return this.loadingTraitKey === `state:${this.selectedStateKey}`;
        },

        // Just the ids, for isQcStateRow(). Separate from qcMetadataByKey below,
        // which carries whole rows for the QC table -- this one only has to answer
        // "is this state_name a QC signature".
        qcSignatureIndex() {
            return buildQcSignatureIndex(this.qcMetadataRows);
        },

        qcMetadataByKey() {
            return this.qcMetadataRows.reduce((map, row) => {
                let key = field(row, ["qc_signature_id"]);

                if (key) {
                    map[String(key)] = row;
                }

                return map;
            }, {});
        },

        // Per-row match counts, for the pick-one lists. Answers "is this worth
        // opening" before anything is opened.
        programItemsWithCounts() {
            let byProgram = this.relationships.byProgram;

            return this.programItems.map((item) => ({
                ...item,
                matchCount: (byProgram[item.key] || []).length
            }));
        },

        stateItemsWithCounts() {
            let byState = this.relationships.byState;

            return this.stateItems.map((item) => ({
                ...item,
                matchCount: (byState[item.key] || []).length
            }));
        },

        // The states this program matches, and the programs this state matches. Both
        // are the same edge set the canvas draws, so the card and the canvas cannot
        // disagree about what a match is.
        programMatches() {
            let stateByKey = this.stateItems.reduce((map, item) => {
                map[item.key] = item;
                return map;
            }, {});

            return (this.relationships.byProgram[this.selectedProgramKey] || [])
                .map((edge) => this.matchRow(edge, stateByKey[edge.stateKey], edge.stateKey))
                .sort((a, b) => a.sortValue - b.sortValue);
        },

        stateMatches() {
            let programByKey = this.programItems.reduce((map, item) => {
                map[item.key] = item;
                return map;
            }, {});

            return (this.relationships.byState[this.selectedStateKey] || [])
                .map((edge) => this.matchRow(edge, programByKey[edge.programKey], edge.programKey))
                .sort((a, b) => a.sortValue - b.sortValue);
        },

        // The two narrowing cases, one per direction. With one side selected and the
        // other not, the pick-one list for the empty side shows only what matches --
        // the question at that point is "which of these does the selected one
        // connect to", not "what exists".
        //
        // Both read the same edge set the canvas draws, so the card and the canvas
        // cannot disagree about what a match is.
        statesForSelectedProgram() {
            if (!this.selectedProgramKey) {
                return [];
            }

            let matched = (this.relationships.byProgram[this.selectedProgramKey] || [])
                .reduce((set, edge) => {
                    set[edge.stateKey] = true;
                    return set;
                }, {});

            return this.stateItemsWithCounts.filter((item) => matched[item.key]);
        },

        programsForSelectedState() {
            if (!this.selectedStateKey) {
                return [];
            }

            let matched = (this.relationships.byState[this.selectedStateKey] || [])
                .reduce((set, edge) => {
                    set[edge.programKey] = true;
                    return set;
                }, {});

            return this.programItemsWithCounts.filter((item) => matched[item.key]);
        },

        scopeSummary() {
            let parts = [this.selectedGene, this.selectedTissueLabel];

            if (this.selectedCellTypeOption) {
                parts.push(this.selectedCellTypeOption.label);
            }

            return parts.filter((part) => !!part).join(" · ");
        },

        // The canvas heading: what this particular picture is, in one line, for a
        // reader who arrived on a shared link and never touched the scope band.
        //
        // Reads as prose rather than `scopeSummary`'s separated parts -- "PPARG in
        // adipose adipocytes" is the sentence the canvas is answering, and the band
        // above already shows the same three values as fields.
        canvasHeadingTitle() {
            let scope = [this.selectedTissueLabel, this.selectedCellTypeOption && this.selectedCellTypeOption.label]
                .filter((part) => !!part)
                .join(" ");

            if (!this.selectedGene) {
                return "";
            }

            return scope ? `${this.selectedGene} in ${scope}` : this.selectedGene;
        },

        // Counts only, and only for lists that have something in them. An empty list
        // is not drawn on the canvas, so claiming "0 cell states" here would describe
        // a panel the reader cannot see.
        canvasHeadingSubtitle() {
            let parts = [];

            if (this.programItems.length) {
                parts.push(`${this.programItems.length} associated gene program${this.programItems.length === 1 ? "" : "s"}`);
            }

            if (this.stateItems.length) {
                parts.push(`${this.stateItems.length} cell state${this.stateItems.length === 1 ? "" : "s"}`);
            }

            return parts.join(" · ");
        },

        // Why there are no association lines, when there are none.
        //
        // This has to be ON the canvas, not only in the legend: the legend opens
        // collapsed, so an empty fan with its explanation behind a click reads as a
        // broken view rather than as a filter doing its job. Switching the metric to
        // GSEA q is the case that found it -- far fewer associations survive FDR
        // correction than survive a raw p-value, so the same 0.05 threshold can
        // legitimately empty the picture, and nothing said so.
        //
        // The two reasons are reported separately for the same reason the legend
        // keeps them apart: "above the threshold" is a filter the reader can undo,
        // "not reported" is not.
        edgeEmptyNotice() {
            if (!this.relationshipRows.length || this.edgeSummary.shown) {
                return "";
            }

            let { metricLabel, nonSignificant, unreported } = this.edgeSummary;

            if (nonSignificant) {
                return `No ${metricLabel} < ${this.significanceThreshold} associations here — `
                    + `${nonSignificant} reported above the threshold. Uncheck the filter under `
                    + `Association scores to draw them.`;
            }

            if (unreported) {
                return `No ${metricLabel} is reported on any of the ${unreported} associations in `
                    + `this scope. Try the other metric under Association scores.`;
            }

            return "No program–state associations reported in this scope.";
        }
    },

    watch: {
        // Lazily, and once. The card is below the canvas and this file is the whole
        // portal's single-cell catalogue, so there is no reason to pay for it before
        // a tissue exists to look up -- and no reason to pay for it twice after.
        activeDatasetId(datasetId) {
            if (datasetId) {
                this.ensureDatasetMetadata();
            }
        },

        // Only fetched when a program is actually selected, and cached after.
        selectedProgramKey(programId) {
            if (!programId) {
                return;
            }

            this.ensureQcMetadata();
            this.ensurePhenotypes();
            this.loadProgramDetail(programId);
            this.loadProgramTraits(programId);
            // Selecting on the canvas has to take the card to the thing selected.
            // The card's own list and cross-links set the tab themselves, so this
            // being unconditional is harmless -- it agrees with them.
            this.activeMetadataTab = "program";
            this.revealProgram(programId);
        },

        selectedStateKey(stateId) {
            if (!stateId) {
                return;
            }

            this.ensurePhenotypes();
            this.loadStateTraits(stateId);
            this.activeMetadataTab = "state";
            this.revealState(stateId);
        },

        searchedGene(value) {
            let query = (value || "").trim();

            this.geneSearchError = "";

            if (this.skipSuggestionLookup) {
                this.skipSuggestionLookup = false;
                return;
            }

            this.clearSuggestionTimer();

            if (query.length < MIN_SUGGESTION_LENGTH) {
                this.geneSuggestions = [];
                this.isLoadingSuggestions = false;
                this.noGeneSuggestions = false;
                return;
            }

            this.isLoadingSuggestions = true;
            this.noGeneSuggestions = false;
            this.suggestionTimer = setTimeout(() => this.lookupGenes(query), SUGGESTION_DEBOUNCE_MS);
        }
    },

    async created() {
        await this.initializeFromQuery();
    },

    beforeDestroy() {
        this.clearSuggestionTimer();
    },

    methods: {
        // --- query string ------------------------------------------------------
        //
        // The param names are v1's, so a link is portable between the two versions.
        // `cell_state` and `gene_program` are NOT mutually exclusive here the way
        // they are in v1: v1 has one detail panel, v2 has two independent lists, so
        // both can be selected and both can appear in the URL.
        //
        // Writes use replaceState, never pushState. v1 pushes, which means Back
        // rewinds the URL while the page keeps showing the newer state -- the URL
        // and the interface disagree until a reload. Replacing keeps the URL
        // always-current and always-shareable, at the cost of not being able to Back
        // through a session's selections. Restoring that would mean a popstate
        // handler that re-runs the load chain.
        currentQueryParams() {
            let params = new URLSearchParams(window.location.search || "");

            return {
                gene: params.get("gene") || "",
                tissue: params.get("tissue") || "",
                cell_type: params.get("cell_type") || "",
                cell_state: params.get("cell_state") || "",
                gene_program: params.get("gene_program") || ""
            };
        },

        syncQueryParams(paramMap = {}) {
            if (this.isHydratingFromQuery || typeof window === "undefined") {
                return;
            }

            let url = new URL(window.location.href);
            let searchParams = new URLSearchParams(url.search || "");

            Object.keys(paramMap).forEach((key) => {
                let value = paramMap[key];

                if (value === null || value === undefined || value === "") {
                    searchParams.delete(key);
                } else {
                    searchParams.set(key, value);
                }
            });

            let nextSearch = searchParams.toString();
            let nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash || ""}`;

            window.history.replaceState({ path: nextUrl }, "", nextUrl);
        },

        // Resolves a `?tissue=` param against the loaded list.
        //
        // The param was always a tissue key, and the selection is now a tissue key
        // too, so this is a membership test rather than a conversion -- the three
        // ways in (config key, unlisted key, label) collapsed into one. Links
        // written by the old version still resolve, which is the point; normalizing
        // covers a param that arrives with different casing or separators.
        tissueFromParam(param) {
            if (!param) {
                return "";
            }

            let wanted = normalizeKey(param);

            let match = this.availableTissues.find((tissue) => tissue.key === wanted)
                || this.availableTissues.find((tissue) => normalizeKey(tissue.label) === wanted);

            return match ? match.key : "";
        },

        async initializeFromQuery() {
            if (typeof window === "undefined") {
                return;
            }

            let query = this.currentQueryParams();
            let initialGene = query.gene || (this.browserConfig.gene ? String(this.browserConfig.gene) : "");

            if (!initialGene) {
                return;
            }

            this.isHydratingFromQuery = true;

            try {
                // Fill the input without triggering the autocomplete lookup for a
                // gene we are about to load outright.
                this.skipSuggestionLookup = true;
                this.searchedGene = normalizeGeneLabel(initialGene);
                await this.submitGeneSearch(initialGene);

                if (!this.selectedGene || !this.availableTissues.length) {
                    return;
                }

                let tissue = this.tissueFromParam(query.tissue);

                if (!tissue) {
                    return;
                }

                // submitGeneSearch auto-selects when there is exactly one tissue, so
                // re-selecting the same one here would refetch its cell types for
                // nothing.
                if (tissue !== this.selectedTissueKey) {
                    await this.selectTissue({ key: tissue });
                }

                if (!query.cell_type) {
                    return;
                }

                let cellType = this.cellTypeOptions.find((option) => option.key === query.cell_type
                    || normalizeKey(option.key) === normalizeKey(query.cell_type));

                if (!cellType) {
                    return;
                }

                await this.selectCellType(cellType);

                // Both lists are populated by now, so a selection can be validated
                // against them rather than set blindly -- a stale link should leave
                // nothing selected, not highlight a row that is not there.
                if (query.gene_program && this.programOrder[query.gene_program] !== undefined) {
                    this.selectedProgramKey = query.gene_program;
                }

                if (query.cell_state && this.stateOrder[query.cell_state] !== undefined) {
                    this.selectedStateKey = query.cell_state;
                }
            } finally {
                this.isHydratingFromQuery = false;
                // Write back what actually resolved, so a link carrying a stale
                // cell type or a dead gene does not keep advertising it.
                this.syncQueryParams(this.selectionParams());
            }
        },

        // The full param set implied by the current selection. Used after hydration
        // and anywhere the whole state is rewritten at once.
        selectionParams() {
            return {
                gene: this.selectedGene || "",
                tissue: this.selectedTissueKey,
                cell_type: this.selectedCellTypeKey || "",
                cell_state: this.selectedStateKey || "",
                gene_program: this.selectedProgramKey || ""
            };
        },

        // One row of a match table, from either direction. `item` is the matched
        // entity's list row, which always exists -- edges are only built between
        // endpoints that are both on the canvas.
        //
        // Sorted by the metric currently driving the edges, so the table's order
        // agrees with the picture. Both metrics are printed either way.
        matchRow(edge, item, fallbackKey) {
            return {
                key: fallbackKey,
                label: item ? item.label : fallbackKey,
                color: item ? item.color : null,
                gseaText: formatSignificance(edge.gseaP),
                qText: formatSignificance(edge.gseaQ),
                sortValue: Number.isFinite(edge.value) ? edge.value : Infinity
            };
        },

        // The searched gene's loading in every program on the canvas.
        //
        // **This is a fan-out, and it is the expensive thing in this component.**
        // There is no gene-keyed loading index, so each program costs its own
        // request, and each response is the program's FULL gene list -- ~4900 rows
        // for one islet beta program. Twenty-five programs is ~120,000 rows
        // downloaded to extract 25 numbers.
        //
        // Three things keep that acceptable:
        //
        // 1. Concurrency is capped, so it does not open 25 sockets at once.
        // 2. Only the one gene's value is kept; the rows are discarded as each
        //    response lands. The full rows are cached only for a program the user
        //    actually opens, by loadProgramDetail().
        // 3. It runs in the background after the canvas has already rendered, and
        //    the lines appear as values arrive. Nothing waits on it.
        //
        // If a gene-keyed loading index ever appears, this whole method collapses
        // into one request.
        async loadGeneLoadings(cellTypeKey) {
            let tissueKey = this.selectedTissueKey;
            let programKeys = this.programItems.map((item) => item.key);

            if (!tissueKey || !cellTypeKey || !this.selectedGene || !programKeys.length) {
                return;
            }

            let run = ++this.geneLoadingRun;
            let gene = this.selectedGene;

            this.geneLoadingByProgram = {};
            this.geneLoadingsDone = 0;
            this.geneLoadingsTotal = programKeys.length;
            this.geneLoadingsAbsent = 0;
            this.geneLoadingsFailed = 0;

            let queue = programKeys.slice();
            let resolved = {};
            // Two different facts, reported separately: the gene is not in this
            // program's index, versus the request for it did not come back.
            let absent = 0;
            let failed = 0;

            let worker = async () => {
                while (queue.length) {
                    // The scope changed under us -- stop, and do not write.
                    if (run !== this.geneLoadingRun) {
                        return;
                    }

                    let programId = queue.shift();

                    try {
                        let rows = rowsFromResponse(
                            await fetchJson(this.api.programGenes(tissueKey, cellTypeKey, programId))
                        );
                        let value = this.geneLoadingFromRows(rows, gene);

                        if (value !== null) {
                            resolved[programId] = value;
                        } else {
                            // The request succeeded and the gene is genuinely not in
                            // this program's loading index. Distinct from a failure.
                            absent += 1;
                        }
                    } catch (error) {
                        // One program failing leaves its line undrawn -- but it is
                        // counted and reported, and the reason goes to the console.
                        //
                        // This catch used to be silent, which hid a ReferenceError in
                        // geneLoadingFromRows behind a legend line reading "10 with no
                        // loading reported": indistinguishable from the API simply
                        // not having the gene. A swallowed exception here looks
                        // exactly like real missing data, so it must not be swallowed.
                        failed += 1;
                        // eslint-disable-next-line no-console
                        console.error(`LIGER: gene loading failed for ${programId}`, error);
                    }

                    if (run !== this.geneLoadingRun) {
                        return;
                    }

                    this.geneLoadingsDone += 1;
                    this.geneLoadingsAbsent = absent;
                    this.geneLoadingsFailed = failed;
                    // Replaced rather than mutated so Vue 2 sees each arrival and
                    // the lines appear progressively.
                    this.geneLoadingByProgram = { ...resolved };
                }
            };

            await Promise.all(
                Array.from({ length: Math.min(GENE_LOADING_CONCURRENCY, queue.length) }, worker)
            );
        },

        // Pulls one gene's loading out of a program's gene list. Case-insensitive,
        // because the gene came from the search box.
        geneLoadingFromRows(rows = [], gene) {
            let wanted = String(gene || "").toUpperCase();

            for (let i = 0; i < rows.length; i++) {
                if (String(field(rows[i], ["gene"]) || "").toUpperCase() === wanted) {
                    return numericField(rows[i], ["value", "loading"]);
                }
            }

            return null;
        },

        // Brings a row into view on the canvas. Needed because the card is BELOW the
        // canvas: a selection made down there changes a highlight the reader cannot
        // see, which is indistinguishable from nothing happening.
        //
        // Skipped when the row is already on screen, so clicking a canvas row does
        // not yank the view out from under the click.
        revealRow(listTop, index) {
            let stage = this.$refs.stage;

            if (!stage || index === undefined || index < 0) {
                return;
            }

            stage.revealWorldPoint(
                PROGRAM_LIST_X + PROGRAM_LIST_WIDTH / 2,
                listTop + PROGRAM_HEADER_HEIGHT + index * LIST_ROW_HEIGHT + LIST_ROW_HEIGHT / 2
            );
        },

        revealProgram(programId) {
            this.$nextTick(() => this.revealRow(this.programListTop, this.programOrder[programId]));
        },

        revealState(stateId) {
            this.$nextTick(() => {
                let stage = this.$refs.stage;
                let index = this.stateOrder[stateId];

                if (!stage || index === undefined) {
                    return;
                }

                stage.revealWorldPoint(
                    STATE_LIST_X + STATE_LIST_WIDTH / 2,
                    this.stateListTop + STATE_HEADER_HEIGHT + index * LIST_ROW_HEIGHT + LIST_ROW_HEIGHT / 2
                );
            });
        },

        async ensurePhenotypes() {
            if (this.phenotypesLoaded) {
                return;
            }

            // Marked loaded up front: a failure here degrades the trait tables to
            // raw codes, and retrying on every selection would hammer a host that is
            // already not answering.
            this.phenotypesLoaded = true;

            try {
                this.phenotypeRows = rowsFromResponse(await fetchJson(this.api.traitPhenotypes()));
            } catch (error) {
                this.phenotypeRows = [];
            }
        },

        async loadTraits(cacheKey, url) {
            if (this.traitCache[cacheKey] || this.loadingTraitKey === cacheKey) {
                return;
            }

            this.loadingTraitKey = cacheKey;
            this.traitError = "";

            try {
                let rows = rowsFromResponse(await fetchJson(url));

                // Vue 2 cannot see a new key on a plain object.
                this.traitCache = { ...this.traitCache, [cacheKey]: rows };
            } catch (error) {
                this.traitError = "Unable to load trait associations.";
            } finally {
                if (this.loadingTraitKey === cacheKey) {
                    this.loadingTraitKey = "";
                }
            }
        },

        loadProgramTraits(programId) {
            if (!this.selectedTissueKey || !this.selectedCellTypeKey) {
                return;
            }

            return this.loadTraits(
                `program:${programId}`,
                this.api.programTraits(this.selectedTissueKey, this.selectedCellTypeKey, programId)
            );
        },

        loadStateTraits(stateId) {
            if (!this.selectedCellTypeKey) {
                return;
            }

            if (!this.selectedTissueKey) {
                return;
            }

            return this.loadTraits(
                `state:${stateId}`,
                this.api.cellStateTraits(this.selectedTissueKey, this.selectedCellTypeKey, stateId)
            );
        },

        async ensureQcMetadata() {
            if (this.qcMetadataRows.length) {
                return;
            }

            try {
                this.qcMetadataRows = rowsFromResponse(await fetchJson(this.api.qcMetadata()));
            } catch (error) {
                // The QC table still renders without it, using raw signature ids.
                this.qcMetadataRows = [];
            }
        },

        // Three per-program indexes, in parallel, cached by program id. Only fetched
        // when a program is actually selected -- fanning these out across every
        // program up front is what made v1's bulk trait matrix expensive.
        async loadProgramDetail(programId) {
            if (!programId || this.programDetailCache[programId] || this.loadingProgramDetailKey === programId) {
                return;
            }

            let tissueKey = this.selectedTissueKey;
            let cellType = this.selectedCellTypeKey;

            if (!tissueKey || !cellType) {
                return;
            }

            this.loadingProgramDetailKey = programId;
            this.programDetailError = "";

            // Settled individually, NOT Promise.all.
            //
            // These are three independent indexes and one of them failing says
            // nothing about the other two. Under Promise.all a single rejection
            // discarded all three results and reported one generic message, so a
            // fault in any one index blanked Gene loadings, Gene sets and QC
            // signatures together -- and `gene-program-gene-set-factor` may legitimately
            // be absent on some portals, which would have taken the other two down
            // with it. This is the same shape of mistake as the gene-loading fan-out
            // that once turned a ReferenceError into plausible-looking missing data;
            // see "The fan-out reports absent and failed separately" in ../README.md.
            let sources = [
                { key: "genes", label: "gene loadings", url: this.api.programGenes(tissueKey, cellType, programId) },
                { key: "geneSets", label: "gene sets", url: this.api.programGeneSets(tissueKey, cellType, programId) },
                { key: "qc", label: "QC signatures", url: this.api.programQc(tissueKey, cellType, programId) }
            ];

            try {
                let detail = {};
                let failed = [];

                await Promise.all(sources.map(async (source) => {
                    try {
                        detail[source.key] = rowsFromResponse(await fetchJson(source.url));
                    } catch (error) {
                        // Left undefined rather than set to []. The panel tests
                        // `Array.isArray` to decide whether a source loaded, so an
                        // empty array here would assert "this program has none"
                        // where the fact is "we could not ask".
                        failed.push(source.label);
                        console.error(`LIGER: ${source.label} failed for ${programId}`, error);
                    }
                }));

                // Vue 2 cannot see a new key on a plain object, so replace the map.
                this.programDetailCache = {
                    ...this.programDetailCache,
                    [programId]: detail
                };

                // Names what actually failed, so an empty tab is never ambiguous
                // between "nothing reported" and "the request did not come back".
                this.programDetailError = failed.length
                    ? `Unable to load ${failed.join(" or ")} for this program. Everything else here is unaffected.`
                    : "";
            } finally {
                if (this.loadingProgramDetailKey === programId) {
                    this.loadingProgramDetailKey = "";
                }
            }
        },

        async ensureDatasetMetadata() {
            if (this.datasetMetadataLoaded || this.isLoadingDatasetMetadata) {
                return;
            }

            this.isLoadingDatasetMetadata = true;
            this.datasetMetadataError = "";

            try {
                // JSONL, not JSON. See fetchJsonLines() in ../ligerApi.js.
                this.datasetMetadataRows = await fetchJsonLines(this.api.datasetMetadata());
                this.datasetMetadataLoaded = true;

                if (!this.datasetMetadataRows.length) {
                    this.datasetMetadataError = "The dataset metadata file is empty.";
                }
            } catch (error) {
                this.datasetMetadataError = "Unable to load dataset metadata.";
            } finally {
                this.isLoadingDatasetMetadata = false;
            }
        },

        clearSuggestionTimer() {
            if (this.suggestionTimer) {
                clearTimeout(this.suggestionTimer);
                this.suggestionTimer = null;
            }
        },

        // The config allowlist is the one legitimately client-side piece of tissue
        // config left: which tissues a portal chooses to DISPLAY is curation, not
        // identity.
        tissueAllowed(tissueKey) {
            if (!this.configuredTissueKeys.length) {
                return true;
            }

            return this.configuredTissueKeys.includes(tissueKey);
        },

        async lookupGenes(query) {
            try {
                let payload = await fetchJson(this.api.matchGene(query));
                let matches = rowsFromResponse(payload).slice(0, 10);

                // The input may have moved on while this was in flight.
                if (query !== this.searchedGene.trim()) {
                    return;
                }

                this.geneSuggestions = matches;
                this.noGeneSuggestions = matches.length === 0;
            } catch (error) {
                this.geneSuggestions = [];
                this.noGeneSuggestions = true;
                this.geneSearchError = "Unable to load gene suggestions right now.";
            } finally {
                if (query === this.searchedGene.trim()) {
                    this.isLoadingSuggestions = false;
                }
            }
        },

        onSearchInput(value) {
            this.searchedGene = value;
        },

        async onSuggestionSelected(label) {
            this.skipSuggestionLookup = true;
            this.searchedGene = label;
            this.geneSuggestions = [];
            this.noGeneSuggestions = false;
            this.isLoadingSuggestions = false;
            await this.submitGeneSearch(label);
        },

        resetGeneResults() {
            this.availableTissues = [];
            this.selectedTissueKey = "";
            this.resetTissueResults();
        },

        resetTissueResults() {
            this.cellTypeRows = [];
            this.selectedCellTypeKey = "";
            this.cellTypeError = "";
            this.resetCellTypeResults();
        },

        resetCellTypeResults() {
            this.programRows = [];
            this.programInfoRows = [];
            this.programError = "";
            this.selectedProgramKey = "";
            this.stateRows = [];
            this.stateMetadataRows = [];
            this.stateError = "";
            this.selectedStateKey = "";
            this.relationshipRows = [];
            this.relationshipError = "";
            // A stale hover would keep dimming rows that belong to a scope the user
            // has already left.
            this.hovered = null;
            // Invalidates any in-flight gene-loading fan-out, so responses for the
            // old cell type cannot land as lines in the new one.
            this.geneLoadingRun += 1;
            this.geneLoadingByProgram = {};
            this.geneLoadingsDone = 0;
            this.geneLoadingsTotal = 0;
            this.geneLoadingsAbsent = 0;
            this.geneLoadingsFailed = 0;
        },

        async submitGeneSearch(gene) {
            let normalizedGene = normalizeGeneLabel(gene).trim();

            this.clearSuggestionTimer();
            this.resetGeneResults();
            this.geneSearchError = "";
            this.geneSuggestions = [];
            this.noGeneSuggestions = false;
            this.isLoadingSuggestions = false;

            if (!normalizedGene) {
                this.selectedGene = "";
                this.syncQueryParams({ gene: "", tissue: "", cell_type: "", cell_state: "", gene_program: "" });
                return;
            }

            this.isLoadingGeneData = true;
            this.selectedGene = normalizedGene;
            // A new gene invalidates everything below it.
            this.syncQueryParams({
                gene: normalizedGene,
                tissue: "",
                cell_type: "",
                cell_state: "",
                gene_program: ""
            });

            try {
                // Both gene-level queries, to derive the tissue list. They used to
                // do double duty as the signal for which keying convention the
                // portal spoke; there is only one convention now.
                let [cellStatePayload, programPayload] = await Promise.all([
                    fetchJson(this.api.geneCellStates(normalizedGene)),
                    fetchJson(this.api.genePrograms(normalizedGene))
                ]);

                let cellStateRows = rowsFromResponse(cellStatePayload);
                let programRows = rowsFromResponse(programPayload);

                // The tissue list is whatever the rows report, with no table to
                // check it against -- which is the point. The old version resolved
                // each row through a hardcoded 9-tissue config and dropped anything
                // missing from it, so `bone`, `bonemarrow` and `tendon` stayed
                // invisible for as long as the config went unedited.
                let byKey = {};

                [].concat(cellStateRows, programRows).forEach((row) => {
                    let key = rowTissueKey(row);

                    if (key && !byKey[key] && this.tissueAllowed(key)) {
                        byKey[key] = { key, label: tissueLabel(key, row) };
                    }
                });

                let tissues = Object.keys(byKey)
                    .map((key) => byKey[key])
                    .sort((a, b) => a.label.localeCompare(b.label));

                this.availableTissues = tissues;

                if (!tissues.length) {
                    this.geneSearchError = `No tissues are currently available for ${normalizedGene}.`;
                    return;
                }

                // `tissues` is now [{ key, label }], so the entry IS the option.
                if (tissues.length === 1) {
                    await this.selectTissue(tissues[0]);
                }
            } catch (error) {
                this.selectedGene = "";
                this.geneSearchError = "Unable to load LIGER data for that gene.";
                this.syncQueryParams({ gene: "", tissue: "", cell_type: "", cell_state: "", gene_program: "" });
            } finally {
                this.isLoadingGeneData = false;
            }
        },

        async selectTissue(option) {
            this.resetTissueResults();
            this.selectedTissueKey = option.key;
            this.syncQueryParams({
                // The selection IS the param now -- no conversion.
                tissue: option.key,
                cell_type: "",
                cell_state: "",
                gene_program: ""
            });
            await this.loadCellTypes(option.key);
        },

        async loadCellTypes(tissueKey) {
            if (!this.selectedGene || !tissueKey) {
                return;
            }

            // The query takes the key; the messages take the label. `vat` is what
            // the API is asked for, "VAT" is what a reader is told about.
            let label = tissueLabel(tissueKey);

            this.isLoadingCellTypes = true;
            this.cellTypeError = "";

            try {
                let payload = await fetchJson(this.api.cellTypeExpression(tissueKey, this.selectedGene));

                this.cellTypeRows = rowsFromResponse(payload).filter((row) => !!cellTypeKey(row));

                if (!this.cellTypeRows.length) {
                    this.cellTypeError = `No cell types for ${this.selectedGene} in ${label}.`;
                }
            } catch (error) {
                this.cellTypeError = `Unable to load cell types for ${label}.`;
            } finally {
                this.isLoadingCellTypes = false;
            }
        },

        async selectCellType(option) {
            this.resetCellTypeResults();
            this.selectedCellTypeKey = option.key;
            this.syncQueryParams({
                cell_type: option.key,
                cell_state: "",
                gene_program: ""
            });

            // In parallel. The relationship heatmap is NOT lazily loaded behind a
            // click: its rows are the edges, and the edges are the point of showing
            // both lists at once.
            //
            // The QC dictionary joins this set because it is now what identifies a
            // QC signature in the heatmap rows. It is fetched once per session and
            // cached, and `relationships` is a computed, so the edges re-filter on
            // their own if it lands after them.
            await Promise.all([
                this.loadPrograms(option),
                this.loadStates(option),
                this.loadRelationships(option),
                this.ensureQcMetadata()
            ]);

            // Deliberately NOT awaited. The gene-loading fan-out is one request per
            // program (see loadGeneLoadings) and the canvas is already usable
            // without it -- the hub lines fill in behind the rendered picture.
            this.loadGeneLoadings(option.key);
        },

        async loadPrograms(cellType) {
            if (!this.selectedGene || !this.selectedTissueKey || !cellType) {
                return;
            }

            let tissueKey = this.selectedTissueKey;

            this.isLoadingPrograms = true;
            this.programError = "";

            try {
                let [expressionPayload, infoPayload] = await Promise.all([
                    fetchJson(this.api.programExpression(tissueKey, cellType.key, this.selectedGene)),
                    // gene-program-factor is still fetched for `top_genes`, which
                    // only it carries. The readable label now rides along on the
                    // expression rows as `factor_label`, so this is no longer load
                    // bearing for the node labels -- programLabel() prefers the info
                    // row when present and falls back to the expression row's own
                    // field, which means the canvas renders correctly even if this
                    // request is the one that fails.
                    fetchJson(this.api.programInfo(tissueKey, cellType.key))
                ]);

                // No model filter any more: the API serves one factorization and the
                // argument is gone. `model` survives as a field on these rows, so a
                // future multi-model index would need the filter back here.
                this.programRows = rowsFromResponse(expressionPayload);
                this.programInfoRows = rowsFromResponse(infoPayload);

                if (!this.programRows.length) {
                    this.programError = `No gene programs for ${this.selectedGene} in ${cellType.label}.`;
                }
            } catch (error) {
                this.programError = `Unable to load gene programs for ${cellType.label}.`;
            } finally {
                this.isLoadingPrograms = false;
            }
        },

        async loadStates(cellType) {
            if (!this.selectedGene || !this.selectedTissueKey || !cellType) {
                return;
            }

            // One key for both now. These two used to take DIFFERENT first
            // arguments -- the expression endpoint a per-portal dataset-or-tissue
            // key, the metadata endpoint a plain tissue key -- and swapping them
            // returned HTTP 500 on one portal or the other.
            let tissueKey = this.selectedTissueKey;

            this.stateError = "";

            try {
                let [expressionPayload, metadataPayload] = await Promise.all([
                    fetchJson(this.api.cellStateExpression(tissueKey, cellType.key, this.selectedGene)),
                    // Carries `display_name`, which is the readable state label.
                    fetchJson(this.api.cellStateMetadata(tissueKey, cellType.key))
                ]);

                // QC signatures are filtered here as well as in the edge builder:
                // they are pipeline diagnostics, not cell states a reader browses.
                this.stateRows = rowsFromResponse(expressionPayload)
                    .filter((row) => !!stateKey(row))
                    .filter((row) => !isQcStateRow(row, this.qcSignatureIndex));
                this.stateMetadataRows = rowsFromResponse(metadataPayload);

                if (!this.stateRows.length) {
                    this.stateError = `No cell states for ${this.selectedGene} in ${cellType.label}.`;
                }
            } catch (error) {
                this.stateError = `Unable to load cell states for ${cellType.label}.`;
            }
        },

        async loadRelationships(cellType) {
            if (!this.selectedTissueKey || !cellType) {
                return;
            }

            this.relationshipError = "";

            try {
                let payload = await fetchJson(this.api.relationshipHeatmap(this.selectedTissueKey, cellType.key));

                this.relationshipRows = rowsFromResponse(payload);

                if (!this.relationshipRows.length) {
                    this.relationshipError = `No program/state associations reported for ${cellType.label}.`;
                }
            } catch (error) {
                this.relationshipError = `Unable to load program/state associations for ${cellType.label}.`;
            }
        },

        // Canvas rows toggle: clicking the selected row is how you clear it, since
        // the canvas has no other affordance for that.
        selectProgram(program) {
            this.setProgram(this.selectedProgramKey === program.key ? "" : program.key);
        },

        selectState(state) {
            this.setState(this.selectedStateKey === state.key ? "" : state.key);
        },

        // The metadata card always SETS. Its two entry points are a pick-one list
        // (which only renders when nothing is selected) and a cross-link from the
        // other entity's match table -- and a cross-link back to something already
        // selected has to land on it, not toggle it off.
        setProgram(programKey) {
            this.selectedProgramKey = programKey || "";
            this.syncQueryParams({ gene_program: this.selectedProgramKey });
        },

        setState(stateKey) {
            this.selectedStateKey = stateKey || "";
            this.syncQueryParams({ cell_state: this.selectedStateKey });
        },

        onHoverProgram(program) {
            this.hovered = program ? { kind: "program", key: program.key } : null;
        },

        onHoverState(state) {
            this.hovered = state ? { kind: "state", key: state.key } : null;
        },

        isDimmed(highlighted, key) {
            return !!highlighted && !highlighted[key];
        },

        // Three levels, not two: at rest every edge is faint enough that a few
        // hundred of them read as a texture rather than a wall; hovering a row lifts
        // its edges to full strength and pushes the rest nearly out.
        edgeOpacity(edge) {
            // A directly hovered line wins over a hovered row: the reader is
            // pointing at that one association, not at the row's whole fan.
            if (this.hoveredEdgeKey) {
                return this.hoveredEdgeKey === edge.key ? 0.95 : 0.05;
            }

            if (!this.hovered) {
                return 0.3;
            }

            let related = this.hovered.kind === "program"
                ? this.hovered.key === edge.programKey
                : this.hovered.key === edge.stateKey;

            return related ? 0.95 : 0.05;
        },

        // --- line hover ---

        // A drawn line is 2-11 world pixels wide, so the pointer needs a wider
        // target than the mark. Floored rather than scaled: a strong association is
        // already easy to hit and does not need an even bigger catchment.
        hitWidth(drawnWidth) {
            return Math.max(drawnWidth, EDGE_HIT_WIDTH);
        },

        // Anchored where the pointer crossed the line, and NOT updated on mousemove.
        // The render function holds a few hundred paths, so a reactive write at
        // pointer-move rate re-diffs all of them ~60 times a second for a tooltip
        // that is already where the reader is pointing.
        positionTooltip(event, payload) {
            let host = this.$refs.body;

            if (!host) {
                return;
            }

            let rect = host.getBoundingClientRect();
            let x = event.clientX - rect.left;
            let y = event.clientY - rect.top;

            // The prose form is both wider and taller than the line readout, so it
            // has to flip sooner -- one margin for both would let it run off the
            // right edge exactly where it is longest.
            let prose = !!payload.paragraphs;

            this.canvasTooltip = {
                ...payload,
                x,
                y,
                flipX: x > rect.width - (prose ? TOOLTIP_PROSE_MARGIN_X : TOOLTIP_EDGE_MARGIN_X),
                flipY: y > rect.height - (prose ? TOOLTIP_PROSE_MARGIN_Y : TOOLTIP_EDGE_MARGIN_Y)
            };
        },

        onEdgeEnter(edge, event) {
            this.hoveredEdgeKey = edge.key;

            let stats = [
                { label: "GSEA P", value: formatSignificance(edge.gseaP) },
                { label: "GSEA q", value: formatSignificance(edge.gseaQ) },
                // The width's own quantity, named with the metric driving it -- so a
                // reader comparing two lines can see what the difference is in.
                {
                    label: `−log₁₀ ${this.edgeSummary.metricLabel}`,
                    value: edge.score.toFixed(1)
                }
            ];

            this.positionTooltip(event, {
                from: this.programLabelByKey[edge.programKey] || edge.programKey,
                to: this.stateLabelByKey[edge.stateKey] || edge.stateKey,
                // The state's color, matching the line and the swatch on its row.
                color: edge.color,
                stats,
                // Only when it is true. A clamped line is drawn dashed, and the
                // dash is the one thing a reader cannot look up anywhere else.
                note: edge.clamped
                    ? `Above the ${this.edgeSummary.ceiling} width ceiling — the line is clamped`
                    : ""
            });
        },

        onEdgeLeave() {
            this.hoveredEdgeKey = "";
            this.canvasTooltip = null;
        },

        // Hovering a gene link sets the hovered *program* rather than a link-specific
        // key: that already lifts this link to 0.95 and dims the rest, and it also
        // dims the cell states the program does not match -- which is the question
        // the reader is asking by pointing at it.
        onGeneLinkEnter(link, event) {
            this.hovered = { kind: "program", key: link.programKey };

            this.positionTooltip(event, {
                from: this.geneLabelOrGene,
                to: this.programLabelByKey[link.programKey] || link.programKey,
                color: "",
                stats: [
                    { label: "Gene loading", value: formatRawMetric(link.loading) }
                ],
                note: ""
            });
        },

        onGeneLinkLeave() {
            this.hovered = null;
            this.canvasTooltip = null;
        },

        // The column heads use the same tooltip, and touch neither `hovered` nor
        // `hoveredEdgeKey`: a reader reading what a column means is not pointing at
        // any row, and dimming the canvas under them would be noise.
        onColumnHelpEnter(help, event) {
            this.positionTooltip(event, help);
        },

        onColumnHelpLeave() {
            this.canvasTooltip = null;
        }
    }
});
</script>

<template>
    <div id="cell-evolution-browser" class="f-col g-40">
        <!-- Page header -->
        <div class="f-col g-10">
            <div class="f-row g-40">
                <div class="f-col g-10 flex1">
                    <h3 class="bold">{{ pageTitle }}</h3>
                    <h5 class="headline">{{ pageSubtitle }}</h5>
                    <div class="ai-disclosure">
                        <span class="bold">Note:</span> this resource uses AI-assisted curation of program names and cell states; manual review and curation are ongoing. Please see cell state and program metadata for details.
                    </div>
                </div>
                <!-- The figure rides alongside the headline as a thumbnail rather
                     than taking a full-width band of its own: it is orienting
                     material, not a step in the workflow. Clicking it opens the
                     full figure as an overlay. `align-h-bottom` is this repo's
                     `align-items: flex-end`, so the figure and the documentation
                     link under it both sit against the right edge. -->
                <div class="f-col align-h-bottom flex1 g-5">
                    <cell-state-infographic thumbnail />
                    <a :href="documentationUrl" target="_blank" style="width:fit-content">Read Documentation</a>
                </div>
            </div>
        </div>

        <!-- One card: a scope band across the top, the canvas below it. The band is
             the whole of the interface's chrome, so the body is free to be spatial
             rather than a stack of sections. -->
        <div class="browser-card">
            <div class="scope-band">
                <gene-search
                    :value="searchedGene"
                    :selected-gene="selectedGene"
                    :suggestions="geneSuggestions"
                    :loading="isLoadingSuggestions || isLoadingGeneData"
                    :no-matches="noGeneSuggestions"
                    :error="geneSearchError"
                    :example-genes="exampleGenes"
                    @input="onSearchInput"
                    @submit="submitGeneSearch"
                    @select="onSuggestionSelected"
                />

                <div class="band-divider" aria-hidden="true"></div>

                <scope-select
                    label="Tissue"
                    placeholder="Select a tissue"
                    :options="tissueOptions"
                    :value="selectedTissueKey"
                    :disabled-reason="tissueDisabledReason"
                    :loading="isLoadingGeneData"
                    empty-text="No tissues for this gene"
                    @select="selectTissue"
                />

                <div class="band-divider" aria-hidden="true"></div>

                <scope-select
                    label="Cell type"
                    placeholder="Select a cell type"
                    :options="cellTypeOptions"
                    :value="selectedCellTypeKey"
                    :disabled-reason="cellTypeDisabledReason"
                    :loading="isLoadingCellTypes"
                    :error="cellTypeError"
                    empty-text="No cell types for this tissue"
                    @select="selectCellType"
                />
            </div>

            <div ref="body" class="browser-body">
                <!-- One tooltip, for everything on the canvas that has something to
                     say on hover: the association lines and the two column heads.
                     One component rather than two, because a reader crossing between
                     them should not meet two different kinds of popover.

                     Outside CanvasStage on purpose: it is in screen coordinates, so
                     putting it in the world would scale it with the zoom and leave it
                     behind on a pan. That is also what makes it usable from a trigger
                     that IS in the world -- the column heads are scaled, and their
                     tooltip is not.

                     `aria-hidden`, and deliberately so rather than `role="tooltip"`:
                     the triggers are an SVG path and a span, neither focusable, so
                     there is no element for a tooltip role to be associated with and
                     nothing would ever announce it. Every number in here is also in
                     the detail card, which is reachable by keyboard. -->
                <div
                    v-if="canvasTooltip"
                    class="canvas-tooltip"
                    :class="{
                        'flip-x': canvasTooltip.flipX,
                        'flip-y': canvasTooltip.flipY,
                        wide: !!canvasTooltip.paragraphs
                    }"
                    :style="canvasTooltipStyle"
                    aria-hidden="true"
                >
                    <!-- Two head forms. A line joins two things, so its head is the
                         pair; a column heads one thing, so its head is a title. -->
                    <div v-if="canvasTooltip.title" class="tip-title">{{ canvasTooltip.title }}</div>
                    <div v-else class="tip-head">
                        <span class="tip-from">{{ canvasTooltip.from }}</span>
                        <span class="tip-arrow" aria-hidden="true">→</span>
                        <!-- The swatch is the CELL STATE's color -- the same one its
                             row and this line carry -- so it belongs against the
                             endpoint it identifies, not at the head of the line. -->
                        <span
                            v-if="canvasTooltip.color"
                            class="tip-swatch"
                            :style="{ background: canvasTooltip.color }"
                            aria-hidden="true"
                        ></span>
                        <span class="tip-to">{{ canvasTooltip.to }}</span>
                    </div>

                    <dl v-if="canvasTooltip.stats" class="tip-stats">
                        <template v-for="stat in canvasTooltip.stats">
                            <dt :key="stat.label + '-l'">{{ stat.label }}</dt>
                            <dd :key="stat.label + '-v'">{{ stat.value }}</dd>
                        </template>
                    </dl>

                    <p
                        v-for="(paragraph, index) in canvasTooltip.paragraphs"
                        :key="'p' + index"
                        class="tip-text"
                    >{{ paragraph }}</p>

                    <div v-if="canvasTooltip.note" class="tip-note">{{ canvasTooltip.note }}</div>
                </div>

                <canvas-stage
                    v-if="bodyState === 'canvas'"
                    ref="stage"
                    :world-width="worldWidth"
                    :world-height="worldHeight"
                    :content-bounds="contentBounds"
                    :fit-padding="fitPadding"
                >
                    <!-- What this picture is, fixed to the top-left of the viewport.
                         The scope band above shows the same three values as fields;
                         this states them as the result they produced, for a reader
                         who arrived on a link and is looking at the canvas. -->
                    <template v-slot:heading>
                        <div class="canvas-heading">
                            <div class="canvas-heading-title">{{ canvasHeadingTitle }}</div>
                            <div v-if="canvasHeadingSubtitle" class="canvas-heading-subtitle">
                                {{ canvasHeadingSubtitle }}
                            </div>
                            <!-- Only when the fan is empty. An empty canvas has to
                                 say why here, because the counts that explain it
                                 are inside a legend that opens collapsed. -->
                            <div v-if="edgeEmptyNotice" class="canvas-heading-notice">
                                {{ edgeEmptyNotice }}
                            </div>
                        </div>
                    </template>

                    <!-- One SVG for every line, sized to the world. It sits inside
                         the transformed wrapper, so the curves scale with everything
                         else and stay vector-crisp at any zoom. `pointer-events:
                         none` in the stylesheet keeps it from stealing the drag that
                         pans the canvas. -->
                    <svg
                        class="connector-layer"
                        :width="worldWidth"
                        :height="worldHeight"
                        :viewBox="`0 0 ${worldWidth} ${worldHeight}`"
                        aria-hidden="true"
                    >
                        <!-- Gene -> programs, only while nothing has resolved.
                             Structural, carrying no measurement. -->
                        <path
                            v-if="showStructuralConnector"
                            :d="connectorPath"
                            :stroke="structuralLinkColor"
                            stroke-width="2"
                            fill="none"
                        />

                        <!-- Gene -> program links. Width is the searched gene's
                             loading in that program. One neutral color: the quantity
                             is the width, and the target is identified by the row it
                             lands on. -->
                        <path
                            v-for="link in drawnGeneLinks"
                            :key="link.key"
                            :d="link.path"
                            :stroke="geneLinkColor"
                            :stroke-width="link.width"
                            :opacity="link.opacity"
                            stroke-linecap="round"
                            fill="none"
                        />

                        <!-- Program -> state associations. Width is -log10 of the
                             selected GSEA metric; color is the target state's, which
                             is the same color as the swatch on its row. -->
                        <path
                            v-for="edge in edgeGeometry"
                            :key="edge.key"
                            :d="edge.path"
                            :stroke="edge.color"
                            :stroke-width="edge.width"
                            :opacity="edgeOpacity(edge)"
                            :stroke-dasharray="edge.clamped ? '14 5' : null"
                            stroke-linecap="round"
                            fill="none"
                        />

                        <!-- Hit targets, over everything and invisible.
                             A drawn edge is 2-11 world pixels, which is 1-8 on
                             screen at a fitted zoom -- not something a pointer can
                             be expected to land on. Each of these reuses its edge's
                             own `d`, so this costs a second element per line and no
                             extra geometry.

                             Drawn in the same thin-to-thick order as the edges, so
                             where the fan converges the STRONGEST association is the
                             one on top and the one that answers the hover. -->
                        <g class="hit-layer">
                            <path
                                v-for="link in drawnGeneLinks"
                                :key="'hit-' + link.key"
                                :d="link.path"
                                :stroke-width="hitWidth(link.width)"
                                stroke="transparent"
                                fill="none"
                                @mouseenter="onGeneLinkEnter(link, $event)"
                                @mouseleave="onGeneLinkLeave"
                            />
                            <path
                                v-for="edge in edgeGeometry"
                                :key="'hit-' + edge.key"
                                :d="edge.path"
                                :stroke-width="hitWidth(edge.width)"
                                stroke="transparent"
                                fill="none"
                                @mouseenter="onEdgeEnter(edge, $event)"
                                @mouseleave="onEdgeLeave"
                            />
                        </g>
                    </svg>

                    <!-- The gene hub: what the programs on the right are programs
                         *of*. Mirrors the infographic's Gene panel. -->
                    <div class="gene-hub" :style="hubStyle">
                        <div class="hub-eyebrow">Gene</div>
                        <div class="hub-gene">{{ selectedGene }}</div>
                        <div class="hub-scope">{{ selectedTissueLabel }}</div>
                        <div v-if="selectedCellTypeOption" class="hub-scope">{{ selectedCellTypeOption.label }}</div>
                    </div>

                    <!-- The two lists. Each is one panel, absolutely positioned in
                         world coordinates; the rows inside are ordinary flow. -->
                    <div class="canvas-list" :style="programListStyle">
                        <div class="list-header">
                            <div class="list-heading-row">
                                <span class="list-title">Gene programs</span>
                                <span class="list-count">{{ programItems.length }}</span>
                            </div>
                            <div class="list-description">
                                Coordinated patterns of gene activity representing biological processes.
                            </div>

                            <!-- Column heads over the two numeric columns, on the
                                 same geometry the rows use (see the --ce-col-*
                                 variables), so they line up with the values rather
                                 than near them.

                                 Their explanations go through the same tooltip the
                                 association lines use. These triggers are inside the
                                 canvas world and therefore scaled by the zoom, but
                                 the tooltip is not -- it is positioned in screen
                                 coordinates from the pointer, outside CanvasStage,
                                 so its text stays the same size at every zoom.

                                 The dotted underline is the only thing saying there
                                 is anything here to hover. -->
                            <div class="list-columns">
                                <span class="col-spacer" aria-hidden="true"></span>
                                <span
                                    class="col-head"
                                    @mouseenter="onColumnHelpEnter(expressionColumnHelp, $event)"
                                    @mouseleave="onColumnHelpLeave"
                                >EXP</span>
                                <span
                                    class="col-head"
                                    @mouseenter="onColumnHelpEnter(specificityColumnHelp, $event)"
                                    @mouseleave="onColumnHelpLeave"
                                >SPEC</span>
                            </div>
                        </div>

                        <program-row
                            v-for="program in programItems"
                            :key="program.key"
                            :program="program"
                            :selected="program.key === selectedProgramKey"
                            :dimmed="isDimmed(highlightedProgramKeys, program.key)"
                            @select="selectProgram"
                            @hover="onHoverProgram"
                        />
                    </div>

                    <div v-if="stateItems.length" class="canvas-list" :style="stateListStyle">
                        <div class="list-header">
                            <div class="list-heading-row">
                                <span class="list-title">Cell states</span>
                                <span class="list-count">{{ stateItems.length }}</span>
                            </div>
                            <div class="list-description">
                                Cellular phenotypes associated with gene programs.
                            </div>
                        </div>

                        <state-row
                            v-for="state in stateItems"
                            :key="state.key"
                            :state="state"
                            :selected="state.key === selectedStateKey"
                            :dimmed="isDimmed(highlightedStateKeys, state.key)"
                            @select="selectState"
                            @hover="onHoverState"
                        />
                    </div>

                    <!-- Legend and controls for the edges. Fixed to the viewport, not
                         the world, so it stays readable at any zoom. -->
                    <template v-slot:overlay>
                        <div class="edge-legend" data-canvas-interactive>
                            <!-- Collapsible, because it is a key rather than a
                                 control: once a reader has read what the widths mean
                                 it is occluding the top-right of their canvas. The
                                 header is what survives collapsing, so the way back
                                 is in the same place the box was. -->
                            <button
                                type="button"
                                class="legend-toggle"
                                :aria-expanded="String(!legendCollapsed)"
                                :title="legendCollapsed ? 'Show the association scales' : 'Hide the association scales'"
                                @click="legendCollapsed = !legendCollapsed"
                            >
                                <span class="legend-heading">Association scores</span>
                                <!-- One drawn chevron, rotated, rather than the ▾/▴
                                     glyph pair: those two are not the same size in
                                     every font, so the arrow changed weight as it
                                     flipped. -->
                                <svg
                                    class="legend-chevron"
                                    :class="{ open: !legendCollapsed }"
                                    viewBox="0 0 16 16"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M 3.5 6 L 8 10.5 L 12.5 6"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </button>

                            <div v-show="!legendCollapsed" class="legend-body">
                                <!-- Gene links first, because they are the left half
                                     of the picture. Width is a loading, not a
                                     p-value, so it gets its own scale readout. -->
                                <div class="legend-row">
                                    <span class="legend-title">{{ geneLabelOrGene }} → program</span>
                                    <span class="legend-count">({{ geneLinkSummary.resolved }})</span>
                                </div>
                                <div class="legend-label">Gene loading</div>
                                <div class="legend-scale">
                                    <span class="scale-end">0</span>
                                    <svg class="scale-swatch" viewBox="0 0 100 11"
                                         preserveAspectRatio="none" aria-hidden="true">
                                        <polygon points="0,4.5 100,0 100,11 0,6.5"
                                                 :fill="geneLinkColor" opacity=".5" />
                                    </svg>
                                    <span class="scale-end">{{ geneLinkSummary.ceiling }}</span>
                                </div>
                                <div v-if="geneLinkSummary.pending" class="legend-notes">
                                    {{ geneLinkSummary.pending }} of {{ geneLinkSummary.total }} programs still loading…
                                </div>
                                <div v-else-if="geneLinkSummary.absent || geneLinkSummary.failed" class="legend-notes">
                                    <div v-if="geneLinkSummary.absent">
                                        {{ geneLinkSummary.absent }} with no loading reported for this gene
                                    </div>
                                    <div v-if="geneLinkSummary.failed" class="legend-fail">
                                        {{ geneLinkSummary.failed }} failed to load — see the console
                                    </div>
                                </div>

                                <div class="legend-divider" aria-hidden="true"></div>

                                <div class="legend-row">
                                    <span class="legend-title">Program → state</span>
                                    <span class="legend-count">({{ edgeSummary.shown }})</span>
                                </div>

                                <!-- The metric sits on the unit line rather than a
                                     row of its own: it *is* the unit, so naming the
                                     encoding and choosing it are one thought. -->
                                <div class="legend-row unit-row">
                                    <label class="legend-label" for="ce-metric">Enrichment (−log₁₀)</label>
                                    <select id="ce-metric" v-model="metricKey" class="legend-select">
                                        <option v-for="metric in metricOptions" :key="metric.key" :value="metric.key">
                                            {{ metric.label }}
                                        </option>
                                    </select>
                                </div>

                                <!-- Both ends stated. The scale starts at the
                                     significance threshold, not at zero, so the
                                     thinnest line is a real score and has to say so;
                                     the top moves with the data. -->
                                <div class="legend-scale">
                                    <span class="scale-end">{{ edgeSummary.floor }}</span>
                                    <svg class="scale-swatch" viewBox="0 0 100 11"
                                         preserveAspectRatio="none" aria-hidden="true">
                                        <polygon points="0,4.5 100,0 100,11 0,6.5" :fill="mutedLinkColor" />
                                    </svg>
                                    <span class="scale-end">{{ edgeSummary.ceiling }}</span>
                                </div>

                                <label class="legend-check">
                                    <input type="checkbox" v-model="significantEdgesOnly" />
                                    <span>{{ edgeSummary.metricLabel }} &lt; {{ significanceThreshold }} only</span>
                                </label>

                                <!-- What is NOT drawn, and why. A missing p-value
                                     cannot be a thin line: that would assert "no
                                     association" where the fact is "not reported". -->
                                <div class="legend-notes">
                                    <div v-if="edgeSummary.nonSignificant">
                                        {{ edgeSummary.nonSignificant }} below threshold, hidden
                                    </div>
                                    <div v-if="edgeSummary.unreported">
                                        {{ edgeSummary.unreported }} with no {{ edgeSummary.metricLabel }} reported
                                    </div>
                                    <div v-if="edgeSummary.qc">
                                        {{ edgeSummary.qc }} QC signatures excluded
                                    </div>
                                </div>

                                <div v-if="relationshipError" class="legend-error">{{ relationshipError }}</div>
                                <div v-else-if="stateError" class="legend-error">{{ stateError }}</div>
                            </div>
                        </div>
                    </template>
                </canvas-stage>

                <div v-else class="body-placeholder">
                    <div v-if="bodyState === 'loading'" class="placeholder-inner">
                        <span class="placeholder-spinner" aria-hidden="true"></span>
                        <div class="placeholder-text">Loading gene programs…</div>
                    </div>
                    <div v-else-if="bodyState === 'error'" class="placeholder-inner">
                        <div class="placeholder-title">Could not load gene programs</div>
                        <div class="placeholder-text">{{ programError }}</div>
                    </div>
                    <div v-else class="placeholder-inner">
                        <div class="placeholder-title">
                            <template v-if="bodyState === 'empty-gene'">Search a gene to begin</template>
                            <template v-else-if="bodyState === 'empty-tissue'">Select a tissue</template>
                            <template v-else-if="bodyState === 'empty-cell-type'">Select a cell type</template>
                            <template v-else>No gene programs in this scope</template>
                        </div>
                        <div class="placeholder-text">
                            <template v-if="bodyState === 'empty-gene'">
                                Pick a gene, tissue and cell type above to see the programs its expression is associated with.
                            </template>
                            <template v-else-if="bodyState === 'empty-programs'">
                                {{ scopeSummary }} returned no gene programs.
                            </template>
                            <template v-else>
                                Finish choosing a scope in the band above.
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Metadata card. Same shape as the card above, with three tabs where that
             one has three selectors, so the two read as one stack. -->
        <metadata-card
            :dataset="activeDataset"
            :dataset-id="activeDatasetId"
            :browser-url="singleCellBrowserUrl"
            :loading-dataset="isLoadingDatasetMetadata"
            :dataset-error="datasetMetadataError"
            :cell-types="cellTypeTable"
            :cell-type-gene="geneLabelOrGene"
            :loading-cell-types="isLoadingCellTypes"
            :cell-type-error="cellTypeError"

            :program-items="programItemsWithCounts"
            :selected-program="selectedProgram"
            :selected-program-factor="selectedProgramFactor"
            :program-detail="programDetail"
            :qc-metadata="qcMetadataByKey"
            :program-matches="programMatches"
            :loading-program-detail="!!loadingProgramDetailKey"
            :program-detail-error="programDetailError"
            :program-traits="programTraits"
            :loading-program-traits="isLoadingProgramTraits"
            :programs-for-selected-state="programsForSelectedState"

            :state-items="stateItemsWithCounts"
            :selected-state="selectedState"
            :selected-state-metadata="selectedStateMetadata"
            :state-matches="stateMatches"
            :states-for-selected-program="statesForSelectedProgram"
            :state-traits="stateTraits"
            :loading-state-traits="isLoadingStateTraits"

            :trait-error="traitError"
            :active-tab="activeMetadataTab"
            :gene-label="selectedGene"
            @update:active-tab="activeMetadataTab = $event"
            @select-program="setProgram($event.key)"
            @select-state="setState($event.key)"
            @clear-program="setProgram('')"
            @clear-state="setState('')"
        />
    </div>
</template>

<style scoped>
@import url("/css/layout.css");

#cell-evolution-browser{
    /* One palette for the whole version, declared on the root so the child
       components inherit it across their scope boundaries -- scoped styles cannot
       reach into a child's markup, but CSS variables cross freely. */
    --ce-ink: #17262b;
    --ce-muted: #687a80;
    --ce-line: #d7e1e3;
    --ce-sunken: #f1f5f6;
    --ce-accent: #0277b6;
    --ce-accent-soft: rgba(2,119,182,.12);
    --ce-canvas-bg: #fbfcfc;
    --ce-canvas-dot: #dfe7e9;

    font-family: Open Sans, sans-serif;
    font-size: 12px;
    color: var(--ce-ink);
}
.bold{font-weight: bold;}
h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6 {
    margin-bottom: 0px !important;
}
.headline{
    line-height: 1.6rem;
}
.ai-disclosure {
    background: #e8f1fb;
    padding: 5px 10px;
    border-radius: 10px;
    font-style: italic;
    margin: 0 -10px auto -10px;
}

/* --- the card --- */

.browser-card{
    display: flex;
    flex-direction: column;
    border: 1px solid var(--ce-line);
    border-radius: 14px;
    background: #fff;
    overflow: hidden;
}

.scope-band{
    display: grid;
    /* Three equal columns with a hairline between them. Equal rather than
       content-sized so the band does not reflow as labels change length. */
    grid-template-columns: 1fr 1px 1fr 1px 1fr;
    gap: 18px;
    align-items: start;
    padding: 14px 18px;
    background: var(--ce-sunken);
    border-bottom: 1px solid var(--ce-line);
}
.band-divider{
    align-self: stretch;
    background: var(--ce-line);
}

.browser-body{
    display: flex;
    flex-direction: column;
    /* The line tooltip is positioned against this box. */
    position: relative;
    /* The canvas needs a definite height to clip and fit against; it cannot size to
       its content, because its content is unbounded by design. */
    height: 620px;
    min-height: 0;
}

/* --- canvas content --- */

.connector-layer{
    position: absolute;
    left: 0;
    top: 0;
    /* The drawn lines are inert -- they must not intercept the drag that pans the
       canvas, and a bezier's fill region would swallow a huge area of it. */
    pointer-events: none;
}
/* The hit strokes opt back in, on the stroke only. Crucially they do NOT carry
   `data-canvas-interactive`: pointerdown still reaches the viewport, so a drag that
   happens to start on a line pans as usual. Hover and pan are different gestures
   here and both have to work on the same pixel. */
.connector-layer .hit-layer path{
    pointer-events: stroke;
}

/* --- canvas tooltip --- */
/*
   Shared by the association lines and the column heads. One popover style for
   everything on the canvas that explains itself on hover -- a reader crossing
   between a line and a column heading should not meet two different kinds of box.
*/
.canvas-tooltip{
    position: absolute;
    z-index: 20;
    max-width: 260px;
    padding: 8px 10px;
    border: 1px solid var(--ce-line);
    border-radius: 8px;
    background: rgba(255,255,255,.97);
    box-shadow: 0 6px 18px rgba(23,38,43,.18);
    /* Never the thing under the cursor: it follows the pointer onto the line it is
       describing, and a tooltip that can take the pointer flickers. */
    pointer-events: none;
}
/* A line's tooltip is a readout -- two labels and three numbers -- and fits in 260.
   A column's is prose, and at 260 the explanations run to eight or nine lines. */
.canvas-tooltip.wide{
    max-width: 330px;
}
/* Anchored by the corner nearest the pointer, so flipping is a translate rather
   than a second position calculation. */
.canvas-tooltip.flip-x{
    transform: translateX(-100%);
}
.canvas-tooltip.flip-y{
    transform: translateY(-100%);
}
.canvas-tooltip.flip-x.flip-y{
    transform: translate(-100%, -100%);
}
/* The one-thing head, where `.tip-head` is the joins-two-things one. */
.tip-title{
    font-size: 11px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--ce-ink);
}
.tip-head{
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 2px 5px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--ce-ink);
}
/* The target state's color, the same one the line and the state's row carry. */
.tip-swatch{
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    align-self: center;
}
.tip-arrow{
    flex: none;
    color: var(--ce-muted);
    font-weight: 400;
}
.tip-stats{
    display: grid;
    /* Labels sized to content, values in one right-aligned column, so two tooltips
       read as the same table when the reader moves between lines. */
    grid-template-columns: auto auto;
    justify-content: space-between;
    gap: 1px 14px;
    margin: 6px 0 0;
    font-size: 10px;
}
.tip-stats dt{
    font-weight: 400;
    color: var(--ce-muted);
}
.tip-stats dd{
    margin: 0;
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--ce-ink);
}
/* Prose, for the column heads. Under the stats, because the stats are the answer to
   "what is this" and these paragraphs are the qualifications on it. */
.tip-text{
    margin: 6px 0 0;
    font-size: 10px;
    line-height: 1.45;
    color: var(--ce-ink);
}
.tip-text + .tip-text{
    color: var(--ce-muted);
}
.tip-note{
    margin-top: 5px;
    font-size: 9px;
    line-height: 1.4;
    color: var(--ce-muted);
}

.gene-hub{
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    padding: 14px 16px;
    border: 1px solid var(--ce-ink);
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 2px 10px rgba(23,38,43,.1);
}
.hub-eyebrow{
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--ce-muted);
}
.hub-gene{
    font-size: 26px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -.5px;
}
.hub-scope{
    font-size: 11px;
    color: var(--ce-muted);
}

/* Row geometry, published to the rows AND to the programs header so the column
   heads line up with the values rather than near them. Custom properties inherit
   through scoped styles, so ProgramRow reads these from its panel -- the same
   one-constant-on-both-sides discipline as `--ce-row-height`. Changing a column
   width here moves the heading with it. */
.canvas-list{
    --ce-row-pad: 10px;
    --ce-row-gutter: 22px;
    --ce-row-gutter-gap: 6px;
    --ce-col-exp: 38px;
    --ce-col-spec: 42px;
    --ce-col-gap: 7px;

    position: absolute;
    background: #fff;
    border: 1px solid var(--ce-line);
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(23,38,43,.08);
    /* Clips the first row's corners into the panel's radius. The list is not
       scrollable -- it is as tall as it needs to be and the canvas pans to it,
       which is the point of putting it on a canvas. */
    overflow: hidden;
}
/* Fixed height, from the one JS constant, for the same reason the rows are: the edge
   anchors add this to the panel top rather than measuring it, so a header that grew
   would point every line one header's worth too high. `border-box` makes the height
   hold regardless of padding and text metrics. */
.list-header{
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    height: var(--ce-list-header-height, 68px);
    box-sizing: border-box;
    padding: 0 var(--ce-row-pad);
    border-bottom: 1px solid var(--ce-line);
    background: var(--ce-sunken);
}
.list-heading-row{
    display: flex;
    align-items: baseline;
    gap: 7px;
}
.list-title{
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
    letter-spacing: .01em;
    color: var(--ce-ink);
}
/* What the panel's rows are, once, at the top -- rather than on every row. Clamped
   to two lines: the header height is load-bearing, so the text cannot be allowed to
   decide it. Both descriptions wrap to two at this panel width. */
.list-description{
    font-size: 10px;
    line-height: 13px;
    color: var(--ce-muted);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
}
/* Right-aligned, in the slot the axis readout used to hold. The axis top itself did
   not just disappear -- it moved into the EXP column's tooltip, because the bars are
   relatively scaled and that ceiling has to be stated somewhere. */
.list-count{
    margin-left: auto;
    padding: 1px 7px;
    border-radius: 999px;
    background: #fff;
    border: 1px solid var(--ce-line);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    color: var(--ce-muted);
}

/* Same grid as `.row-metrics` in ProgramRow, offset by the row's gutter, so EXP and
   SPEC sit over their own columns. */
.list-columns{
    display: grid;
    grid-template-columns: 1fr var(--ce-col-exp) var(--ce-col-spec);
    align-items: center;
    gap: var(--ce-col-gap);
    margin-top: 3px;
    padding-left: calc(var(--ce-row-gutter) + var(--ce-row-gutter-gap));
}
.col-head{
    /* Shrink-wrapped and pushed right, so the dotted rule is exactly as wide as the
       word. Underlining the whole 42px cell would advertise a hover target that is
       mostly empty space. */
    justify-self: end;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .06em;
    color: var(--ce-muted);
    cursor: help;
    /* The only thing saying these explain themselves. `text-decoration` rather than
       a border, so the rule follows the text's own box and not the grid cell's. */
    text-decoration: underline dotted;
    text-decoration-color: var(--ce-muted);
    text-underline-offset: 3px;
}
.col-head:hover{
    color: var(--ce-ink);
    text-decoration-color: var(--ce-ink);
}

/* --- canvas heading --- */

/* No card around it, unlike the legend: the legend is a key you read against the
   lines, so it needs to sit on its own ground, while this is a label on the picture.
   A translucent plate keeps it legible over the dot grid without boxing it in. */
.canvas-heading{
    max-width: 320px;
    padding: 2px 8px 3px;
    border-radius: 8px;
    background: rgba(255,255,255,.82);
}
.canvas-heading-title{
    font-size: 15px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -.2px;
    color: var(--ce-ink);
}
.canvas-heading-subtitle{
    font-size: 11px;
    line-height: 1.3;
    font-variant-numeric: tabular-nums;
    color: var(--ce-muted);
}
/* Tinted, because it reports a state of the view rather than describing it -- the
   heading's other two lines are always true and this one only appears when
   something is missing. */
.canvas-heading-notice{
    margin-top: 5px;
    padding: 5px 7px;
    border-radius: 6px;
    background: #fdf3e2;
    border: 1px solid #f0d9ae;
    font-size: 10px;
    line-height: 1.4;
    color: #7a4a09;
}

/* --- edge legend --- */

.edge-legend{
    width: 252px;
    border: 1px solid var(--ce-line);
    border-radius: 10px;
    background: rgba(255,255,255,.95);
    box-shadow: 0 4px 14px rgba(23,38,43,.12);
    /* The header is full-bleed and tinted, so its corners have to be clipped into
       the box's radius -- which is also why the padding lives on the header and the
       body rather than here. */
    overflow: hidden;
}

/* Tinted like the list panels' own headers, so the two read as the same kind of
   band. The whole header is the hit target, not just the chevron: it is a 250px bar
   with one job, and a reader aiming at a small glyph on a pannable canvas misses and
   pans instead. */
.legend-toggle{
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 11px;
    border: none;
    background: var(--ce-sunken);
    text-align: left;
    cursor: pointer;
}
.legend-heading{
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    color: var(--ce-ink);
}
.legend-chevron{
    flex: none;
    margin-left: auto;
    width: 16px;
    height: 16px;
    color: var(--ce-muted);
    transition: transform .15s ease;
}
.legend-chevron.open{
    transform: rotate(180deg);
}
.legend-body{
    border-top: 1px solid var(--ce-line);
    padding: 8px 11px 10px;
}

.legend-row{
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 3px;
}
/* The unit and its selector are one line, and the selector is the taller thing on
   it, so this row needs its own breathing room. */
.legend-row.unit-row{
    margin-bottom: 4px;
}
.legend-title{
    font-size: 11px;
    font-weight: 700;
    color: var(--ce-ink);
}
/* Inline and parenthesized rather than a pill: it is part of the title's phrase --
   "PPARG → program (24)" -- not a separate badge. */
.legend-count{
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    color: var(--ce-muted);
}
.legend-label{
    font-size: 10px;
    color: var(--ce-muted);
    margin: 0;
}
.legend-select{
    margin-left: auto;
    height: 22px;
    border: 1px solid var(--ce-line);
    border-radius: 6px;
    background: #fff;
    font-size: 10px;
    color: var(--ce-ink);
}
.legend-scale{
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    font-size: 9px;
    color: var(--ce-muted);
}
/* A wedge from MIN_WIDTH to MAX_WIDTH -- the width ramp itself, rather than two
   sample strokes. `preserveAspectRatio: none` lets it take whatever width the row
   has left, so widening the legend widens the ramp. */
.scale-swatch{
    flex: 1;
    min-width: 0;
    height: 11px;
}
.scale-end{
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}
.legend-check{
    display: flex;
    align-items: center;
    gap: 5px;
    margin: 0;
    font-size: 10px;
    font-weight: 400;
    color: var(--ce-ink);
    cursor: pointer;
}
.legend-check input{
    margin: 0;
}
.legend-notes{
    margin-top: 5px;
    font-size: 9px;
    line-height: 1.5;
    color: var(--ce-muted);
}
/* The legend carries two independent encodings -- gene loadings and GSEA -- and a
   rule keeps them from reading as one list. */
.legend-divider{
    height: 1px;
    margin: 8px 0;
    background: var(--ce-line);
}
.legend-fail{
    color: #b42318;
}
.legend-error{
    margin-top: 5px;
    font-size: 9px;
    line-height: 1.4;
    color: #b42318;
}

/* --- body placeholders --- */

.body-placeholder{
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ce-canvas-bg);
    background-image: radial-gradient(var(--ce-canvas-dot) 1px, transparent 1px);
    background-size: 22px 22px;
}
.placeholder-inner{
    max-width: 420px;
    padding: 24px;
    text-align: center;
}
.placeholder-title{
    font-size: 14px;
    font-weight: 700;
    color: var(--ce-ink);
}
.placeholder-text{
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ce-muted);
}
.placeholder-spinner{
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid var(--ce-line);
    border-top-color: var(--ce-accent);
    border-radius: 50%;
    animation: ce-spin .7s linear infinite;
}
@keyframes ce-spin{ to { transform: rotate(360deg); } }
</style>
