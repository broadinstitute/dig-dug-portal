<script>
import Vue from "vue";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import CellStateInfographic from "./CellStateInfographic.vue";
import LigerDetailPanel from "./LigerDetailPanel.vue";

const LIGER_FORCE_DEV_BIOINDEX = false; //change this flag to TRUE to force use of bioindex-dev in all cases
const LIGER_DEV_BIOINDEX_HOST = "https://bioindex-dev.hugeamp.org";
const LIGER_LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "0.0.0.0"];
const LIGER_RUNTIME_HOSTNAME = typeof window !== "undefined" ? window.location.hostname : "";
const LIGER_USE_DEV_BIOINDEX = LIGER_FORCE_DEV_BIOINDEX || LIGER_LOCAL_HOSTNAMES.includes(LIGER_RUNTIME_HOSTNAME);
const LIGER_RESOLVED_BIOINDEX_HOST = LIGER_USE_DEV_BIOINDEX ? LIGER_DEV_BIOINDEX_HOST : BIO_INDEX_HOST;
const LIGER_API_HOST = LIGER_RESOLVED_BIOINDEX_HOST;
// /api/portal/phenotypes is only served by the hugeamp bioindex, so it stays
// pinned there regardless of which portal is hosting this component. These must
// stay independent of LIGER_DEV_BIOINDEX_HOST above: that constant is the knob
// for pointing the rest of the component at a different portal, so routing
// through it would drag this endpoint along with it.
const LIGER_DEV_HUGEAMP_BIOINDEX_HOST = "https://bioindex-dev.hugeamp.org";
const LIGER_PROD_HUGEAMP_BIOINDEX_HOST = "https://bioindex.hugeamp.org";
const LIGER_PHENOTYPES_HOST = LIGER_USE_DEV_BIOINDEX ? LIGER_DEV_HUGEAMP_BIOINDEX_HOST : LIGER_PROD_HUGEAMP_BIOINDEX_HOST;
const LIGER_PROGRAM_MODEL = "mouse_msigdb";
// The section headers stack rather than replace each other: each one pins below
// the headers of the sections above it, so by the time you are reading programs
// the gene, tissue and cell type that produced them are all still on screen.
//
// A header compacts once it parks, so there are two heights: the full height it
// has in flow, and the shorter height it takes when stuck. Only stuck headers
// stack, so the pin offset is index * STUCK height. Both are mirrored in CSS
// (--liger-header-h / --liger-header-stuck-h); keep the pairs in sync.
const LIGER_HEADER_HEIGHT = 50;
const LIGER_HEADER_STUCK_HEIGHT = 34;
// The row tooltip sits above or below its row rather than beside it, so it never
// covers the row it is describing. Wider than the old side placement because a
// wider box is a shorter box, and height is what decides whether it fits.
const LIGER_TOOLTIP_WIDTH = 640;
const LIGER_TOOLTIP_MARGIN = 12;
const LIGER_SECTION_ORDER = ["gene", "tissue", "cellType", "state", "program", "relationships", "traits"];
const LIGER_SECTION_ANCHOR_REFS = {
    gene: "anchorGene",
    tissue: "anchorTissue",
    cellType: "anchorCellType",
    state: "anchorState",
    program: "anchorProgram",
    relationships: "anchorRelationships",
    traits: "anchorTraits",
};
const LIGER_DEFAULT_CONFIG = {
    pageTitle: "Cell State & Program Explorer",
    documentationUrl: "/research.html?pageid=kp_liger_documentation",
    tissues: [],
    hideTissueCardIfOneOption: false,
    expressionAxis: null,
    specificityAxis: null,
};
// Expression bars are drawn against a FIXED axis, not the min/max of whatever
// rows happen to be on screen. Rescaling per section made every gene look the
// same: the weakest row always sat at the floor and the strongest always filled
// the track, so a cell-type-specific marker and a gene that is absent everywhere
// produced identical pictures. With a fixed domain the bar finally means
// something on its own, and is comparable across cards, genes, and tissues.
//
// The bar is drawn from 10^log10_cpk, not from log10_cpk itself.
//
// A filled bar asserts a meaningful zero: length is supposed to be proportional
// to the quantity. log10_cpk has no such zero - log10_cpk = 0 just means "1 CPK"
// - and it runs negative for most genes, so a bar drawn from it starts at an
// arbitrary point on a log axis and its length means nothing. Undoing the
// pipeline's outer log recovers the underlying positive quantity, which does
// have a true zero, so the bar becomes legitimate: empty really is "none".
//
// This is not a new metric, just the linear form of the value the API already
// returns. The raw log10_cpk is still what we show on hover.
//
// It also reads far better. In linear form a cell-type-specific gene separates
// cleanly (SST: 94% on delta, then 15/13/10/9...) while an absent gene collapses
// to nothing (A1BG: 1.6% down to 0), which is exactly the right message for each.
//
// The axis top scales to the gene being viewed, since a user only ever looks at
// one gene at a time - a global ceiling set by the islet hormones (INS 1.54)
// left a mid-expressed gene like PRSS1 (max 0.24) using the bottom 15% of every
// track.
//
// This is NOT the per-section rescaling this component started with. That was
// broken for two separate reasons: it ran from the section MINIMUM rather than
// zero, so an absent gene still filled the track, and the axis was unlabeled so
// nothing revealed the scale had moved. Here the bar keeps a true zero and the
// ticks are labeled with real values, so a shifting top is visible rather than
// hidden. One axis is shared by all three cards so they stay mutually readable.
//
// The floor stops a barely-expressed gene from filling its own bar: A1BG peaks
// at 0.025, and without this it would scale up to look strongly expressed.
// Chosen against the observed distribution (p50 = 0.088, p75 = 0.47), so a gene
// has to reach roughly the upper quartile before the axis starts tracking it.
const LIGER_EXPRESSION_AXIS_FLOOR = 0.5;
// log2 fold-change is signed and symmetric around a true zero, so it gets a
// symmetric domain and a center-anchored bar.
//
// The top is per-card, not global. Cell-type specificity is measured against the
// other cell types in the tissue, while state and program specificity is measured
// against the parent cell type - different denominators, so those numbers were
// never comparable and must not share a scale. Ranges differ enormously in
// practice: one portal returns cell-type values spanning -4.65..+7.56 while its
// own state and program values sit inside +/-1.4.
//
// The floor keeps the pre-existing behavior where values cluster at zero
// (p75 = +0.115 on the pankbase sweep); without it a card whose values are all
// tiny would scale up and imply enrichment that isn't there.
const LIGER_SPECIFICITY_AXIS_FLOOR = 1.5;
// p_value underflows to 5e-324 for the strongest hits, so it is only usable as a
// significance flag - never as a continuous ranking.
const LIGER_SIGNIFICANCE_P = 0.05;
// Keep this code-level toggle in place so we can quickly compare raw API traits
// versus portal-labeled traits without introducing UI controls yet.
const LIGER_FILTER_UNLABELED_HEATMAP_TRAITS = true;
// Portals do not agree on how a tissue is identified. Some return a tissue label
// on the gene-level expression rows, others return only a dataset ID, and the
// dataset IDs themselves differ between portals for the same tissue. So each
// tissue lists every dataset ID we know it by, and we resolve in whichever
// direction the response happens to give us.
const LIGER_TISSUE_CONFIG = {
    artery: {
        label: "Artery",
        datasetIds: ["FNIH_Artery_scRNA_v2.2"],
    },
    heart: {
        label: "Heart",
        datasetIds: ["FNIH_Heart_scRNA_v3.2"],
    },
    hypothalamus: {
        label: "Hypothalamus",
        datasetIds: ["FNIH_Hypothalamus_scRNA_v2.2"],
    },
    kidney: {
        label: "Kidney",
        datasetIds: ["FNIH_Kidney_scRNA_v2.2"],
    },
    liver: {
        label: "Liver",
        datasetIds: ["FNIH_Liver_scRNA_v3.2"],
    },
    muscle: {
        label: "Muscle",
        datasetIds: ["FNIH_Muscle_scRNA_v2.2"],
    },
    pancreas: {
        label: "Pancreas",
        datasetIds: ["FNIH_Pancreas_scRNA_v2.2", "islet_of_Langerhans_scRNA_v3-4"],
    },
    sat: {
        label: "SAT",
        datasetIds: ["FNIH_SAT_scRNA_v2.2"],
    },
    vat: {
        label: "VAT",
        datasetIds: ["FNIH_VAT_scRNA_v2.2"],
    }
};

const LIGER_DATASET_TISSUE_MAP = Object.keys(LIGER_TISSUE_CONFIG).reduce((map, tissueKey) => {
    (LIGER_TISSUE_CONFIG[tissueKey].datasetIds || []).forEach((datasetId) => {
        map[datasetId] = tissueKey;
    });
    return map;
}, {});

