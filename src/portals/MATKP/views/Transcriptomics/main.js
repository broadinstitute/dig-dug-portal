import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";
import keyParams from "@/utils/keyParams";
import {
    resolveCanonicalHumanGene,
    resolveHumanMouseSymbols,
} from "../../utils/gprofilerOrth.js";
import { fetchForestGenePayload } from "../../utils/buildForestGenePayload.js";

import pageIndex from "../../data/transcriptomicPrototype/index.json";
import geneIndex from "../../data/transcriptomicPrototype/genes_index.json";
import outcomeIndex from "../../data/transcriptomicPrototype/outcomes_index.json";

const FILTER_DROPDOWN_POPPER_OPTS = {
    placement: "right",
    modifiers: {
        flip: {
            enabled: true,
            behavior: ["right", "right-start", "right-end"],
            padding: 8,
        },
        preventOverflow: {
            enabled: true,
            padding: 8,
        },
        offset: {
            offset: "0, 6",
        },
    },
};

new Vue({
    mixins: [matkpMixin],

    data() {
        return {
            pageIndex,
            geneIndex,
            outcomeIndex,
            activeGenePayload: null,
            showGeneResults: false,
            selectedGene: null,
            geneQuery: "",
            geneSearchSpecies: "human",
            geneLoading: false,
            pendingOutcomeId: null,
            urlOutcomeFilter: null,
            geneOrthologSymbols: {
                human: null,
                mouse: null,
            },
            geneNotFound: false,
            selectedOutcomeId: null,
            expandedOutcomes: {},
            visibleOutcomes: {},
            speciesFilters: {
                human: true,
                mouse: true,
                other: true,
            },
            depotFilters: {},
            datasetFilters: {},
            adjPValueMax: "",
            adjPValueInput: "",
            datasetRowVisibility: {},
            filterDropdownPopperOpts: FILTER_DROPDOWN_POPPER_OPTS,
            activeScrolledOutcomeId: null,
            scrollHandler: null,
        };
    },

    computed: {
        activeGene() {
            if (this.geneNotFound || !this.activeGenePayload) {
                return null;
            }

            return this.activeGenePayload;
        },
        geneSummaryList() {
            if (!this.activeGene) {
                return [];
            }

            const summary = this.activeGene.page_summary;

            return [
                `${summary.dataset_count} datasets represented`,
                `${summary.outcome_count} supported outcomes`,
                `${summary.pooled_outcome_count} pooled outcome sections`,
            ];
        },
        geneSpeciesSymbolLabel() {
            const symbols = this.geneOrthologSymbols;
            const parts = [];

            if (symbols.human) {
                parts.push(`Human: ${symbols.human}`);
            }

            if (symbols.mouse) {
                parts.push(`Mouse: ${symbols.mouse}`);
            }

            return parts.join(" | ");
        },
        geneSearchPlaceholder() {
            return this.geneSearchSpecies === "mouse"
                ? "Type a mouse gene symbol"
                : "Type a human gene symbol";
        },
        activeOutcomeIds() {
            return this.activeGene ? this.activeGene.supported_outcomes : [];
        },
        depotOptions() {
            return this.collectDepotOptions(this.activeGene);
        },
        datasetOptions() {
            return this.collectDatasetOptions(this.activeGene);
        },
        activeOutcome() {
            return (
                this.outcomes.find(
                    (outcome) => outcome.outcome_id === this.selectedOutcomeId
                ) || this.outcomes[0]
            );
        },
        outcomes() {
            if (!this.activeGene) {
                return [];
            }

            return this.activeGene.outcomes.map((outcome) => {
                const visibleRows = outcome.rows.filter((row) =>
                    this.isRowFilterVisible(row, outcome.outcome_id)
                );
                const domain = this.getOutcomeDomain(visibleRows);
                const plotRows = visibleRows.map((row) =>
                    this.decorateRowForPlot(row, domain)
                );

                return {
                    ...outcome,
                    hasFilteredData: visibleRows.length > 0,
                    domain,
                    ticks: this.buildTicks(domain),
                    plotRowGroups: this.buildPlotRowGroups(plotRows),
                };
            });
        },
    },

    created() {
        const requestedGene = keyParams.gene;
        const requestedOutcome = keyParams.outcome;

        this.showGeneResults = !!requestedGene;
        this.pendingOutcomeId = requestedOutcome
            ? String(requestedOutcome).trim()
            : null;

        if (requestedGene) {
            this.selectedGene = String(requestedGene).trim().toUpperCase();
            this.geneQuery = this.selectedGene;
        }
    },
    mounted() {
        if (!this.showGeneResults) {
            return;
        }

        this.bootstrapGene().then(() => {
            this.$nextTick(() => {
                this.setupScrollTracking();
            });
        });
    },
    beforeDestroy() {
        if (this.scrollHandler) {
            window.removeEventListener("scroll", this.scrollHandler);
            this.scrollHandler = null;
        }
    },

    methods: {
        initializeVisibleOutcomes() {
            const visible = {};

            this.activeOutcomeIds.forEach((outcomeId) => {
                visible[outcomeId] = true;
            });

            this.visibleOutcomes = visible;
        },
        applyOutcomeVisibilityFilter(outcomeId) {
            const visible = {};

            this.activeOutcomeIds.forEach((id) => {
                visible[id] = id === outcomeId;
            });

            this.visibleOutcomes = visible;
        },
        applyUrlOutcomeFilter() {
            const outcomeId = this.pendingOutcomeId;

            if (
                outcomeId &&
                this.activeOutcomeIds.includes(outcomeId)
            ) {
                this.urlOutcomeFilter = outcomeId;
                this.applyOutcomeVisibilityFilter(outcomeId);
                this.selectedOutcomeId = outcomeId;
                return;
            }

            this.urlOutcomeFilter = null;
            this.initializeVisibleOutcomes();
            this.selectedOutcomeId = this.activeOutcomeIds[0] || null;
        },
        isOutcomeVisible(outcomeId) {
            return this.visibleOutcomes[outcomeId] !== false;
        },
        outcomeHasFilteredData(outcomeId) {
            const outcome = this.outcomes.find(
                (item) => item.outcome_id === outcomeId
            );

            return outcome ? outcome.hasFilteredData : false;
        },
        isOutcomeSectionVisible(outcomeId) {
            return (
                this.isOutcomeVisible(outcomeId) &&
                this.outcomeHasFilteredData(outcomeId)
            );
        },
        setOutcomeVisibility(outcomeId, isVisible) {
            this.$set(this.visibleOutcomes, outcomeId, isVisible);
            this.refreshUrlOutcomeFilter();
            this.syncParams();
        },
        areAllOutcomesSelected() {
            if (!this.activeGene) {
                return true;
            }

            return this.activeGene.outcomes.every(
                (outcome) =>
                    this.visibleOutcomes[outcome.outcome_id] !== false
            );
        },
        isOutcomeVisibilityIndeterminate() {
            if (!this.activeGene) {
                return false;
            }

            const selectedCount = this.activeGene.outcomes.filter(
                (outcome) =>
                    this.visibleOutcomes[outcome.outcome_id] !== false
            ).length;

            return (
                selectedCount > 0 &&
                selectedCount < this.activeGene.outcomes.length
            );
        },
        setAllOutcomeVisibility(isVisible) {
            if (!this.activeGene) {
                return;
            }

            this.activeGene.outcomes.forEach((outcome) => {
                this.$set(
                    this.visibleOutcomes,
                    outcome.outcome_id,
                    isVisible
                );
            });

            if (isVisible) {
                this.urlOutcomeFilter = null;
            }

            this.syncParams();
        },
        getDatasetRowKey(row) {
            if (row.row_type === "pooled") {
                return `pooled:${row.comparison_id || row.outcome_id}`;
            }

            return row.dataset_id || row.display_label_short;
        },
        getDatasetVisibilityKey(outcomeId, row) {
            return `${outcomeId}::${this.getDatasetRowKey(row)}`;
        },
        initializeDatasetVisibility() {
            const visibility = {};

            if (this.activeGene) {
                this.activeGene.outcomes.forEach((outcome) => {
                    outcome.rows.forEach((row) => {
                        visibility[
                            this.getDatasetVisibilityKey(
                                outcome.outcome_id,
                                row
                            )
                        ] = true;
                    });
                });
            }

            this.datasetRowVisibility = visibility;
        },
        getOutcomeDatasetOptions(outcome) {
            if (!outcome || !outcome.rows) {
                return [];
            }

            const datasetsByKey = new Map();

            outcome.rows.forEach((row) => {
                const id = this.getDatasetRowKey(row);

                if (!datasetsByKey.has(id)) {
                    datasetsByKey.set(id, {
                        id,
                        label: row.display_label_short,
                    });
                }
            });

            return Array.from(datasetsByKey.values()).sort((a, b) =>
                a.label.localeCompare(b.label)
            );
        },
        isDatasetVisible(outcomeId, datasetRowKey) {
            const key = `${outcomeId}::${datasetRowKey}`;

            return this.datasetRowVisibility[key] !== false;
        },
        setDatasetVisibility(outcomeId, datasetRowKey, isVisible) {
            const key = `${outcomeId}::${datasetRowKey}`;

            this.$set(this.datasetRowVisibility, key, isVisible);
        },
        isOutcomeDatasetFilterActive(outcomeId) {
            const outcome = this.activeGene?.outcomes.find(
                (item) => item.outcome_id === outcomeId
            );

            if (!outcome) {
                return false;
            }

            return outcome.rows.some((row) => {
                const key = this.getDatasetVisibilityKey(outcomeId, row);

                return this.datasetRowVisibility[key] === false;
            });
        },
        passesRowGlobalFilters(row) {
            return (
                this.isSpeciesRowVisible(row) &&
                this.isGlobalDatasetRowVisible(row) &&
                this.isDepotRowVisible(row) &&
                this.isAdjPRowVisible(row)
            );
        },
        collectDatasetOptions(gene) {
            if (!gene) {
                return [];
            }

            const datasetsByKey = new Map();

            gene.outcomes.forEach((outcome) => {
                outcome.rows.forEach((row) => {
                    if (row.row_type === "pooled") {
                        return;
                    }

                    const id = this.getDatasetRowKey(row);

                    if (!datasetsByKey.has(id)) {
                        datasetsByKey.set(id, {
                            id,
                            label: row.display_label_short,
                        });
                    }
                });
            });

            return Array.from(datasetsByKey.values()).sort((a, b) =>
                a.label.localeCompare(b.label)
            );
        },
        initializeDatasetFilters() {
            const filters = {};

            this.datasetOptions.forEach((option) => {
                filters[option.id] = true;
            });

            this.datasetFilters = filters;
        },
        setDatasetFilter(datasetId, isVisible) {
            this.$set(this.datasetFilters, datasetId, isVisible);
        },
        areAllDatasetsSelected() {
            if (!this.datasetOptions.length) {
                return true;
            }

            return this.datasetOptions.every(
                (option) => this.datasetFilters[option.id] !== false
            );
        },
        isDatasetFilterIndeterminate() {
            if (!this.datasetOptions.length) {
                return false;
            }

            const selectedCount = this.datasetOptions.filter(
                (option) => this.datasetFilters[option.id] !== false
            ).length;

            return (
                selectedCount > 0 &&
                selectedCount < this.datasetOptions.length
            );
        },
        setAllDatasetFilters(isVisible) {
            this.datasetOptions.forEach((option) => {
                this.$set(this.datasetFilters, option.id, isVisible);
            });
        },
        isDatasetFilterActive() {
            if (!this.datasetOptions.length) {
                return false;
            }

            return this.datasetOptions.some(
                (option) => this.datasetFilters[option.id] === false
            );
        },
        isGlobalDatasetRowVisible(row) {
            if (row.row_type === "pooled") {
                return true;
            }

            const datasetKey = this.getDatasetRowKey(row);

            return this.datasetFilters[datasetKey] !== false;
        },
        collectGeneSpeciesSymbols(gene) {
            const symbols = {
                human: null,
                mouse: null,
            };

            if (!gene) {
                return symbols;
            }

            gene.outcomes.forEach((outcome) => {
                outcome.rows.forEach((row) => {
                    const speciesKey = this.speciesClass(row.species);
                    const geneSymbol = row.gene || gene.gene;

                    if (speciesKey === "human" && !symbols.human) {
                        symbols.human = geneSymbol;
                    }

                    if (speciesKey === "mouse" && !symbols.mouse) {
                        symbols.mouse = geneSymbol;
                    }
                });
            });

            return symbols;
        },
        async refreshGeneOrthologSymbols(humanCanonical) {
            const fallback = this.collectGeneSpeciesSymbols(this.activeGenePayload);

            this.geneOrthologSymbols = {
                human: fallback.human || humanCanonical,
                mouse: fallback.mouse || humanCanonical,
            };

            const symbols = await resolveHumanMouseSymbols(
                humanCanonical,
                "human"
            );

            if (symbols.human) {
                this.geneOrthologSymbols = symbols;
            }
        },
        async fetchGenePayload(canonicalGene) {
            this.geneLoading = true;

            try {
                const payload = await fetchForestGenePayload(canonicalGene);

                if (!payload || !payload.outcomes.length) {
                    this.activeGenePayload = null;
                    this.geneNotFound = true;
                    return false;
                }

                this.activeGenePayload = payload;
                this.geneNotFound = false;
                return true;
            } catch (error) {
                console.error(error);
                this.activeGenePayload = null;
                this.geneNotFound = true;
                return false;
            } finally {
                this.geneLoading = false;
            }
        },
        initializeGeneState() {
            this.applyUrlOutcomeFilter();
            this.initializeDepotFilters();
            this.initializeDatasetFilters();
            this.initializeDatasetVisibility();
            this.syncParams();
        },
        async bootstrapGene() {
            const loaded = await this.fetchGenePayload(this.selectedGene);

            if (!loaded) {
                this.syncParams();
                return;
            }

            this.initializeGeneState();
            await this.refreshGeneOrthologSymbols(this.selectedGene);
        },
        collectDepotOptions(gene) {
            if (!gene) {
                return [];
            }

            const depotIds = new Set();

            gene.outcomes.forEach((outcome) => {
                outcome.rows.forEach((row) => {
                    this.getRowDepotTokens(row).forEach((token) => {
                        depotIds.add(token);
                    });
                });
            });

            return Array.from(depotIds)
                .sort((a, b) => {
                    if (a === "__none__") {
                        return 1;
                    }

                    if (b === "__none__") {
                        return -1;
                    }

                    return a.localeCompare(b);
                })
                .map((id) => ({
                    id,
                    label: this.formatDepotLabel(id),
                }));
        },
        formatDepotLabel(depotId) {
            if (depotId === "__none__") {
                return "Not specified";
            }

            return depotId;
        },
        getRowDepotTokens(row) {
            const depot = String(row.depot || "").trim();

            if (!depot) {
                return ["__none__"];
            }

            return depot
                .split(";")
                .map((part) => part.trim())
                .filter(Boolean);
        },
        initializeDepotFilters() {
            const filters = {};

            this.depotOptions.forEach((option) => {
                filters[option.id] = true;
            });

            this.depotFilters = filters;
        },
        isRowFilterVisible(row, outcomeId) {
            return (
                this.passesRowGlobalFilters(row) &&
                this.isDatasetRowVisible(row, outcomeId)
            );
        },
        isDatasetRowVisible(row, outcomeId) {
            const key = this.getDatasetVisibilityKey(outcomeId, row);

            return this.datasetRowVisibility[key] !== false;
        },
        isSpeciesRowVisible(row) {
            return this.speciesFilters[this.speciesClass(row.species)] !== false;
        },
        isDepotRowVisible(row) {
            const enabledDepots = this.depotOptions.filter(
                (option) => this.depotFilters[option.id] !== false
            );

            if (enabledDepots.length === 0) {
                return false;
            }

            return this.getRowDepotTokens(row).some(
                (token) => this.depotFilters[token] !== false
            );
        },
        isAdjPRowVisible(row) {
            const maxValue = String(this.adjPValueMax || "").trim();

            if (!maxValue) {
                return true;
            }

            const threshold = Number(maxValue);

            if (Number.isNaN(threshold)) {
                return true;
            }

            if (row.p_value_adj === null || row.p_value_adj === undefined) {
                return false;
            }

            return row.p_value_adj <= threshold;
        },
        setSpeciesFilter(speciesClass, isVisible) {
            this.$set(this.speciesFilters, speciesClass, isVisible);
        },
        isSpeciesFilterActive() {
            return ["human", "mouse", "other"].some(
                (key) => this.speciesFilters[key] === false
            );
        },
        setDepotFilter(depotId, isVisible) {
            this.$set(this.depotFilters, depotId, isVisible);
        },
        areAllDepotsSelected() {
            if (!this.depotOptions.length) {
                return true;
            }

            return this.depotOptions.every(
                (option) => this.depotFilters[option.id] !== false
            );
        },
        isDepotFilterIndeterminate() {
            if (!this.depotOptions.length) {
                return false;
            }

            const selectedCount = this.depotOptions.filter(
                (option) => this.depotFilters[option.id] !== false
            ).length;

            return (
                selectedCount > 0 && selectedCount < this.depotOptions.length
            );
        },
        setAllDepotFilters(isVisible) {
            this.depotOptions.forEach((option) => {
                this.$set(this.depotFilters, option.id, isVisible);
            });
        },
        isDepotFilterActive() {
            if (!this.depotOptions.length) {
                return false;
            }

            return this.depotOptions.some(
                (option) => this.depotFilters[option.id] === false
            );
        },
        applyAdjPFilter() {
            this.adjPValueMax = String(this.adjPValueInput || "").trim();
        },
        isAdjPFilterActive() {
            const maxValue = String(this.adjPValueMax || "").trim();

            if (!maxValue) {
                return false;
            }

            return !Number.isNaN(Number(maxValue));
        },
        buildPlotRowGroups(plotRows) {
            const groups = [];
            let lastSpeciesKey = null;

            plotRows.forEach((row) => {
                const speciesKey = row.species || "__none__";

                if (speciesKey !== lastSpeciesKey) {
                    groups.push({
                        type: "species-header",
                        key: `header-${speciesKey}-${groups.length}`,
                        species: row.species,
                        label: this.formatSpeciesLabel(row.species),
                        speciesClass: this.speciesClass(row.species),
                    });
                    lastSpeciesKey = speciesKey;
                }

                groups.push({
                    type: "row",
                    key: `${row.display_label_short}-${row.row_type}-${groups.length}`,
                    row,
                });
            });

            return groups;
        },
        buildTicks(domain) {
            return [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                const value = domain.min + (domain.max - domain.min) * fraction;
                return {
                    value,
                    label: this.formatTick(value),
                    position: fraction * 100,
                };
            });
        },
        decorateRowForPlot(row, domain) {
            const ciLeft = this.scaleValue(row.ci_low, domain);
            const ciRight = this.scaleValue(row.ci_high, domain);
            const effectLeft = this.scaleValue(row.effect, domain);

            return {
                ...row,
                ciLeft,
                ciWidth: Math.max(ciRight - ciLeft, 1),
                effectLeft,
            };
        },
        formatEstimate(row) {
            return `${this.formatNumber(row.effect)} (${this.formatNumber(
                row.ci_low
            )}, ${this.formatNumber(row.ci_high)})`;
        },
        formatNumber(value, digits = 2) {
            if (value === null || value === undefined || Number.isNaN(value)) {
                return "—";
            }

            return Number(value).toFixed(digits);
        },
        formatPValue(value) {
            if (value === null || value === undefined || Number.isNaN(value)) {
                return "—";
            }

            if (value === 0) {
                return "0";
            }

            if (value < 0.001) {
                return value.toExponential(2);
            }

            return Number(value).toFixed(3);
        },
        formatTick(value) {
            if (Math.abs(value) >= 10) {
                return value.toFixed(0);
            }

            if (Math.abs(value) >= 1) {
                return value.toFixed(1);
            }

            return value.toFixed(2);
        },
        formatSpeciesLabel(species) {
            if (species === "Homo sapiens") {
                return "Human";
            }

            if (species === "Mus musculus") {
                return "Mouse";
            }

            return species || "Pooled";
        },
        getOutcomeDomain(rows) {
            const maxAbs = rows.reduce((currentMax, row) => {
                const candidates = [
                    Math.abs(row.effect || 0),
                    Math.abs(row.ci_low || 0),
                    Math.abs(row.ci_high || 0),
                ];

                return Math.max(currentMax, ...candidates);
            }, 0);

            const extent = Math.max(maxAbs * 1.1, 0.25);

            return {
                min: -extent,
                max: extent,
            };
        },
        outcomeMeta(outcomeId) {
            return (
                this.outcomeIndex.find((item) => item.outcome_id === outcomeId) || null
            );
        },
        async loadGene() {
            const query = String(this.geneQuery || "").trim();

            if (!query) {
                return;
            }

            const canonicalGene = await resolveCanonicalHumanGene(
                query,
                this.geneSearchSpecies
            );

            if (!canonicalGene) {
                this.showGeneResults = true;
                this.geneNotFound = true;
                this.activeGenePayload = null;
                this.selectedGene = query.toUpperCase();
                this.geneOrthologSymbols = {
                    human: null,
                    mouse: null,
                };
                this.syncParams();
                return;
            }

            const loaded = await this.fetchGenePayload(canonicalGene);

            if (!loaded) {
                this.showGeneResults = true;
                this.selectedGene = canonicalGene;
                this.syncParams();
                return;
            }

            this.showGeneResults = true;
            this.selectedGene = canonicalGene;

            const symbols = await resolveHumanMouseSymbols(
                query,
                this.geneSearchSpecies
            );

            this.geneOrthologSymbols = {
                human: canonicalGene,
                mouse: symbols.mouse || query,
            };
            this.onGeneChange(canonicalGene, { updateQuery: false });
            this.geneQuery =
                this.geneSearchSpecies === "mouse"
                    ? this.geneOrthologSymbols.mouse
                    : canonicalGene;
        },
        onGeneChange(gene, options = {}) {
            this.selectedGene = gene;
            this.geneNotFound = false;

            if (options.updateQuery !== false) {
                this.geneQuery = gene;
            }
            this.expandedOutcomes = {};
            this.speciesFilters = {
                human: true,
                mouse: true,
                other: true,
            };
            this.adjPValueMax = "";
            this.adjPValueInput = "";
            this.applyUrlOutcomeFilter();
            this.initializeDepotFilters();
            this.initializeDatasetFilters();
            this.initializeDatasetVisibility();

            this.syncParams();
            this.$nextTick(() => {
                this.setupScrollTracking();
            });
        },
        refreshUrlOutcomeFilter() {
            const visibleIds = this.activeOutcomeIds.filter(
                (id) => this.visibleOutcomes[id] !== false
            );

            if (
                visibleIds.length === 1 &&
                visibleIds[0] === this.urlOutcomeFilter
            ) {
                return;
            }

            this.urlOutcomeFilter = null;
        },
        scaleValue(value, domain) {
            if (domain.max === domain.min) {
                return 50;
            }

            return ((value - domain.min) / (domain.max - domain.min)) * 100;
        },
        rowTooltip(row) {
            const label = row.display_label_full || row.display_label_medium;
            const datasetId = row.dataset_id || "meta-analysis";
            const species = this.formatSpeciesLabel(row.species);
            const effect = this.formatNumber(row.effect);
            const ciLow = this.formatNumber(row.ci_low);
            const ciHigh = this.formatNumber(row.ci_high);

            return `
                <div class="plot-tooltip">
                    <div class="plot-tooltip__title">${label}</div>
                    <div class="plot-tooltip__row"><span class="plot-tooltip__label">Dataset ID</span><span class="plot-tooltip__value">${datasetId}</span></div>
                    <div class="plot-tooltip__row"><span class="plot-tooltip__label">Species</span><span class="plot-tooltip__value">${species}</span></div>
                    <div class="plot-tooltip__row"><span class="plot-tooltip__label">Effect</span><span class="plot-tooltip__value">${effect}</span></div>
                    <div class="plot-tooltip__row"><span class="plot-tooltip__label">CI low</span><span class="plot-tooltip__value">${ciLow}</span></div>
                    <div class="plot-tooltip__row"><span class="plot-tooltip__label">CI high</span><span class="plot-tooltip__value">${ciHigh}</span></div>
                </div>
            `;
        },
        selectOutcome(outcomeId) {
            this.selectedOutcomeId = outcomeId;
            this.syncParams();

            this.$nextTick(() => {
                const section = document.querySelector(
                    `[data-outcome-id="${outcomeId}"]`
                );

                if (section) {
                    section.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            });
        },
        toggleOutcome(outcomeId) {
            this.$set(
                this.expandedOutcomes,
                outcomeId,
                !this.expandedOutcomes[outcomeId]
            );
        },
        isOutcomeExpanded(outcomeId) {
            return !!this.expandedOutcomes[outcomeId];
        },
        isOutcomeInFocus(outcomeId) {
            if (this.activeScrolledOutcomeId) {
                return this.activeScrolledOutcomeId === outcomeId;
            }

            return this.selectedOutcomeId === outcomeId;
        },
        refreshScrolledOutcome() {
            const sections = Array.from(
                document.querySelectorAll("[data-outcome-id]")
            ).filter((section) =>
                this.isOutcomeSectionVisible(section.dataset.outcomeId)
            );

            if (!sections.length) {
                this.activeScrolledOutcomeId = null;
                return;
            }

            const topAnchor = 0;
            let closestBelowTop = null;
            let lastAboveTop = null;

            sections.forEach((section) => {
                const rect = section.getBoundingClientRect();
                const distance = rect.top - topAnchor;

                if (distance <= 0) {
                    if (!lastAboveTop || rect.top > lastAboveTop.rect.top) {
                        lastAboveTop = { id: section.dataset.outcomeId, rect };
                    }
                } else if (
                    !closestBelowTop ||
                    distance < closestBelowTop.distance
                ) {
                    closestBelowTop = {
                        id: section.dataset.outcomeId,
                        distance,
                    };
                }
            });

            this.activeScrolledOutcomeId =
                (closestBelowTop && closestBelowTop.id) ||
                (lastAboveTop && lastAboveTop.id) ||
                this.selectedOutcomeId;
        },
        setupScrollTracking() {
            if (this.scrollHandler) {
                window.removeEventListener("scroll", this.scrollHandler);
            }

            this.scrollHandler = () => {
                this.refreshScrolledOutcome();
            };

            window.addEventListener("scroll", this.scrollHandler, {
                passive: true,
            });
            this.refreshScrolledOutcome();
        },
        speciesClass(species) {
            if (species === "Homo sapiens") {
                return "human";
            }

            if (species === "Mus musculus") {
                return "mouse";
            }

            return "other";
        },
        syncParams() {
            if (!this.showGeneResults) {
                keyParams.set({
                    gene: undefined,
                    outcome: undefined,
                });
                return;
            }

            const params = {
                gene: this.selectedGene || undefined,
                outcome: undefined,
            };
            const visibleIds = this.activeOutcomeIds.filter(
                (id) => this.visibleOutcomes[id] !== false
            );

            if (
                this.urlOutcomeFilter &&
                visibleIds.length === 1 &&
                visibleIds[0] === this.urlOutcomeFilter
            ) {
                params.outcome = this.urlOutcomeFilter;
            }

            keyParams.set(params);
        },
    },

    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
