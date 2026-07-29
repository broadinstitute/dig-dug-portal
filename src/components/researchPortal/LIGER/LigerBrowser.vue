<script>
import Vue from "vue";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

const LIGER_FORCE_DEV_BIOINDEX = false; //change this flag to TRUE to force use of bioindex-dev in all cases
const LIGER_DEV_BIOINDEX_HOST = "https://bioindex-dev.hugeamp.org";
const LIGER_LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "0.0.0.0"];
const LIGER_RUNTIME_HOSTNAME = typeof window !== "undefined" ? window.location.hostname : "";
const LIGER_USE_DEV_BIOINDEX = LIGER_FORCE_DEV_BIOINDEX || LIGER_LOCAL_HOSTNAMES.includes(LIGER_RUNTIME_HOSTNAME);
const LIGER_RESOLVED_BIOINDEX_HOST = LIGER_USE_DEV_BIOINDEX ? LIGER_DEV_BIOINDEX_HOST : BIO_INDEX_HOST;
const LIGER_API_HOST = LIGER_RESOLVED_BIOINDEX_HOST;
const LIGER_PROGRAM_MODEL = "mouse_msigdb";
const LIGER_DEFAULT_CONFIG = {
    pageTitle: "Cell State & Program Explorer",
    documentationUrl: "/research.html?pageid=kp_liger_documentation",
    tissues: [],
    hideTissueCardIfOneOption: false,
};
// Keep this code-level toggle in place so we can quickly compare raw API traits
// versus portal-labeled traits without introducing UI controls yet.
const LIGER_FILTER_UNLABELED_HEATMAP_TRAITS = true;
const LIGER_TISSUE_CONFIG = {
    artery: {
        label: "Artery",
        datasetId: "FNIH_Artery_scRNA_v2.2",
    },
    heart: {
        label: "Heart",
        datasetId: "FNIH_Heart_scRNA_v3.2",
    },
    hypothalamus: {
        label: "Hypothalamus",
        datasetId: "FNIH_Hypothalamus_scRNA_v2.2"
    },
    kidney: {
        label: "Kidney",
        datasetId: "FNIH_Kidney_scRNA_v2.2"
    },
    liver: {
        label: "Liver",
        datasetId: "FNIH_Liver_scRNA_v3.2",
    },
    muscle: {
        label: "Muscle",
        datasetId: "FNIH_Muscle_scRNA_v2.2",
    },
    pancreas: {
        label: "Pancreas",
        datasetId: "FNIH_Pancreas_scRNA_v2.2",
    },
    sat: {
        label: "SAT",
        datasetId: "FNIH_SAT_scRNA_v2.2",
    },
    vat: {
        label: "VAT",
        datasetId: "FNIH_VAT_scRNA_v2.2",
    }
};

const LIGER_DATASET_TISSUE_MAP = Object.keys(LIGER_TISSUE_CONFIG).reduce((map, tissueKey) => {
    let datasetId = LIGER_TISSUE_CONFIG[tissueKey].datasetId;
    if (datasetId) {
        map[datasetId] = tissueKey;
    }
    return map;
}, {});