export default Vue.component('LigerBrowser', {
    components: {
        CellStateInfographic,
        LigerDetailPanel
    },

    props: {
        config: {
            type: Object,
            default: () => ({})
        }
    },

    data() {
        return {
            searchedGene: "",
            selectedGene: null,
            geneSuggestions: [],
            availableTissues: [],
            // tissue key -> dataset ID as reported by this portal for the
            // current gene. Empty when the portal returns tissue labels instead.
            observedDatasetIds: {},
            // Whether this portal's cell-state endpoints are keyed by dataset ID
            // rather than tissue. Derived from the gene search response.
            cellStateUsesDatasetKey: false,
            selectedTissue: null,
            cellTypeExpressionRows: [],
            selectedCellType: null,
            // Row selections. Distinct from the drawer target: the drawer is a
            // transient look at metadata, these stay put. Selecting a state also
            // narrows the program section to the programs that state is linked to.
            selectedCellStateKey: "",
            selectedProgramKey: "",
            // Metadata for the selected row, rendered in the card beside the
            // rows. Shape: { id, title, badges, content, loading }. The drawer
            // keeps its own copy because the heatmaps still open it.
            cellStateDetail: null,
            geneProgramDetail: null,
            viewStateInfo: false,
            viewProgramInfo: false,
            cellStateExpressionRows: [],
            programExpressionRows: [],
            cellStateMetadataRows: [],
            geneProgramInfoRows: [],
            relationshipHeatmapRows: [],
            traitHeatmapRows: [],
            traitHeatmapColumns: [],
            phenotypeTraitRows: [],
            qcMetadataRows: [],
            stateTraitRowsCache: {},
            programTraitRowsCache: {},
            programGeneSetRowsCache: {},
            programGeneRowsCache: {},
            programQcRowsCache: {},
            drawerOpen: false,
            drawerLoading: false,
            drawerKind: "Details",
            drawerTitle: "Select a state or program",
            drawerBadges: [],
            drawerContent: null,
            drawerTargetId: "",
            // name -> whether that header is currently parked at the top. Driven
            // by measurement rather than by scroll position arithmetic, so it
            // stays right when the sections above change height.
            stuckSections: {},
            stuckSectionFrame: null,
            isHydratingFromQuery: false,
            isLoadingGeneSuggestions: false,
            isLoadingGeneData: false,
            isLoadingCellTypes: false,
            isLoadingCellStateSection: false,
            isLoadingGeneProgramSection: false,
            isLoadingRelationshipHeatmap: false,
            isLoadingTraitHeatmap: false,
            geneSearchError: null,
            cellTypeLoadError: null,
            cellStateSectionError: null,
            geneProgramSectionError: null,
            relationshipHeatmapError: null,
            traitHeatmapError: null,
            selectedRelationshipMetric: "correlation",
            selectedTraitMetric: "beta",
            selectedTraitColumnFilter: "all",
            noGeneSuggestions: false,
            geneSuggestionTimer: null,
            skipGeneSuggestionLookup: false,
            floatingHeatmapTooltip: {
                visible: false,
                x: 0,
                y: 0,
                rows: [],
            },
            floatingExpressionTooltip: {
                visible: false,
                // Stays false for the one frame between rendering the box and
                // measuring it, so nothing is drawn at a provisional position.
                positioned: false,
                rowKey: "",
                x: 0,
                y: 0,
                anchorX: 0,
                anchorTop: 0,
                anchorBottom: 0,
                arrowX: 0,
                side: "below",
                columns: [],
            },
        };
    },

    computed: {
        ligerConfig() {
            return {
                ...LIGER_DEFAULT_CONFIG,
                ...(this.config || {}),
            };
        },
        pageTitle() {
            return this.ligerConfig.pageTitle || LIGER_DEFAULT_CONFIG.pageTitle;
        },
        documentationUrl() {
            return this.ligerConfig.documentationUrl || LIGER_DEFAULT_CONFIG.documentationUrl;
        },
        configuredTissueKeys() {
            let configuredTissues = Array.isArray(this.ligerConfig.tissues)
                ? this.ligerConfig.tissues
                : [];

            return configuredTissues
                .map((tissue) => this.normalizeKey(tissue))
                .filter((tissueKey) => !!tissueKey);
        },
        hideTissueCardIfOneOption() {
            return this.ligerConfig.hideTissueCardIfOneOption === true;
        },
        hasSingleTissueOption() {
            return this.availableTissues.length === 1;
        },
        shouldHideTissueCard() {
            return this.hideTissueCardIfOneOption && this.hasSingleTissueOption;
        },
        expressionSectionTitleSuffix() {
            if (this.shouldHideTissueCard && this.selectedTissue) {
                return ` expressed in ${this.selectedTissue}?`;
            }

            return " expressed?";
        },
        // One axis for the whole gene view, computed across all three cards so
        // a cell type, a state and a program are read on the same scale. It
        // steps once when the state/program sections finish loading, which is a
        // single predictable reflow rather than each card drifting on its own.
        expressionAxisMax() {
            let configured = Number(this.ligerConfig.expressionAxis);
            if (Number.isFinite(configured) && configured > 0) {
                return configured;
            }

            let observed = []
                .concat(this.cellTypeExpressionRows, this.cellStateExpressionRows, this.programExpressionRows)
                .map((row) => this.absoluteExpressionValue(row))
                .filter((value) => Number.isFinite(value))
                .reduce((max, value) => Math.max(max, Math.pow(10, value)), 0);

            return this.niceAxisMax(Math.max(observed, LIGER_EXPRESSION_AXIS_FLOOR));
        },
        cellTypeSpecificityAxis() {
            return this.specificityAxisFor(this.cellTypeExpressionRows);
        },
        cellStateSpecificityAxis() {
            return this.specificityAxisFor(this.cellStateExpressionRows);
        },
        programSpecificityAxis() {
            return this.specificityAxisFor(this.programExpressionRows);
        },
        // Ticks are rendered under each bar column so the scale is readable
        // without hovering anything.
        expressionAxisTicks() {
            let max = this.expressionAxisMax;
            return [0, max / 2, max].map((value) => ({
                value,
                label: this.formatAxisTick(value),
                offset: `${(value / max) * 100}%`,
            }));
        },
        cellTypeSpecificityTicks() {
            return this.specificityTicksFor(this.cellTypeSpecificityAxis);
        },
        cellStateSpecificityTicks() {
            return this.specificityTicksFor(this.cellStateSpecificityAxis);
        },
        programSpecificityTicks() {
            return this.specificityTicksFor(this.programSpecificityAxis);
        },
        // Naming this "CPK" would assert counts-per-thousand, which the observed
        // magnitudes contradict (INS in beta comes out at 1.54, orders of
        // magnitude too low). Stating the transform instead is exact and
        // inherits the pipeline's own naming rather than inventing a unit.
        expressionUnitLabel() {
            return "10^log₁₀CPK";
        },
        specificityUnitLabel() {
            return "log₂ fold-change";
        },
        // The three cards measure against different backgrounds. Collapsing them
        // to one tooltip described the wrong denominator on two of the three.
        absoluteExpressionTooltipByKind() {
            let basis = "The bar shows 10^log₁₀CPK, the linear form of the pipeline's log₁₀ CPK value, so the bar starts at a true zero and an empty bar means none detected. Hover a row for the raw value.";

            return {
                cellType: `Mean expression across cells of this cell type. ${basis}`,
                state: `State-weighted mean expression: cells are weighted by curated state activity. ${basis}`,
                program: `Program-weighted mean expression: cells are weighted by inferred program activity. ${basis}`,
            };
        },
        specificityTooltipByKind() {
            return {
                cellType: "Specificity is log₂ fold-change of this cell type versus the other cell types in the tissue. Not currently reported for cell types.",
                state: "Specificity is log₂ fold-change of the state-weighted expression versus the parent cell-type background. Positive means enriched in this state.",
                program: "Specificity is log₂ fold-change of the program-weighted expression versus the parent cell-type background. Positive means enriched in this program.",
            };
        },
        showGeneSuggestions() {
            return this.searchedGene.length > 1 &&
                (this.geneSuggestions.length > 0 || this.isLoadingGeneSuggestions || this.noGeneSuggestions);
        },
        tissueCount() {
            return this.availableTissues.length;
        },
        cellTypeCount() {
            return this.availableCellTypes.length;
        },
        cellStateCount() {
            if (!this.selectedCellType) {
                return 0;
            }

            return this.cellStateExpressionList.length;
        },
        geneProgramCount() {
            if (!this.selectedCellType) {
                return 0;
            }

            return this.geneProgramExpressionList.length;
        },
        availableCellTypes() {
            return this.toExpressionList(this.cellTypeExpressionRows, "cellType");
        },
        // Hiding the tissue section shifts every section below it up one slot in
        // the sticky stack, so the pin offsets are derived from the sections that
        // actually render rather than from a fixed position in LIGER_SECTION_ORDER.
        visibleSectionOrder() {
            return LIGER_SECTION_ORDER.filter((name) => name !== "tissue" || !this.shouldHideTissueCard);
        },
        // One string per section, rendered in the value slot while nothing is
        // selected and on the right once something is - so the count is what the
        // header says when it has nothing better to say. Each names what it is
        // counted within, since the same section shows different numbers as the
        // selection above it changes.
        //
        // Empty while loading: a count of zero that has not been fetched yet is
        // not the same claim as "none available", and the body already has a
        // loading overlay saying so.
        tissueMetaText() {
            if (this.isLoadingGeneData) {
                return "";
            }

            return this.tissueCount ? `${this.tissueCount} with data for ${this.selectedGene}` : "None available";
        },
        cellTypeMetaText() {
            if (!this.selectedTissue || this.isLoadingCellTypes) {
                return "";
            }

            return this.cellTypeCount ? `${this.cellTypeCount} in ${this.selectedTissue}` : "None available";
        },
        cellStateMetaText() {
            if (!this.selectedCellType || this.isLoadingCellStateSection) {
                return "";
            }

            return this.cellStateCount ? `${this.cellStateCount} in ${this.selectedCellType.label}` : "None available";
        },
        geneProgramMetaText() {
            if (!this.selectedCellType || this.isLoadingGeneProgramSection) {
                return "";
            }

            // A state filter is otherwise only visible in the cell state header,
            // so the program count keeps saying what it has been narrowed to.
            if (this.selectedCellStateKey) {
                return this.geneProgramCount
                    ? `${this.geneProgramCount} linked to ${this.selectedCellStateLabel}`
                    : `None linked to ${this.selectedCellStateLabel}`;
            }

            return this.geneProgramCount ? `${this.geneProgramCount} in ${this.selectedCellType.label}` : "None available";
        },
        relationshipMetaText() {
            if (!this.selectedCellType || this.isLoadingRelationshipHeatmap) {
                return "";
            }

            let heatmap = this.relationshipHeatmapDisplay;

            if (!heatmap.programCount || !heatmap.stateCount) {
                return "None available";
            }

            return `${heatmap.programCount} programs x ${heatmap.stateCount} states in ${this.selectedCellType.label}`;
        },
        traitMetaText() {
            if (!this.selectedCellType || this.isLoadingTraitHeatmap) {
                return "";
            }

            let traitCount = this.traitHeatmapDisplay.groupRows.reduce((sum, group) => sum + group.traits.length, 0);
            let columnCount = this.availableTraitColumns.length;

            if (!traitCount || !columnCount) {
                return "None available";
            }

            return `${traitCount} traits x ${columnCount} state/program columns`;
        },
        selectedCellStateLabel() {
            if (!this.selectedCellStateKey) {
                return "";
            }

            return this.stateLabel(this.stateMetadataById[this.selectedCellStateKey] || { state_id: this.selectedCellStateKey });
        },
        selectedProgramLabel() {
            if (!this.selectedProgramKey) {
                return "";
            }

            return this.programLabel(this.geneProgramInfoById[this.selectedProgramKey] || { program_id: this.selectedProgramKey });
        },
        // Programs the selected state is linked to, by the same GSEA P < 0.05
        // rule the state drawer already uses for "related programs" - one
        // definition of "related", so the two views cannot disagree.
        // null (not an empty set) means no state is selected, i.e. no filter.
        relatedProgramKeys() {
            if (!this.selectedCellStateKey) {
                return null;
            }

            return new Set(
                this.relatedProgramsForState(this.selectedCellStateKey)
                    .map((row) => row.programId)
                    .filter((programId) => !!programId)
            );
        },
        cellStateExpressionList() {
            return this.toExpressionList(this.cellStateExpressionRows, "state");
        },
        geneProgramExpressionList() {
            let programs = this.toExpressionList(this.programExpressionRows, "program");

            if (!this.relatedProgramKeys) {
                return programs;
            }

            return programs.filter((program) => this.relatedProgramKeys.has(program.key));
        },
        // Filtering to nothing has two very different causes and the section has
        // to say which: no relationships were loaded for this cell type at all,
        // versus loaded and none of them reach significance for this state.
        geneProgramFilterEmptyMessage() {
            if (!this.selectedCellStateKey || this.geneProgramExpressionList.length) {
                return "";
            }

            if (!this.relationshipHeatmapRows.length) {
                return `Program-state relationships have not loaded for this cell type, so programs cannot be filtered by ${this.selectedCellStateLabel}.`;
            }

            return `No gene programs are linked to ${this.selectedCellStateLabel} at GSEA P < 0.05.`;
        },
        // gene-program-expression-cell-type returns log2fc_weighted_vs_all_parent
        // as null on every row, so the cell-type card hides the column entirely
        // rather than printing a wall of 0.00 that reads as "measured, no
        // enrichment". If the pipeline starts populating it this lights up on its
        // own.
        showCellTypeSpecificity() {
            return this.availableCellTypes.some((item) => Number.isFinite(item.spec));
        },
        cellStateInfoList() {
            let expressionOrder = this.cellStateExpressionList.map((row) => row.key);
            let expressionOrderMap = expressionOrder.reduce((map, key, index) => {
                map[key] = index;
                return map;
            }, {});

            return this.cellStateMetadataRows
                .map((row) => ({
                    key: this.stateKey(row),
                    label: this.stateLabel(row),
                    description: this.stateDescription(row),
                    genes: this.joinDisplayList(this.extractMarkerGenes(row)),
                }))
                .filter((row) => !!row.key)
                .sort((a, b) => {
                    let aIndex = Object.prototype.hasOwnProperty.call(expressionOrderMap, a.key) ? expressionOrderMap[a.key] : Number.MAX_SAFE_INTEGER;
                    let bIndex = Object.prototype.hasOwnProperty.call(expressionOrderMap, b.key) ? expressionOrderMap[b.key] : Number.MAX_SAFE_INTEGER;

                    if (aIndex !== bIndex) {
                        return aIndex - bIndex;
                    }

                    return a.label.localeCompare(b.label);
                });
        },
        geneProgramInfoList() {
            let expressionOrder = this.geneProgramExpressionList.map((row) => row.key);
            let expressionOrderMap = expressionOrder.reduce((map, key, index) => {
                map[key] = index;
                return map;
            }, {});

            return this.geneProgramInfoRows
                .map((row) => ({
                    key: this.programKey(row),
                    label: this.programLabel(row),
                    description: this.programDescription(row),
                    genes: this.joinDisplayList(this.extractGenes(row, ["top_genes", "genes", "gene_symbols"])),
                }))
                .filter((row) => !!row.key)
                .filter((row) => !this.relatedProgramKeys || this.relatedProgramKeys.has(row.key))
                .sort((a, b) => {
                    let aIndex = Object.prototype.hasOwnProperty.call(expressionOrderMap, a.key) ? expressionOrderMap[a.key] : Number.MAX_SAFE_INTEGER;
                    let bIndex = Object.prototype.hasOwnProperty.call(expressionOrderMap, b.key) ? expressionOrderMap[b.key] : Number.MAX_SAFE_INTEGER;

                    if (aIndex !== bIndex) {
                        return aIndex - bIndex;
                    }

                    return a.label.localeCompare(b.label);
                });
        },
        stateMetadataById() {
            let map = {};
            this.cellStateMetadataRows.forEach((row) => {
                let key = this.stateKey(row);
                if (key) {
                    map[key] = row;
                }
            });
            return map;
        },
        geneProgramInfoById() {
            let map = {};
            this.geneProgramInfoRows.forEach((row) => {
                let key = this.programKey(row);
                if (key) {
                    map[key] = row;
                }
            });
            return map;
        },
        qcMetadataById() {
            let map = {};
            this.qcMetadataRows.forEach((row) => {
                let key = String(this.field(row, ["qc_signature_id", "state_id", "state_name"]) || "");
                if (key) {
                    map[key] = row;
                }
            });
            return map;
        },
        relationshipMetricIds() {
            let preferred = [
                "correlation",
                "gsea_neglog10p",
                "gsea_neglog10q",
                "combined_match_score",
                "gsea_nes",
                "loading_auc",
                "cell_spearman_r_gradient",
                "donor_spearman_r_gradient",
                "expression_score_spearman_r",
                "top100_overlap_n",
            ];
            let foundMetrics = new Set();

            this.relationshipHeatmapRows.forEach((row) => {
                let metricId = this.field(row, ["metric_id"]);
                if (metricId) {
                    foundMetrics.add(String(metricId));
                }

                preferred.forEach((metric) => {
                    if (this.field(row, [metric]) !== null) {
                        foundMetrics.add(metric);
                    }
                });

                if (this.field(row, ["gsea_p", "loading_mwu_p", "p_value"]) !== null) {
                    foundMetrics.add("gsea_neglog10p");
                }

                if (this.field(row, ["gsea_q", "loading_mwu_q", "q_value"]) !== null) {
                    foundMetrics.add("gsea_neglog10q");
                }
            });

            let orderedPreferred = preferred.filter((metric) => foundMetrics.has(metric));
            let additional = Array.from(foundMetrics).filter((metric) => !preferred.includes(metric));

            return orderedPreferred.concat(additional);
        },
        relationshipMetricOptions() {
            return this.relationshipMetricIds.map((metric) => ({
                value: metric,
                label: this.relationshipMetricLabel(metric),
            }));
        },
        relationshipHeatmapDisplay() {
            let metric = this.selectedRelationshipMetric || this.relationshipMetricIds[0] || "combined_match_score";
            let rows = this.heatRowsForMetric(metric)
                .filter((row) => this.field(row, ["state_type"]) !== "qc_state");

            if (!rows.length) {
                return {
                    metric,
                    programCount: 0,
                    stateCount: 0,
                    programHeaders: [],
                    stateRows: [],
                };
            }

            let programKeys = Array.from(new Set(
                rows
                    .map((row) => this.programKey(row))
                    .filter((value) => !!value)
            )).sort(this.naturalSort);
            let stateKeys = Array.from(new Set(
                rows
                    .map((row) => this.stateKey(row))
                    .filter((value) => !!value)
            )).sort(this.naturalSort);

            let cellMap = new Map();
            let values = [];

            rows.forEach((row) => {
                let programKey = this.programKey(row);
                let stateKey = this.stateKey(row);
                let metricValue = row.__metric_value;

                if (!programKey || !stateKey || !Number.isFinite(metricValue)) {
                    return;
                }

                cellMap.set(`${programKey}||${stateKey}`, row);
                values.push(metricValue);
            });

            let maxAbsolute = values.length ? Math.max(...values.map((value) => Math.abs(value))) : 1;
            let maxPositive = values.length ? Math.max(...values) : 1;
            let diverging = this.relationshipMetricIsDiverging(metric);

            let stateHeaders = stateKeys.map((stateKey) => {
                let metadataRow = this.stateMetadataById[stateKey] || { state_id: stateKey };
                return {
                    key: stateKey,
                    label: this.stateLabel(metadataRow),
                };
            });

            let programHeaders = programKeys.map((programKey) => {
                let infoRow = this.geneProgramInfoById[programKey] || { program_id: programKey };
                return {
                    key: programKey,
                    label: this.programLabel(infoRow),
                };
            });

            let stateRows = stateKeys.map((stateKey) => {
                let metadataRow = this.stateMetadataById[stateKey] || { state_id: stateKey };
                return {
                    key: stateKey,
                    label: this.stateLabel(metadataRow),
                    cells: programKeys.map((programKey) => {
                        let row = cellMap.get(`${programKey}||${stateKey}`);
                        let value = row ? row.__metric_value : null;
                        let programHeader = programHeaders.find((item) => item.key === programKey);

                        return {
                            key: `${stateKey}-${programKey}`,
                            value,
                            title: `${metadataRow ? this.stateLabel(metadataRow) : stateKey} x ${programHeader ? programHeader.label : programKey}`,
                            tooltipRows: row ? this.relationshipHeatmapTooltipRows(row, metadataRow, programHeader, metric) : [],
                            color: Number.isFinite(value)
                                ? this.relationshipCellColor(value, diverging, maxAbsolute, maxPositive)
                                : "#f8fafc",
                        };
                    }),
                };
            });

            return {
                metric,
                programCount: programKeys.length,
                stateCount: stateKeys.length,
                programHeaders,
                stateRows,
            };
        },
        relationshipHeatmapMetricLabel() {
            return this.relationshipMetricLabel(this.relationshipHeatmapDisplay.metric);
        },
        traitPhenotypeLookup() {
            let map = {};

            this.phenotypeTraitRows.forEach((row) => {
                let keys = [
                    row.name,
                    row.description,
                    row.label,
                    row.trait,
                ]
                    .filter((value) => !!value)
                    .map((value) => this.normalizeKey(value));

                keys.forEach((key) => {
                    map[key] = row;
                });
            });

            return map;
        },
        availableTraitColumns() {
            return this.traitHeatmapColumns.filter((column) => {
                return this.selectedTraitColumnFilter === "all" || column.type === this.selectedTraitColumnFilter;
            });
        },
        traitHeatmapDisplay() {
            let rows = this.traitHeatmapRows;
            let metric = this.selectedTraitMetric || "beta";
            let columns = this.availableTraitColumns;

            if (LIGER_FILTER_UNLABELED_HEATMAP_TRAITS) {
                rows = rows.filter((row) => this.shouldDisplayTraitInHeatmap(row));
            }

            if (this.selectedTraitColumnFilter !== "all") {
                rows = rows.filter((row) => row.__column_type === this.selectedTraitColumnFilter);
            }

            if (!rows.length || !columns.length) {
                return {
                    metric,
                    columnCount: columns.length,
                    groupRows: [],
                    scaleMax: 1,
                };
            }

            let rowsByColumn = new Map();

            rows.forEach((row) => {
                let value = this.traitMetricValue(row, metric);
                let trait = this.traitKey(row);

                if (!trait || !Number.isFinite(value)) {
                    return;
                }

                let columnRows = rowsByColumn.get(row.__column_id) || [];
                columnRows.push({
                    trait,
                    value,
                    row,
                });
                rowsByColumn.set(row.__column_id, columnRows);
            });

            let selectedTraits = new Set();

            rowsByColumn.forEach((columnRows) => {
                columnRows
                    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
                    .slice(0, 3)
                    .forEach((entry) => selectedTraits.add(entry.trait));
            });

            if (!selectedTraits.size) {
                return {
                    metric,
                    columnCount: columns.length,
                    groupRows: [],
                    scaleMax: 1,
                };
            }

            let valueMap = new Map();
            let values = [];

            rows.forEach((row) => {
                let trait = this.traitKey(row);
                let value = this.traitMetricValue(row, metric);

                if (!trait || !Number.isFinite(value) || !selectedTraits.has(trait)) {
                    return;
                }

                let cellKey = `${trait}||${row.__column_id}`;
                let existing = valueMap.get(cellKey);

                if (!existing || Math.abs(value) > Math.abs(existing.value)) {
                    valueMap.set(cellKey, {
                        value,
                        row,
                    });
                }

                values.push(value);
            });

            let scaleMax = this.quantile(values.map((value) => Math.abs(value)), 0.9) || 1;
            if (scaleMax === 0) {
                scaleMax = 1;
            }

            let groupedTraits = {};

            Array.from(selectedTraits).forEach((trait) => {
                let group = this.traitGroupLabel(trait);
                if (!groupedTraits[group]) {
                    groupedTraits[group] = [];
                }
                groupedTraits[group].push(trait);
            });

            let orderedGroups = Object.keys(groupedTraits).sort(this.naturalSort);
            let groupRows = orderedGroups.map((group) => ({
                group,
                traits: groupedTraits[group].sort(this.naturalSort).map((trait) => ({
                    trait,
                    displayTrait: this.traitDisplayName(trait),
                    cells: columns.map((column) => {
                        let record = valueMap.get(`${trait}||${column.id}`);
                        let value = record ? record.value : null;

                        return {
                            key: `${trait}-${column.id}`,
                            value,
                            title: `${column.label} | ${this.traitDisplayName(trait)}`,
                            tooltipRows: record ? this.traitHeatmapTooltipRows(record.row, trait, column) : [],
                            color: Number.isFinite(value)
                                ? this.relationshipCellColor(value, true, scaleMax, scaleMax)
                                : "#f8fafc",
                        };
                    }),
                })),
            }));

            return {
                metric,
                columnCount: columns.length,
                groupRows,
                scaleMax,
            };
        },
        traitHeatmapMetricLabel() {
            return this.selectedTraitMetric === "beta" ? "Joint beta" : "Marginal beta";
        },
        traitColumnHeaderLabel() {
            if (this.selectedTraitColumnFilter === "program") {
                return "Gene Program";
            }

            if (this.selectedTraitColumnFilter === "state") {
                return "Cell State";
            }

            return "State & Program";
        }
    },

    watch: {
        searchedGene(value) {
            let queryValue = (value || "").trim();

            this.geneSearchError = null;

            if (this.skipGeneSuggestionLookup) {
                this.skipGeneSuggestionLookup = false;
                return;
            }

            if (this.geneSuggestionTimer) {
                clearTimeout(this.geneSuggestionTimer);
                this.geneSuggestionTimer = null;
            }

            if (queryValue.length < 2) {
                this.geneSuggestions = [];
                this.isLoadingGeneSuggestions = false;
                this.noGeneSuggestions = false;
                return;
            }

            this.isLoadingGeneSuggestions = true;
            this.noGeneSuggestions = false;
            this.geneSuggestionTimer = setTimeout(() => {
                this.lookupGenes(queryValue);
            }, 200);
        }
    },

    async created() {
        await this.initializeFromQuery();
    },

    mounted() {
        // The row lists scroll with the page now rather than inside their own
        // panels, so the row tooltip - which is position:fixed and anchored to
        // where the row was - has to be dismissed on page scroll as well.
        window.addEventListener("scroll", this.hideExpressionRowTooltip, true);
        window.addEventListener("scroll", this.scheduleStuckSectionUpdate, { passive: true });
        window.addEventListener("resize", this.scheduleStuckSectionUpdate);
        this.scheduleStuckSectionUpdate();
    },

    // Selecting a row changes how tall the sections are, which can park or
    // release a header without any scrolling at all. Re-measuring after every
    // render is cheap because updateStuckSections only writes when something
    // actually changed, which is also what stops this from looping.
    updated() {
        this.scheduleStuckSectionUpdate();
    },

    beforeDestroy() {
        if (this.geneSuggestionTimer) {
            clearTimeout(this.geneSuggestionTimer);
        }

        if (this.stuckSectionFrame && typeof window !== "undefined") {
            window.cancelAnimationFrame(this.stuckSectionFrame);
        }

        window.removeEventListener("scroll", this.hideExpressionRowTooltip, true);
        window.removeEventListener("scroll", this.scheduleStuckSectionUpdate);
        window.removeEventListener("resize", this.scheduleStuckSectionUpdate);
    },

    methods: {
        async fetchJson(url) {
            let response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        },
        currentQueryParams() {
            let params = new URLSearchParams(window.location.search || "");

            return {
                gene: params.get("gene") || "",
                tissue: params.get("tissue") || "",
                cell_type: params.get("cell_type") || "",
                cell_state: params.get("cell_state") || "",
                gene_program: params.get("gene_program") || "",
            };
        },
        setQueryParams(paramMap = {}, { replace = false } = {}) {
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

            if (replace) {
                window.history.replaceState({ path: nextUrl }, "", nextUrl);
                return;
            }

            window.history.pushState({ path: nextUrl }, "", nextUrl);
        },
        syncQueryParams(paramMap = {}, options = {}) {
            this.setQueryParams(paramMap, {
                replace: this.isHydratingFromQuery || options.replace,
            });
        },
        async initializeFromQuery() {
            let query = this.currentQueryParams();
            let initialGene = query.gene || (this.config && this.config.gene ? String(this.config.gene) : "");

            if (!initialGene) {
                return;
            }

            this.isHydratingFromQuery = true;

            try {
                this.skipGeneSuggestionLookup = true;
                this.geneSuggestions = [];
                this.noGeneSuggestions = false;
                this.isLoadingGeneSuggestions = false;
                if (this.geneSuggestionTimer) {
                    clearTimeout(this.geneSuggestionTimer);
                    this.geneSuggestionTimer = null;
                }
                this.searchedGene = String(initialGene).toUpperCase();
                await this.submitGeneSearch(this.searchedGene);

                if (query.tissue) {
                    let requestedTissue = LIGER_TISSUE_CONFIG[query.tissue]
                        ? LIGER_TISSUE_CONFIG[query.tissue].label
                        : this.availableTissues.find((tissue) => this.tissueKeyFromLabel(tissue) === this.normalizeKey(query.tissue) || this.normalizeKey(tissue) === this.normalizeKey(query.tissue));

                    if (requestedTissue) {
                        await this.selectTissue(requestedTissue);
                    }
                }

                if (query.cell_type && this.selectedTissue) {
                    let requestedCellType = this.availableCellTypes.find((cellType) => {
                        return this.normalizeKey(cellType.key) === this.normalizeKey(query.cell_type) ||
                            this.normalizeKey(cellType.label) === this.normalizeKey(query.cell_type);
                    });

                    if (requestedCellType) {
                        await this.selectCellType(requestedCellType);
                    }
                }

                // A shared link restores the row selection, which is what opens
                // the in-card metadata - not the drawer, which is now only for
                // the relationship and trait heatmaps.
                if (query.cell_state && this.selectedCellType) {
                    await this.applyCellStateSelection(query.cell_state, this.stateMetadataById[query.cell_state] || this.cellStateExpressionRows.find((row) => this.stateKey(row) === query.cell_state));
                } else if (query.gene_program && this.selectedCellType) {
                    await this.applyGeneProgramSelection(query.gene_program, this.geneProgramInfoById[query.gene_program] || this.programExpressionRows.find((row) => this.programKey(row) === query.gene_program));
                }
            } finally {
                this.syncQueryParams({
                    gene: this.selectedGene || "",
                    tissue: this.selectedTissue ? this.tissueKeyFromLabel(this.selectedTissue) : "",
                    cell_type: this.selectedCellType ? this.selectedCellType.key : "",
                    cell_state: this.selectedCellStateKey,
                    gene_program: this.selectedProgramKey,
                }, { replace: true });
                this.isHydratingFromQuery = false;
            }
        },
        buildMatchUrl(queryValue) {
            return `${LIGER_PHENOTYPES_HOST}/api/bio/match/gene?q=${encodeURIComponent(queryValue)}`;
        },
        buildCellStateExpressionUrl(gene) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-expression-cell-state?q=${encodeURIComponent(gene)}`;
        },
        buildProgramExpressionUrl(gene) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-expression-program?q=${encodeURIComponent(gene)}`;
        },
        // The tissueQuery argument comes from tissueQueryKey(): a dataset ID on
        // dataset-keyed portals, a tissue key on tissue-keyed ones.
        buildCellTypeExpressionUrl(tissueQuery, gene) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-expression-cell-type?q=${encodeURIComponent(`${tissueQuery},${gene}`)}`;
        },
        buildCellStateSectionExpressionUrl(tissueQuery, cellType, gene) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-expression-cell-state?q=${encodeURIComponent(`${tissueQuery},${cellType},${gene}`)}`;
        },
        buildProgramSectionExpressionUrl(datasetId, cellType, gene) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-expression-program?q=${encodeURIComponent(`${datasetId},${cellType},${LIGER_PROGRAM_MODEL},${gene}`)}`;
        },
        buildCellStateMetadataUrl(tissue, cellType) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-cell-state-metadata-extended?q=${encodeURIComponent(`${tissue},${cellType}`)}`;
        },
        buildGeneProgramInfoUrl(datasetId, cellType) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-factor?q=${encodeURIComponent(`${datasetId},${cellType},${LIGER_PROGRAM_MODEL}`)}`;
        },
        buildProgramGeneInfoUrl(datasetId, cellType, programId) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-gene-factor?q=${encodeURIComponent(`${datasetId},${cellType},${LIGER_PROGRAM_MODEL},${programId}`)}`;
        },
        buildProgramGeneSetInfoUrl(datasetId, cellType, programId) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-gene-set-factor?q=${encodeURIComponent(`${datasetId},${cellType},${LIGER_PROGRAM_MODEL},${programId}`)}`;
        },
        buildProgramQcInfoUrl(datasetId, cellType, programId) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-qc-factor?q=${encodeURIComponent(`${datasetId},${cellType},${LIGER_PROGRAM_MODEL},${programId}`)}`;
        },
        buildQcMetadataUrl() {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-qc-metadata-extended?q=1`;
        },
        buildRelationshipHeatmapUrl(tissueQuery, cellType) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-heatmap?q=${encodeURIComponent(`${tissueQuery},${cellType}`)}`;
        },
        buildTraitPhenotypesUrl() {
            return `${LIGER_PHENOTYPES_HOST}/api/portal/phenotypes?q=md`;
        },
        buildCellStateTraitUrl(tissueQuery, cellType, stateId) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-cell-state-trait-factor?q=${encodeURIComponent(`${tissueQuery},${cellType},${stateId}`)}`;
        },
        buildProgramTraitUrl(datasetId, cellType, programId) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-trait-factor?q=${encodeURIComponent(`${datasetId},${cellType},${LIGER_PROGRAM_MODEL},${programId}`)}`;
        },
        async ensurePhenotypeTraitRows() {
            if (this.phenotypeTraitRows.length) {
                return;
            }

            let phenotypePayload = await this.fetchJson(this.buildTraitPhenotypesUrl());
            this.phenotypeTraitRows = this.rowsFromResponse(phenotypePayload);
        },
        async ensureQcMetadataRows() {
            if (this.qcMetadataRows.length) {
                return;
            }

            let payload = await this.fetchJson(this.buildQcMetadataUrl());
            this.qcMetadataRows = this.rowsFromResponse(payload);
        },
        rowsFromResponse(payload) {
            if (Array.isArray(payload)) {
                return payload;
            }

            if (!payload || typeof payload !== "object") {
                return [];
            }

            let rowCollections = [
                payload.data,
                payload.results,
                payload.rows,
                payload.items,
                payload.values,
                payload.result,
            ];

            for (let i = 0; i < rowCollections.length; i++) {
                let collection = rowCollections[i];

                if (!Array.isArray(collection)) {
                    continue;
                }

                if (collection.length > 0 && Array.isArray(collection[0]) && Array.isArray(payload.columns)) {
                    return collection.map((row) => {
                        let mappedRow = {};
                        payload.columns.forEach((column, columnIndex) => {
                            mappedRow[column] = row[columnIndex];
                        });
                        return mappedRow;
                    });
                }

                return collection;
            }

            if (Array.isArray(payload.columns) && Array.isArray(payload.data)) {
                return this.rowsFromResponse({
                    columns: payload.columns,
                    data: payload.data,
                });
            }

            return [payload];
        },
        field(row, names = []) {
            if (!row || typeof row !== "object") {
                return null;
            }

            let normalizedRow = {};
            Object.keys(row).forEach((key) => {
                normalizedRow[this.normalizeKey(key)] = row[key];
            });

            for (let i = 0; i < names.length; i++) {
                let key = names[i];
                if (key in row && row[key] !== undefined && row[key] !== null && row[key] !== "") {
                    return row[key];
                }

                let normalizedKey = this.normalizeKey(key);
                if (normalizedKey in normalizedRow && normalizedRow[normalizedKey] !== undefined && normalizedRow[normalizedKey] !== null && normalizedRow[normalizedKey] !== "") {
                    return normalizedRow[normalizedKey];
                }
            }

            return null;
        },
        normalizeKey(value) {
            return String(value || "")
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "");
        },
        normalizeGeneLabel(gene) {
            if (gene == null) {
                return "";
            }

            if (typeof gene === "string") {
                return gene.toUpperCase();
            }

            let label = this.field(gene, ["symbol", "gene_symbol", "name", "gene", "id"]);
            return String(label || "").toUpperCase();
        },
        formatDisplayLabel(value) {
            return String(value || "")
                .replace(/_/g, " ")
                .split(" ")
                .filter((part) => !!part)
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ");
        },
        tissueKeyFromLabel(label) {
            return Object.keys(LIGER_TISSUE_CONFIG).find((tissueKey) => {
                return LIGER_TISSUE_CONFIG[tissueKey].label === label;
            }) || null;
        },
        tissueAllowed(label) {
            if (!this.configuredTissueKeys.length) {
                return true;
            }

            let tissueKey = this.tissueKeyFromLabel(label) || this.normalizeKey(label);
            return this.configuredTissueKeys.includes(tissueKey);
        },
        tissueDatasetId(label) {
            let tissueKey = this.tissueKeyFromLabel(label);
            if (!tissueKey) {
                return null;
            }

            // Prefer the dataset ID this portal actually used for the current
            // gene; fall back to the first configured ID when the response only
            // gave us tissue labels.
            return this.observedDatasetIds[tissueKey]
                || (LIGER_TISSUE_CONFIG[tissueKey].datasetIds || [])[0]
                || null;
        },
        // The cell-state family of endpoints keys on a tissue on some portals and
        // on a dataset ID on others. The gene-level cell-state response tells us
        // which: if its rows carry a tissue, the portal speaks tissue; if they
        // only carry a dataset ID, it speaks dataset. Note the program payload
        // is no help here, since it reports dataset IDs on both kinds of portal.
        detectCellStateDatasetKeying(rows = []) {
            let hasTissue = rows.some((row) => !!this.field(row, ["tissue_label", "tissue"]));
            let hasDataset = rows.some((row) => !!this.rowDatasetId(row));

            return !hasTissue && hasDataset;
        },
        // Query key for the cell-state family only. The two cell-state-metadata
        // endpoints are tissue-keyed everywhere and should keep using
        // tissueKeyFromLabel; the program endpoints take tissueDatasetId.
        tissueQueryKey(label) {
            let tissueKey = this.tissueKeyFromLabel(label);
            if (!tissueKey) {
                return "";
            }

            if (!this.cellStateUsesDatasetKey) {
                return tissueKey;
            }

            return this.tissueDatasetId(label) || tissueKey;
        },
        rowDatasetId(row) {
            return String(this.field(row, ["dataset_id", "dataset"]) || "");
        },
        rowTissueKey(row) {
            let tissue = this.field(row, ["tissue_label", "tissue"]);
            if (tissue) {
                let normalizedTissue = this.normalizeKey(tissue);
                if (LIGER_TISSUE_CONFIG[normalizedTissue]) {
                    return normalizedTissue;
                }
            }

            let datasetId = this.rowDatasetId(row);
            return LIGER_DATASET_TISSUE_MAP[datasetId] || null;
        },
        tissueLabel(row) {
            let tissueKey = this.rowTissueKey(row);
            if (tissueKey) {
                return LIGER_TISSUE_CONFIG[tissueKey].label;
            }

            // Unrecognized tissue with no dataset ID we can map: show it as-is
            // rather than dropping the row.
            let tissue = this.field(row, ["tissue_label", "tissue"]);
            return tissue ? this.formatDisplayLabel(tissue) : "";
        },
        cellTypeKey(row) {
            let label = this.field(row, ["cell_type", "annotated_cell_type", "celltype", "cell_type_label"]);
            return String(label || "");
        },
        cellTypeLabel(row) {
            let label = this.field(row, ["cell_type_label", "annotated_cell_type", "cell_type", "celltype"]);
            return this.formatDisplayLabel(label);
        },
        stateKey(row) {
            return String(this.field(row, ["state_id", "state", "cell_state_id", "state_name", "display_name"]) || "");
        },
        stateLabel(row) {
            let key = this.stateKey(row);
            let metadataRow = key ? this.stateMetadataById[key] : null;
            let label = this.field(metadataRow || row, ["display_name", "state_label", "cell_state", "state_name", "state_id"]);
            return this.formatDisplayLabel(label);
        },
        programKey(row) {
            return String(this.field(row, ["program_id", "factor", "factor_id", "program", "label"]) || "");
        },
        programLabel(row) {
            let key = this.programKey(row);
            let infoRow = key ? this.geneProgramInfoById[key] : null;
            let label = this.field(infoRow || row, ["suggested_program_label", "program_label", "label", "display_name", "program_id", "factor"]);
            return this.formatDisplayLabel(label);
        },
        absoluteExpressionValue(row) {
            return this.numericField(row, [
                "log10_cpk",
            ]);
        },
        specificityValue(row) {
            return this.numericField(row, [
                "log2fc_weighted_vs_all_parent",
                "log2fc_vs_all_parent",
                "specificity_log2fc",
                "log2_fold_change",
                "specificity",
                "spec",
            ]);
        },
        numericField(row, names = []) {
            let value = this.field(row, names);

            // field() returns null when it finds nothing, and Number(null) is 0,
            // which is finite - so without this guard every absent numeric field
            // silently became a real zero. That is what put a column of "0.00"
            // under cell-type Specificity (the API sends null there on every
            // row), and it made a missing p_value read as 0, i.e. maximally
            // significant. Real zeros in the data still pass through: field()
            // only skips null/undefined/"".
            if (value === null || value === undefined || value === "") {
                return null;
            }

            let numberValue = Number(value);
            return Number.isFinite(numberValue) ? numberValue : null;
        },
        formatMetric(value) {
            if (!Number.isFinite(value)) {
                return "0.00";
            }

            return value.toFixed(2);
        },
        isFiniteNumber(value) {
            return Number.isFinite(value);
        },
        // Missing and zero are different facts. formatMetric() renders both as
        // "0.00", which in the bar cards reads as a real measurement of nothing.
        // The wider drawer tables still use formatMetric; only the bars use this.
        formatMetricOrDash(value) {
            return Number.isFinite(value) ? value.toFixed(2) : "—";
        },
        // The linear expression scale spans several orders of magnitude, so a
        // fixed 2 decimals would print "0.00" for everything below a hundredth
        // and lose the distinction between "barely there" and "absent".
        formatExpressionValue(value) {
            if (!Number.isFinite(value)) {
                return "—";
            }

            if (value >= 0.1) {
                return value.toFixed(2);
            }

            if (value >= 0.001) {
                return value.toFixed(3);
            }

            return value > 0 ? "<0.001" : "0";
        },
        // p_value underflows to 5e-324 for the strongest hits, so anything at the
        // floor is reported as a bound rather than a number that looks precise.
        formatSignificance(value) {
            if (!Number.isFinite(value)) {
                return "—";
            }

            if (value < 1e-300) {
                return "<1e-300";
            }

            return this.formatPValue(value);
        },
        specificityAxisFor(rows = []) {
            let configured = Number(this.ligerConfig.specificityAxis);
            if (Number.isFinite(configured) && configured > 0) {
                return configured;
            }

            let observed = rows
                .map((row) => this.specificityValue(row))
                .filter((value) => Number.isFinite(value))
                .reduce((max, value) => Math.max(max, Math.abs(value)), 0);

            return this.niceAxisMax(Math.max(observed, LIGER_SPECIFICITY_AXIS_FLOOR));
        },
        specificityTicksFor(axis) {
            return [-axis, 0, axis].map((value) => ({
                value,
                label: value > 0 ? `+${this.formatAxisTick(value)}` : this.formatAxisTick(value),
                offset: `${((value + axis) / (axis * 2)) * 100}%`,
            }));
        },
        // Round the axis top up to the next readable step so ticks land on
        // values like 0.6 / 0.8 / 1.5 instead of 1.543.
        niceAxisMax(value) {
            if (!Number.isFinite(value) || value <= 0) {
                return 1;
            }

            let magnitude = Math.pow(10, Math.floor(Math.log10(value)));
            let normalized = value / magnitude;
            let step = [1, 1.2, 1.4, 1.5, 1.6, 1.8, 2, 2.5, 3, 4, 5, 6, 8, 10]
                .find((candidate) => normalized <= candidate + 1e-9);

            return Number((step * magnitude).toPrecision(2));
        },
        // The axis top moves with the gene, so ticks span anything from ~0.5 to
        // ~1.6 and a fixed decimal count would print "0.0" or drop detail.
        formatAxisTick(value) {
            if (!Number.isFinite(value)) {
                return "";
            }

            if (value === 0) {
                return "0";
            }

            // Axis tops range from ~0.5 to ~10 depending on gene and portal, so
            // no single decimal count works: "10.0" is clumsy and "0.3" loses a
            // 0.25 midpoint.
            if (Number.isInteger(value)) {
                return String(value);
            }

            return Math.abs(value) >= 1 ? value.toFixed(1) : String(Number(value.toFixed(2)));
        },
        // Fraction of the fixed axis this value fills, plus which end it ran off
        // so the caller can mark clamped rows instead of hiding the clamp.
        axisFill(value, min, max) {
            if (!Number.isFinite(value) || max <= min) {
                return { percent: 0, overflow: null, present: false };
            }

            let raw = ((value - min) / (max - min)) * 100;
            let overflow = raw > 100 ? "high" : (raw < 0 ? "low" : null);

            return { percent: Math.max(0, Math.min(100, raw)), overflow, present: true };
        },
        toExpressionList(rows = [], kind) {
            let axisMax = this.expressionAxisMax;
            let specAxis = this.specificityAxisFor(rows);

            return rows
                .map((row) => {
                    let absoluteExpression = this.absoluteExpressionValue(row);
                    // Undo the pipeline's outer log so the bar has a true zero.
                    let linearExpression = Number.isFinite(absoluteExpression)
                        ? Math.pow(10, absoluteExpression)
                        : null;
                    let specificity = this.specificityValue(row);
                    let pValue = this.numericField(row, ["p_value"]);
                    let fill = this.axisFill(linearExpression, 0, axisMax);
                    let specFill = this.axisFill(specificity, -specAxis, specAxis);
                    let key = kind === "state"
                        ? this.stateKey(row)
                        : (kind === "program" ? this.programKey(row) : this.cellTypeKey(row));
                    let label = kind === "state"
                        ? this.stateLabel(row)
                        : (kind === "program" ? this.programLabel(row) : this.cellTypeLabel(row));

                    return {
                        key,
                        label,
                        abs: linearExpression,
                        // raw pipeline value, surfaced on hover
                        absRaw: absoluteExpression,
                        absRawText: this.formatMetricOrDash(absoluteExpression),
                        absText: this.formatExpressionValue(linearExpression),
                        expressionWidth: `${fill.percent}%`,
                        expressionOverflow: fill.overflow,
                        hasExpression: fill.present,
                        spec: specificity,
                        specText: this.formatMetricOrDash(specificity),
                        // -1..1 of a half-track; the template scales a
                        // center-anchored fill by this, so passing through 0
                        // crosses the axis cleanly.
                        specScale: Number.isFinite(specificity)
                            ? Math.max(-1, Math.min(1, specificity / specAxis)).toFixed(3)
                            : "0",
                        specOverflow: specFill.overflow,
                        hasSpec: specFill.present,
                        // Only dim a bar when there is a p-value saying it is not
                        // significant. Some endpoints omit p_value entirely, and
                        // dimming the whole column on missing data reads as "all
                        // low confidence" when it actually means "not reported".
                        muted: Number.isFinite(pValue) && pValue > LIGER_SIGNIFICANCE_P,
                        pValueText: this.formatSignificance(pValue),
                        row,
                    };
                })
                .filter((item) => !!item.key)
                .sort((a, b) => this.compareExpressionRows(a, b));
        },
        // Sort by the same value the bar is drawn from. The old order used a
        // wider field-name fallback list than the bar used, so rows could appear
        // out of order relative to their own bars. Rows with no value sort last
        // rather than being treated as zero.
        compareExpressionRows(a, b) {
            let aFinite = Number.isFinite(a.abs);
            let bFinite = Number.isFinite(b.abs);

            if (aFinite !== bFinite) {
                return aFinite ? -1 : 1;
            }

            if (!aFinite) {
                return String(a.label).localeCompare(String(b.label));
            }

            return b.abs - a.abs;
        },
        stateDescription(row) {
            let summary = this.field(row, [
                "portal_user_summary",
                "gene_expression_interpretation",
                "biological_description",
                "recommended_portal_summary",
                "short_description",
                "curation_notes",
                "description",
                "notes",
            ]);
            if (summary) {
                return String(summary);
            }

            let summaryObject = row && row.summary;
            if (summaryObject && typeof summaryObject === "object") {
                return String(
                    summaryObject.portal_user_summary ||
                    summaryObject.gene_expression_interpretation ||
                    summaryObject.biological_description ||
                    summaryObject.recommended_portal_summary ||
                    summaryObject.short_description ||
                    summaryObject.curation_notes ||
                    ""
                );
            }

            return "No description available.";
        },
        programDescription(row) {
            let description = this.field(row, [
                "program_label",
                "suggested_program_label",
                "label",
                "display_name",
                "description",
            ]);
            return String(description || "No description available.");
        },
        extractGenes(row, fields = []) {
            let genes = [];
            fields.forEach((fieldName) => {
                let value = this.field(row, [fieldName]);
                if (value == null) {
                    return;
                }

                if (Array.isArray(value)) {
                    value.forEach((item) => {
                        if (item && typeof item === "object") {
                            let gene = item.gene || item.gene_symbol || item.name;
                            if (gene) {
                                genes.push(String(gene));
                            }
                        } else if (item) {
                            genes.push(String(item));
                        }
                    });
                    return;
                }

                if (typeof value === "object") {
                    let gene = value.gene || value.gene_symbol || value.name;
                    if (gene) {
                        genes.push(String(gene));
                    }
                    return;
                }

                String(value)
                    .split(/[,;|]/)
                    .map((item) => item.trim())
                    .filter((item) => !!item)
                    .forEach((item) => genes.push(item));
            });

            return Array.from(new Set(genes));
        },
        naturalSort(a, b) {
            return String(a || "").localeCompare(String(b || ""), undefined, {
                numeric: true,
                sensitivity: "base",
            });
        },
        relationshipMetricLabel(metric) {
            let labels = {
                correlation: "Program-state correlation",
                combined_match_score: "Overall match score",
                gsea_nes: "Marker enrichment NES",
                gsea_neglog10p: "Marker enrichment -log10(P)",
                gsea_neglog10q: "Marker enrichment -log10(q)",
                loading_auc: "Loading AUROC",
                cell_spearman_r_gradient: "Cell coactivity r",
                donor_spearman_r_gradient: "Donor coactivity r",
                expression_score_spearman_r: "Program genes vs state-specific genes",
                top100_overlap_n: "Top 100 marker overlap",
            };

            return labels[metric] || this.formatDisplayLabel(metric);
        },
        relationshipMetricTooltip(metric) {
            let tooltips = {
                correlation: "Correlation of cell expression values between program and state",
                gsea_neglog10p: "Enrichment of state marker genes within genes with high factor loadings (p-value)",
                gsea_neglog10q: "Enrichment of state marker genes within genes with high factor loadings (FDR q-value)",
            };

            return tooltips[metric] || "";
        },
        traitMetricTooltip(metric) {
            let tooltips = {
                beta: "Predictive power of state/factor on genetic association adjusting for other state/factors (produced by PIGEAN; 0.01=significant, 0.1=strong, 1.0=extreme)",
                beta_uncorrected: "Predictive power of state/factor on genetic association in isolation (produced by PIGEAN; 0.01=significant, 0.1=strong, 1.0=extreme)",
            };

            return tooltips[metric] || "";
        },
        tooltipMetricValue(value, { pValue = false } = {}) {
            if (pValue) {
                return this.formatPValue(value);
            }

            return this.formatMetric(value);
        },
        stateTooltipColumns(cellState) {
            let metadataRow = this.stateMetadataById[cellState.key] || cellState.row || {};
            let markerGenes = this.extractMarkerGenes(metadataRow);

            return [
                { label: "Cell State", value: cellState.label || this.stateLabel(metadataRow) || "Not available" },
                { label: "Expression (raw log₁₀ CPK)", value: cellState.absRawText },
                { label: "Specificity p-value", value: cellState.pValueText },
                { label: "Description", value: this.stateDescription(metadataRow) || "No description available." },
                { label: "Marker Genes", value: this.joinDisplayList(markerGenes), items: markerGenes },
            ];
        },
        programTooltipColumns(program) {
            let infoRow = this.geneProgramInfoById[program.key] || program.row || {};
            let topGenes = this.extractGenes(infoRow, ["top_genes", "genes", "gene_symbols"]);

            return [
                { label: "Gene Program", value: program.label || this.programLabel(infoRow) || "Not available" },
                { label: "Expression (raw log₁₀ CPK)", value: program.absRawText },
                { label: "Specificity p-value", value: program.pValueText },
                { label: "Description", value: this.programDescription(infoRow) || "No description available." },
                { label: "Top Genes", value: this.joinDisplayList(topGenes), items: topGenes },
            ];
        },
        // Clicking a row is the selection, and the selection is what opens the
        // metadata beside the rows - so clicking the selected row again closes
        // it. Cross-links from inside a pane go through the apply* methods
        // instead, since "go to this state" must not toggle it shut.
        async selectCellState(cellState) {
            if (this.selectedCellStateKey === cellState.key) {
                this.clearCellStateSelection();
                return;
            }

            await this.applyCellStateSelection(cellState.key, cellState.row);
        },
        async applyCellStateSelection(stateId, fallbackRow) {
            if (!stateId) {
                return;
            }

            this.selectedCellStateKey = stateId;

            // The program list has just been refiltered; a selected program the
            // new filter excludes would leave the program section showing
            // metadata for a row that is no longer in it.
            if (this.selectedProgramKey && !this.geneProgramExpressionList.some((program) => program.key === this.selectedProgramKey)) {
                this.clearGeneProgramSelection();
            }

            await this.loadCellStateDetail(stateId, fallbackRow);
        },
        clearCellStateSelection() {
            this.selectedCellStateKey = "";
            this.cellStateDetail = null;
        },
        async selectGeneProgram(program) {
            if (this.selectedProgramKey === program.key) {
                this.clearGeneProgramSelection();
                return;
            }

            await this.applyGeneProgramSelection(program.key, program.row);
        },
        async applyGeneProgramSelection(programId, fallbackRow) {
            if (!programId) {
                return;
            }

            this.selectedProgramKey = programId;
            await this.loadGeneProgramDetail(programId, fallbackRow);
        },
        clearGeneProgramSelection() {
            this.selectedProgramKey = "";
            this.geneProgramDetail = null;
        },
        // Both loaders re-check the selection after every await: clicking a
        // second row before the first one's fetches land would otherwise let the
        // slower response overwrite the newer selection's pane.
        async loadCellStateDetail(stateId, fallbackRow) {
            let head = this.stateDetailHead(stateId, fallbackRow);

            this.cellStateDetail = {
                id: head.id,
                title: head.title,
                badges: head.badges,
                content: null,
                loading: true,
            };

            let content = await this.stateDetailContent(head.resolution);

            if (this.selectedCellStateKey !== stateId) {
                return;
            }

            this.cellStateDetail = {
                id: head.id,
                title: head.title,
                badges: head.badges,
                content,
                loading: false,
            };
        },
        async loadGeneProgramDetail(programId, fallbackRow) {
            this.geneProgramDetail = {
                id: programId,
                title: this.programLabel(this.geneProgramInfoById[programId] || fallbackRow || { program_id: programId }),
                badges: [],
                content: null,
                loading: true,
            };

            let head = await this.programDetailHead(programId, fallbackRow);

            if (this.selectedProgramKey !== programId) {
                return;
            }

            this.geneProgramDetail = {
                id: head.id,
                title: head.title,
                badges: head.badges,
                content: null,
                loading: true,
            };

            let content = await this.programDetailContent(head);

            if (this.selectedProgramKey !== programId) {
                return;
            }

            this.geneProgramDetail = {
                id: head.id,
                title: head.title,
                badges: head.badges,
                content,
                loading: false,
            };
        },
        // A pane's cross-links point into the other section, so following one
        // moves the selection there and scrolls that section into view.
        openStateFromPanel(stateId, fallbackRow) {
            this.applyCellStateSelection(stateId, fallbackRow);
            this.scrollToSection("state");
        },
        openProgramFromPanel(programId, fallbackRow) {
            this.applyGeneProgramSelection(programId, fallbackRow);
            this.scrollToSection("program");
        },
        sectionStackIndex(name) {
            let index = this.visibleSectionOrder.indexOf(name);
            return index < 0 ? 0 : index;
        },
        // Reads down the stack at a glance: a filled dot is the gene the page is
        // about, a hook is a section that has something in it, and an outline is
        // one still waiting. Decorative only - the header text says the same
        // thing, which is why the span is aria-hidden.
        sectionIcon(name) {
            if (name === "gene") {
                return this.selectedGene ? "\u25cf" : "\u25cb";
            }

            return this.sectionHasContent(name) ? "\u21b3" : "\u25cb";
        },
        sectionHasContent(name) {
            if (name === "tissue") {
                return this.tissueCount > 0;
            }

            if (name === "cellType") {
                return this.cellTypeCount > 0;
            }

            if (name === "state") {
                return this.cellStateCount > 0;
            }

            if (name === "program") {
                return this.geneProgramCount > 0;
            }

            if (name === "relationships") {
                return this.relationshipHeatmapDisplay.stateRows.length > 0;
            }

            if (name === "traits") {
                return this.traitHeatmapDisplay.groupRows.length > 0;
            }

            return false;
        },
        sectionStickyStyle(name) {
            return { "--i": String(this.sectionStackIndex(name)) };
        },
        scheduleStuckSectionUpdate() {
            if (typeof window === "undefined" || this.stuckSectionFrame) {
                return;
            }

            this.stuckSectionFrame = window.requestAnimationFrame(() => {
                this.stuckSectionFrame = null;
                this.updateStuckSections();
            });
        },
        // A header is parked once its anchor - the zero-height marker sitting in
        // front of it - has reached the slot the header pins to. Reading the
        // anchor rather than the header matters: a stuck header reports the
        // position it is pinned at, so it would always look parked.
        //
        // The subtlety is that parking a header shortens it, which pulls every
        // anchor below it up - so with two headers back to back (which happens
        // whenever a section has no body, e.g. before a cell type is picked)
        // they park at the same scroll position, but only the first one looks
        // parked in a pass that reads live positions. So each anchor is measured
        // against where it will be once the headers above have finished
        // shrinking, and the whole cascade resolves in one pass instead of
        // needing a further scroll event per header to catch up.
        updateStuckSections() {
            let next = {};
            let changed = false;
            let shrinkAbove = 0;
            // A sticky box cannot be held below the bottom of its containing
            // block, so a header only actually parks if the sheet still reaches
            // past its slot. Without this the class could say parked while the
            // browser had clamped the header somewhere else entirely.
            let sheet = this.$refs.ligerSections;
            let sheetBottom = sheet ? sheet.getBoundingClientRect().bottom : Number.POSITIVE_INFINITY;

            this.visibleSectionOrder.forEach((name, index) => {
                let anchor = this.$refs[LIGER_SECTION_ANCHOR_REFS[name]];

                if (!anchor) {
                    next[name] = false;
                    return;
                }

                let slotTop = index * LIGER_HEADER_STUCK_HEIGHT;
                let projectedTop = anchor.getBoundingClientRect().top - shrinkAbove;
                let stuck = projectedTop <= slotTop + 0.5 && sheetBottom >= slotTop + LIGER_HEADER_STUCK_HEIGHT;

                next[name] = stuck;

                if (this.stuckSections[name] !== stuck) {
                    changed = true;
                }

                if (stuck) {
                    let header = anchor.nextElementSibling;
                    let height = header ? header.getBoundingClientRect().height : LIGER_HEADER_STUCK_HEIGHT;

                    shrinkAbove += Math.max(0, height - LIGER_HEADER_STUCK_HEIGHT);
                }
            });

            if (changed || Object.keys(next).length !== Object.keys(this.stuckSections).length) {
                this.stuckSections = next;
            }
        },
        // Clicking a header returns to its section. The anchor is a zero-height
        // element in front of the header rather than the header itself: a stuck
        // header reports the position it is pinned at, not the one it came from,
        // so scrolling to it would be a no-op exactly when it is needed.
        scrollToSection(name) {
            let anchor = this.$refs[LIGER_SECTION_ANCHOR_REFS[name]];

            if (!anchor || typeof window === "undefined") {
                return;
            }

            let index = this.sectionStackIndex(name);
            // Every header above this one will be parked once we get there, and
            // parking one shortens it - so the anchor's document position is
            // about to move up by that much. Measuring without allowing for it
            // overshoots by 10px per header that is not parked yet.
            let aboutToPark = this.visibleSectionOrder
                .slice(0, index)
                .filter((sectionName) => !this.stuckSections[sectionName])
                .length;
            let top = anchor.getBoundingClientRect().top
                + window.pageYOffset
                - (index * LIGER_HEADER_STUCK_HEIGHT)
                - (aboutToPark * (LIGER_HEADER_HEIGHT - LIGER_HEADER_STUCK_HEIGHT));

            window.scrollTo({ top, behavior: "smooth" });
        },
        showExpressionRowTooltip(event, kind, item) {
            if (!event || !event.currentTarget || !item) {
                this.hideExpressionRowTooltip();
                return;
            }

            let rowKey = `${kind}:${item.key}`;

            // mousemove fires this on every pixel of travel across a row. The
            // answer only changes when the row changes, and recomputing would
            // re-measure and jitter the box under the cursor.
            if (this.floatingExpressionTooltip.visible && this.floatingExpressionTooltip.rowKey === rowKey) {
                return;
            }

            let columns = kind === "state"
                ? this.stateTooltipColumns(item)
                : this.programTooltipColumns(item);

            if (!columns.length) {
                this.hideExpressionRowTooltip();
                return;
            }

            let rect = event.currentTarget.getBoundingClientRect();
            let viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1440;

            this.floatingExpressionTooltip.visible = true;
            this.floatingExpressionTooltip.positioned = false;
            this.floatingExpressionTooltip.rowKey = rowKey;
            this.floatingExpressionTooltip.columns = columns;
            // Left-aligned to the row, so the tooltip reads as belonging to it.
            this.floatingExpressionTooltip.x = Math.max(
                LIGER_TOOLTIP_MARGIN,
                Math.min(viewportWidth - LIGER_TOOLTIP_WIDTH - LIGER_TOOLTIP_MARGIN, rect.left)
            );
            this.floatingExpressionTooltip.anchorX = rect.left + 60;
            this.floatingExpressionTooltip.anchorTop = rect.top;
            this.floatingExpressionTooltip.anchorBottom = rect.bottom;

            this.$nextTick(this.alignExpressionRowTooltip);
        },
        // Vertical placement needs the rendered height, which is only knowable
        // once the box exists - and the height swings from a couple of lines to
        // a full marker list, so guessing it (this used to assume 220px) put the
        // box in the wrong place entirely.
        alignExpressionRowTooltip() {
            let element = this.$refs.expressionTooltip;

            if (!element || !this.floatingExpressionTooltip.visible) {
                return;
            }

            let gap = 10;
            let height = element.offsetHeight;
            let viewportHeight = typeof window !== "undefined" ? window.innerHeight : 900;
            let tooltip = this.floatingExpressionTooltip;
            let spaceBelow = viewportHeight - tooltip.anchorBottom - gap - LIGER_TOOLTIP_MARGIN;
            let spaceAbove = tooltip.anchorTop - gap - LIGER_TOOLTIP_MARGIN;
            // Below by default; above only when the box genuinely does not fit
            // below and fits better above. If it fits neither the clamp below
            // takes over, which is the one case where it can still cover rows.
            let placeBelow = height <= spaceBelow || spaceBelow >= spaceAbove;
            let top = placeBelow ? tooltip.anchorBottom + gap : tooltip.anchorTop - gap - height;
            let maxTop = Math.max(LIGER_TOOLTIP_MARGIN, viewportHeight - height - LIGER_TOOLTIP_MARGIN);

            tooltip.side = placeBelow ? "below" : "above";
            tooltip.y = Math.max(LIGER_TOOLTIP_MARGIN, Math.min(maxTop, top));
            // Clamped so the arrow stays clear of the rounded corners.
            tooltip.arrowX = Math.max(20, Math.min(element.offsetWidth - 20, tooltip.anchorX - tooltip.x));
            tooltip.positioned = true;
        },
        hideExpressionRowTooltip() {
            this.floatingExpressionTooltip.visible = false;
            this.floatingExpressionTooltip.positioned = false;
            this.floatingExpressionTooltip.rowKey = "";
            this.floatingExpressionTooltip.columns = [];
        },
        showHeatmapTooltip(event, rows = []) {
            if (!rows.length) {
                this.hideHeatmapTooltip();
                return;
            }

            this.floatingHeatmapTooltip.visible = true;
            this.floatingHeatmapTooltip.rows = rows;
            this.moveHeatmapTooltip(event);
        },
        moveHeatmapTooltip(event) {
            if (!this.floatingHeatmapTooltip.visible || !event) {
                return;
            }

            this.floatingHeatmapTooltip.x = event.clientX + 16;
            this.floatingHeatmapTooltip.y = event.clientY + 16;
        },
        hideHeatmapTooltip() {
            this.floatingHeatmapTooltip.visible = false;
            this.floatingHeatmapTooltip.rows = [];
        },
        relationshipHeatmapTooltipRows(row, metadataRow, programHeader, metric) {
            let markerScore = this.numericField(row, ["combined_match_score", "loading_auc", "top100_overlap_n", "score"]);
            let gseaP = this.gseaPValue(row);
            let gseaQ = this.gseaQValue(row);
            let gseaNes = this.numericField(row, ["gsea_nes"]);

            return [
                { label: "Cell state", value: metadataRow ? this.stateLabel(metadataRow) : this.stateLabel(row) },
                { label: "Gene program", value: programHeader ? programHeader.label : this.programLabel(row) },
                { label: this.relationshipMetricLabel(metric), value: this.tooltipMetricValue(row.__metric_value) },
                { label: "Marker score", value: markerScore !== null ? this.tooltipMetricValue(markerScore) : null },
                { label: "GSEA NES", value: gseaNes !== null ? this.tooltipMetricValue(gseaNes) : null },
                { label: "GSEA P", value: gseaP !== null ? this.tooltipMetricValue(gseaP, { pValue: true }) : null },
                { label: "GSEA q", value: gseaQ !== null ? this.tooltipMetricValue(gseaQ, { pValue: true }) : null },
            ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "");
        },
        traitHeatmapTooltipRows(row, trait, column) {
            return [
                { label: "Trait", value: this.traitDisplayName(trait) },
                { label: column.type === "state" ? "Cell state" : "Gene program", value: column.label },
                { label: "Joint score", value: this.numericField(row, ["beta"]) !== null ? this.tooltipMetricValue(this.numericField(row, ["beta"])) : null },
                { label: "Marginal score", value: this.numericField(row, ["beta_uncorrected"]) !== null ? this.tooltipMetricValue(this.numericField(row, ["beta_uncorrected"])) : null },
            ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "");
        },
        relationshipMetricIsDiverging(metric) {
            return metric.includes("spearman") || metric.includes("auc") || metric.includes("correlation");
        },
        relationshipMetricValue(row, metric) {
            if (metric === "gsea_neglog10q") {
                let qValue = this.numericField(row, ["gsea_q", "loading_mwu_q", "q_value"]);
                return qValue && qValue > 0 ? -Math.log10(qValue) : null;
            }

            if (metric === "gsea_neglog10p") {
                let pValue = this.numericField(row, ["gsea_p", "loading_mwu_p", "p_value"]);
                return pValue && pValue > 0 ? -Math.log10(pValue) : null;
            }

            return this.numericField(row, [metric, "metric_value", "value", "score", "correlation"]);
        },
        heatRowsForMetric(metric) {
            if (!this.relationshipHeatmapRows.length) {
                return [];
            }

            let hasMetricId = this.relationshipHeatmapRows.some((row) => !!this.field(row, ["metric_id"]));

            if (hasMetricId) {
                return this.relationshipHeatmapRows
                    .filter((row) => String(this.field(row, ["metric_id"])) === metric)
                    .map((row) => ({
                        ...row,
                        __metric_value: this.numericField(row, ["metric_value", "value"]),
                    }));
            }

            return this.relationshipHeatmapRows.map((row) => ({
                ...row,
                __metric_value: this.relationshipMetricValue(row, metric),
            }));
        },
        clamp(value, minValue, maxValue) {
            return Math.min(maxValue, Math.max(minValue, value));
        },
        mixColor(start, end, amount) {
            let red = Math.round(start[0] + (end[0] - start[0]) * amount);
            let green = Math.round(start[1] + (end[1] - start[1]) * amount);
            let blue = Math.round(start[2] + (end[2] - start[2]) * amount);
            return `rgb(${red}, ${green}, ${blue})`;
        },
        relationshipCellColor(value, diverging, maxAbsolute, maxPositive) {
            if (diverging) {
                let normalized = this.clamp(value / (maxAbsolute || 1), -1, 1);

                if (normalized >= 0) {
                    return this.mixColor([255, 255, 255], [47, 91, 234], Math.pow(normalized, 0.65));
                }

                return this.mixColor([255, 255, 255], [194, 65, 12], Math.pow(Math.abs(normalized), 0.65));
            }

            let positiveScale = this.clamp(value / (maxPositive || 1), 0, 1);
            return this.mixColor([255, 255, 255], [24, 169, 153], Math.pow(positiveScale, 0.6));
        },
        preferredRelationshipMetric() {
            if (this.relationshipMetricIds.includes("correlation")) {
                return "correlation";
            }

            if (this.relationshipMetricIds.includes("combined_match_score")) {
                return "combined_match_score";
            }

            return this.relationshipMetricIds[0] || "combined_match_score";
        },
        nestedValue(value, path = []) {
            return path.reduce((current, key) => {
                if (!current || typeof current !== "object") {
                    return null;
                }

                return current[key];
            }, value);
        },
        firstNonEmpty(values = []) {
            for (let i = 0; i < values.length; i++) {
                let value = values[i];
                if (value !== null && value !== undefined && value !== "") {
                    return value;
                }
            }

            return null;
        },
        prettyToken(value) {
            let tokenMap = {
                curated_biological_state: "Curated biological state",
                exploratory_biological: "Exploratory biological",
                high_confidence_biological: "High confidence biological",
                continuous_gradient: "Continuous gradient",
                reviewed: "Reviewed",
                low: "Low QC sensitivity",
                medium: "Medium QC sensitivity",
                high: "High QC sensitivity",
            };
            let normalized = this.normalizeKey(value);

            if (tokenMap[normalized]) {
                return tokenMap[normalized];
            }

            return this.formatDisplayLabel(String(value || ""));
        },
        drawerBadgeTone(value) {
            let normalized = String(value || "").toLowerCase();

            if (/suppress|artifact|hard|contamination|qc high|fail/.test(normalized)) {
                return "bad";
            }

            if (/flag|required|review|caveat|emerging|exploratory|medium|low/.test(normalized)) {
                return "warn";
            }

            if (/canonical|established|default|reviewed|high confidence|pass|strong/.test(normalized)) {
                return "good";
            }

            return "blue";
        },
        buildDrawerBadges(values = []) {
            let seen = new Set();

            return values
                .filter((value) => value !== null && value !== undefined && value !== "")
                .map((value) => this.prettyToken(value))
                .filter((value) => {
                    if (!value || seen.has(value)) {
                        return false;
                    }

                    seen.add(value);
                    return true;
                })
                .map((value) => ({
                    text: value,
                    tone: this.drawerBadgeTone(value),
                }));
        },
        programApiFactor(programId) {
            let match = String(programId || "").match(/program_factor_(\d+)$/i) || String(programId || "").match(/^factor[_\s-]*(\d+)$/i);
            return match ? `Factor${Number(match[1])}` : String(programId || "");
        },
        shortStateLabel(stateId) {
            let metadataRow = this.stateMetadataById[stateId] || { state_id: stateId };
            return this.stateLabel(metadataRow).replace(/^Pancreas Beta Cell /i, "");
        },
        gseaPValue(row) {
            return this.numericField(row, ["gsea_p", "loading_mwu_p", "p_value"]);
        },
        gseaQValue(row) {
            return this.numericField(row, ["gsea_q", "loading_mwu_q", "q_value"]);
        },
        gseaNegLogQValue(row) {
            let qValue = this.gseaQValue(row);
            return qValue && qValue > 0 ? -Math.log10(qValue) : 0;
        },
        rowMatchScore(row) {
            let directScore = this.numericField(row, ["combined_match_score", "metric_value", "score"]);
            if (directScore !== null) {
                return directScore;
            }

            let correlation = this.numericField(row, ["correlation", "cell_spearman_r_gradient", "cell_spearman_r"]);
            if (correlation !== null) {
                return correlation;
            }

            return this.gseaNegLogQValue(row);
        },
        resolveStateDetail(stateId, fallbackRow) {
            let resolvedId = stateId || this.stateKey(fallbackRow || {}) || "";
            return {
                stateId: resolvedId,
                detail: this.stateMetadataById[resolvedId] || null,
                fallback: fallbackRow || this.cellStateExpressionRows.find((row) => this.stateKey(row) === resolvedId) || null,
                source: this.stateMetadataById[resolvedId] ? "api" : "fallback",
            };
        },
        resolvedStateLabel(resolution) {
            if (resolution.detail) {
                return this.firstNonEmpty([
                    this.nestedValue(resolution.detail, ["summary", "recommended_portal_label"]),
                    resolution.detail.display_name,
                    this.nestedValue(resolution.detail, ["state", "label"]),
                ]) || this.shortStateLabel(resolution.stateId);
            }

            return this.stateLabel(resolution.fallback || { state_id: resolution.stateId }) || this.shortStateLabel(resolution.stateId);
        },
        resolvedStateDescription(resolution) {
            if (resolution.detail) {
                return this.firstNonEmpty([
                    this.nestedValue(resolution.detail, ["summary", "portal_user_summary"]),
                    this.nestedValue(resolution.detail, ["summary", "gene_expression_interpretation"]),
                    this.nestedValue(resolution.detail, ["summary", "biological_description"]),
                    this.nestedValue(resolution.detail, ["summary", "recommended_portal_summary"]),
                    this.nestedValue(resolution.detail, ["summary", "short_description"]),
                    this.nestedValue(resolution.detail, ["summary", "curation_notes"]),
                ]);
            }

            return this.stateDescription(resolution.fallback);
        },
        stateDrawerBadges(resolution) {
            if (resolution.detail) {
                let detail = resolution.detail;
                let values = [
                    this.nestedValue(detail, ["summary", "portal_display_establishment"]),
                    ...((this.nestedValue(detail, ["summary", "portal_primary_badges"]) || [])),
                ];

                if (!values.filter(Boolean).length) {
                    values = values.concat([
                        this.nestedValue(detail, ["summary", "state_establishment_level"]),
                        this.nestedValue(detail, ["state", "class"]),
                        this.nestedValue(detail, ["state", "interpretation_status"]),
                        this.nestedValue(detail, ["state", "release_class"]),
                        this.nestedValue(detail, ["state", "qc_sensitivity"]),
                        ...((this.nestedValue(detail, ["quality", "quality_badges"]) || [])),
                    ]);
                }

                values.push("API metadata");
                return this.buildDrawerBadges(values);
            }

            return this.buildDrawerBadges([
                this.field(resolution.fallback, ["state_class"]),
                this.field(resolution.fallback, ["interpretation_status"]),
                this.field(resolution.fallback, ["release_class"]),
                this.field(resolution.fallback, ["manual_review_status"]),
                this.field(resolution.fallback, ["qc_sensitivity"]),
                "Expression metadata",
            ]);
        },
        stateInterpretationRows(resolution) {
            let rows;

            if (resolution.detail) {
                rows = [
                    ["If your gene is enriched here", this.nestedValue(resolution.detail, ["summary", "gene_expression_interpretation"]) || this.nestedValue(resolution.detail, ["summary", "recommended_portal_summary"])],
                    ["Caveat", this.nestedValue(resolution.detail, ["summary", "gene_expression_caveat"]) || this.nestedValue(resolution.detail, ["summary", "interpretation_caveat"])],
                    ["What to check next", this.nestedValue(resolution.detail, ["summary", "gene_expression_followup"])],
                    ["Do not conclude", this.nestedValue(resolution.detail, ["summary", "gene_expression_overinterpretation_warning"]) || this.nestedValue(resolution.detail, ["summary", "do_not_overinterpret_as"])],
                ];
            } else {
                rows = [
                    ["If your gene is enriched here", this.field(resolution.fallback, ["gene_expression_interpretation", "recommended_portal_summary", "interpretation_status"])],
                    ["Caveat", this.field(resolution.fallback, ["gene_expression_caveat", "interpretation_caveat"])],
                    ["What to check next", this.field(resolution.fallback, ["gene_expression_followup"])],
                    ["Do not conclude", this.field(resolution.fallback, ["gene_expression_overinterpretation_warning", "do_not_overinterpret_as"])],
                ];
            }

            return rows
                .filter((row) => row[1] !== null && row[1] !== undefined && row[1] !== "")
                .map((row) => ({ label: row[0], value: row[1] }));
        },
        markerCitationLabel(citation) {
            return this.firstNonEmpty([
                citation && citation.citation_label,
                citation && citation.title,
                citation && citation.raw_citation_text,
                citation && citation.url,
                citation && citation.pmid,
                citation && citation.doi,
            ]);
        },
        markerCitationsText(marker) {
            let citations = Array.isArray(marker && marker.citations) ? marker.citations : [];
            return citations
                .map((citation) => this.markerCitationLabel(citation))
                .filter((value) => !!value)
                .join("; ");
        },
        stateMarkerDetail(resolution) {
            if (resolution.detail) {
                let markers = this.nestedValue(resolution.detail, ["marker_set", "markers"]) || [];

                return {
                    markers: markers.map((marker) => marker.gene || marker.marker || "").filter((value) => !!value),
                    provenance: markers.map((marker) => ({
                        gene: marker.gene || "",
                        role: marker.role || "",
                        evidence: marker.evidence_level || "",
                        notes: marker.marker_notes || "",
                        sourceType: marker.source_type || "",
                        citations: this.markerCitationsText(marker),
                    })),
                };
            }

            return {
                markers: this.extractMarkerGenes(resolution.fallback),
                provenance: [],
            };
        },
        stateReferenceDetail(resolution) {
            if (!resolution.detail) {
                return {
                    curationRows: [],
                    references: [],
                };
            }

            let references = Array.isArray(resolution.detail.state_level_citations)
                ? resolution.detail.state_level_citations.slice()
                : [];

            if (!references.length) {
                let seen = new Set();
                let markers = this.nestedValue(resolution.detail, ["marker_set", "markers"]) || [];
                markers.forEach((marker) => {
                    (marker.citations || []).forEach((citation) => {
                        let key = citation.citation_id || this.markerCitationLabel(citation);
                        if (!key || seen.has(key)) {
                            return;
                        }

                        seen.add(key);
                        references.push(citation);
                    });
                });
            }

            return {
                curationRows: [
                    { label: "Manual review", value: this.nestedValue(resolution.detail, ["curation", "manual_review_status"]) },
                    { label: "Curation version", value: this.nestedValue(resolution.detail, ["curation", "curation_version"]) },
                ].filter((row) => row.value),
                references: references.map((citation) => {
                    let label = this.markerCitationLabel(citation) || "Citation";
                    let url = citation.url || (citation.doi ? `https://doi.org/${citation.doi}` : "");
                    let suffix = [
                        citation.pmid ? `PMID ${citation.pmid}` : "",
                        citation.doi ? `DOI ${citation.doi}` : "",
                    ].filter((value) => !!value).join("; ");

                    return {
                        label,
                        url,
                        suffix,
                    };
                }),
            };
        },
        stateMethodsDetail(resolution) {
            let text;
            let rows;

            if (resolution.detail) {
                text = this.nestedValue(resolution.detail, ["summary", "portal_methods_details"]);
                rows = [
                    { label: "Score scope", value: this.nestedValue(resolution.detail, ["state", "score_scope"]) },
                    { label: "Hard-call policy", value: this.nestedValue(resolution.detail, ["state", "hard_call_notes"]) || this.nestedValue(resolution.detail, ["scoring", "hard_call_policy"]) },
                    { label: "QC sensitivity", value: this.nestedValue(resolution.detail, ["state", "qc_sensitivity"]) },
                    { label: "Supporting evidence for assignment", value: this.nestedValue(resolution.detail, ["summary", "required_supporting_evidence"]) },
                    { label: "Assignment overinterpretation warning", value: this.nestedValue(resolution.detail, ["summary", "do_not_overinterpret_as"]) },
                ];
            } else {
                text = this.field(resolution.fallback, ["portal_methods_details"]);
                rows = [
                    { label: "Score scope", value: this.field(resolution.fallback, ["score_scope"]) },
                    { label: "Hard-call policy", value: this.field(resolution.fallback, ["hard_call_notes", "hard_call_policy"]) },
                    { label: "QC sensitivity", value: this.field(resolution.fallback, ["qc_sensitivity"]) },
                    { label: "Supporting evidence for assignment", value: this.field(resolution.fallback, ["required_supporting_evidence"]) },
                    { label: "Assignment overinterpretation warning", value: this.field(resolution.fallback, ["do_not_overinterpret_as"]) },
                ];
            }

            return {
                text,
                rows: rows.filter((row) => row.value),
            };
        },
        relatedProgramCoactivity(row) {
            return this.numericField(row, ["correlation", "cell_spearman_r_gradient", "cell_spearman_r", "donor_spearman_r_gradient", "donor_spearman_r"]);
        },
        relatedProgramsForState(stateId) {
            return this.relationshipHeatmapRows
                .filter((row) => this.stateKey(row) === stateId && this.gseaPValue(row) !== null && this.gseaPValue(row) < 0.05)
                .sort((a, b) => (this.gseaPValue(a) || Number.POSITIVE_INFINITY) - (this.gseaPValue(b) || Number.POSITIVE_INFINITY))
                .slice(0, 12)
                .map((row) => ({
                    programId: this.programKey(row),
                    programLabel: this.programLabel(row),
                    gseaP: this.gseaPValue(row),
                    gseaQ: this.gseaQValue(row),
                    coactivity: this.relatedProgramCoactivity(row),
                    matchScore: this.rowMatchScore(row),
                    row,
                }));
        },
        inferredProgramQuality(programId) {
            let rows = this.relationshipHeatmapRows.filter((row) => this.programKey(row) === programId);
            let hasBadMatch = rows.some((row) => /qc|suppress|artifact/i.test(String(this.field(row, ["match_class", "qc_recommendation", "qc_caveat"]) || "")));

            if (hasBadMatch) {
                return "review";
            }

            let hasStrongMatch = rows.some((row) => /strong|gene_only/i.test(String(this.field(row, ["match_class"]) || "")));
            return hasStrongMatch ? "high_confidence_biological" : "exploratory_biological";
        },
        inferredProgramLabel(programId) {
            let rows = this.relationshipHeatmapRows
                .filter((row) => this.programKey(row) === programId && this.field(row, ["state_type"]) !== "qc_state")
                .sort((a, b) => (this.gseaQValue(a) || Number.POSITIVE_INFINITY) - (this.gseaQValue(b) || Number.POSITIVE_INFINITY));

            return rows[0] ? `${this.shortStateLabel(this.stateKey(rows[0]))}-like program` : "unmatched data-driven program";
        },
        programSummaryText(programId, curatedMatches, quality) {
            if (/qc|artifact|suppress/i.test(String(quality || ""))) {
                return "This program has stronger QC/artifact evidence than biological state evidence and should be hidden or reviewed before interpretation.";
            }

            if (curatedMatches[0]) {
                return `This program is most consistent with ${curatedMatches[0].stateLabel}. Use the state match and QC bubbles to decide whether it is suitable for biological interpretation.`;
            }

            return "This program does not yet have a strong curated-state match and should be treated as exploratory.";
        },
        programQcBubbleClass(row) {
            let qValue = this.gseaQValue(row);
            let pValue = this.gseaPValue(row);

            if (qValue !== null && qValue < 0.05) {
                return "bad";
            }

            if (pValue !== null && pValue < 0.05) {
                return "warn";
            }

            return "good";
        },
        qcStateLabel(row) {
            let stateId = this.stateKey(row);
            let rawLabel = this.field(row, ["display_name", "state_label"]);

            if (!rawLabel && stateId && this.stateMetadataById[stateId]) {
                return this.shortStateLabel(stateId);
            }

            rawLabel = rawLabel || this.field(row, ["state_name", "state_id", "qc_caveat", "match_class"]);

            return this.formatDisplayLabel(
                String(rawLabel || "")
                    .replace(/^qc_bad_/i, "")
                    .replace(/^qc_/i, "")
            );
        },
        qcMetadataRow(row) {
            let stateId = String(this.field(row, ["qc_signature_id", "state_name", "state_id"]) || "");
            return this.qcMetadataById[stateId] || null;
        },
        programQcBadge(row) {
            let metadata = this.qcMetadataRow(row);
            let markerGenes = metadata && Array.isArray(metadata.markers) ? metadata.markers : [];

            return {
                text: this.programQcBubbleLabel(row),
                tone: this.programQcBubbleClass(row),
                tooltip: metadata ? {
                    displayName: metadata.display_name || this.qcStateLabel(row),
                    category: this.prettyToken(metadata.category),
                    markerGenes: markerGenes,
                } : null,
            };
        },
        programQcBubbleLabel(row) {
            let baseLabel = this.qcStateLabel(row) || this.field(row, ["qc_caveat", "match_class", "state_name", "state_id"]);
            let qValue = this.gseaQValue(row);
            let pValue = this.gseaPValue(row);
            let suffix = qValue !== null ? ` q=${this.formatPValue(qValue)}` : (pValue !== null ? ` p=${this.formatPValue(pValue)}` : "");

            return `${baseLabel}${suffix}`;
        },
        formatPValue(value) {
            if (!Number.isFinite(value)) {
                return "";
            }

            if (value === 0) {
                return "0";
            }

            if (Math.abs(value) < 0.001) {
                return value.toExponential(2);
            }

            return value.toFixed(3);
        },
        programDrawerBadges(programId, quality, qcRows = [], qcMatches = []) {
            let badges = [
                { text: this.prettyToken(quality), tone: this.drawerBadgeTone(quality) },
            ];

            if (qcRows[0]) {
                badges.push({
                    text: this.programQcBubbleLabel(qcRows[0]),
                    tone: this.programQcBubbleClass(qcRows[0]),
                });
                return badges;
            }

            if (qcMatches[0]) {
                let text = this.field(qcMatches[0].row, ["qc_caveat", "match_class"]) || "QC reviewed";
                badges.push({
                    text: this.prettyToken(text),
                    tone: this.drawerBadgeTone(text),
                });
            }

            return badges;
        },
        curatedStateMatchesForProgram(programId) {
            return this.relationshipHeatmapRows
                .filter((row) => this.programKey(row) === programId && this.field(row, ["state_type"]) !== "qc_state")
                .sort((a, b) => (this.gseaQValue(a) || Number.POSITIVE_INFINITY) - (this.gseaQValue(b) || Number.POSITIVE_INFINITY))
                .filter((row) => this.gseaPValue(row) !== null && this.gseaPValue(row) < 0.05)
                .map((row) => ({
                    stateId: this.stateKey(row),
                    stateLabel: this.shortStateLabel(this.stateKey(row)),
                    gseaP: this.gseaPValue(row),
                    gseaQ: this.gseaQValue(row),
                    negLogQ: this.gseaNegLogQValue(row),
                    correlation: this.numericField(row, ["correlation", "cell_spearman_r_gradient", "cell_spearman_r"]),
                    matchScore: this.rowMatchScore(row),
                    row,
                }));
        },
        qcMatchesForProgram(programId) {
            return this.relationshipHeatmapRows
                .filter((row) => this.programKey(row) === programId && this.field(row, ["state_type"]) === "qc_state")
                .sort((a, b) => this.rowMatchScore(b) - this.rowMatchScore(a))
                .slice(0, 8)
                .map((row) => ({
                    stateId: this.stateKey(row),
                    stateLabel: this.shortStateLabel(this.stateKey(row)),
                    gseaP: this.gseaPValue(row),
                    gseaQ: this.gseaQValue(row),
                    negLogQ: this.gseaNegLogQValue(row),
                    correlation: this.numericField(row, ["correlation", "cell_spearman_r_gradient", "cell_spearman_r"]),
                    row,
                }));
        },
        async getStateTraitRows(stateId) {
            if (this.stateTraitRowsCache[stateId]) {
                return this.stateTraitRowsCache[stateId];
            }

            let cachedRows = this.traitHeatmapRows.filter((row) => row.__column_type === "state" && row.__column_id === stateId);
            if (cachedRows.length) {
                this.$set(this.stateTraitRowsCache, stateId, cachedRows);
                return cachedRows;
            }

            let tissueKey = this.tissueKeyFromLabel(this.selectedTissue);
            if (!tissueKey || !this.selectedCellType) {
                return [];
            }

            try {
                let payload = await this.fetchJson(this.buildCellStateTraitUrl(this.tissueQueryKey(this.selectedTissue), this.selectedCellType.key, stateId));
                let rows = this.rowsFromResponse(payload);
                this.$set(this.stateTraitRowsCache, stateId, rows);
                return rows;
            } catch (error) {
                return [];
            }
        },
        async getProgramTraitRows(programId) {
            if (this.programTraitRowsCache[programId]) {
                return this.programTraitRowsCache[programId];
            }

            let cachedRows = this.traitHeatmapRows.filter((row) => row.__column_type === "program" && row.__column_id === programId);
            if (cachedRows.length) {
                this.$set(this.programTraitRowsCache, programId, cachedRows);
                return cachedRows;
            }

            let datasetId = this.tissueDatasetId(this.selectedTissue);
            if (!datasetId || !this.selectedCellType) {
                return [];
            }

            try {
                // Deliberately the real cell type, not the resolved trait
                // partition: factor IDs are namespaced per cell type.
                let payload = await this.fetchJson(this.buildProgramTraitUrl(datasetId, this.selectedCellType.key, this.programApiFactor(programId)));
                let rows = this.rowsFromResponse(payload);
                this.$set(this.programTraitRowsCache, programId, rows);
                return rows;
            } catch (error) {
                return [];
            }
        },
        async getProgramGeneRows(programId) {
            if (this.programGeneRowsCache[programId]) {
                return this.programGeneRowsCache[programId];
            }

            let datasetId = this.tissueDatasetId(this.selectedTissue);
            if (!datasetId || !this.selectedCellType) {
                return [];
            }

            try {
                let payload = await this.fetchJson(this.buildProgramGeneInfoUrl(datasetId, this.selectedCellType.key, this.programApiFactor(programId)));
                let rows = this.rowsFromResponse(payload);
                this.$set(this.programGeneRowsCache, programId, rows);
                return rows;
            } catch (error) {
                return [];
            }
        },
        async getProgramGeneSetRows(programId) {
            if (this.programGeneSetRowsCache[programId]) {
                return this.programGeneSetRowsCache[programId];
            }

            let datasetId = this.tissueDatasetId(this.selectedTissue);
            if (!datasetId || !this.selectedCellType) {
                return [];
            }

            try {
                let payload = await this.fetchJson(this.buildProgramGeneSetInfoUrl(datasetId, this.selectedCellType.key, this.programApiFactor(programId)));
                let rows = this.rowsFromResponse(payload);
                this.$set(this.programGeneSetRowsCache, programId, rows);
                return rows;
            } catch (error) {
                return [];
            }
        },
        async getProgramQcRows(programId) {
            if (this.programQcRowsCache[programId]) {
                return this.programQcRowsCache[programId];
            }

            let datasetId = this.tissueDatasetId(this.selectedTissue);
            if (!datasetId || !this.selectedCellType) {
                return [];
            }

            try {
                let payload = await this.fetchJson(this.buildProgramQcInfoUrl(datasetId, this.selectedCellType.key, this.programApiFactor(programId)));
                let rows = this.rowsFromResponse(payload)
                    .sort((a, b) => {
                        let aQ = this.gseaQValue(a);
                        let bQ = this.gseaQValue(b);
                        let aP = this.gseaPValue(a);
                        let bP = this.gseaPValue(b);
                        let aQSort = Number.isFinite(aQ) ? aQ : Number.POSITIVE_INFINITY;
                        let bQSort = Number.isFinite(bQ) ? bQ : Number.POSITIVE_INFINITY;
                        let aPSort = Number.isFinite(aP) ? aP : Number.POSITIVE_INFINITY;
                        let bPSort = Number.isFinite(bP) ? bP : Number.POSITIVE_INFINITY;

                        if (aQSort !== bQSort) {
                            return aQSort - bQSort;
                        }

                        return aPSort - bPSort;
                    });
                this.$set(this.programQcRowsCache, programId, rows);
                return rows;
            } catch (error) {
                return [];
            }
        },
        buildTopGeneRows(rows, meta) {
            let loadingRows = rows
                .filter((row) => (this.numericField(row, ["loading", "weight", "score", "value"]) || 0) > 0)
                .sort((a, b) => (this.numericField(b, ["loading", "weight", "score", "value"]) || 0) - (this.numericField(a, ["loading", "weight", "score", "value"]) || 0))
                .slice(0, 30)
                .map((row) => ({
                    gene: this.field(row, ["gene", "gene_symbol", "marker", "name"]),
                    loading: this.numericField(row, ["loading", "weight", "score", "value"]),
                }));

            if (loadingRows.length) {
                return {
                    mode: "loading",
                    rows: loadingRows,
                };
            }

            let topGenes = this.extractGenes(meta, ["top_genes", "genes", "marker_genes"]).slice(0, 30);
            return {
                mode: "rank",
                rows: topGenes.map((gene, index) => ({
                    rank: index + 1,
                    gene,
                    rankScore: topGenes.length - index,
                })),
            };
        },
        buildProgramGeneSetTableRows(rows = []) {
            return rows
                .filter((row) => this.field(row, ["gene_set", "gene_set_name", "pathway", "name"]))
                .map((row) => ({
                    geneSet: this.field(row, ["gene_set", "gene_set_name", "pathway", "name"]),
                    description: this.field(row, ["gene_set_description", "description", "label"]),
                    relevanceToFactor: this.numericField(row, ["factor_value", "relevance_to_factor", "value", "score"]),
                    beta: this.numericField(row, ["beta"]),
                    betaUncorrected: this.numericField(row, ["beta_uncorrected"]),
                }))
                .sort((a, b) => {
                    let aScore = Math.max(Math.abs(a.relevanceToFactor || 0), Math.abs(a.beta || 0), Math.abs(a.betaUncorrected || 0));
                    let bScore = Math.max(Math.abs(b.relevanceToFactor || 0), Math.abs(b.beta || 0), Math.abs(b.betaUncorrected || 0));
                    return bScore - aScore;
                });
        },
        topTraitRows(rows = []) {
            return rows
                .filter((row) => {
                    if (!this.traitKey(row)) {
                        return false;
                    }

                    if (LIGER_FILTER_UNLABELED_HEATMAP_TRAITS && !this.shouldDisplayTraitInHeatmap(row)) {
                        return false;
                    }

                    return this.numericField(row, ["beta"]) !== null || this.numericField(row, ["beta_uncorrected"]) !== null;
                })
                .sort((a, b) => {
                    let aScore = Math.max(Math.abs(this.numericField(a, ["beta"]) || 0), Math.abs(this.numericField(a, ["beta_uncorrected"]) || 0));
                    let bScore = Math.max(Math.abs(this.numericField(b, ["beta"]) || 0), Math.abs(this.numericField(b, ["beta_uncorrected"]) || 0));
                    return bScore - aScore;
                })
                .slice(0, 20)
                .map((row) => ({
                    trait: this.traitDisplayName(row),
                    beta: this.numericField(row, ["beta"]),
                    betaUncorrected: this.numericField(row, ["beta_uncorrected"]),
                    method: this.field(row, ["signature_method", "method", "gene_set"]),
                }));
        },
        openDrawerShell(kind, title, badges = []) {
            this.hideExpressionRowTooltip();
            this.drawerKind = kind;
            this.drawerTitle = title;
            this.drawerBadges = badges;
            this.drawerContent = null;
            this.drawerLoading = true;
            this.drawerOpen = true;
        },
        closeDrawer() {
            this.drawerOpen = false;
            this.drawerTargetId = "";
            this.syncQueryParams({
                cell_state: "",
                gene_program: "",
            });
        },
        // Head (label, badges) is synchronous and content is not, so they are
        // separate: both hosts show the header immediately and fill the body in
        // when the fetches land.
        stateDetailHead(stateId, fallbackRow) {
            let resolution = this.resolveStateDetail(stateId, fallbackRow);

            return {
                resolution,
                id: resolution.stateId,
                title: this.resolvedStateLabel(resolution),
                badges: this.stateDrawerBadges(resolution),
            };
        },
        async stateDetailContent(resolution) {
            await this.ensurePhenotypeTraitRows();
            let stateTraitRows = await this.getStateTraitRows(resolution.stateId);

            return {
                type: "state",
                summaryDescription: this.resolvedStateDescription(resolution) || "A curated marker-defined cell state. Use expression and program overlap to assess whether a gene or factor maps to this state.",
                summaryFields: [
                    { label: "State ID", value: resolution.stateId },
                    { label: "Tissue", value: this.nestedValue(resolution.detail, ["tissue", "label"]) || this.field(resolution.fallback, ["tissue_label", "tissue"]) || this.selectedTissue },
                    { label: "Cell type", value: this.nestedValue(resolution.detail, ["cell_type", "label"]) || this.field(resolution.fallback, ["cell_type_label", "cell_type", "annotated_cell_type"]) || (this.selectedCellType && this.selectedCellType.label) },
                ].filter((row) => row.value),
                interpretationRows: this.stateInterpretationRows(resolution),
                markerDetail: this.stateMarkerDetail(resolution),
                referenceDetail: this.stateReferenceDetail(resolution),
                relatedPrograms: this.relatedProgramsForState(resolution.stateId),
                traitRows: this.topTraitRows(stateTraitRows),
            };
        },
        // Still used by the relationship and trait heatmaps, which have no
        // in-card pane to render into.
        async openStateDrawer(stateId, fallbackRow) {
            let head = this.stateDetailHead(stateId, fallbackRow);

            this.openDrawerShell("Curated state", head.title, head.badges);
            this.drawerTargetId = head.id;
            this.drawerContent = await this.stateDetailContent(head.resolution);

            this.syncQueryParams({
                cell_state: head.id,
                gene_program: "",
            });
            this.drawerLoading = false;
        },
        // Unlike the state head, this one is async: the badges need the QC rows.
        async programDetailHead(programId, fallbackRow) {
            let meta = Object.assign({}, fallbackRow || {}, this.geneProgramInfoById[programId] || {});
            let quality = this.field(meta, ["suggested_program_quality_class", "quality_class", "release_recommendation", "qc_recommendation"]) || this.inferredProgramQuality(programId);
            let label = this.field(meta, ["suggested_program_label", "program_label", "label"]) || this.inferredProgramLabel(programId);
            let curatedMatches = this.curatedStateMatchesForProgram(programId);
            let qcMatches = this.qcMatchesForProgram(programId);

            await this.ensureQcMetadataRows();
            let programQcRows = await this.getProgramQcRows(programId);

            return {
                id: programId,
                title: label,
                badges: this.programDrawerBadges(programId, quality, programQcRows, qcMatches),
                meta,
                quality,
                curatedMatches,
                qcMatches,
                programQcRows,
            };
        },
        async programDetailContent(head) {
            let { id: programId, meta, quality, curatedMatches, qcMatches, programQcRows } = head;

            await this.ensurePhenotypeTraitRows();
            let [programGeneRows, programTraitRows, programGeneSetRows] = await Promise.all([
                this.getProgramGeneRows(programId),
                this.getProgramTraitRows(programId),
                this.getProgramGeneSetRows(programId),
            ]);

            return {
                type: "program",
                summaryText: this.programSummaryText(programId, curatedMatches, quality),
                summaryFields: [
                    { label: "Program ID", value: this.programApiFactor(programId) },
                    { label: "Suggested label", value: head.title },
                    { label: "Rationale", value: this.field(meta, ["rationale"]) },
                    { label: "Quality", value: this.prettyToken(quality) },
                ].filter((row) => row.value),
                qcBadges: programQcRows.length
                    ? programQcRows.map((row) => this.programQcBadge(row))
                    : qcMatches.length
                        ? qcMatches.map((row) => ({
                            text: this.programQcBubbleLabel(row.row),
                            tone: this.programQcBubbleClass(row.row),
                            tooltip: null,
                        }))
                    : this.buildDrawerBadges(this.extractGenes(meta, ["qc_cell_states", "qc_caveat", "qc_recommendation"])).length
                        ? this.buildDrawerBadges(this.extractGenes(meta, ["qc_cell_states", "qc_caveat", "qc_recommendation"]))
                        : [{ text: "QC pass", tone: "good" }],
                curatedMatches,
                qcMatches,
                topGenes: this.buildTopGeneRows(programGeneRows, meta),
                traitRows: this.topTraitRows(programTraitRows).slice(0, 12),
                geneSetRows: this.buildProgramGeneSetTableRows(programGeneSetRows),
            };
        },
        // Still used by the relationship and trait heatmaps, which have no
        // in-card pane to render into.
        async openProgramDrawer(programId, fallbackRow) {
            let head = await this.programDetailHead(programId, fallbackRow);

            this.openDrawerShell("Inferred program", head.title, head.badges);
            this.drawerTargetId = head.id;
            this.drawerContent = await this.programDetailContent(head);

            this.syncQueryParams({
                cell_state: "",
                gene_program: head.id,
            });
            this.drawerLoading = false;
        },
        quantile(values = [], q = 0.5) {
            let sortedValues = values
                .filter((value) => Number.isFinite(value))
                .sort((a, b) => a - b);

            if (!sortedValues.length) {
                return null;
            }

            let position = (sortedValues.length - 1) * q;
            let lower = Math.floor(position);
            let upper = Math.ceil(position);

            if (lower === upper) {
                return sortedValues[lower];
            }

            return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (position - lower);
        },
        traitKey(row) {
            return this.field(row, ["trait", "trait_label", "trait_internal", "phenotype"]);
        },
        traitPhenotypeRow(valueOrRow) {
            let traitKey = typeof valueOrRow === "string" ? valueOrRow : this.traitKey(valueOrRow);
            return this.traitPhenotypeLookup[this.normalizeKey(traitKey)];
        },
        shouldDisplayTraitInHeatmap(valueOrRow) {
            let phenotype = this.traitPhenotypeRow(valueOrRow);
            return !!(phenotype && phenotype.description);
        },
        traitDisplayName(valueOrRow) {
            let traitKey = typeof valueOrRow === "string" ? valueOrRow : this.traitKey(valueOrRow);
            let phenotype = this.traitPhenotypeRow(valueOrRow);
            return (phenotype && phenotype.description) || traitKey;
        },
        traitName(row) {
            return this.traitDisplayName(row);
        },
        traitMetricValue(row, metric) {
            return this.numericField(row, [metric]);
        },
        traitGroupLabel(trait) {
            let phenotype = this.traitPhenotypeRow(trait);
            return phenotype && phenotype.group ? String(phenotype.group) : "Other Traits";
        },
        buildTraitColumns() {
            let stateIds = Array.from(new Set(
                []
                    .concat(this.cellStateMetadataRows.map((row) => this.stateKey(row)))
                    .concat(this.relationshipHeatmapRows.map((row) => this.stateKey(row)))
                    .filter((value) => !!value && !value.startsWith("qc_"))
            )).sort(this.naturalSort);
            let programIds = Array.from(new Set(
                []
                    .concat(this.geneProgramInfoRows.map((row) => this.programKey(row)))
                    .concat(this.relationshipHeatmapRows.map((row) => this.programKey(row)))
                    .filter((value) => !!value)
            )).sort(this.naturalSort);

            let stateColumns = stateIds.map((stateId) => {
                let metadataRow = this.stateMetadataById[stateId] || { state_id: stateId };
                return {
                    id: stateId,
                    label: this.stateLabel(metadataRow),
                    type: "state",
                };
            });
            let programColumns = programIds.map((programId) => {
                let infoRow = this.geneProgramInfoById[programId] || { program_id: programId };
                return {
                    id: programId,
                    label: this.programLabel(infoRow),
                    type: "program",
                };
            });

            return stateColumns.concat(programColumns);
        },
        extractMarkerGenes(row) {
            let genes = this.extractGenes(row, ["markers", "marker_genes", "genes"]);
            if (genes.length > 0) {
                return genes;
            }

            let markerSet = row && row.marker_set;
            if (markerSet && Array.isArray(markerSet.markers)) {
                return Array.from(new Set(
                    markerSet.markers
                        .map((item) => item && (item.gene || item.gene_symbol || item.name))
                        .filter((item) => !!item)
                        .map((item) => String(item))
                ));
            }

            return [];
        },
        joinDisplayList(items = []) {
            return items.length > 0 ? items.join(", ") : "Not available";
        },
        resetGeneResults() {
            this.availableTissues = [];
            this.observedDatasetIds = {};
            this.cellStateUsesDatasetKey = false;
            this.selectedTissue = null;
            this.cellTypeExpressionRows = [];
            this.selectedCellType = null;
            this.selectedCellStateKey = "";
            this.viewStateInfo = false;
            this.viewProgramInfo = false;
            this.cellStateExpressionRows = [];
            this.programExpressionRows = [];
            this.cellStateMetadataRows = [];
            this.geneProgramInfoRows = [];
            this.relationshipHeatmapRows = [];
            this.traitHeatmapRows = [];
            this.traitHeatmapColumns = [];
            this.stateTraitRowsCache = {};
            this.programTraitRowsCache = {};
            this.programGeneSetRowsCache = {};
            this.programGeneRowsCache = {};
            this.programQcRowsCache = {};
            this.isLoadingCellTypes = false;
            this.isLoadingCellStateSection = false;
            this.isLoadingGeneProgramSection = false;
            this.isLoadingRelationshipHeatmap = false;
            this.isLoadingTraitHeatmap = false;
            this.cellTypeLoadError = null;
            this.cellStateSectionError = null;
            this.geneProgramSectionError = null;
            this.relationshipHeatmapError = null;
            this.traitHeatmapError = null;
            this.selectedRelationshipMetric = "correlation";
            this.selectedTraitMetric = "beta";
            this.selectedTraitColumnFilter = "all";
            this.closeDrawer();
        },
        resetCellTypeResults() {
            this.cellTypeExpressionRows = [];
            this.isLoadingCellTypes = false;
            this.cellTypeLoadError = null;
            this.dropCellTypeDownstream();
        },
        // States, programs and both heatmaps are all keyed on the cell type, so
        // dropping the cell type has to drop them too - leaving them on screen
        // would attribute one cell type's rows to whichever is picked next.
        dropCellTypeDownstream() {
            this.selectedCellType = null;
            this.selectedCellStateKey = "";
            this.selectedProgramKey = "";
            this.cellStateDetail = null;
            this.geneProgramDetail = null;
            this.viewStateInfo = false;
            this.viewProgramInfo = false;
            this.cellStateExpressionRows = [];
            this.programExpressionRows = [];
            this.cellStateMetadataRows = [];
            this.geneProgramInfoRows = [];
            this.relationshipHeatmapRows = [];
            this.traitHeatmapRows = [];
            this.traitHeatmapColumns = [];
            this.stateTraitRowsCache = {};
            this.programTraitRowsCache = {};
            this.programGeneSetRowsCache = {};
            this.programGeneRowsCache = {};
            this.programQcRowsCache = {};
            this.isLoadingCellStateSection = false;
            this.isLoadingGeneProgramSection = false;
            this.isLoadingRelationshipHeatmap = false;
            this.isLoadingTraitHeatmap = false;
            this.cellStateSectionError = null;
            this.geneProgramSectionError = null;
            this.relationshipHeatmapError = null;
            this.traitHeatmapError = null;
            this.selectedRelationshipMetric = "correlation";
            this.selectedTraitMetric = "beta";
            this.selectedTraitColumnFilter = "all";
            this.closeDrawer();
        },
        clearTissueSelection() {
            this.selectedTissue = null;
            this.resetCellTypeResults();
            this.syncQueryParams({ tissue: "" });
        },
        clearCellTypeSelection() {
            this.dropCellTypeDownstream();
            this.syncQueryParams({ cell_type: "" });
        },
        collectTissues(rows = []) {
            return rows
                .map((row) => this.tissueLabel(row))
                .filter((value) => !!value)
                .filter((value) => this.tissueAllowed(value));
        },
        // Records the dataset ID a portal reported for each tissue, so the
        // dataset-keyed endpoints downstream query the ID this portal actually
        // serves rather than the first one in the static config.
        collectDatasetIds(rows = []) {
            rows.forEach((row) => {
                let datasetId = this.rowDatasetId(row);
                let tissueKey = this.rowTissueKey(row);

                if (datasetId && tissueKey && !this.observedDatasetIds[tissueKey]) {
                    Vue.set(this.observedDatasetIds, tissueKey, datasetId);
                }
            });
        },
        async lookupGenes(input) {
            try {
                let payload = await this.fetchJson(this.buildMatchUrl(input));
                let matches = this.rowsFromResponse(payload).slice(0, 10);

                if (input !== this.searchedGene.trim()) {
                    return;
                }

                this.geneSuggestions = matches || [];
                this.noGeneSuggestions = this.geneSuggestions.length === 0;
            } catch (error) {
                this.geneSuggestions = [];
                this.noGeneSuggestions = true;
                this.geneSearchError = "Unable to load gene suggestions right now.";
            } finally {
                if (input === this.searchedGene.trim()) {
                    this.isLoadingGeneSuggestions = false;
                }
            }
        },
        async onSuggestionSelected(gene) {
            let selectedGene = this.normalizeGeneLabel(gene);
            this.skipGeneSuggestionLookup = true;
            this.searchedGene = selectedGene;
            this.geneSuggestions = [];
            this.noGeneSuggestions = false;
            this.isLoadingGeneSuggestions = false;
            await this.submitGeneSearch(selectedGene);
        },
        async onSearchClick() {
            await this.submitGeneSearch(this.searchedGene);
        },
        async submitGeneSearch(gene) {
            let normalizedGene = this.normalizeGeneLabel(gene).trim();

            this.resetGeneResults();
            this.geneSearchError = null;
            this.geneSuggestions = [];
            this.noGeneSuggestions = false;
            this.isLoadingGeneSuggestions = false;

            if (this.geneSuggestionTimer) {
                clearTimeout(this.geneSuggestionTimer);
                this.geneSuggestionTimer = null;
            }

            if (!normalizedGene) {
                this.selectedGene = null;
                this.syncQueryParams({
                    gene: "",
                    tissue: "",
                    cell_type: "",
                    cell_state: "",
                    gene_program: "",
                });
                return;
            }

            this.isLoadingGeneData = true;
            this.selectedGene = normalizedGene;
            this.syncQueryParams({
                gene: normalizedGene,
                tissue: "",
                cell_type: "",
                cell_state: "",
                gene_program: "",
            });

            try {
                let [cellStatePayload, programPayload] = await Promise.all([
                    this.fetchJson(this.buildCellStateExpressionUrl(normalizedGene)),
                    this.fetchJson(this.buildProgramExpressionUrl(normalizedGene)),
                ]);

                let geneLevelCellStateRows = this.rowsFromResponse(cellStatePayload);
                let geneLevelProgramRows = this.rowsFromResponse(programPayload);

                this.collectDatasetIds(geneLevelCellStateRows);
                this.collectDatasetIds(geneLevelProgramRows);
                this.cellStateUsesDatasetKey = this.detectCellStateDatasetKeying(geneLevelCellStateRows);

                let uniqueTissues = Array.from(
                    new Set(
                        [
                            ...this.collectTissues(geneLevelCellStateRows),
                            ...this.collectTissues(geneLevelProgramRows),
                        ]
                    )
                ).sort((a, b) => a.localeCompare(b));

                this.availableTissues = uniqueTissues;

                if (this.availableTissues.length === 0) {
                    this.geneSearchError = `No tissues are currently available for ${normalizedGene}.`;
                } else if (this.availableTissues.length === 1) {
                    await this.selectTissue(this.availableTissues[0]);
                }
            } catch (error) {
                this.selectedGene = null;
                this.geneSearchError = "Unable to load LIGER expression data for that gene.";
            } finally {
                this.isLoadingGeneData = false;
            }
        },
        async selectTissue(tissue) {
            this.selectedTissue = tissue;
            this.syncQueryParams({
                tissue: this.tissueKeyFromLabel(tissue) || "",
                cell_type: "",
                cell_state: "",
                gene_program: "",
            });
            await this.loadCellTypeExpression(tissue);
        },
        async loadCellTypeExpression(tissue) {
            this.resetCellTypeResults();

            if (!this.selectedGene || !tissue) {
                return;
            }

            this.isLoadingCellTypes = true;

            try {
                let payload = await this.fetchJson(this.buildCellTypeExpressionUrl(this.tissueQueryKey(tissue), this.selectedGene));
                let rows = this.rowsFromResponse(payload);

                this.cellTypeExpressionRows = rows.filter((row) => !!this.cellTypeLabel(row));

                if (this.cellTypeExpressionRows.length === 0) {
                    this.cellTypeLoadError = `No cell type expression is currently available for ${this.selectedGene} in ${tissue}.`;
                }
            } catch (error) {
                this.cellTypeLoadError = `Unable to load cell type expression for ${tissue}.`;
            } finally {
                this.isLoadingCellTypes = false;
            }
        },
        async selectCellType(cellType) {
            this.selectedCellType = cellType;
            this.selectedCellStateKey = "";
            this.selectedProgramKey = "";
            this.cellStateDetail = null;
            this.geneProgramDetail = null;
            this.syncQueryParams({
                cell_type: cellType.key,
                cell_state: "",
                gene_program: "",
            });
            await Promise.all([
                this.loadCellStateSection(cellType),
                this.loadGeneProgramSection(cellType),
                this.loadRelationshipHeatmap(cellType),
            ]);
            this.loadTraitHeatmap(cellType);
        },
        async loadCellStateSection(cellType) {
            this.cellStateExpressionRows = [];
            this.cellStateMetadataRows = [];
            this.cellStateSectionError = null;

            if (!this.selectedGene || !this.selectedTissue || !cellType) {
                return;
            }

            let tissueKey = this.tissueKeyFromLabel(this.selectedTissue);
            if (!tissueKey) {
                this.cellStateSectionError = "Unable to determine the selected tissue.";
                return;
            }

            this.isLoadingCellStateSection = true;

            try {
                let [expressionPayload, metadataPayload] = await Promise.all([
                    this.fetchJson(this.buildCellStateSectionExpressionUrl(this.tissueQueryKey(this.selectedTissue), cellType.key, this.selectedGene)),
                    this.fetchJson(this.buildCellStateMetadataUrl(tissueKey, cellType.key)),
                ]);

                this.cellStateExpressionRows = this.rowsFromResponse(expressionPayload);
                this.cellStateMetadataRows = this.rowsFromResponse(metadataPayload);

                if (!this.cellStateExpressionRows.length && !this.cellStateMetadataRows.length) {
                    this.cellStateSectionError = `No cell state data is currently available for ${cellType.label} in ${this.selectedTissue}.`;
                }
            } catch (error) {
                this.cellStateSectionError = `Unable to load cell state data for ${cellType.label}.`;
            } finally {
                this.isLoadingCellStateSection = false;
            }
        },
        async loadGeneProgramSection(cellType) {
            this.programExpressionRows = [];
            this.geneProgramInfoRows = [];
            this.geneProgramSectionError = null;

            if (!this.selectedGene || !this.selectedTissue || !cellType) {
                return;
            }

            let datasetId = this.tissueDatasetId(this.selectedTissue);
            if (!datasetId) {
                this.geneProgramSectionError = "Unable to determine the selected dataset.";
                return;
            }

            this.isLoadingGeneProgramSection = true;

            try {
                let [expressionPayload, infoPayload] = await Promise.all([
                    this.fetchJson(this.buildProgramSectionExpressionUrl(datasetId, cellType.key, this.selectedGene)),
                    this.fetchJson(this.buildGeneProgramInfoUrl(datasetId, cellType.key)),
                ]);

                this.programExpressionRows = this.rowsFromResponse(expressionPayload);
                this.geneProgramInfoRows = this.rowsFromResponse(infoPayload);

                if (!this.programExpressionRows.length && !this.geneProgramInfoRows.length) {
                    this.geneProgramSectionError = `No gene program data is currently available for ${cellType.label} in ${this.selectedTissue}.`;
                }
            } catch (error) {
                this.geneProgramSectionError = `Unable to load gene program data for ${cellType.label}.`;
            } finally {
                this.isLoadingGeneProgramSection = false;
            }
        },
        async loadRelationshipHeatmap(cellType) {
            this.relationshipHeatmapRows = [];
            this.relationshipHeatmapError = null;
            this.selectedRelationshipMetric = "correlation";

            if (!this.selectedTissue || !cellType) {
                return;
            }

            let tissueKey = this.tissueKeyFromLabel(this.selectedTissue);
            if (!tissueKey) {
                this.relationshipHeatmapError = "Unable to determine the selected tissue.";
                return;
            }

            this.isLoadingRelationshipHeatmap = true;

            try {
                let payload = await this.fetchJson(this.buildRelationshipHeatmapUrl(this.tissueQueryKey(this.selectedTissue), cellType.key));
                this.relationshipHeatmapRows = this.rowsFromResponse(payload);

                if (!this.relationshipHeatmapRows.length) {
                    this.relationshipHeatmapError = `No relationship heatmap data is currently available for ${cellType.label} in ${this.selectedTissue}.`;
                    return;
                }

                this.selectedRelationshipMetric = this.preferredRelationshipMetric();
            } catch (error) {
                this.relationshipHeatmapError = `Unable to load relationship heatmap data for ${cellType.label}.`;
            } finally {
                this.isLoadingRelationshipHeatmap = false;
            }
        },
        async loadTraitHeatmap(cellType) {
            this.traitHeatmapRows = [];
            this.traitHeatmapColumns = [];
            this.traitHeatmapError = null;
            this.selectedTraitMetric = "beta";
            this.selectedTraitColumnFilter = "all";

            if (!this.selectedTissue || !cellType) {
                return;
            }

            let tissueKey = this.tissueKeyFromLabel(this.selectedTissue);
            let datasetId = this.tissueDatasetId(this.selectedTissue);

            if (!tissueKey || !datasetId) {
                this.traitHeatmapError = "Unable to determine the selected tissue.";
                return;
            }

            this.isLoadingTraitHeatmap = true;

            try {
                await this.ensurePhenotypeTraitRows();

                let columns = this.buildTraitColumns();
                this.traitHeatmapColumns = columns;

                if (!columns.length) {
                    this.traitHeatmapError = "No states or programs are available for trait links.";
                    return;
                }

                let traitPayloads = await Promise.all(
                    columns.map(async (column) => {
                        try {
                            let payload = column.type === "state"
                                ? await this.fetchJson(this.buildCellStateTraitUrl(this.tissueQueryKey(this.selectedTissue), cellType.key, column.id))
                                : await this.fetchJson(this.buildProgramTraitUrl(datasetId, cellType.key, column.id));

                            return this.rowsFromResponse(payload).map((row) => ({
                                ...row,
                                __column_id: column.id,
                                __column_label: column.label,
                                __column_type: column.type,
                            }));
                        } catch (error) {
                            return [];
                        }
                    })
                );

                this.traitHeatmapRows = traitPayloads.reduce((rows, columnRows) => {
                    return rows.concat(columnRows);
                }, []);

                if (!this.traitHeatmapRows.length) {
                    this.traitHeatmapError = `No trait link data is currently available for ${cellType.label} in ${this.selectedTissue}.`;
                }
            } catch (error) {
                this.traitHeatmapError = `Unable to load trait link data for ${cellType.label}.`;
            } finally {
                this.isLoadingTraitHeatmap = false;
            }
        }
    }
});
</script>

