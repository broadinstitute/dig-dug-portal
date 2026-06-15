import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";
import keyParams from "@/utils/keyParams";

import pageIndex from "../../data/transcriptomicPrototype/index.json";
import geneIndex from "../../data/transcriptomicPrototype/genes_index.json";
import outcomeIndex from "../../data/transcriptomicPrototype/outcomes_index.json";
import ADIPOQ from "../../data/transcriptomicPrototype/genes/ADIPOQ.json";
import LEP from "../../data/transcriptomicPrototype/genes/LEP.json";
import PLIN1 from "../../data/transcriptomicPrototype/genes/PLIN1.json";
import PPARG from "../../data/transcriptomicPrototype/genes/PPARG.json";
import UCP1 from "../../data/transcriptomicPrototype/genes/UCP1.json";

const genePayloads = {
    ADIPOQ,
    LEP,
    PLIN1,
    PPARG,
    UCP1,
};

new Vue({
    mixins: [matkpMixin],

    data() {
        return {
            pageIndex,
            geneIndex,
            outcomeIndex,
            genesBySymbol: genePayloads,
            selectedGene: pageIndex.default_gene,
            geneQuery: pageIndex.default_gene,
            selectedOutcomeId: null,
            expandedOutcomes: {},
            activeScrolledOutcomeId: null,
            scrollHandler: null,
        };
    },

    computed: {
        activeGene() {
            return (
                this.genesBySymbol[this.selectedGene] ||
                this.genesBySymbol[this.pageIndex.default_gene]
            );
        },
        geneSummaryCards() {
            if (!this.activeGene) {
                return [];
            }

            return [
                {
                    label: "Demo genes",
                    value: this.pageIndex.gene_count,
                },
                {
                    label: "Datasets represented",
                    value: this.activeGene.page_summary.dataset_count,
                },
                {
                    label: "Supported outcomes",
                    value: this.activeGene.page_summary.outcome_count,
                },
                {
                    label: "Pooled outcome sections",
                    value: this.activeGene.page_summary.pooled_outcome_count,
                },
            ];
        },
        activeOutcomeIds() {
            return this.activeGene ? this.activeGene.supported_outcomes : [];
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
                const domain = this.getOutcomeDomain(outcome.rows);
                return {
                    ...outcome,
                    domain,
                    ticks: this.buildTicks(domain),
                    plotRows: outcome.rows.map((row) =>
                        this.decorateRowForPlot(row, domain)
                    ),
                };
            });
        },
    },

    created() {
        const requestedGene = keyParams.gene;
        const requestedOutcome = keyParams.outcome;

        if (requestedGene && this.genesBySymbol[requestedGene]) {
            this.selectedGene = requestedGene;
            this.geneQuery = requestedGene;
        }

        this.selectedOutcomeId =
            requestedOutcome &&
            this.activeOutcomeIds.includes(requestedOutcome)
                ? requestedOutcome
                : this.activeOutcomeIds[0];

        this.syncParams();
    },
    mounted() {
        this.$nextTick(() => {
            this.setupScrollTracking();
        });
    },
    beforeDestroy() {
        if (this.scrollHandler) {
            window.removeEventListener("scroll", this.scrollHandler);
            this.scrollHandler = null;
        }
    },

    methods: {
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
        loadGene() {
            const normalizedGene = String(this.geneQuery || "")
                .trim()
                .toUpperCase();

            if (!this.genesBySymbol[normalizedGene]) {
                this.geneQuery = this.selectedGene;
                return;
            }

            this.onGeneChange(normalizedGene);
        },
        onGeneChange(gene) {
            if (!this.genesBySymbol[gene]) {
                return;
            }

            this.selectedGene = gene;
            this.geneQuery = gene;
            this.expandedOutcomes = {};

            if (!this.activeOutcomeIds.includes(this.selectedOutcomeId)) {
                this.selectedOutcomeId = this.activeOutcomeIds[0];
            }

            this.syncParams();
            this.$nextTick(() => {
                this.setupScrollTracking();
            });
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
            keyParams.set({
                gene: this.selectedGene,
                outcome: this.selectedOutcomeId,
            });
        },
    },

    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