export default Vue.component('LigerBrowser', {
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
            selectedTissue: null,
            cellTypeExpressionRows: [],
            selectedCellType: null,
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
            showAllProgramQcBadges: false,
            showAllProgramGeneSets: false,
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
                x: 0,
                y: 0,
                side: "right",
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
        absoluteExpressionTooltip() {
            return "Absolute expression is log10(CP10K + 1), where CP10K is gene counts normalized per 10,000 total cell counts and averaged within the cell type.";
        },
        specificityTooltip() {
            return "Specificity is log2 fold-change of the cell-type mean expression versus the other cell types in the tissue.";
        },
        aiSuggestedLabelTooltip() {
            return "AI was used to generate this program label. See rationale for more detail.";
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
            let range = this.metricRange(this.cellTypeExpressionRows, (row) => this.absoluteExpressionValue(row));

            return this.cellTypeExpressionRows
                .map((row) => {
                    let expression = this.expressionValue(row);
                    let width = this.barWidth(this.absoluteExpressionValue(row), range);

                    return {
                        key: this.cellTypeKey(row),
                        label: this.cellTypeLabel(row),
                        expression: this.formatMetric(expression),
                        expressionWidth: `${width}%`,
                        abs: this.formatMetric(this.absoluteExpressionValue(row)),
                        spec: this.formatMetric(this.specificityValue(row)),
                        row,
                    };
                })
                .sort((a, b) => this.expressionValue(b.row) - this.expressionValue(a.row));
        },
        cellStateExpressionList() {
            return this.toExpressionList(this.cellStateExpressionRows, "state");
        },
        geneProgramExpressionList() {
            return this.toExpressionList(this.programExpressionRows, "program");
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
        relationshipHeatmapMeta() {
            let heatmap = this.relationshipHeatmapDisplay;

            if (!heatmap.programCount || !heatmap.stateCount) {
                return "No relationships loaded";
            }

            return `${heatmap.programCount} programs x ${heatmap.stateCount} states`;
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
        traitHeatmapMeta() {
            let groupCount = this.traitHeatmapDisplay.groupRows.length;
            let traitCount = this.traitHeatmapDisplay.groupRows.reduce((sum, group) => {
                return sum + group.traits.length;
            }, 0);
            let columnCount = this.availableTraitColumns.length;

            if (!traitCount || !columnCount) {
                return "No trait links loaded";
            }

            return `${traitCount} traits in ${groupCount} groups x ${columnCount} state/program columns`;
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

    beforeDestroy() {
        if (this.geneSuggestionTimer) {
            clearTimeout(this.geneSuggestionTimer);
        }
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

                if (query.cell_state && this.selectedCellType) {
                    await this.openStateDrawer(query.cell_state, this.stateMetadataById[query.cell_state] || this.cellStateExpressionRows.find((row) => this.stateKey(row) === query.cell_state));
                } else if (query.gene_program && this.selectedCellType) {
                    await this.openProgramDrawer(query.gene_program, this.geneProgramInfoById[query.gene_program] || this.programExpressionRows.find((row) => this.programKey(row) === query.gene_program));
                }
            } finally {
                this.syncQueryParams({
                    gene: this.selectedGene || "",
                    tissue: this.selectedTissue ? this.tissueKeyFromLabel(this.selectedTissue) : "",
                    cell_type: this.selectedCellType ? this.selectedCellType.key : "",
                    cell_state: this.drawerOpen && this.drawerContent && this.drawerContent.type === "state" ? this.drawerTargetId : "",
                    gene_program: this.drawerOpen && this.drawerContent && this.drawerContent.type === "program" ? this.drawerTargetId : "",
                }, { replace: true });
                this.isHydratingFromQuery = false;
            }
        },
        buildMatchUrl(queryValue) {
            return `${LIGER_API_HOST}/api/bio/match/gene?q=${encodeURIComponent(queryValue)}`;
        },
        buildCellStateExpressionUrl(gene) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-expression-cell-state?q=${encodeURIComponent(gene)}`;
        },
        buildProgramExpressionUrl(gene) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-expression-program?q=${encodeURIComponent(gene)}`;
        },
        buildCellTypeExpressionUrl(tissue, gene) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-expression-cell-type?q=${encodeURIComponent(`${tissue},${gene}`)}`;
        },
        buildCellStateSectionExpressionUrl(tissue, cellType, gene) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-expression-cell-state?q=${encodeURIComponent(`${tissue},${cellType},${gene}`)}`;
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
        buildRelationshipHeatmapUrl(tissue, cellType) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-heatmap?q=${encodeURIComponent(`${tissue},${cellType}`)}`;
        },
        buildTraitPhenotypesUrl() {
            return `${LIGER_RESOLVED_BIOINDEX_HOST}/api/portal/phenotypes?q=md`;
        },
        buildCellStateTraitUrl(tissue, cellType, stateId) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-cell-state-trait-factor?q=${encodeURIComponent(`${tissue},${cellType},${stateId}`)}`;
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
            return tissueKey ? LIGER_TISSUE_CONFIG[tissueKey].datasetId : null;
        },
        tissueLabel(row) {
            let tissue = this.field(row, ["tissue_label", "tissue"]);
            if (tissue) {
                let normalizedTissue = this.normalizeKey(tissue);
                if (LIGER_TISSUE_CONFIG[normalizedTissue]) {
                    return LIGER_TISSUE_CONFIG[normalizedTissue].label;
                }
                return this.formatDisplayLabel(tissue);
            }

            let datasetId = this.field(row, ["dataset_id", "dataset"]);
            if (datasetId && LIGER_DATASET_TISSUE_MAP[datasetId]) {
                return LIGER_TISSUE_CONFIG[LIGER_DATASET_TISSUE_MAP[datasetId]].label;
            }

            return "";
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
        expressionValue(row) {
            return this.numericField(row, [
                "log10_cpk",
                "log10_cp10k",
                "log1p_mean_cp10k",
                "log1p_weighted_mean_cp10k",
            ]);
        },
        absoluteExpressionValue(row) {
            return this.numericField(row, [
                "log10_cpk",
                "log10_cp10k",
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
        metricRange(rows = [], valueFn) {
            let values = rows
                .map((row) => valueFn(row))
                .filter((value) => Number.isFinite(value));

            if (!values.length) {
                return { min: 0, max: 1 };
            }

            let minValue = Math.min(...values);
            let maxValue = Math.max(...values);

            if (minValue === maxValue) {
                return { min: minValue, max: minValue + 1 };
            }

            return { min: minValue, max: maxValue };
        },
        barWidth(value, range) {
            if (!Number.isFinite(value)) {
                return 8;
            }

            let minValue = range && Number.isFinite(range.min) ? range.min : 0;
            let maxValue = range && Number.isFinite(range.max) ? range.max : 1;
            let denominator = maxValue - minValue;

            if (denominator <= 0) {
                return 100;
            }

            let normalized = ((value - minValue) / denominator) * 100;
            return Math.max(8, Math.min(100, normalized));
        },
        toExpressionList(rows = [], kind) {
            let range = this.metricRange(rows, (row) => this.absoluteExpressionValue(row));

            return rows
                .map((row) => {
                    let expression = this.expressionValue(row);
                    let absoluteExpression = this.absoluteExpressionValue(row);
                    let width = this.barWidth(absoluteExpression, range);
                    let key = kind === "state" ? this.stateKey(row) : this.programKey(row);
                    let label = kind === "state" ? this.stateLabel(row) : this.programLabel(row);

                    return {
                        key,
                        label,
                        expression: this.formatMetric(expression),
                        expressionWidth: `${width}%`,
                        abs: this.formatMetric(absoluteExpression),
                        spec: this.formatMetric(this.specificityValue(row)),
                        row,
                    };
                })
                .filter((row) => !!row.key)
                .sort((a, b) => this.expressionValue(b.row) - this.expressionValue(a.row));
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
                { label: "Description", value: this.stateDescription(metadataRow) || "No description available." },
                { label: "Marker Genes", value: this.joinDisplayList(markerGenes), items: markerGenes },
            ];
        },
        programTooltipColumns(program) {
            let infoRow = this.geneProgramInfoById[program.key] || program.row || {};
            let topGenes = this.extractGenes(infoRow, ["top_genes", "genes", "gene_symbols"]);

            return [
                { label: "Gene Program", value: program.label || this.programLabel(infoRow) || "Not available" },
                { label: "Description", value: this.programDescription(infoRow) || "No description available." },
                { label: "Top Genes", value: this.joinDisplayList(topGenes), items: topGenes },
            ];
        },
        isDrawerTarget(kind, id) {
            return this.drawerOpen &&
                this.drawerContent &&
                this.drawerContent.type === kind &&
                this.drawerTargetId === id;
        },
        showExpressionRowTooltip(event, kind, item) {
            if (!event || !event.currentTarget || !item) {
                this.hideExpressionRowTooltip();
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
            let tooltipWidth = 430;
            let tooltipHeight = 220;
            let gap = 14;
            let viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
            let viewportHeight = typeof window !== "undefined" ? window.innerHeight : 900;
            let preferredX = kind === "state" ? rect.right + gap : rect.left - tooltipWidth - gap;
            let preferredY = rect.top + (rect.height / 2) - (tooltipHeight / 2);

            this.floatingExpressionTooltip.visible = true;
            this.floatingExpressionTooltip.columns = columns;
            this.floatingExpressionTooltip.side = kind === "state" ? "right" : "left";
            this.floatingExpressionTooltip.x = Math.max(12, Math.min(viewportWidth - tooltipWidth - 12, preferredX));
            this.floatingExpressionTooltip.y = Math.max(12, Math.min(viewportHeight - tooltipHeight - 12, preferredY));
        },
        hideExpressionRowTooltip() {
            this.floatingExpressionTooltip.visible = false;
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
        collapsedProgramQcBadgeCount(badges = []) {
            let goodCount = 0;

            for (let i = 0; i < badges.length; i++) {
                if (badges[i] && badges[i].tone === "good") {
                    goodCount += 1;

                    if (goodCount === 2) {
                        return i + 1;
                    }
                }
            }

            return badges.length;
        },
        visibleProgramQcBadges(badges = []) {
            if (this.showAllProgramQcBadges) {
                return badges;
            }

            return badges.slice(0, this.collapsedProgramQcBadgeCount(badges));
        },
        hiddenProgramQcBadgeCount(badges = []) {
            return Math.max(0, badges.length - this.visibleProgramQcBadges(badges).length);
        },
        visibleProgramGeneSetRows(rows = []) {
            if (this.showAllProgramGeneSets) {
                return rows;
            }

            return rows.slice(0, 25);
        },
        hiddenProgramGeneSetRowCount(rows = []) {
            return Math.max(0, rows.length - this.visibleProgramGeneSetRows(rows).length);
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
                let payload = await this.fetchJson(this.buildCellStateTraitUrl(tissueKey, this.selectedCellType.key, stateId));
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
            this.showAllProgramQcBadges = false;
            this.showAllProgramGeneSets = false;
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
            this.showAllProgramQcBadges = false;
            this.showAllProgramGeneSets = false;
            this.syncQueryParams({
                cell_state: "",
                gene_program: "",
            });
        },
        async openStateDrawer(stateId, fallbackRow) {
            let resolution = this.resolveStateDetail(stateId, fallbackRow);
            let label = this.resolvedStateLabel(resolution);

            this.openDrawerShell("Curated state", label, this.stateDrawerBadges(resolution));
            this.drawerTargetId = resolution.stateId;

            await this.ensurePhenotypeTraitRows();
            let stateTraitRows = await this.getStateTraitRows(resolution.stateId);
            let markerDetail = this.stateMarkerDetail(resolution);
            let referenceDetail = this.stateReferenceDetail(resolution);
            this.drawerContent = {
                type: "state",
                summaryDescription: this.resolvedStateDescription(resolution) || "A curated marker-defined cell state. Use expression and program overlap to assess whether a gene or factor maps to this state.",
                summaryFields: [
                    { label: "State ID", value: resolution.stateId },
                    { label: "Tissue", value: this.nestedValue(resolution.detail, ["tissue", "label"]) || this.field(resolution.fallback, ["tissue_label", "tissue"]) || this.selectedTissue },
                    { label: "Cell type", value: this.nestedValue(resolution.detail, ["cell_type", "label"]) || this.field(resolution.fallback, ["cell_type_label", "cell_type", "annotated_cell_type"]) || (this.selectedCellType && this.selectedCellType.label) },
                ].filter((row) => row.value),
                interpretationRows: this.stateInterpretationRows(resolution),
                markerDetail,
                referenceDetail,
                relatedPrograms: this.relatedProgramsForState(resolution.stateId),
                traitRows: this.topTraitRows(stateTraitRows),
            };

            this.syncQueryParams({
                cell_state: resolution.stateId,
                gene_program: "",
            });
            this.drawerLoading = false;
        },
        async openProgramDrawer(programId, fallbackRow) {
            let meta = Object.assign({}, fallbackRow || {}, this.geneProgramInfoById[programId] || {});
            let quality = this.field(meta, ["suggested_program_quality_class", "quality_class", "release_recommendation", "qc_recommendation"]) || this.inferredProgramQuality(programId);
            let label = this.field(meta, ["suggested_program_label", "program_label", "label"]) || this.inferredProgramLabel(programId);
            let curatedMatches = this.curatedStateMatchesForProgram(programId);
            let qcMatches = this.qcMatchesForProgram(programId);
            await this.ensureQcMetadataRows();
            let programQcRows = await this.getProgramQcRows(programId);

            this.openDrawerShell("Inferred program", label, this.programDrawerBadges(programId, quality, programQcRows, qcMatches));
            this.drawerTargetId = programId;

            await this.ensurePhenotypeTraitRows();
            let [programGeneRows, programTraitRows, programGeneSetRows] = await Promise.all([
                this.getProgramGeneRows(programId),
                this.getProgramTraitRows(programId),
                this.getProgramGeneSetRows(programId),
            ]);

            this.drawerContent = {
                type: "program",
                summaryText: this.programSummaryText(programId, curatedMatches, quality),
                summaryFields: [
                    { label: "Program ID", value: this.programApiFactor(programId) },
                    { label: "Suggested label", value: label },
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

            this.syncQueryParams({
                cell_state: "",
                gene_program: programId,
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
            this.selectedTissue = null;
            this.cellTypeExpressionRows = [];
            this.selectedCellType = null;
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
            this.selectedCellType = null;
            this.viewStateInfo = false;
            this.viewProgramInfo = false;
            this.isLoadingCellTypes = false;
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
        collectTissues(rows = []) {
            return rows
                .map((row) => this.tissueLabel(row))
                .filter((value) => !!value)
                .filter((value) => this.tissueAllowed(value));
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
                let payload = await this.fetchJson(this.buildCellTypeExpressionUrl(tissue, this.selectedGene));
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
                    this.fetchJson(this.buildCellStateSectionExpressionUrl(tissueKey, cellType.key, this.selectedGene)),
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
                let payload = await this.fetchJson(this.buildRelationshipHeatmapUrl(tissueKey, cellType.key));
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
                                ? await this.fetchJson(this.buildCellStateTraitUrl(tissueKey, cellType.key, column.id))
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
                    <a :href="documentationUrl" target="_blank">Read Documentation</a>
                </div>
                <div class="f-col align-v-bottom flex1 g-5">
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
            <div class="f-row spread-out g-40">
                <div class="ai-disclosure flex1">
                    <span class="bold">Note:</span> this resource uses AI-assisted curation of program names and cell states; manual review and curation are ongoing. Please see cell state and program metadata for details.
                </div>
                <div class="flex1">&nbsp;</div>
            </div>
        </div>
        <div v-if="selectedGene && availableTissues.length" id="liger-body" class="f-col g-40">
            <div class="flex1">
                <h4 class="bold">Where is <span class="pill">{{ selectedGene }}</span>{{ expressionSectionTitleSuffix }}</h4>
                <div class="subtitle">See gene expression per tissue by cell type, cell states, and gene programs.</div>
            </div>
            <div class="f-col g-40">
                <div class="f-row g-20">
                    <div v-if="!shouldHideTissueCard" class="f-col g-5 flex1">
                        <div class="f-row g-5">
                            <h5 class="bold">Tissues</h5>
                            <span class="count">({{ tissueCount }})</span>
                        </div>
                        <div class="section-card f-col g-10">
                            <div class="scroll-panel">
                                <div class="options f-col g-5">
                                    <div v-if="isLoadingGeneData" class="empty-state">
                                        Loading tissues...
                                    </div>
                                    <div v-if="!isLoadingGeneData && !availableTissues.length" class="empty-state">
                                        No tissues available yet for this gene.
                                    </div>
                                    <div v-for="tissue in availableTissues" 
                                        :key="tissue" 
                                        class="grid-item"
                                        :class="{selected: selectedTissue === tissue}"
                                        @click="selectTissue(tissue)"
                                    >
                                        {{tissue}}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="f-col g-5 flex1">
                        <div class="f-row g-5">
                            <h5 class="bold">Cell Types</h5>
                            <span class="count" v-if="cellTypeCount>0">({{ cellTypeCount }})</span>
                        </div>
                        <div class="section-card relative">
                            <div v-if="!selectedTissue && !isLoadingCellTypes"
                                class="card-overlay"
                            >
                                <div><span class="shout">Select a Tissue</span> to see expression by Cell Type</div>
                            </div>
                            <div v-if="isLoadingCellTypes" class="card-overlay">
                                <div>Loading cell types...</div>
                            </div>
                            <div class="f-row g-20">
                                <div class="f-col flex1">
                                    <div class="bar-grid-header">
                                        <div class="bold">Cell Type</div>
                                        <div class="bold">Expression</div>
                                        <div class="bold text-right">
                                            <span class="metric-tooltip">
                                                <span class="metric-tooltip-label">ABS</span>
                                                <span class="metric-tooltip-bubble">{{ absoluteExpressionTooltip }}</span>
                                            </span>
                                        </div>
                                        <div class="bold text-right">
                                            <span class="metric-tooltip">
                                                <span class="metric-tooltip-label">SPEC</span>
                                                <span class="metric-tooltip-bubble">{{ specificityTooltip }}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div class="scroll-panel f-col g-5" @scroll="hideExpressionRowTooltip">
                                        <div v-if="cellTypeLoadError" class="empty-state">
                                            {{ cellTypeLoadError }}
                                        </div>
                                        <div
                                            v-for="cellType in availableCellTypes" 
                                            :key="cellType.key" 
                                            class="bar-grid-item grid-item"
                                            :class="{selected: selectedCellType && selectedCellType.key === cellType.key}"
                                            @click="selectCellType(cellType)"
                                        >
                                            <div class="bar-label">{{cellType.label}}</div>
                                            <div class="bar-cell">
                                                <div class="bar-track">
                                                    <div
                                                        class="bar-fill"
                                                        :style="{ width: cellType.expressionWidth }"
                                                    ></div>
                                                </div>
                                            </div>
                                            <div class="text-right">{{cellType.abs}}</div>
                                            <div class="text-right">{{cellType.spec}}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="f-col g-20">
                    <div class="f-row g-20">
                        <div class="f-col g-10 flex1">
                            <div class="f-col">
                                <div class="f-row spread-out">
                                    <div class="f-row g-5">
                                        <h5 class="bold">Cell States</h5>
                                        <span class="count"  v-if="cellStateCount>0">({{ cellStateCount }})</span>
                                    </div>
                                    <!--
                                    <button v-if="selectedCellType"
                                        @click="viewStateInfo=!viewStateInfo"
                                    >
                                        Show {{ viewStateInfo ? 'Expression': 'Info'}}
                                    </button>
                                    -->
                                </div>
                                <div class="f-row spread-out g-10 align-v-bottom">
                                    <div class="subtitle-2">Cell states are curated, marker-defined biology.</div>
                                    <div v-if="selectedCellType" class="also">Hover row for info</div>
                                </div>
                            </div>
                            <div class="section-card flex1 relative">
                                <div v-if="!selectedCellType && !isLoadingCellStateSection"
                                    class="card-overlay"
                                >
                                    <div><span class="shout">Select a Cell Type</span> to see expression by Curated Cell State</div>
                                </div>
                                <div v-if="isLoadingCellStateSection" class="card-overlay">
                                    <div>Loading cell states...</div>
                                </div>
                                <div v-if="selectedCellType && !viewStateInfo" class="expression f-col flex1">
                                    <div class="bar-grid-header">
                                        <div class="bold">Cell State</div>
                                        <div class="bold">Expression</div>
                                        <div class="bold text-right">
                                            <span class="metric-tooltip">
                                                <span class="metric-tooltip-label">ABS</span>
                                                <span class="metric-tooltip-bubble">{{ absoluteExpressionTooltip }}</span>
                                            </span>
                                        </div>
                                        <div class="bold text-right">
                                            <span class="metric-tooltip">
                                                <span class="metric-tooltip-label">SPEC</span>
                                                <span class="metric-tooltip-bubble">{{ specificityTooltip }}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div class="scroll-panel f-col g-5" @scroll="hideExpressionRowTooltip">
                                        <div v-if="cellStateSectionError" class="empty-state">
                                            {{ cellStateSectionError }}
                                        </div>
                                        <div
                                            v-for="cellState in cellStateExpressionList"
                                            :key="cellState.key"
                                            class="bar-grid-item grid-item"
                                            :class="{ selected: isDrawerTarget('state', cellState.key) }"
                                            @mouseenter="showExpressionRowTooltip($event, 'state', cellState)"
                                            @mousemove="showExpressionRowTooltip($event, 'state', cellState)"
                                            @mouseleave="hideExpressionRowTooltip"
                                            @click="openStateDrawer(cellState.key, cellState.row)"
                                        >
                                            <div class="bar-label">{{cellState.label}}</div>
                                            <div class="bar-cell">
                                                <div class="bar-track">
                                                    <div
                                                        class="bar-fill"
                                                        :style="{ width: cellState.expressionWidth }"
                                                    ></div>
                                                </div>
                                            </div>
                                            <div class="text-right">{{cellState.abs}}</div>
                                            <div class="text-right">{{cellState.spec}}</div>
                                        </div>
                                    </div>
                                </div>
    
                                <div v-else-if="selectedCellType" class="info f-col flex1">
                                    <div class="info-grid">
                                        <div class="bold">Cell State</div>
                                        <div class="bold">Description</div>
                                        <div class="bold">Marker Genes</div>
                                    </div>
                                    <div class="scroll-panel f-col g-5">
                                        <div v-if="cellStateSectionError" class="empty-state">
                                            {{ cellStateSectionError }}
                                        </div>
                                        <div
                                            v-for="cellState in cellStateInfoList"
                                            :key="cellState.key"
                                            class="info-grid grid-item"
                                            :class="{ selected: isDrawerTarget('state', cellState.key) }"
                                            @click="openStateDrawer(cellState.key, stateMetadataById[cellState.key])"
                                        >
                                            <div>{{cellState.label}}</div>
                                            <div class="info-description">{{cellState.description}}</div>
                                            <div class="info-genes"><span class="info-gene" v-for="gene in cellState.genes.split(',')">{{gene.trim()}}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="f-col g-10 flex1">
                            <div class="f-col">
                                <div class="f-row spread-out">
                                    <div class="f-row g-5">
                                        <h5 class="bold">Gene Programs</h5>
                                    <span class="count" v-if="geneProgramCount>0">({{ geneProgramCount }})</span>
                                    </div>
                                    <!--
                                    <button v-if="selectedCellType"
                                        @click="viewProgramInfo=!viewProgramInfo"
                                    >
                                        Show {{ viewProgramInfo ? 'Expression': 'Info'}}
                                    </button>
                                    -->
                                </div>
                                <div class="f-row spread-out g-10 align-v-bottom">
                                    <div class="subtitle-2">Gene programs are data-driven, computationally inferred latent factors.</div>
                                    <div v-if="selectedCellType" class="also">Hover row for info</div>
                                </div>
                            </div>
                            <div class="section-card  flex1 relative">
                                <div v-if="!selectedCellType && !isLoadingGeneProgramSection"
                                    class="card-overlay"
                                >
                                    <div><span class="shout">Select a Cell Type</span> to see expression by Inferred Gene Program</div>
                                </div>
                                <div v-if="isLoadingGeneProgramSection" class="card-overlay">
                                    <div>Loading gene programs...</div>
                                </div>
                                <div v-if="selectedCellType && !viewProgramInfo" class="expression f-col flex1">
                                    <div class="bar-grid-header">
                                        <div class="bold">Gene Program</div>
                                        <div class="bold">Expression</div>
                                        <div class="bold text-right">
                                            <span class="metric-tooltip">
                                                <span class="metric-tooltip-label">ABS</span>
                                                <span class="metric-tooltip-bubble">{{ absoluteExpressionTooltip }}</span>
                                            </span>
                                        </div>
                                        <div class="bold text-right">
                                            <span class="metric-tooltip">
                                                <span class="metric-tooltip-label">SPEC</span>
                                                <span class="metric-tooltip-bubble">{{ specificityTooltip }}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div class="scroll-panel  f-col g-5" @scroll="hideExpressionRowTooltip">
                                        <div v-if="geneProgramSectionError" class="empty-state">
                                            {{ geneProgramSectionError }}
                                        </div>
                                        <div
                                            v-for="program in geneProgramExpressionList"
                                            :key="program.key"
                                            class="bar-grid-item grid-item"
                                            :class="{ selected: isDrawerTarget('program', program.key) }"
                                            @mouseenter="showExpressionRowTooltip($event, 'program', program)"
                                            @mousemove="showExpressionRowTooltip($event, 'program', program)"
                                            @mouseleave="hideExpressionRowTooltip"
                                            @click="openProgramDrawer(program.key, program.row)"
                                        >
                                            <div class="bar-label">{{program.label}}</div>
                                            <div class="bar-cell">
                                                <div class="bar-track">
                                                    <div
                                                        class="bar-fill"
                                                        :style="{ width: program.expressionWidth }"
                                                    ></div>
                                                </div>
                                            </div>
                                            <div class="text-right">{{program.abs}}</div>
                                            <div class="text-right">{{program.spec}}</div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else-if="selectedCellType" class="info f-col flex1">
                                    <div class="info-grid">
                                        <div class="bold">Gene Program</div>
                                        <div class="bold">Description</div>
                                        <div class="bold">Top Genes</div>
                                    </div>
                                    <div class="scroll-panel  f-col g-5" @scroll="hideExpressionRowTooltip">
                                        <div v-if="geneProgramSectionError" class="empty-state">
                                            {{ geneProgramSectionError }}
                                        </div>
                                        <div
                                            v-for="program in geneProgramInfoList"
                                            :key="program.key"
                                            class="info-grid grid-item"
                                            :class="{ selected: isDrawerTarget('program', program.key) }"
                                            @click="openProgramDrawer(program.key, geneProgramInfoById[program.key])"
                                        >
                                            <div>{{program.label}}</div>
                                            <div class="info-description">{{program.description}}</div>
                                            <div class="info-genes"><span class="info-gene" v-for="gene in program.genes.split(',')">{{gene.trim()}}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="f-col g-20">
                    <div>
                        <h4 class="bold">Relationships between states and programs</h4>
                        <div class="subtitle">Explore genetic correlations between known cell states and inferred gene programs for potentially novel connections.</div>
                    </div>
                    <div class="section-card f-col g-10 relative">
                        <div v-if="!selectedCellType && !isLoadingRelationshipHeatmap"
                            class="card-overlay"
                        >
                            <div><span class="shout">Select a Cell Type</span> to see relationships</div>
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
                                    {{ relationshipHeatmapMeta }} |
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
                            Select a cell type to load relationships.
                        </div>
                    </div>
                </div>
                <div class="f-col g-20">
                    <div>
                        <h4 class="bold">Genetically supported links of states and programs to human traits</h4>
                        <div class="subtitle">See which curated states and inferred programs connect to human traits.</div>
                    </div>
                    <div class="section-card f-col g-10 relative">
                        <div v-if="!selectedCellType && !isLoadingTraitHeatmap"
                            class="card-overlay"
                        >
                            <div><span class="shout">Select a Cell Type</span> to see trait links</div>
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
                                    {{ traitHeatmapMeta }} |
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
                            Select a cell type to load trait links.
                        </div>
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
            class="floating-expression-tooltip"
            :class="`side-${floatingExpressionTooltip.side}`"
            :style="{ left: `${floatingExpressionTooltip.x}px`, top: `${floatingExpressionTooltip.y}px` }"
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
                <div v-if="drawerLoading" class="empty-state">Loading details...</div>

                <template v-else-if="drawerContent && drawerContent.type === 'state'">
                    <div class="drawer-panel">
                        <h3>What this state represents</h3>
                        <p>{{ drawerContent.summaryDescription }}</p>
                        <dl class="drawer-field-grid">
                            <template v-for="field in drawerContent.summaryFields">
                                <dt :key="`${field.label}-dt`">{{ field.label }}</dt>
                                <dd :key="`${field.label}-dd`">{{ field.value }}</dd>
                            </template>
                        </dl>
                    </div>

                    <div class="drawer-panel">
                        <h3>What this means for your gene</h3>
                        <dl v-if="drawerContent.interpretationRows.length" class="drawer-field-grid">
                            <template v-for="field in drawerContent.interpretationRows">
                                <dt :key="`${field.label}-dt`">{{ field.label }}</dt>
                                <dd :key="`${field.label}-dd`">{{ field.value }}</dd>
                            </template>
                        </dl>
                        <div v-else class="empty-state">No interpretation metadata available.</div>
                    </div>

                    <div class="drawer-panel">
                        <h3>Marker genes</h3>
                        <div v-if="drawerContent.markerDetail.markers.length" class="drawer-marker-list">
                            <span
                                v-for="gene in drawerContent.markerDetail.markers"
                                :key="gene"
                                class="drawer-marker"
                            >
                                {{ gene }}
                            </span>
                        </div>
                        <div v-else class="empty-state">No marker genes returned.</div>
                        <details v-if="drawerContent.markerDetail.provenance.length" class="drawer-details">
                            <summary>Show marker provenance</summary>
                            <div class="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Gene</th>
                                            <th>Role</th>
                                            <th>Evidence</th>
                                            <th>Marker notes</th>
                                            <th>Source type</th>
                                            <th>Citations</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="row in drawerContent.markerDetail.provenance" :key="`${row.gene}-${row.role}`">
                                            <td>{{ row.gene }}</td>
                                            <td>{{ row.role }}</td>
                                            <td>{{ row.evidence }}</td>
                                            <td>{{ row.notes }}</td>
                                            <td>{{ row.sourceType }}</td>
                                            <td>{{ row.citations }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    </div>

                    <div class="drawer-panel">
                        <h3>Curation and references</h3>
                        <dl v-if="drawerContent.referenceDetail.curationRows.length" class="drawer-field-grid">
                            <template v-for="field in drawerContent.referenceDetail.curationRows">
                                <dt :key="`${field.label}-dt`">{{ field.label }}</dt>
                                <dd :key="`${field.label}-dd`">{{ field.value }}</dd>
                            </template>
                        </dl>
                        <ul v-if="drawerContent.referenceDetail.references.length" class="drawer-reference-list">
                            <li v-for="reference in drawerContent.referenceDetail.references" :key="reference.label">
                                <a v-if="reference.url" :href="reference.url" target="_blank" rel="noreferrer">{{ reference.label }}</a>
                                <span v-else>{{ reference.label }}</span>
                                <span v-if="reference.suffix" class="drawer-reference-suffix">({{ reference.suffix }})</span>
                            </li>
                        </ul>
                        <div v-else class="empty-state">No state-level citations available.</div>
                    </div>

                    <div v-if="drawerContent.relatedPrograms.length" class="drawer-panel">
                        <h3>Related programs with GSEA P &lt; 0.05</h3>
                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Program</th>
                                        <th>GSEA P</th>
                                        <th>GSEA Q</th>
                                        <th>Cell coactivity</th>
                                        <th>Match score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="row in drawerContent.relatedPrograms"
                                        :key="row.programId"
                                        class="clickable-cell"
                                        @click="openProgramDrawer(row.programId, row.row)"
                                    >
                                        <td>{{ row.programLabel }}</td>
                                        <td>{{ formatPValue(row.gseaP) }}</td>
                                        <td>{{ formatPValue(row.gseaQ) }}</td>
                                        <td>{{ formatMetric(row.coactivity) }}</td>
                                        <td>{{ formatMetric(row.matchScore) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="drawer-panel">
                        <h3>Human genetic trait anchors</h3>
                        <div v-if="drawerContent.traitRows.length" class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Trait</th>
                                        <th>Joint beta</th>
                                        <th>Marginal beta</th>
                                        <th>Method</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in drawerContent.traitRows" :key="row.trait">
                                        <td>{{ row.trait }}</td>
                                        <td>{{ formatMetric(row.beta) }}</td>
                                        <td>{{ formatMetric(row.betaUncorrected) }}</td>
                                        <td>{{ row.method }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else class="empty-state">No state-level PIGEAN rows returned for this state in the current API.</div>
                    </div>
                </template>

                <template v-else-if="drawerContent && drawerContent.type === 'program'">
                    <div class="drawer-panel">
                        <h3>Program summary</h3>
                        <p>{{ drawerContent.summaryText }}</p>
                        <dl class="drawer-field-grid">
                            <template v-for="field in drawerContent.summaryFields">
                                <dt :key="`${field.label}-dt`">
                                    <span v-if="field.label === 'Suggested label'" class="drawer-inline-value">
                                        <span>{{ field.label }}</span>
                                        <span class="drawer-ai-tooltip">
                                            <span class="drawer-ai-pill">AI</span>
                                            <span class="drawer-ai-tooltip-bubble">{{ aiSuggestedLabelTooltip }}</span>
                                        </span>
                                    </span>
                                    <span v-else>{{ field.label }}</span>
                                </dt>
                                <dd :key="`${field.label}-dd`">
                                    <span>{{ field.value }}</span>
                                </dd>
                            </template>
                        </dl>
                        <div class="drawer-badge-row drawer-qc-row">
                            <span
                                v-for="badge in visibleProgramQcBadges(drawerContent.qcBadges)"
                                :key="badge.text"
                                class="drawer-qc-tooltip"
                            >
                                <span
                                    class="drawer-badge"
                                    :class="badge.tone"
                                >
                                    {{ badge.text }}
                                </span>
                                <span v-if="badge.tooltip" class="drawer-qc-tooltip-bubble">
                                    <strong>{{ badge.tooltip.displayName }}</strong>
                                    <span><strong>Category:</strong> {{ badge.tooltip.category }}</span>
                                    <span><strong>Marker genes:</strong> {{ badge.tooltip.markerGenes.join(', ') }}</span>
                                </span>
                            </span>
                        </div>
                        <button
                            v-if="hiddenProgramQcBadgeCount(drawerContent.qcBadges) > 0 && !showAllProgramQcBadges"
                            class="drawer-link-button"
                            @click="showAllProgramQcBadges = true"
                        >
                            See {{ hiddenProgramQcBadgeCount(drawerContent.qcBadges) }} more
                        </button>
                        <div class="drawer-mini">QC bubble colors: green = QC GSEA P &gt;= 0.05, yellow = QC GSEA P &lt; 0.05, red = QC GSEA q &lt; 0.05</div>
                    </div>

                    <div class="drawer-panel">
                        <h3>Best curated state matches</h3>
                        <div v-if="drawerContent.curatedMatches.length" class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>State</th>
                                        <th>GSEA P</th>
                                        <th>GSEA q</th>
                                        <th>-log10(q)</th>
                                        <th>Correlation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="row in drawerContent.curatedMatches"
                                        :key="`${row.stateId}-${row.programId || ''}`"
                                        class="clickable-cell"
                                        @click="openStateDrawer(row.stateId, row.row)"
                                    >
                                        <td>{{ row.stateLabel }}</td>
                                        <td>{{ formatPValue(row.gseaP) }}</td>
                                        <td>{{ formatPValue(row.gseaQ) }}</td>
                                        <td>{{ formatMetric(row.negLogQ) }}</td>
                                        <td>{{ formatMetric(row.correlation) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else class="empty-state">No curated state matches with GSEA P &lt; 0.05.</div>
                    </div>

                    <div class="drawer-panel">
                        <h3>Top gene loadings</h3>
                        <div v-if="drawerContent.topGenes.rows.length" class="table-wrap">
                            <table v-if="drawerContent.topGenes.mode === 'loading'">
                                <thead>
                                    <tr>
                                        <th>Gene</th>
                                        <th>Loading</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in drawerContent.topGenes.rows" :key="row.gene">
                                        <td>{{ row.gene }}</td>
                                        <td>{{ formatMetric(row.loading) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <table v-else>
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Gene</th>
                                        <th>Rank score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in drawerContent.topGenes.rows" :key="`${row.gene}-${row.rank}`">
                                        <td>{{ row.rank }}</td>
                                        <td>{{ row.gene }}</td>
                                        <td>{{ row.rankScore }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else class="empty-state">No positive program gene loadings returned.</div>
                    </div>

                    <div class="drawer-panel">
                        <h3>Top anchor traits</h3>
                        <div v-if="drawerContent.traitRows.length" class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Trait</th>
                                        <th>Joint beta</th>
                                        <th>Marginal beta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in drawerContent.traitRows" :key="row.trait">
                                        <td>{{ row.trait }}</td>
                                        <td>{{ formatMetric(row.beta) }}</td>
                                        <td>{{ formatMetric(row.betaUncorrected) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else class="empty-state">No program trait anchors returned.</div>
                    </div>

                    <div class="drawer-panel">
                        <h3>Gene set associations</h3>
                        <template v-if="drawerContent.geneSetRows.length">
                            <div class="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Gene set</th>
                                            <th>Joint beta</th>
                                            <th>Marginal beta</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="row in visibleProgramGeneSetRows(drawerContent.geneSetRows)" :key="row.geneSet">
                                            <td>{{ row.geneSet }}</td>
                                            <td>{{ formatMetric(row.beta) }}</td>
                                            <td>{{ formatMetric(row.betaUncorrected) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <button
                                v-if="hiddenProgramGeneSetRowCount(drawerContent.geneSetRows) > 0 && !showAllProgramGeneSets"
                                class="drawer-link-button"
                                @click="showAllProgramGeneSets = true"
                            >
                                See {{ hiddenProgramGeneSetRowCount(drawerContent.geneSetRows) }} more
                            </button>
                        </template>
                        <div v-else class="empty-state">No program gene set associations returned.</div>
                    </div>
                </template>
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
    background: #f8f8f8;
    padding: 20px;
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
    margin: 0 -10px;
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
.bar-grid-item{
    display:grid;
    grid-template-columns: 200px minmax(180px, 1fr) 60px 60px;
    gap: 10px;
    align-items: center;
    padding: 5px 10px;
}
.bar-cell{
    display: block;
}
.bar-track{
    flex: 1;
    height: 12px;
    background: #edf0f7;
    border-radius: 999px;
    overflow: hidden;
}
.bar-fill{
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--lite-blue), var(--lite-green));
}
.bar-number{
    min-width: 42px;
    text-align: right;
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
    border: 1px solid #ddd;
    background: #fafafa;
    border-radius: 10px;
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
    width: 430px;
    max-width: min(430px, calc(100vw - 24px));
    padding: 14px;
    border-radius: 12px;
    background: #16324f;
    color: white;
    box-shadow: 0 18px 34px rgba(0, 0, 0, .22);
    z-index: 35;
    pointer-events: none;
}
.floating-expression-tooltip::after{
    content: "";
    position: absolute;
    top: calc(50% - 7px);
    border-width: 7px;
    border-style: solid;
}
.floating-expression-tooltip.side-right::after{
    left: -14px;
    border-color: transparent #16324f transparent transparent;
}
.floating-expression-tooltip.side-left::after{
    right: -14px;
    border-color: transparent transparent transparent #16324f;
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


.options > div {
    padding: 5px 10px;  
}
.options .selected {
    background: var(--blue);
    color: white;
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
.drawer-panel{
    border: 1px solid #edf0f7;
    border-radius: 12px;
    padding: 16px;
    background: #fff;
}
.drawer-panel h3{
    margin-bottom: 10px !important;
}
.drawer-field-grid{
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr);
    gap: 10px 14px;
    margin: 0;
}
.drawer-field-grid dt{
    font-weight: 700;
    color: #1f2937;
}
.drawer-field-grid dd{
    margin: 0;
    color: #374151;
}
.drawer-inline-value{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.drawer-ai-tooltip{
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: help;
}
.drawer-ai-pill{
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    background: #e8f1fb;
    color: #175cd3;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .02em;
}
.drawer-ai-tooltip-bubble{
    position: absolute;
    left: 50%;
    bottom: calc(100% + 10px);
    width: 280px;
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
    transform: translate(-50%, 4px);
    transition: opacity .14s ease, transform .14s ease, visibility .14s ease;
    pointer-events: none;
    z-index: 20;
}
.drawer-ai-tooltip-bubble::after{
    content: "";
    position: absolute;
    left: 50%;
    top: 100%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: #16324f transparent transparent transparent;
}
.drawer-ai-tooltip:hover .drawer-ai-tooltip-bubble,
.drawer-ai-tooltip:focus-within .drawer-ai-tooltip-bubble{
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, 0);
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
.drawer-qc-tooltip{
    position: relative;
    display: inline-flex;
}
.drawer-qc-tooltip-bubble{
    position: absolute;
    left: 50%;
    bottom: calc(100% + 10px);
    width: 320px;
    max-width: min(320px, calc(100vw - 32px));
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
    transform: translate(-50%, 4px);
    transition: opacity .14s ease, transform .14s ease, visibility .14s ease;
    pointer-events: none;
    z-index: 20;
}
.drawer-qc-tooltip-bubble::after{
    content: "";
    position: absolute;
    left: 50%;
    top: 100%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: #16324f transparent transparent transparent;
}
.drawer-qc-tooltip-bubble strong{
    display: block;
}
.drawer-qc-tooltip-bubble span{
    display: block;
    margin-top: 4px;
}
.drawer-qc-tooltip:hover .drawer-qc-tooltip-bubble,
.drawer-qc-tooltip:focus-within .drawer-qc-tooltip-bubble{
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, 0);
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
.drawer-link-button{
    margin-top: 10px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #175cd3;
    font-size: 13px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
}
.drawer-link-button:hover{
    text-decoration: underline;
}
.drawer-marker-list{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.drawer-marker{
    display: inline-flex;
    padding: 4px 10px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #1f2937;
    font-size: 12px;
    font-weight: 700;
}
.drawer-reference-list{
    margin: 0;
    padding-left: 18px;
}
.drawer-reference-suffix{
    color: #6b7280;
    font-size: 12px;
}
.drawer-details{
    margin-top: 12px;
}
.drawer-details-body{
    margin-top: 12px;
}
.drawer-mini{
    margin-top: 10px;
    font-size: 12px;
    color: #4e4e4e;
}
.drawer-qc-row{
    margin-top: 12px;
}

.table-wrap table {
    width: 100%;
}
.table-wrap table tr th {
    white-space: nowrap;
}
.table-wrap table tr th, .table-wrap table tr td {
    padding: 0 5px;
}
.table-wrap table tr td:first-child {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
@media (max-width: 900px) {
    .drawer-field-grid{
        grid-template-columns: 1fr;
    }
    .floating-expression-tooltip{
        width: min(430px, calc(100vw - 24px));
    }
    .expression-tooltip-grid{
        grid-template-columns: 1fr;
    }
}

.section-card {
    display: flex;
    flex-direction: column;
    padding: 15px;
    background: white;
    min-height: 200px;
    flex: 1;
}
.scroll-panel{
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    max-height: 300px;
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