<template>
    <div id="liger" class="f-col g-40">
        <div class="f-col g-10">
            <div class="f-row g-40">
                <div class="f-col g-10 flex1">
                    <h3 class="bold">{{ pageTitle }}</h3>
                    <h5 class="headline">
                        Compare gene expression across cell types, curated cell states and 
                        computationally inferred gene programs with genetically supported links 
                        to human traits, revealing both established and potentially novel biology.
                    </h5>
                    <a :href="documentationUrl" target="_blank" style="width:fit-content">Read Documentation</a>
                </div>
                <div class="f-col align-v-bottom flex1 g-5">
                    <div class="ai-disclosure">
                        <span class="bold">Note:</span> this resource uses AI-assisted curation of program names and cell states; manual review and curation are ongoing. Please see cell state and program metadata for details.
                    </div>
                    <h5 class="bold">Search gene</h5>
                    <div class="search f-row g-5 relative">
                        <div class="search-input-wrap flex1 relative">
                            <input
                                type="text"
                                class="flex1"
                                v-model.trim="searchedGene"
                                autocomplete="off"
                                @keyup.enter="onSearchClick"
                            />
                            <div v-if="showGeneSuggestions" class="suggestions-panel">
                                <div v-if="isLoadingGeneSuggestions" class="suggestion-message">
                                    Searching genes...
                                </div>
                                <div
                                    v-else-if="noGeneSuggestions"
                                    class="suggestion-message"
                                >
                                    No matching genes found.
                                </div>
                                <button
                                    v-else
                                    v-for="gene in geneSuggestions"
                                    :key="normalizeGeneLabel(gene)"
                                    type="button"
                                    class="suggestion-item"
                                    @click="onSuggestionSelected(gene)"
                                >
                                    {{ normalizeGeneLabel(gene) }}
                                </button>
                            </div>
                        </div>
                        <button class="primary bold"
                            @click="onSearchClick"
                        >
                            Search
                        </button>
                    </div>
                    <div v-if="geneSearchError" class="search-feedback error">{{ geneSearchError }}</div>
                    <div v-else-if="isLoadingGeneData" class="search-feedback">Loading gene data...</div>
                    <div v-else>&nbsp;</div>
                </div>
            </div>
        </div>
        <cell-state-infographic :default-collapsed="!!selectedGene" />
        <div v-if="selectedGene && availableTissues.length" id="liger-body" class="f-col g-40">
            <div class="liger-sections" ref="ligerSections">
                <div class="section-anchor" ref="anchorGene"></div>
                <header
                    class="liger-section-header"
                    :class="{ stuck: stuckSections.gene }"
                    :style="sectionStickyStyle('gene')"
                    @click="scrollToSection('gene')"
                >
                    <div class="section-crumb">
                        <span class="section-kicker"><span class="section-icon" aria-hidden="true">{{ sectionIcon('gene') }}</span>Gene</span>
                        <span class="section-value">{{ selectedGene }}</span>
                    </div>
                </header>

                <template v-if="!shouldHideTissueCard">
                    <div class="section-anchor" ref="anchorTissue"></div>
                    <header
                        class="liger-section-header"
                        :class="{ stuck: stuckSections.tissue }"
                        :style="sectionStickyStyle('tissue')"
                        @click="scrollToSection('tissue')"
                    >
                        <div class="section-crumb">
                            <span class="section-kicker"><span class="section-icon" aria-hidden="true">{{ sectionIcon('tissue') }}</span>Tissue</span>
                            <span v-if="selectedTissue" class="section-value">{{ selectedTissue }}</span>
                            <span v-else-if="tissueMetaText" class="section-value as-meta">{{ tissueMetaText }}</span>
                            <button
                                v-if="selectedTissue"
                                type="button"
                                class="link-button"
                                @click.stop="clearTissueSelection"
                            >
                                Clear
                            </button>
                        </div>
                        <div class="section-meta">
                            <span v-if="selectedTissue && tissueMetaText">{{ tissueMetaText }}</span>
                        </div>
                    </header>
                    <div class="liger-section-body">
                        <div v-if="isLoadingGeneData" class="empty-state">
                            Loading tissues...
                        </div>
                        <div v-else-if="!availableTissues.length" class="empty-state">
                            No tissues available yet for this gene.
                        </div>
                        <div v-else class="chip-row">
                            <button
                                v-for="tissue in availableTissues"
                                :key="tissue"
                                type="button"
                                class="chip"
                                :class="{ selected: selectedTissue === tissue }"
                                @click="selectTissue(tissue)"
                            >
                                {{ tissue }}
                            </button>
                        </div>
                    </div>
                    </template>

                    <div class="section-anchor" ref="anchorCellType"></div>
                    <header
                        class="liger-section-header"
                        :class="{ stuck: stuckSections.cellType }"
                        :style="sectionStickyStyle('cellType')"
                        @click="scrollToSection('cellType')"
                    >
                        <div class="section-crumb">
                            <span class="section-kicker"><span class="section-icon" aria-hidden="true">{{ sectionIcon('cellType') }}</span>Cell type</span>
                            <span v-if="selectedCellType" class="section-value">{{ selectedCellType.label }}</span>
                            <span v-else-if="!selectedTissue" class="section-value placeholder">Waiting for tissue selection</span>
                            <span v-else-if="cellTypeMetaText" class="section-value as-meta">{{ cellTypeMetaText }}</span>
                            <button
                                v-if="selectedCellType"
                                type="button"
                                class="link-button"
                                @click.stop="clearCellTypeSelection"
                            >
                                Clear
                            </button>
                        </div>
                        <div class="section-meta">
                            <span v-if="selectedCellType && cellTypeMetaText">{{ cellTypeMetaText }}</span>
                        </div>
                    </header>
                    <div v-if="selectedTissue" class="liger-section-body tall">
                        <div v-if="isLoadingCellTypes" class="card-overlay">
                            <div>Loading cell types...</div>
                        </div>
                        <div class="bar-block f-col">
                            <div class="bar-grid-header" :class="{'no-spec': !showCellTypeSpecificity}">
                                <div class="bold">Cell Type</div>
                                <div class="bold column-head">
                                    <span class="metric-tooltip">
                                        <span class="metric-tooltip-label">Expression</span>
                                        <span class="metric-tooltip-bubble">{{ absoluteExpressionTooltipByKind.cellType }}</span>
                                    </span>
                                    <span class="axis-unit">{{ expressionUnitLabel }}</span>
                                </div>
                                <template v-if="showCellTypeSpecificity">
                                    <div class="bold column-head">
                                        <span class="metric-tooltip">
                                            <span class="metric-tooltip-label">Specificity</span>
                                            <span class="metric-tooltip-bubble">{{ specificityTooltipByKind.cellType }}</span>
                                        </span>
                                        <span class="axis-unit">{{ specificityUnitLabel }}</span>
                                    </div>
                                </template>
                            </div>
                            <div class="axis-row" :class="{'no-spec': !showCellTypeSpecificity}">
                                <div></div>
                                <div class="axis-scale">
                                    <span
                                        v-for="tick in expressionAxisTicks"
                                        :key="`ct-x-${tick.value}`"
                                        class="axis-tick"
                                        :style="{ left: tick.offset }"
                                    >{{ tick.label }}</span>
                                </div>
                                <div v-if="showCellTypeSpecificity" class="axis-scale">
                                    <span
                                        v-for="tick in cellTypeSpecificityTicks"
                                        :key="`ct-s-${tick.value}`"
                                        class="axis-tick"
                                        :style="{ left: tick.offset }"
                                    >{{ tick.label }}</span>
                                </div>
                            </div>
                            <div class="scroll-panel f-col" @scroll="hideExpressionRowTooltip">
                                <div v-if="cellTypeLoadError" class="empty-state">
                                    {{ cellTypeLoadError }}
                                </div>
                                <div
                                    v-for="cellType in availableCellTypes"
                                    :key="cellType.key"
                                    class="bar-grid-item grid-item"
                                    :class="{
                                        selected: selectedCellType && selectedCellType.key === cellType.key,
                                        'no-data': !cellType.hasExpression,
                                        'no-spec': !showCellTypeSpecificity
                                    }"
                                    @click="selectCellType(cellType)"
                                >
                                    <div class="bar-label">{{cellType.label}}</div>
                                    <div class="bar-cell">
                                        <div class="bar-track">
                                            <div
                                                v-if="cellType.hasExpression"
                                                class="bar-fill"
                                                :class="{ 'overflow-high': cellType.expressionOverflow === 'high' }"
                                                :style="{ width: cellType.expressionWidth }"
                                            ></div>
                                        </div>
                                        <div class="bar-number">{{cellType.absText}}</div>
                                    </div>
                                    <div v-if="showCellTypeSpecificity" class="bar-cell">
                                        <div class="bar-track diverging">
                                            <div
                                                v-if="cellType.hasSpec"
                                                class="bar-fill-diverging"
                                                :class="{ negative: cellType.spec < 0, muted: cellType.muted, clamped: !!cellType.specOverflow }"
                                                :style="{ '--k': cellType.specScale }"
                                            ></div>
                                        </div>
                                        <div class="bar-number">{{cellType.specText}}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section-anchor" ref="anchorState"></div>
                    <header
                        class="liger-section-header"
                        :class="{ stuck: stuckSections.state }"
                        :style="sectionStickyStyle('state')"
                        @click="scrollToSection('state')"
                    >
                        <div class="section-crumb">
                            <span class="section-kicker"><span class="section-icon" aria-hidden="true">{{ sectionIcon('state') }}</span>Cell state</span>
                            <span v-if="selectedCellStateLabel" class="section-value">{{ selectedCellStateLabel }}</span>
                            <span v-else-if="!selectedCellType" class="section-value placeholder">Waiting for cell type selection</span>
                            <span v-else-if="cellStateMetaText" class="section-value as-meta">{{ cellStateMetaText }}</span>
                            <button
                                v-if="selectedCellStateKey"
                                type="button"
                                class="link-button"
                                @click.stop="clearCellStateSelection"
                            >
                                Clear
                            </button>
                        </div>
                        <div class="section-meta">
                            <span v-if="selectedCellStateKey && cellStateMetaText">{{ cellStateMetaText }}</span>
                        </div>
                    </header>
                    <div v-if="selectedCellType" class="liger-section-body tall">
                        <div class="section-lede-row">
                            <div class="section-lede">Cell states are curated, marker-defined biology.</div>
                            <div class="also">Hover row for info</div>
                        </div>
                        <div v-if="isLoadingCellStateSection" class="card-overlay">
                            <div>Loading cell states...</div>
                        </div>
                        <div class="detail-split">
                        <div v-if="!viewStateInfo" class="expression bar-block f-col">
                            <div class="bar-grid-header">
                                <div class="bold">Cell State</div>
                                <div class="bold column-head">
                                    <span class="metric-tooltip">
                                        <span class="metric-tooltip-label">Expression</span>
                                        <span class="metric-tooltip-bubble">{{ absoluteExpressionTooltipByKind.state }}</span>
                                    </span>
                                    <span class="axis-unit">{{ expressionUnitLabel }}</span>
                                </div>
                                <div class="bold column-head">
                                    <span class="metric-tooltip">
                                        <span class="metric-tooltip-label">Specificity</span>
                                        <span class="metric-tooltip-bubble">{{ specificityTooltipByKind.state }}</span>
                                    </span>
                                    <span class="axis-unit">{{ specificityUnitLabel }}</span>
                                </div>
                            </div>
                            <div class="axis-row">
                                <div></div>
                                <div class="axis-scale">
                                    <span
                                        v-for="tick in expressionAxisTicks"
                                        :key="`st-x-${tick.value}`"
                                        class="axis-tick"
                                        :style="{ left: tick.offset }"
                                    >{{ tick.label }}</span>
                                </div>
                                <div class="axis-scale">
                                    <span
                                        v-for="tick in cellStateSpecificityTicks"
                                        :key="`st-s-${tick.value}`"
                                        class="axis-tick"
                                        :style="{ left: tick.offset }"
                                    >{{ tick.label }}</span>
                                </div>
                            </div>
                            <div class="scroll-panel f-col" @scroll="hideExpressionRowTooltip">
                                <div v-if="cellStateSectionError" class="empty-state">
                                    {{ cellStateSectionError }}
                                </div>
                                <div
                                    v-for="cellState in cellStateExpressionList"
                                    :key="cellState.key"
                                    class="bar-grid-item grid-item"
                                    :class="{
                                        selected: selectedCellStateKey === cellState.key,
                                        'no-data': !cellState.hasExpression
                                    }"
                                    @mouseenter="showExpressionRowTooltip($event, 'state', cellState)"
                                    @mousemove="showExpressionRowTooltip($event, 'state', cellState)"
                                    @mouseleave="hideExpressionRowTooltip"
                                    @click="selectCellState(cellState)"
                                >
                                    <div class="bar-label">{{cellState.label}}</div>
                                    <div class="bar-cell">
                                        <div class="bar-track">
                                            <div
                                                v-if="cellState.hasExpression"
                                                class="bar-fill"
                                                :class="{ 'overflow-high': cellState.expressionOverflow === 'high' }"
                                                :style="{ width: cellState.expressionWidth }"
                                            ></div>
                                        </div>
                                        <div class="bar-number">{{cellState.absText}}</div>
                                    </div>
                                    <div class="bar-cell">
                                        <div class="bar-track diverging">
                                            <div
                                                v-if="cellState.hasSpec"
                                                class="bar-fill-diverging"
                                                :class="{ negative: cellState.spec < 0, muted: cellState.muted, clamped: !!cellState.specOverflow }"
                                                :style="{ '--k': cellState.specScale }"
                                            ></div>
                                        </div>
                                        <div class="bar-number">{{cellState.specText}}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else class="info f-col">
                            <div class="info-grid">
                                <div class="bold">Cell State</div>
                                <div class="bold">Description</div>
                                <div class="bold">Marker Genes</div>
                            </div>
                            <div class="scroll-panel f-col">
                                <div v-if="cellStateSectionError" class="empty-state">
                                    {{ cellStateSectionError }}
                                </div>
                                <div
                                    v-for="cellState in cellStateInfoList"
                                    :key="cellState.key"
                                    class="info-grid grid-item"
                                    :class="{ selected: selectedCellStateKey === cellState.key }"
                                    @click="selectCellState({ key: cellState.key, row: stateMetadataById[cellState.key] })"
                                >
                                    <div>{{cellState.label}}</div>
                                    <div class="info-description">{{cellState.description}}</div>
                                    <div class="info-genes"><span class="info-gene" v-for="gene in cellState.genes.split(',')">{{gene.trim()}}</span></div>
                                </div>
                            </div>
                        </div>

                        <aside v-if="cellStateDetail" class="detail-pane">
                            <div class="detail-pane-scroll">
                                <div class="detail-pane-header">
                                    <div class="detail-pane-eyebrow">Curated cell state</div>
                                    <h4 class="bold detail-pane-title">{{ cellStateDetail.title }}</h4>
                                    <button type="button" class="detail-pane-close" @click="clearCellStateSelection">Close</button>
                                    <div v-if="cellStateDetail.badges.length" class="drawer-badge-row">
                                        <span
                                            v-for="badge in cellStateDetail.badges"
                                            :key="badge.text"
                                            class="drawer-badge"
                                            :class="badge.tone"
                                        >
                                            {{ badge.text }}
                                        </span>
                                    </div>
                                </div>
                                <liger-detail-panel
                                    :content="cellStateDetail.content"
                                    :loading="cellStateDetail.loading"
                                    @open-state="openStateFromPanel"
                                    @open-program="openProgramFromPanel"
                                />
                            </div>
                        </aside>
                        </div>
                    </div>

                    <div class="section-anchor" ref="anchorProgram"></div>
                    <header
                        class="liger-section-header"
                        :class="{ stuck: stuckSections.program }"
                        :style="sectionStickyStyle('program')"
                        @click="scrollToSection('program')"
                    >
                        <div class="section-crumb">
                            <span class="section-kicker"><span class="section-icon" aria-hidden="true">{{ sectionIcon('program') }}</span>Gene program</span>
                            <span v-if="selectedProgramLabel" class="section-value">{{ selectedProgramLabel }}</span>
                            <span v-else-if="!selectedCellType" class="section-value placeholder">Waiting for cell type selection</span>
                            <span v-else-if="geneProgramMetaText" class="section-value as-meta">{{ geneProgramMetaText }}</span>
                            <button
                                v-if="selectedProgramKey"
                                type="button"
                                class="link-button"
                                @click.stop="clearGeneProgramSelection"
                            >
                                Clear
                            </button>
                        </div>
                        <div class="section-meta">
                            <span v-if="selectedProgramKey && geneProgramMetaText">{{ geneProgramMetaText }}</span>
                        </div>
                    </header>
                    <div v-if="selectedCellType" class="liger-section-body tall">
                        <div class="section-lede-row">
                            <div class="section-lede">Gene programs are data-driven, computationally inferred latent factors.</div>
                            <div class="also">Hover row for info</div>
                        </div>
                        <div v-if="isLoadingGeneProgramSection" class="card-overlay">
                            <div>Loading gene programs...</div>
                        </div>
                        <div class="detail-split">
                        <div v-if="!viewProgramInfo" class="expression bar-block f-col">
                            <div class="bar-grid-header">
                                <div class="bold">Gene Program</div>
                                <div class="bold column-head">
                                    <span class="metric-tooltip">
                                        <span class="metric-tooltip-label">Expression</span>
                                        <span class="metric-tooltip-bubble">{{ absoluteExpressionTooltipByKind.program }}</span>
                                    </span>
                                    <span class="axis-unit">{{ expressionUnitLabel }}</span>
                                </div>
                                <div class="bold column-head">
                                    <span class="metric-tooltip">
                                        <span class="metric-tooltip-label">Specificity</span>
                                        <span class="metric-tooltip-bubble">{{ specificityTooltipByKind.program }}</span>
                                    </span>
                                    <span class="axis-unit">{{ specificityUnitLabel }}</span>
                                </div>
                            </div>
                            <div class="axis-row">
                                <div></div>
                                <div class="axis-scale">
                                    <span
                                        v-for="tick in expressionAxisTicks"
                                        :key="`pr-x-${tick.value}`"
                                        class="axis-tick"
                                        :style="{ left: tick.offset }"
                                    >{{ tick.label }}</span>
                                </div>
                                <div class="axis-scale">
                                    <span
                                        v-for="tick in programSpecificityTicks"
                                        :key="`pr-s-${tick.value}`"
                                        class="axis-tick"
                                        :style="{ left: tick.offset }"
                                    >{{ tick.label }}</span>
                                </div>
                            </div>
                            <div class="scroll-panel f-col" @scroll="hideExpressionRowTooltip">
                                <div v-if="geneProgramSectionError" class="empty-state">
                                    {{ geneProgramSectionError }}
                                </div>
                                <div v-else-if="geneProgramFilterEmptyMessage" class="empty-state">
                                    {{ geneProgramFilterEmptyMessage }}
                                </div>
                                <div
                                    v-for="program in geneProgramExpressionList"
                                    :key="program.key"
                                    class="bar-grid-item grid-item"
                                    :class="{
                                        selected: selectedProgramKey === program.key,
                                        'no-data': !program.hasExpression
                                    }"
                                    @mouseenter="showExpressionRowTooltip($event, 'program', program)"
                                    @mousemove="showExpressionRowTooltip($event, 'program', program)"
                                    @mouseleave="hideExpressionRowTooltip"
                                    @click="selectGeneProgram(program)"
                                >
                                    <div class="bar-label">{{program.label}}</div>
                                    <div class="bar-cell">
                                        <div class="bar-track">
                                            <div
                                                v-if="program.hasExpression"
                                                class="bar-fill"
                                                :class="{ 'overflow-high': program.expressionOverflow === 'high' }"
                                                :style="{ width: program.expressionWidth }"
                                            ></div>
                                        </div>
                                        <div class="bar-number">{{program.absText}}</div>
                                    </div>
                                    <div class="bar-cell">
                                        <div class="bar-track diverging">
                                            <div
                                                v-if="program.hasSpec"
                                                class="bar-fill-diverging"
                                                :class="{ negative: program.spec < 0, muted: program.muted, clamped: !!program.specOverflow }"
                                                :style="{ '--k': program.specScale }"
                                            ></div>
                                        </div>
                                        <div class="bar-number">{{program.specText}}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="info f-col">
                            <div class="info-grid">
                                <div class="bold">Gene Program</div>
                                <div class="bold">Description</div>
                                <div class="bold">Top Genes</div>
                            </div>
                            <div class="scroll-panel f-col" @scroll="hideExpressionRowTooltip">
                                <div v-if="geneProgramSectionError" class="empty-state">
                                    {{ geneProgramSectionError }}
                                </div>
                                <div
                                    v-for="program in geneProgramInfoList"
                                    :key="program.key"
                                    class="info-grid grid-item"
                                    :class="{ selected: selectedProgramKey === program.key }"
                                    @click="selectGeneProgram({ key: program.key, row: geneProgramInfoById[program.key] })"
                                >
                                    <div>{{program.label}}</div>
                                    <div class="info-description">{{program.description}}</div>
                                    <div class="info-genes"><span class="info-gene" v-for="gene in program.genes.split(',')">{{gene.trim()}}</span></div>
                                </div>
                            </div>
                        </div>

                        <aside v-if="geneProgramDetail" class="detail-pane">
                            <div class="detail-pane-scroll">
                                <div class="detail-pane-header">
                                    <div class="detail-pane-eyebrow">Inferred gene program</div>
                                    <h4 class="bold detail-pane-title">{{ geneProgramDetail.title }}</h4>
                                    <button type="button" class="detail-pane-close" @click="clearGeneProgramSelection">Close</button>
                                    <div v-if="geneProgramDetail.badges.length" class="drawer-badge-row">
                                        <span
                                            v-for="badge in geneProgramDetail.badges"
                                            :key="badge.text"
                                            class="drawer-badge"
                                            :class="badge.tone"
                                        >
                                            {{ badge.text }}
                                        </span>
                                    </div>
                                </div>
                                <liger-detail-panel
                                    :content="geneProgramDetail.content"
                                    :loading="geneProgramDetail.loading"
                                    @open-state="openStateFromPanel"
                                    @open-program="openProgramFromPanel"
                                />
                            </div>
                        </aside>
                        </div>
                    </div>

                <div class="section-anchor" ref="anchorRelationships"></div>
                <header
                    class="liger-section-header"
                    :class="{ stuck: stuckSections.relationships }"
                    :style="sectionStickyStyle('relationships')"
                    @click="scrollToSection('relationships')"
                >
                    <div class="section-crumb">
                        <span class="section-kicker"><span class="section-icon" aria-hidden="true">{{ sectionIcon('relationships') }}</span>Relationships</span>
                        <span v-if="!selectedCellType" class="section-value placeholder">Waiting for cell type selection</span>
                        <span v-else-if="relationshipMetaText" class="section-value as-meta">{{ relationshipMetaText }}</span>
                    </div>
                </header>
                <div v-if="selectedCellType" class="liger-section-body tall">
                    <div class="section-lede-row">
                        <div class="section-lede">Explore genetic correlations between known cell states and inferred gene programs for potentially novel connections.</div>
                    </div>
                    <div v-if="isLoadingRelationshipHeatmap" class="card-overlay">
                        <div>Loading relationships...</div>
                    </div>
                    <div class="f-row spread-out align-v-center">
                        <div class="f-row g-10 align-v-center">
                            <select v-model="selectedRelationshipMetric" :disabled="!relationshipMetricOptions.length">
                                <option
                                    v-for="option in relationshipMetricOptions"
                                    :key="option.value"
                                    :value="option.value"
                                >
                                    {{ option.label }}
                                </option>
                            </select>
                            <span class="heatmap-meta">
                                <span class="metric-tooltip">
                                    <span class="metric-tooltip-label">{{ relationshipHeatmapMetricLabel }}</span>
                                    <span class="metric-tooltip-bubble">{{ relationshipMetricTooltip(relationshipHeatmapDisplay.metric) }}</span>
                                </span>
                            </span>
                        </div>
                        <div class="heatmap-legend">
                            <span class="legend-label">Lower</span>
                            <span
                                class="legend-gradient"
                                :class="{ diverging: relationshipMetricIsDiverging(selectedRelationshipMetric || 'correlation') }"
                            ></span>
                            <span class="legend-label">Higher</span>
                        </div>
                    </div>
                    <div v-if="relationshipHeatmapError" class="empty-state">
                        {{ relationshipHeatmapError }}
                    </div>
                    <div v-else-if="selectedCellType && !relationshipHeatmapDisplay.stateRows.length" class="empty-state">
                        No relationship heatmap rows returned.
                    </div>
                    <div v-else-if="relationshipHeatmapDisplay.stateRows.length" class="heatmap-wrap">
                        <table class="heatmap-table">
                            <thead>
                                <tr>
                                    <th class="heatmap-row-head">
                                        <div class="heatmap-row-head-label">Cell State</div>
                                        <div class="heatmap-column-head-label">Gene Program</div>
                                    </th>
                                    <th
                                        v-for="program in relationshipHeatmapDisplay.programHeaders"
                                        :key="program.key"
                                        class="heatmap-column-head"
                                        :title="program.label"
                                        @click="openProgramDrawer(program.key, geneProgramInfoById[program.key])"
                                    >
                                        <div class="heatmap-column-label">{{ program.label }}</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="state in relationshipHeatmapDisplay.stateRows"
                                    :key="state.key"
                                >
                                    <td class="heatmap-row-head clickable-cell" :title="state.label" @click="openStateDrawer(state.key, stateMetadataById[state.key])">{{ state.label }}</td>
                                    <td
                                        v-for="cell in state.cells"
                                        :key="cell.key"
                                        class="heatmap-cell"
                                        :style="{ background: cell.color }"
                                        @mouseenter="showHeatmapTooltip($event, cell.tooltipRows)"
                                        @mousemove="moveHeatmapTooltip($event)"
                                        @mouseleave="hideHeatmapTooltip()"
                                    >
                                        <div class="heatmap-cell-inner">
                                            <span v-if="isFiniteNumber(cell.value)">{{ formatMetric(cell.value) }}</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-else class="empty-state">
                        No relationships loaded.
                    </div>
                </div>

                <div class="section-anchor" ref="anchorTraits"></div>
                <header
                    class="liger-section-header"
                    :class="{ stuck: stuckSections.traits }"
                    :style="sectionStickyStyle('traits')"
                    @click="scrollToSection('traits')"
                >
                    <div class="section-crumb">
                        <span class="section-kicker"><span class="section-icon" aria-hidden="true">{{ sectionIcon('traits') }}</span>Traits</span>
                        <span v-if="!selectedCellType" class="section-value placeholder">Waiting for cell type selection</span>
                        <span v-else-if="traitMetaText" class="section-value as-meta">{{ traitMetaText }}</span>
                    </div>
                </header>
                <div v-if="selectedCellType" class="liger-section-body tall">
                    <div class="section-lede-row">
                        <div class="section-lede">See which curated states and inferred programs connect to human traits.</div>
                    </div>
                    <div v-if="isLoadingTraitHeatmap" class="card-overlay">
                        <div>Loading trait links...</div>
                    </div>
                    <div class="f-row spread-out">
                        <div class="f-row g-10 align-v-center">
                            <select v-model="selectedTraitMetric">
                                <option value="beta">Joint beta</option>
                                <option value="beta_uncorrected">Marginal beta</option>
                            </select>
                            <select v-model="selectedTraitColumnFilter">
                                <option value="all">states + factors</option>
                                <option value="program">factors only</option>
                                <option value="state">states only</option>
                            </select>
                            <span class="heatmap-meta">
                                <span class="metric-tooltip">
                                    <span class="metric-tooltip-label">{{ traitHeatmapMetricLabel }}</span>
                                    <span class="metric-tooltip-bubble">{{ traitMetricTooltip(selectedTraitMetric) }}</span>
                                </span>
                            </span>
                        </div>
                        <div class="heatmap-legend">
                            <span class="legend-label">Negative</span>
                            <span class="legend-gradient diverging"></span>
                            <span class="legend-label">Positive</span>
                        </div>
                    </div>
                    <div v-if="traitHeatmapError" class="empty-state">
                        {{ traitHeatmapError }}
                    </div>
                    <div v-else-if="selectedCellType && !traitHeatmapDisplay.groupRows.length" class="empty-state">
                        No grouped trait links returned.
                    </div>
                    <div v-else-if="traitHeatmapDisplay.groupRows.length" class="heatmap-wrap">
                        <table class="heatmap-table">
                            <thead>
                                <tr>
                                    <th class="heatmap-row-head">
                                        <div class="heatmap-row-head-label">Trait</div>
                                        <div class="heatmap-column-head-label">{{ traitColumnHeaderLabel }}</div>
                                    </th>
                                    <th
                                        v-for="column in availableTraitColumns"
                                        :key="column.id"
                                        class="heatmap-column-head"
                                        :title="`${column.type}: ${column.label}`"
                                        @click="column.type === 'state' ? openStateDrawer(column.id, stateMetadataById[column.id]) : openProgramDrawer(column.id, geneProgramInfoById[column.id])"
                                    >
                                        <div class="heatmap-column-label">{{ column.label }}</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <template v-for="group in traitHeatmapDisplay.groupRows">
                                    <tr :key="`${group.group}-header`" class="heatmap-group-row">
                                        <td class="heatmap-group-label" :colspan="availableTraitColumns.length + 1">
                                            {{ group.group }}
                                        </td>
                                    </tr>
                                    <tr
                                        v-for="trait in group.traits"
                                        :key="`${group.group}-${trait.trait}`"
                                    >
                                        <td class="heatmap-row-head" :title="trait.displayTrait">{{ trait.displayTrait }}</td>
                                        <td
                                            v-for="cell in trait.cells"
                                            :key="cell.key"
                                            class="heatmap-cell"
                                            :style="{ background: cell.color }"
                                            @mouseenter="showHeatmapTooltip($event, cell.tooltipRows)"
                                            @mousemove="moveHeatmapTooltip($event)"
                                            @mouseleave="hideHeatmapTooltip()"
                                        >
                                            <div class="heatmap-cell-inner">
                                                <span v-if="isFiniteNumber(cell.value)">{{ cell.value.toFixed(3) }}</span>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                    <div v-else class="empty-state">
                        No trait links loaded.
                    </div>
                </div>
            </div>
        </div>
        <div
            v-if="floatingHeatmapTooltip.visible && floatingHeatmapTooltip.rows.length"
            class="floating-heatmap-tooltip"
            :style="{ left: `${floatingHeatmapTooltip.x}px`, top: `${floatingHeatmapTooltip.y}px` }"
        >
            <div
                v-for="tooltipRow in floatingHeatmapTooltip.rows"
                :key="`floating-${tooltipRow.label}`"
                class="heatmap-tooltip-row"
            >
                <strong>{{ tooltipRow.label }}:</strong> {{ tooltipRow.value }}
            </div>
        </div>

        <div
            v-if="floatingExpressionTooltip.visible && floatingExpressionTooltip.columns.length"
            ref="expressionTooltip"
            class="floating-expression-tooltip"
            :class="[`side-${floatingExpressionTooltip.side}`, { positioned: floatingExpressionTooltip.positioned }]"
            :style="{
                left: `${floatingExpressionTooltip.x}px`,
                top: `${floatingExpressionTooltip.y}px`,
                '--arrow-x': `${floatingExpressionTooltip.arrowX}px`
            }"
        >
            <div class="expression-tooltip-grid">
                <div
                    v-for="column in floatingExpressionTooltip.columns"
                    :key="`expression-tooltip-${column.label}`"
                    class="expression-tooltip-column"
                >
                    <div class="expression-tooltip-heading">{{ column.label }}</div>
                    <div v-if="column.items && column.items.length" class="expression-tooltip-chip-list">
                        <span
                            v-for="item in column.items"
                            :key="`${column.label}-${item}`"
                            class="expression-tooltip-chip"
                        >
                            {{ item }}
                        </span>
                    </div>
                    <div v-else class="expression-tooltip-value">{{ column.value }}</div>
                </div>
            </div>
            <div class="expression-tooltip-note">Click row for full metadata</div>
        </div>

        <div
            v-if="drawerOpen"
            class="drawer-backdrop"
            @click="closeDrawer"
        ></div>
        <aside class="drawer" :class="{ open: drawerOpen }">
            <div class="drawer-header">
                <button class="drawer-close" @click="closeDrawer">Close</button>
                <div class="drawer-eyebrow">{{ drawerKind }}</div>
                <h2 class="drawer-title">{{ drawerTitle }}</h2>
                <div class="drawer-badge-row">
                    <span
                        v-for="badge in drawerBadges"
                        :key="badge.text"
                        class="drawer-badge"
                        :class="badge.tone"
                    >
                        {{ badge.text }}
                    </span>
                </div>
            </div>
            <div class="drawer-body">
                <liger-detail-panel
                    :content="drawerContent"
                    :loading="drawerLoading"
                    @open-state="openStateDrawer"
                    @open-program="openProgramDrawer"
                />
            </div>
        </aside>
    </div>
