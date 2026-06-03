<script>
import Vue from "vue";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

const LIGER_API_HOST = "https://bioindex-dev.hugeamp.org";
const LIGER_PROGRAM_MODEL = "mouse_msigdb";
const LIGER_TISSUE_CONFIG = {
    artery: {
        label: "Artery",
        datasetId: "FNIH_Artery_scRNA_v2.2",
    },
    heart: {
        label: "Heart",
        datasetId: "FNIH_Heart_scRNA_v3.2",
    },
    liver: {
        label: "Liver",
        datasetId: "FNIH_Liver_scRNA_v3",
    },
    pancreas: {
        label: "Pancreas",
        datasetId: "FNIH_islet_of_Langerhans_scRNA_v3-3",
    },
};
const LIGER_DATASET_TISSUE_MAP = Object.keys(LIGER_TISSUE_CONFIG).reduce((map, tissueKey) => {
    map[LIGER_TISSUE_CONFIG[tissueKey].datasetId] = tissueKey;
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
            viewInfo: false,
            cellStateExpressionRows: [],
            programExpressionRows: [],
            cellStateMetadataRows: [],
            geneProgramInfoRows: [],
            relationshipHeatmapRows: [],
            traitHeatmapRows: [],
            traitHeatmapColumns: [],
            phenotypeTraitRows: [],
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
        };
    },

    computed: {
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
            return this.cellStateExpressionList.length;
        },
        geneProgramCount() {
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
        relationshipMetricIds() {
            let preferred = [
                "correlation",
                "gsea_neglog10p",
                "gsea_neglog10q",
                "gsea_p",
                "gsea_q",
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
                    stateHeaders: [],
                    programRows: [],
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

            let programRows = programKeys.map((programKey) => {
                let infoRow = this.geneProgramInfoById[programKey] || { program_id: programKey };
                return {
                    key: programKey,
                    label: this.programLabel(infoRow),
                    cells: stateKeys.map((stateKey) => {
                        let row = cellMap.get(`${programKey}||${stateKey}`);
                        let value = row ? row.__metric_value : null;
                        let stateHeader = stateHeaders.find((item) => item.key === stateKey);

                        return {
                            key: `${programKey}-${stateKey}`,
                            value,
                            title: `${this.programLabel(infoRow)} x ${stateHeader ? stateHeader.label : stateKey}`,
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
                stateHeaders,
                programRows,
            };
        },
        relationshipHeatmapMeta() {
            let heatmap = this.relationshipHeatmapDisplay;

            if (!heatmap.programCount || !heatmap.stateCount) {
                return "No relationships loaded";
            }

            return `${heatmap.programCount} programs x ${heatmap.stateCount} states | ${this.relationshipMetricLabel(heatmap.metric)}`;
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
                let trait = this.traitName(row);

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
                let trait = this.traitName(row);
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
                    cells: columns.map((column) => {
                        let record = valueMap.get(`${trait}||${column.id}`);
                        let value = record ? record.value : null;

                        return {
                            key: `${trait}-${column.id}`,
                            value,
                            title: `${column.label} | ${trait}`,
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

            return `${traitCount} traits in ${groupCount} groups x ${columnCount} state/program columns | ${this.selectedTraitMetric === "beta" ? "joint beta" : "marginal beta"}`;
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
        if (this.config && this.config.gene) {
            this.searchedGene = String(this.config.gene).toUpperCase();
            await this.submitGeneSearch(this.searchedGene);
        }
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
        buildRelationshipHeatmapUrl(tissue, cellType) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-heatmap?q=${encodeURIComponent(`${tissue},${cellType}`)}`;
        },
        buildTraitPhenotypesUrl() {
            return `${BIO_INDEX_HOST}/api/portal/phenotypes?q=md`;
        },
        buildCellStateTraitUrl(tissue, cellType, stateId) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-cell-state-trait-factor?q=${encodeURIComponent(`${tissue},${cellType},${stateId}`)}`;
        },
        buildProgramTraitUrl(datasetId, cellType, programId) {
            return `${LIGER_API_HOST}/api/bio/query/gene-program-trait-factor?q=${encodeURIComponent(`${datasetId},${cellType},${LIGER_PROGRAM_MODEL},${programId}`)}`;
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
        traitName(row) {
            return this.field(row, ["trait", "trait_label", "trait_internal", "phenotype"]);
        },
        traitMetricValue(row, metric) {
            return this.numericField(row, [metric]);
        },
        traitGroupLabel(trait) {
            let phenotype = this.traitPhenotypeLookup[this.normalizeKey(trait)];
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
            this.viewInfo = false;
            this.cellStateExpressionRows = [];
            this.programExpressionRows = [];
            this.cellStateMetadataRows = [];
            this.geneProgramInfoRows = [];
            this.relationshipHeatmapRows = [];
            this.traitHeatmapRows = [];
            this.traitHeatmapColumns = [];
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
        },
        resetCellTypeResults() {
            this.cellTypeExpressionRows = [];
            this.selectedCellType = null;
            this.viewInfo = false;
            this.isLoadingCellTypes = false;
            this.cellStateExpressionRows = [];
            this.programExpressionRows = [];
            this.cellStateMetadataRows = [];
            this.geneProgramInfoRows = [];
            this.relationshipHeatmapRows = [];
            this.traitHeatmapRows = [];
            this.traitHeatmapColumns = [];
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
        },
        collectTissues(rows = []) {
            return rows
                .map((row) => this.tissueLabel(row))
                .filter((value) => !!value);
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
                return;
            }

            this.isLoadingGeneData = true;
            this.selectedGene = normalizedGene;

            try {
                let [cellStatePayload, programPayload] = await Promise.all([
                    this.fetchJson(this.buildCellStateExpressionUrl(normalizedGene)),
                    this.fetchJson(this.buildProgramExpressionUrl(normalizedGene)),
                ]);

                this.cellStateExpressionRows = this.rowsFromResponse(cellStatePayload);
                let programExpressionRows = this.rowsFromResponse(programPayload);

                let uniqueTissues = Array.from(
                    new Set(
                        [
                            ...this.collectTissues(this.cellStateExpressionRows),
                            ...this.collectTissues(programExpressionRows),
                        ]
                    )
                ).sort((a, b) => a.localeCompare(b));

                this.availableTissues = uniqueTissues;

                if (this.availableTissues.length === 0) {
                    this.geneSearchError = `No tissues are currently available for ${normalizedGene}.`;
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
            await Promise.all([
                this.loadCellStateSection(cellType),
                this.loadGeneProgramSection(cellType),
                this.loadRelationshipHeatmap(cellType),
            ]);
            await this.loadTraitHeatmap(cellType);
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
                if (!this.phenotypeTraitRows.length) {
                    let phenotypePayload = await this.fetchJson(this.buildTraitPhenotypesUrl());
                    this.phenotypeTraitRows = this.rowsFromResponse(phenotypePayload);
                }

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
        <div class="f-row g-40">
            <div class="f-col align-v-bottom flex1" style="padding:0 0 7px;">
                <h4 class="bold">Search gene</h4>
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
            </div>
            <h4 class="headline f-col flex1">
                Compare gene expression across cell types, curated cell states and 
                computationally inferred gene programs with genetically supported links 
                to human traits, revealing both established and potentially novel biology.
            </h4>
        </div>
        <div v-if="selectedGene" id="liger-body" class="f-col g-40">
            <div class="flex1">
                <h3 class="bold">Where is <span class="pill">{{ selectedGene }}</span> expressed?</h3>
                <div class="subtitle">See gene expression per tissue by cell type, cell states, and gene programs.</div>
            </div>
            <div class="f-col g-40">
                <div class="f-row g-20">
                    <div class="f-col g-5 flex1">
                        <div class="f-row g-5">
                            <h5 class="bold">Tissues</h5>
                            <span class="count">({{ tissueCount }})</span>
                        </div>
                        <div class="section-card f-col g-10">
                            <div class="scroll-panel">
                                <div class="options f-col">
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
                            <span class="count">({{ cellTypeCount }})</span>
                        </div>
                        <div class="section-card relative">
                            <div v-if="!selectedTissue && !isLoadingCellTypes"
                                class="card-overlay"
                            >
                                <div><strong>Select a Tissue</strong> to see expression by Cell Type</div>
                            </div>
                            <div v-if="isLoadingCellTypes" class="card-overlay">
                                <div>Loading cell types...</div>
                            </div>
                            <div class="f-row g-20">
                                <div class="f-col flex1">
                                    <div class="bar-grid-header">
                                        <div class="bold">Cell Type</div>
                                        <div class="bold">Expression</div>
                                        <div class="bold text-right">ABS</div>
                                        <div class="bold text-right">SPEC</div>
                                    </div>
                                    <div class="scroll-panel">
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
                    <!--
                    <div class="section-header">
                        <div class="f-row spread-out">
                            <h3 class="bold">Cell states and gene programs <span v-if="selectedCellType">for {{ selectedCellType.label }} in {{ selectedTissue }}</span><span v-else>within a cell type</span></h3>
                            <button v-if="selectedCellType"
                                @click="viewInfo=!viewInfo"
                            >
                                Show {{ viewInfo ? 'Expression': 'Info'}}
                            </button>
                        </div>
                        <div class="subtitle">Cell states are curated, marker-defined biology. Gene programs are data-driven, computationally inferred latent factors.</div>
                    </div>
                    -->
                    <div class="f-row g-20">
                        <div class="f-col g-10 flex1">
                            <div class="f-col">
                                <div class="f-row spread-out">
                                    <div class="f-row g-5">
                                        <h5 class="bold">Cell States</h5>
                                        <span class="count">({{ cellStateCount }})</span>
                                    </div>
                                    <button v-if="selectedCellType"
                                        @click="viewInfo=!viewInfo"
                                    >
                                        Show {{ viewInfo ? 'Expression': 'Info'}}
                                    </button>
                                </div>
                                <div>Cell states are curated, marker-defined biology.</div>
                            </div>
                            <div class="section-card flex1 relative">
                                <div v-if="!selectedCellType && !isLoadingCellStateSection"
                                    class="card-overlay"
                                >
                                    <div><strong>Select a Cell Type</strong> to see expression by Curated Cell State</div>
                                </div>
                                <div v-if="isLoadingCellStateSection" class="card-overlay">
                                    <div>Loading cell states...</div>
                                </div>
                                <div v-if="selectedCellType && !viewInfo" class="expression f-col flex1">
                                    <div class="bar-grid-header">
                                        <div class="bold">Cell State</div>
                                        <div class="bold">Expression</div>
                                        <div class="bold text-right">ABS</div>
                                        <div class="bold text-right">SPEC</div>
                                    </div>
                                    <div class="scroll-panel">
                                        <div v-if="cellStateSectionError" class="empty-state">
                                            {{ cellStateSectionError }}
                                        </div>
                                        <div
                                            v-for="cellState in cellStateExpressionList"
                                            :key="cellState.key"
                                            class="bar-grid-item grid-item"
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
                                    <div class="scroll-panel">
                                        <div v-if="cellStateSectionError" class="empty-state">
                                            {{ cellStateSectionError }}
                                        </div>
                                        <div
                                            v-for="cellState in cellStateInfoList"
                                            :key="cellState.key"
                                            class="info-grid grid-item"
                                        >
                                            <div>{{cellState.label}}</div>
                                            <div>{{cellState.description}}</div>
                                            <div>{{cellState.genes}}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="f-col g-10 flex1">
                            <div class="f-col">
                                <div class="f-row g-5">
                                    <h5 class="bold">Gene Programs</h5>
                                    <span class="count">({{ geneProgramCount }})</span>
                                </div>
                                <div>Gene programs are data-driven, computationally inferred latent factors.</div>
                            </div>
                            <div class="section-card  flex1 relative">
                                <div v-if="!selectedCellType && !isLoadingGeneProgramSection"
                                    class="card-overlay"
                                >
                                    <div><strong>Select a Cell Type</strong> to see expression by Inferred Gene Program</div>
                                </div>
                                <div v-if="isLoadingGeneProgramSection" class="card-overlay">
                                    <div>Loading gene programs...</div>
                                </div>
                                <div v-if="selectedCellType && !viewInfo" class="expression f-col flex1">
                                    <div class="bar-grid-header">
                                        <div class="bold">Gene Program</div>
                                        <div class="bold">Expression</div>
                                        <div class="bold text-right">ABS</div>
                                        <div class="bold text-right">SPEC</div>
                                    </div>
                                    <div class="scroll-panel">
                                        <div v-if="geneProgramSectionError" class="empty-state">
                                            {{ geneProgramSectionError }}
                                        </div>
                                        <div
                                            v-for="program in geneProgramExpressionList"
                                            :key="program.key"
                                            class="bar-grid-item grid-item"
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
                                    <div class="scroll-panel">
                                        <div v-if="geneProgramSectionError" class="empty-state">
                                            {{ geneProgramSectionError }}
                                        </div>
                                        <div
                                            v-for="program in geneProgramInfoList"
                                            :key="program.key"
                                            class="info-grid grid-item"
                                        >
                                            <div>{{program.label}}</div>
                                            <div>{{program.description}}</div>
                                            <div>{{program.genes}}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="f-col g-20">
                    <div>
                        <h3 class="bold">Relationships between states and programs</h3>
                        <div class="subtitle">Explore genetic correlations between known cell states and inferred gene programs for potentially novel connections.</div>
                    </div>
                    <div class="section-card f-col g-10 relative">
                        <div v-if="!selectedCellType && !isLoadingRelationshipHeatmap"
                            class="card-overlay"
                        >
                            <div><strong>Select a Cell Type</strong> to see relationships</div>
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
                                <span class="heatmap-meta">{{ relationshipHeatmapMeta }}</span>
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
                        <div v-else-if="selectedCellType && !relationshipHeatmapDisplay.programRows.length" class="empty-state">
                            No relationship heatmap rows returned.
                        </div>
                        <div v-else-if="relationshipHeatmapDisplay.programRows.length" class="heatmap-wrap">
                            <table class="heatmap-table">
                                <thead>
                                    <tr>
                                        <th class="heatmap-row-head">Program</th>
                                        <th
                                            v-for="state in relationshipHeatmapDisplay.stateHeaders"
                                            :key="state.key"
                                            class="heatmap-column-head"
                                            :title="state.label"
                                        >
                                            <div class="heatmap-column-label">{{ state.label }}</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="program in relationshipHeatmapDisplay.programRows"
                                        :key="program.key"
                                    >
                                        <td class="heatmap-row-head" :title="program.label">{{ program.label }}</td>
                                        <td
                                            v-for="cell in program.cells"
                                            :key="cell.key"
                                            class="heatmap-cell"
                                            :style="{ background: cell.color }"
                                            :title="`${cell.title}${isFiniteNumber(cell.value) ? `: ${formatMetric(cell.value)}` : ''}`"
                                        >
                                            <span v-if="isFiniteNumber(cell.value)">{{ formatMetric(cell.value) }}</span>
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
                        <h3 class="bold">Genetically supported links of states and programs to human traits</h3>
                        <div class="subtitle">See which curated states and inferred programs connect to grouped human traits, using the portal phenotype catalog to organize traits by phenotype group.</div>
                    </div>
                    <div class="section-card f-col g-10 relative">
                        <div v-if="!selectedCellType && !isLoadingTraitHeatmap"
                            class="card-overlay"
                        >
                            <div><strong>Select a Cell Type</strong> to see trait links</div>
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
                                    <option value="all">Traits: states + factors</option>
                                    <option value="program">Traits: factors only</option>
                                    <option value="state">Traits: states only</option>
                                </select>
                                <span class="heatmap-meta">{{ traitHeatmapMeta }}</span>
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
                                        <th class="heatmap-row-head">Trait</th>
                                        <th
                                            v-for="column in availableTraitColumns"
                                            :key="column.id"
                                            class="heatmap-column-head"
                                            :title="`${column.type}: ${column.label}`"
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
                                            <td class="heatmap-row-head" :title="trait.trait">{{ trait.trait }}</td>
                                            <td
                                                v-for="cell in trait.cells"
                                                :key="cell.key"
                                                class="heatmap-cell"
                                                :style="{ background: cell.color }"
                                                :title="`${cell.title}${isFiniteNumber(cell.value) ? `: ${cell.value.toFixed(3)}` : ''}`"
                                            >
                                                <span v-if="isFiniteNumber(cell.value)">{{ cell.value.toFixed(3) }}</span>
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
    </div>
</template>

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
}
.headline{
    line-height: 2rem;
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
    background: #219197;
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
    background: linear-gradient(90deg, #94c95e, #219197);
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
    font-size: 1.1em;
}
.grid-item{
    text-align: left;
    cursor: pointer;
}
.grid-item:hover{
    background: #94c95e;
}
.grid-item.selected {
    background: #219197;
    color: white;
}

.tabs {
    display: flex;
    font-size: 1.2em;
    gap: 5px;
    border-bottom: 1px solid rgba(0, 0, 0, .25);
}
.tab {
    padding: 5px 10px;
    border: 1px solid rgba(0, 0, 0, .25);
    border-bottom: 1px solid white;
    cursor: pointer;
}
.tab.active {
    margin-bottom: -.5px;
    color: #219197;
    font-weight: bold;
    border-color: #219197;
    border-bottom-color: white;
}
.tab-section {
    border: 1px solid rgba(0, 0, 0, .25);
    border-top: none;
    padding: 15px 10px;
}

.options > div {
    padding: 5px 10px;  
}
.options .selected {
    background: #219197;
    color: white;
}

.title{
    margin-bottom: 20px;
}
.subtitle{
    font-size: 1.2em;
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
.heatmap-table thead .heatmap-row-head{
    z-index: 3;
}
.heatmap-column-head{
    min-width: 62px;
    max-width: 62px;
    padding: 10px 6px;
    vertical-align: bottom;
}
.heatmap-column-label{
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    white-space: nowrap;
    margin: 0 auto;
    max-height: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
}
.heatmap-cell{
    min-width: 62px;
    height: 42px;
    padding: 6px;
    text-align: center;
    font-size: 11px;
    color: #1f2937;
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