</template>

<style>
:root{
    --blue: #0277b6;
    --lite-green: #c7dd04;
    --lite-blue: #afe6fd;
}
</style>

<style scoped>
@import url("/css/layout.css");

.bold{font-weight: bold;}
h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6 {
    margin-bottom: 0px !important;
}
#liger{
    font-family: Open Sans, sans-serif;
    font-size: 14px;
}
#liger-body{
    min-width: 1230px;
}
.headline{
    line-height: 1.6rem;
}
#liger .search{
    font-size: 1.5em;
}
#liger .search input{
    text-transform: uppercase;
    width: 100%;
}
#liger button {
    border: 1px solid rgba(0, 0, 0, .25);
    background: white;
    color: #4e4e4e;
    padding: 1px 10px;
    font-size: 14px;
}
#liger button.primary{
    background: var(--blue);
    color: white;
}
.search-input-wrap{
    min-width: 0;
}
.suggestions-panel{
    position: absolute;
    top: calc(100% + 3px);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid rgba(0, 0, 0, .25);
    z-index: 20;
    max-height: 240px;
    overflow-y: auto;
}
.suggestion-item{
    display: block;
    width: 100%;
    text-align: left;
    border: none !important;
    border-bottom: 1px solid rgba(0, 0, 0, .1) !important;
    padding: 8px 10px !important;
    background: white !important;
    color: #4e4e4e !important;
}
.suggestion-item:last-child{
    border-bottom: none !important;
}
.suggestion-item:hover{
    background: #94c95e !important;
    color: white !important;
}
.suggestion-message,
.search-feedback,
.empty-state{
    font-size: 13px;
    color: #4e4e4e;
}
.suggestion-message{
    padding: 8px 10px;
}
.search-feedback{
    margin-top: 6px;
}
.search-feedback.error{
    color: #b54708;
}
.empty-state{
    padding: 5px 10px;
}

.shout {
    font-weight: bold;
    color: var(--blue);
    font-size: 1.2em;
}
.ai-disclosure {
    background: #e8f1fb;
    padding: 5px 10px;
    border-radius: 10px;
    font-style: italic;
    margin: 0 -10px auto -10px;
}

.expression-grid{
    display:grid;
    grid-template-columns: 200px auto 50px 50px;
    padding: 5px 10px;
}
.bar-grid-header{
    font-size: 1.1em;
}
.bar-grid-header,
.bar-grid-item,
.axis-row{
    display:grid;
    grid-template-columns: 1.5fr 1fr 1fr;
    gap: 40px;
    align-items: center;
    padding: 7px 12px;
}
/* Cell types have no specificity data, so that card runs a two-column grid.
   The bar column is capped rather than left to fill the freed space, so bars
   stay the same physical length as the other two cards - a fixed axis is only
   readable as "comparable" if the tracks are the same size. */
.bar-grid-header.no-spec,
.bar-grid-item.no-spec,
.axis-row.no-spec{
    grid-template-columns: 1.5fr 2fr;
}
/* Selecting a row opens its metadata beside the rows rather than in the drawer,
   which put the record on top of the list it came from. Half the card each, so
   the bars stay readable while the record is open. The split only exists while a
   row is selected - reserving the space permanently would halve the bar tracks
   for the whole session to serve a pane that is usually not there. */
/* No min-height here: with no row selected this holds the list alone, and a
   floor would pad every short list with dead space. The floor belongs to the
   pane, which only exists while a row is selected. */
.detail-split{
    display: flex;
    align-items: stretch;
    min-width: 0;
}
.detail-split > .expression,
.detail-split > .info{
    flex: 1 1 50%;
    min-width: 0;
}
/* The pane ends up max(row list height, 500px) and never taller than the split.
   It holds no in-flow content of its own (the scroller below is absolutely
   positioned), so a long record contributes nothing to the flex line and cannot
   stretch the rows column to match it - only min-height does, which is what
   gives a short list enough room to read a record in. align-items: stretch then
   sizes the pane to the line. Sizing it by its own content instead is what would
   let it run past the card. */
.detail-pane{
    position: relative;
    flex: 0 0 50%;
    min-width: 0;
    min-height: 500px;
    border-left: 2px solid var(--blue);
    background: #fafafa;
    overflow: hidden;
}
.detail-pane-scroll{
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    padding: 16px;
    overflow-y: auto;
    overscroll-behavior: contain;
}
.detail-pane-header{
    position: relative;
    margin-bottom: 16px;
    padding-right: 70px;
}
.detail-pane-eyebrow{
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #6b7688;
}
.detail-pane-title{
    margin: 4px 0 8px !important;
}
.detail-pane-close{
    position: absolute;
    top: 0;
    right: 0;
    padding: 2px 10px !important;
}
/* Sits in a sticky header next to the counts, so it reads as a control on that
   line rather than as another portal button. */
#liger .link-button{
    padding: 0;
    border: 0;
    background: transparent;
    color: #175cd3;
    font-size: 12px;
    font-weight: 700;
}
#liger .link-button:hover{
    text-decoration: underline;
}
.bar-cell{
    display: flex;
    align-items: center;
    gap: 8px;
}
.bar-track{
    flex: 1;
    height: 12px;
    background: #edf0f7;
    border-radius: 999px;
    overflow: hidden;
    position: relative;
}
.bar-fill{
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--lite-blue), var(--lite-green));
}
/* A row past the top of the fixed axis gets a hard edge and a marker, so
   clamping is visible rather than silently reading as "exactly the maximum". */
.bar-fill.overflow-high{
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    background: linear-gradient(90deg, var(--lite-blue), var(--lite-green) 88%, #16324f 88%);
}
/* Diverging track for signed log2FC: center line is the zero point. */
.bar-track.diverging::before{
    content: "";
    position: absolute;
    left: 50%;
    top: -1px;
    bottom: -1px;
    width: 1px;
    background: #c3cad8;
}
/* -1..1 of a half-track; scaling through 0 crosses the axis cleanly.
   Same mechanism as CellStateInfographic's delta bars. */
.bar-fill-diverging{
    --k: 0;
    position: absolute;
    left: 50%;
    width: 50%;
    top: 0;
    bottom: 0;
    border-radius: 3px;
    background: #1d4ed8;
    transform: scaleX(var(--k));
    transform-origin: left center;
}
.bar-fill-diverging.negative{
    background: #c2410c;
}
.bar-fill-diverging.muted{
    opacity: .35;
}
/* Rows past the end of the symmetric axis get a squared-off edge so a clamped
   bar is not mistaken for one that happens to reach the axis limit. */
.bar-fill-diverging.clamped{
    border-radius: 0;
}
.bar-fill-diverging.clamped::after{
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 2px;
    background: #16324f;
}
.bar-number{
    min-width: 30px;
    font-size:12px;
    text-align: right;
    font-variant-numeric: tabular-nums;
}
.bar-grid-item.no-data .bar-label,
.bar-grid-item.no-data .bar-number{
    color: #9aa4b5;
}
/* Tick labels sit under the bar columns so the scale never needs a hover. */
.axis-row{
    padding-top: 0;
    padding-bottom: 2px;
}
.axis-scale{
    position: relative;
    height: 14px;
    /* leave room for the numeric column the bars sit beside */
    margin-right: 50px;
    border-top: 1px solid #dfe4ee;
}
.axis-tick{
    position: absolute;
    top: 1px;
    transform: translateX(-50%);
    font-size: 10px;
    color: #6b7688;
    white-space: nowrap;
}
.axis-tick::before{
    content: "";
    position: absolute;
    left: 50%;
    top: -3px;
    height: 3px;
    width: 1px;
    background: #dfe4ee;
}
/* Title on the left of the column, unit on the right of the same line. The
   50px right margin is the same one the tick labels use, so the unit ends where
   the bar track ends rather than out over the numeric column. */
.column-head{
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
}
.axis-unit{
    font-size: 10px;
    font-weight: 400;
    color: #8a93a5;
    margin-right: 50px;
    line-height: 1.3;
    white-space: nowrap;
}
.bar-label{
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.info-grid{
    display:grid;
    grid-template-columns: 200px auto 200px;
    padding: 5px 10px;
    font-size: 1em;
    gap: 10px;
}
.info-description {
    font-size: .9em;
}
.info-genes {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    font-size: .9em;
    height: fit-content;
}
.info-gene {
    padding: 0 5px;
    background: #eee;
    height: fit-content;
}
.grid-item{
    text-align: left;
    cursor: pointer;
    background: #fafafa;
}
.grid-item:hover{
    background: #ddd;
}
.grid-item.selected {
    background: var(--blue);
    color: white;
}

.metric-tooltip{
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    cursor: help;
}
.metric-tooltip-label{
    text-decoration: underline dotted;
    text-underline-offset: 2px;
}
.metric-tooltip-bubble{
    position: absolute;
    right: 0;
    bottom: calc(100% + 10px);
    width: 260px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #16324f;
    color: white;
    text-align: left;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.45;
    box-shadow: 0 10px 24px rgba(0, 0, 0, .18);
    opacity: 0;
    visibility: hidden;
    transform: translateY(4px);
    transition: opacity .14s ease, transform .14s ease, visibility .14s ease;
    pointer-events: none;
    z-index: 20;
}
.metric-tooltip-bubble::after{
    content: "";
    position: absolute;
    right: 12px;
    top: 100%;
    border-width: 6px;
    border-style: solid;
    border-color: #16324f transparent transparent transparent;
}
.metric-tooltip:hover .metric-tooltip-bubble,
.metric-tooltip:focus-within .metric-tooltip-bubble{
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.floating-expression-tooltip{
    position: fixed;
    width: 640px;
    max-width: min(640px, calc(100vw - 24px));
    padding: 14px;
    border-radius: 12px;
    background: #16324f;
    color: white;
    box-shadow: 0 18px 34px rgba(0, 0, 0, .22);
    z-index: 35;
    pointer-events: none;
    /* Held back until alignExpressionRowTooltip has measured the box, so it is
       never briefly drawn at its provisional position. */
    opacity: 0;
}
.floating-expression-tooltip.positioned{
    opacity: 1;
}
/* --arrow-x is the hovered row's anchor point measured from the left edge of
   this box, so the arrow stays over the row even when the box has been clamped
   away from a viewport edge. */
.floating-expression-tooltip::after{
    content: "";
    position: absolute;
    left: calc(var(--arrow-x, 60px) - 7px);
    border-width: 7px;
    border-style: solid;
}
.floating-expression-tooltip.side-below::after{
    top: -14px;
    border-color: transparent transparent #16324f transparent;
}
.floating-expression-tooltip.side-above::after{
    bottom: -14px;
    border-color: #16324f transparent transparent transparent;
}
.expression-tooltip-grid{
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
}
.expression-tooltip-column{
    min-width: 0;
}
.expression-tooltip-heading{
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .03em;
    text-transform: uppercase;
    color: #c6ddf7;
}
.expression-tooltip-value{
    font-size: 13px;
    line-height: 1.45;
    word-break: break-word;
}
.expression-tooltip-chip-list{
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}
.expression-tooltip-chip{
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, .14);
    font-size: 12px;
    line-height: 1.3;
}
.expression-tooltip-note{
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, .16);
    font-size: 12px;
    color: #c6ddf7;
}


.title{
    margin-bottom: 20px;
}
.subtitle{
    font-size: 1.2em;
}
.subtitle-2{
    font-size: 1.1em;
}
.also{
    font-weight: bold;
    font-size: .9em;
}

.spaceholder {
    display: flex;
    width: 100%;
    height: 300px;
    align-items: center;
    justify-content: center;
    border: 1px dashed #bbb;
}
.card-overlay {
    position: absolute;
    top:0;
    left:0;
    background: rgb(236 236 236);
    width: 100%;
    height: 100%;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
}
.heatmap-meta{
    font-size: 13px;
    color: #4e4e4e;
}
.heatmap-legend{
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.legend-label{
    font-size: 12px;
    color: #4e4e4e;
}
.legend-gradient{
    display: inline-block;
    width: 140px;
    height: 12px;
    border-radius: 999px;
    background: linear-gradient(90deg, #ffffff, #18a999);
    border: 1px solid rgba(0, 0, 0, .08);
}
.legend-gradient.diverging{
    background: linear-gradient(90deg, #c2410c, #ffffff 50%, #2f5bea);
}
.heatmap-wrap{
    overflow: auto;
    border: 1px solid rgba(0, 0, 0, .08);
    border-radius: 12px;
    background: white;
    max-height: 520px;
}
.heatmap-table{
    width: max-content;
    min-width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 12px;
}
.heatmap-table th,
.heatmap-table td{
    border-right: 1px solid #edf0f7;
    border-bottom: 1px solid #edf0f7;
}
.heatmap-table thead th{
    position: sticky;
    top: 0;
    z-index: 2;
    background: white;
}
.heatmap-row-head{
    position: sticky;
    left: 0;
    z-index: 1;
    min-width: 180px;
    max-width: 180px;
    padding: 10px 12px;
    background: white;
    text-align: left;
    font-weight: 700;
}
.heatmap-row-head-label {
    position: absolute;
    bottom: 10px;
    font-weight: bold;
    font-size: 14px;
}
.heatmap-column-head-label {
    position: absolute;
    transform: rotate(-90deg) translateX(-50%);
    right: -20px;
    top: 10px;
    font-weight: bold;
    font-size: 14px;
}
.heatmap-table thead .heatmap-row-head{
    z-index: 3;
}
.heatmap-column-head{
    min-width: 62px;
    max-width: 62px;
    vertical-align: bottom;
}
.heatmap-column-label{
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    margin: 0 auto;
    max-height: 150px;
    line-height: 14px;
    display: flex;
    padding: 10px;
    width: 100%;
    height: 100%;
    align-items: center;
    cursor: pointer;
}
.heatmap-column-label:hover{
    background: #ddd;
}
.heatmap-cell{
    min-width: 62px;
    height: 42px;
    padding: 6px;
    text-align: center;
    font-size: 11px;
    color: #1f2937;
    position: relative;
}
.heatmap-cell-inner{
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.floating-heatmap-tooltip{
    position: fixed;
    width: 220px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #16324f;
    color: white;
    text-align: left;
    font-size: 12px;
    line-height: 1.45;
    box-shadow: 0 10px 24px rgba(0, 0, 0, .18);
    pointer-events: none;
    z-index: 2000;
}
.heatmap-tooltip-row + .heatmap-tooltip-row{
    margin-top: 4px;
}
.heatmap-group-row td{
    border-bottom: 1px solid #d9e0eb;
}
.heatmap-group-label{
    position: sticky;
    left: 0;
    z-index: 1;
    padding: 8px 12px;
    background: #eef5fb;
    color: #1f2937;
    font-weight: 700;
    text-align: left;
}
.clickable-cell{
    cursor: pointer;
}
.clickable-cell:hover {
    background: #ddd;
}
.drawer-backdrop{
    position: fixed;
    inset: 0;
    background: rgba(16, 24, 40, 0.28);
    z-index: 20;
}
.drawer{
    position: fixed;
    top: 0;
    right: 0;
    width: min(760px, 96vw);
    height: 100vh;
    background: #fff;
    box-shadow: -22px 0 55px rgba(16, 24, 40, 0.18);
    z-index: 21;
    transform: translateX(105%);
    transition: transform 0.2s ease;
    overflow: auto;
    overscroll-behavior: none;
}
.drawer.open{
    transform: translateX(0);
}
.drawer-header{
    padding: 22px 24px;
    border-bottom: 1px solid #edf0f7;
    position: sticky;
    top: 0;
    background: rgba(255,255,255,0.96);
    z-index: 2;
    backdrop-filter: blur(8px);
}
.drawer-close{
    position: absolute;
    right: 20px;
    padding: 5px 10px !important;
}
.drawer-eyebrow{
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #4e4e4e;
    height: 32px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
}
.drawer-title{
    margin-bottom: 10px !important;
}
.drawer-body{
    padding: 22px 24px 40px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.drawer-badge-row{
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}
.drawer-badge{
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
}
.drawer-badge.good{
    background: #e7f7ed;
    color: #0f7b39;
}
.drawer-badge.warn{
    background: #fff4d6;
    color: #9a6700;
}
.drawer-badge.bad{
    background: #fde7e9;
    color: #b42318;
}
.drawer-badge.blue{
    background: #e8f1fb;
    color: #175cd3;
}

@media (max-width: 900px) {
    .drawer-field-grid{
        grid-template-columns: 1fr;
    }
    .floating-expression-tooltip{
        width: min(640px, calc(100vw - 24px));
    }
    .expression-tooltip-grid{
        grid-template-columns: 1fr;
    }
}

.scroll-panel{
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    max-height: 300px;
}

/* ---------------------------------------------------------------------------
   Stacked sections with sticky headers.

   Gene -> tissue -> cell type -> cell state -> program now read top to bottom
   as one sheet instead of a 2x2 grid of cards, and the headers accumulate as you
   scroll: each pins directly below the ones above it instead of replacing them.
   Every header names the selection its section owns ("TISSUE: Pancreas"), so the
   stack reads as the path that produced whatever is currently on screen.

   Accumulating is why the headers are siblings of the bodies rather than nested
   inside per-section wrappers. A sticky element can only travel within its own
   containing block, so a header inside its section would be shoved out the
   moment that section ended - the iOS behavior, not this one. Sharing one
   containing block (.liger-sections) lets every header stay pinned to the bottom
   of the whole sheet, and --i on each header is what separates them into slots.
   --------------------------------------------------------------------------- */
.liger-sections{
    /* Two fixed heights: the one a header has in flow, and the shorter one it
       takes once it parks. Only parked headers stack, so the pin offset is
       index x the parked height. Both are mirrored by LIGER_HEADER_HEIGHT and
       LIGER_HEADER_STUCK_HEIGHT in the script; change the pairs together.
       --liger-sticky-top is 0 because no portal chrome is pinned to the top of
       the window today - it is here so a future fixed nav is one number. */
    --liger-header-h: 50px;
    --liger-header-stuck-h: 34px;
    --liger-sticky-top: 0px;
    background: white;
    /* Room for the whole parked stack, as PADDING rather than margin. A sticky
       box cannot be pushed past the bottom of its containing block's padding
       box, and with several sections bodyless (before a cell type is picked) the
       sheet ends right below the last header - so the deepest headers could not
       reach their slots and got clamped upward onto each other. Margin does not
       help: it is outside the padding box, so it moves the sheet without giving
       the headers anywhere to sit. */
    padding-bottom: calc(7 * var(--liger-header-stuck-h));
}
.section-anchor{
    height: 0;
}
.liger-section-header{
    position: sticky;
    top: calc(var(--liger-sticky-top) + (var(--i, 0) * var(--liger-header-stuck-h)));
    /* Descending, so a header never covers one already parked above it, and the
       gene header's suggestion dropdown stays over everything below. Stays under
       the drawer backdrop (20) and the floating tooltips. */
    z-index: calc(14 - var(--i, 0));
    box-sizing: border-box;
    height: var(--liger-header-h);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 0 20px;
    background: rgba(255, 255, 255, .95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #e6e8ee;
    cursor: pointer;
}
/* Parked headers give a little height back, so a five-deep stack costs 210px of
   viewport rather than 250. There is no :stuck selector in CSS, so the class is
   set from measurement - see updateStuckSections. */
.liger-section-header.stuck{
    height: var(--liger-header-stuck-h);
}
.liger-section-header.stuck .section-kicker{
    font-size: 13px;
}
.liger-section-header.stuck .section-value{
    font-size: 14px;
}
.liger-section-header.stuck .section-meta{
    font-size: 11px;
}
/* The gene header opens the sheet, so its divider would double the container
   border. Its anchor is the first child, which is why this reads one step in. */
.liger-sections > .section-anchor:first-child + .liger-section-header{
    border-top: 0;
}
.section-crumb{
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
}
.section-kicker{
    transition: font-size .12s ease;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: #6b7688;
    white-space: nowrap;
}
.section-kicker::after{
    content: ":";
}
/* Fixed width so the kickers line up whichever glyph is showing. */
.section-icon{
    display: inline-block;
    width: 14px;
    margin-right: 6px;
    font-size: 11px;
    letter-spacing: normal;
    text-align: center;
    color: #98a2b3;
}
/* Deliberately larger than .bar-grid-header (1.1em): the header names what you
   picked, the grid header only labels a column. */
.section-value{
    transition: font-size .12s ease;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.2;
    color: #16324f;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
/* An unmade choice is prompt text, not a value - it should not read as a
   selection that happens to be named "Select a tissue". */
.section-value.placeholder{
    font-weight: 400;
    font-style: italic;
    color: #9aa4b5;
}
/* The count standing in for a selection: muted, so it does not read as one. */
.section-value.as-meta{
    font-weight: 400;
    color: #6b7688;
    font-style: italic;
}
.section-meta{
    display: flex;
    align-items: baseline;
    gap: 14px;
    font-size: 14px;
    color: #6b7688;
    white-space: nowrap;
}
.liger-section-body{
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 25px 30px 30px;
    background: #f5f5f5;
    box-shadow: inset 0 10px 10px -10px rgba(0, 0, 0, 0.5);
}
/* Enough height for the "select a tissue" overlay to land on before any rows
   have loaded. */
.liger-section-body.tall{
    min-height: 180px;
}
/* The lede describes what the section is, which is exactly what a reader needs
   while the loading overlay is up - so it sits above the overlay rather than
   being greyed out by it, and below the sticky header so it scrolls under it
   cleanly. */
.section-lede-row{
    position: relative;
    z-index: 5;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 20px;
}
.section-lede{
    font-size: 1.1em;
}
.liger-section-body .card-overlay{
    z-index: 4;
}
/* The page scroll is what the sticky headers ride on, so these lists grow to
   their content instead of scrolling inside a fixed-height panel - an inner
   scrollbar would leave the headers nothing to stick against. */
.liger-section-body .scroll-panel{
    max-height: none;
    overflow: visible;
}
/* Full-width sections would stretch the bar tracks across the whole sheet,
   which makes the fixed axis harder to read rather than easier. */
.bar-block{
    /*max-width: 1100px;*/
}
.chip-row{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
#liger .chip{
    padding: 5px 14px;
    border: 1px solid #d7dce6;
    background: white;
    color: #4e4e4e;
}
#liger .chip:hover{
    background: #eef2f7;
}
#liger .chip.selected{
    background: var(--blue);
    border-color: var(--blue);
    color: white;
}
.count{
    font-weight: normal;
}

.pill {
    display: inline-flex;
    position: relative;
    margin: 0 3px;
    z-index: 1;
}
.pill:before {
    content: '';
    background: gold;
    width: 110%;
    height: 100%;
    position: absolute;
    transform: translate(-5%, 0);
    z-index: -1;
    border-radius: .5rem;
}
</style>
