<template>
    <div class="vks-welcome" role="region" aria-labelledby="vks-welcome-title">
        <div class="vks-welcome-card">
            <header class="vks-welcome-head">
                <h2 id="vks-welcome-title">Welcome to Variant Sifter</h2>
                <p class="vks-welcome-lead">
                    Variant Sifter helps you explore genetic associations, credible
                    sets, enrichment, and variant-to-gene links across a shared genomic
                    locus. Stack section visualizers, filter each track, and compare
                    variants that survive your cross-section criteria.
                </p>
            </header>

            <form class="vks-welcome-form" @submit.prevent="onSubmit">
                <h3 class="vks-welcome-form-title">Start a new search</h3>

                <div class="vks-welcome-fields">
                    <div class="vks-welcome-field">
                        <label class="vks-welcome-label" :for="phenotypeInputId">
                            Phenotype
                        </label>
                        <div class="vks-welcome-typeahead">
                            <input
                                :id="phenotypeInputId"
                                v-model="phenotypeQuery"
                                type="text"
                                class="vks-welcome-input"
                                autocomplete="off"
                                placeholder="Search phenotype"
                                @focus="phenotypeListOpen = true"
                                @input="onPhenotypeInput"
                            />
                            <div
                                v-if="phenotypeListOpen && phenotypeSuggestions.length"
                                class="vks-welcome-suggestions"
                                role="listbox"
                            >
                                <button
                                    v-for="phenotype in phenotypeSuggestions"
                                    :key="phenotype.name"
                                    type="button"
                                    class="vks-welcome-suggestion"
                                    role="option"
                                    @mousedown.prevent="selectPhenotype(phenotype)"
                                >
                                    <span class="vks-welcome-suggestion-label">
                                        {{ phenotype.description }}
                                    </span>
                                    <span class="vks-welcome-suggestion-meta">
                                        {{ phenotype.name }}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="vks-welcome-field">
                        <label class="vks-welcome-label" :for="ancestrySelectId">
                            Ancestry
                        </label>
                        <select
                            :id="ancestrySelectId"
                            v-model="selectedAncestry"
                            class="vks-welcome-select"
                        >
                            <option value="">All ancestries</option>
                            <option
                                v-for="ancestry in ancestryOptions"
                                :key="ancestry"
                                :value="ancestry"
                            >
                                {{ formatAncestry(ancestry) }}
                            </option>
                        </select>
                    </div>

                    <div class="vks-welcome-field vks-welcome-field--wide">
                        <label class="vks-welcome-label" :for="locusInputId">
                            Gene or variant
                        </label>
                        <input
                            :id="locusInputId"
                            v-model="geneOrVariantQuery"
                            type="text"
                            class="vks-welcome-input"
                            placeholder="e.g. PCSK9, rs11716727, chr1:100000-200000"
                        />
                        <p class="vks-welcome-hint">
                            Genes and variants are converted to a genomic region for
                            the locus view. You can also enter a region directly as
                            chr:start-end.
                        </p>
                    </div>

                    <div class="vks-welcome-field">
                        <label class="vks-welcome-label" :for="expandSelectId">
                            Region expand
                        </label>
                        <select
                            :id="expandSelectId"
                            v-model="regionExpandBp"
                            class="vks-welcome-select"
                        >
                            <option
                                v-for="option in regionExpandOptions"
                                :key="String(option.value)"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                </div>

                <p v-if="resolvedRegionLabel" class="vks-welcome-region-preview">
                    Region preview:
                    <strong>{{ resolvedRegionLabel }}</strong>
                </p>

                <p v-if="errorMessage" class="vks-welcome-error" role="alert">
                    {{ errorMessage }}
                </p>

                <footer class="vks-welcome-footer">
                    <button
                        type="submit"
                        class="vks-welcome-submit"
                        :disabled="submitting"
                    >
                        {{ submitting ? "Resolving locus…" : "Start exploring" }}
                    </button>
                </footer>
            </form>
        </div>
    </div>
</template>

<script>
import Formatters from "@/utils/formatters";
import {
    REGION_EXPAND_OPTIONS,
    filterPhenotypes,
    formatRegion,
    resolveGeneOrVariantToRegion,
} from "./variantSifterSearchUtils.js";

let welcomeFieldCounter = 0;

export default {
    name: "VariantSifterWelcomePanel",
    props: {
        phenotypes: {
            type: Array,
            default: () => [],
        },
        ancestries: {
            type: Array,
            default: () => [],
        },
        utils: {
            type: Object,
            default: null,
        },
        initialValues: {
            type: Object,
            default: null,
        },
    },
    data() {
        welcomeFieldCounter += 1;
        const suffix = welcomeFieldCounter;
        return {
            phenotypeInputId: `vks-welcome-phenotype-${suffix}`,
            ancestrySelectId: `vks-welcome-ancestry-${suffix}`,
            locusInputId: `vks-welcome-locus-${suffix}`,
            expandSelectId: `vks-welcome-expand-${suffix}`,
            phenotypeQuery: "",
            selectedPhenotype: null,
            selectedAncestry: "",
            geneOrVariantQuery: "",
            regionExpandBp: null,
            phenotypeListOpen: false,
            errorMessage: "",
            submitting: false,
            resolvedRegionLabel: "",
            regionExpandOptions: REGION_EXPAND_OPTIONS,
        };
    },
    computed: {
        phenotypeSuggestions() {
            return filterPhenotypes(this.phenotypes, this.phenotypeQuery);
        },
        ancestryOptions() {
            const values = (this.ancestries || []).filter(
                (ancestry) => ancestry && ancestry !== "Mixed"
            );
            return [...new Set(values)].sort();
        },
    },
    watch: {
        initialValues: {
            immediate: true,
            handler(values) {
                if (!values) {
                    return;
                }
                this.applyInitialValues(values);
            },
        },
        geneOrVariantQuery() {
            this.resolvedRegionLabel = "";
            this.errorMessage = "";
        },
    },
    mounted() {
        document.addEventListener("click", this.onDocumentClick);
    },
    beforeDestroy() {
        document.removeEventListener("click", this.onDocumentClick);
    },
    methods: {
        formatAncestry: Formatters.ancestryFormatter,
        applyInitialValues(values) {
            if (values.phenotype) {
                const match = (this.phenotypes || []).find(
                    (phenotype) => phenotype.name === values.phenotype
                );
                if (match) {
                    this.selectPhenotype(match);
                } else {
                    this.phenotypeQuery = values.phenotype;
                }
            }
            if (values.ancestry != null) {
                this.selectedAncestry = values.ancestry;
            }
            if (values.geneOrVariantQuery) {
                this.geneOrVariantQuery = values.geneOrVariantQuery;
            }
            if (values.regionExpandBp != null) {
                this.regionExpandBp = values.regionExpandBp;
            }
        },
        onDocumentClick(event) {
            if (!this.$el.contains(event.target)) {
                this.phenotypeListOpen = false;
            }
        },
        onPhenotypeInput() {
            this.phenotypeListOpen = true;
            this.selectedPhenotype = null;
            this.errorMessage = "";
        },
        selectPhenotype(phenotype) {
            this.selectedPhenotype = phenotype;
            this.phenotypeQuery = phenotype.description;
            this.phenotypeListOpen = false;
            this.errorMessage = "";
        },
        async onSubmit() {
            this.errorMessage = "";
            this.resolvedRegionLabel = "";

            const phenotype =
                this.selectedPhenotype ||
                (this.phenotypes || []).find(
                    (entry) =>
                        entry.name === this.phenotypeQuery ||
                        entry.description === this.phenotypeQuery
                );

            if (!phenotype) {
                this.errorMessage = "Select a phenotype to continue.";
                return;
            }

            if (!this.geneOrVariantQuery.trim()) {
                this.errorMessage =
                    "Enter a gene, variant, or genomic region (chr:start-end).";
                return;
            }

            if (!this.utils?.regionUtils) {
                this.errorMessage = "Search utilities are not available.";
                return;
            }

            this.submitting = true;
            try {
                const region = await resolveGeneOrVariantToRegion(
                    this.geneOrVariantQuery,
                    this.utils.regionUtils,
                    this.regionExpandBp
                );

                if (!region) {
                    this.errorMessage =
                        "Could not resolve that gene, variant, or region. Check the format and try again.";
                    return;
                }

                this.resolvedRegionLabel = formatRegion(region);
                this.$emit("start-search", {
                    phenotype,
                    ancestry: this.selectedAncestry || null,
                    region,
                    regionLabel: this.resolvedRegionLabel,
                    geneOrVariantQuery: this.geneOrVariantQuery.trim(),
                    regionExpandBp: this.regionExpandBp,
                });
            } finally {
                this.submitting = false;
            }
        },
    },
};
</script>

<style scoped>
.vks-welcome {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 28px 52px 28px 20px;
    overflow-y: auto;
    pointer-events: none;
}

.vks-welcome-card {
    pointer-events: auto;
    width: min(760px, 100%);
    background: #ffffff;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 12px;
    box-shadow: 0 12px 36px rgba(20, 22, 30, 0.1);
}

.vks-welcome-head {
    padding: 22px 24px 10px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.vks-welcome-head h2 {
    margin: 0 0 8px;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.vks-welcome-lead {
    margin: 0;
    font-size: 14px;
    line-height: 1.55;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-welcome-form {
    padding: 18px 24px 22px;
}

.vks-welcome-form-title {
    margin: 0 0 14px;
    font-size: 15px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.vks-welcome-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 16px;
}

.vks-welcome-field--wide {
    grid-column: 1 / -1;
}

.vks-welcome-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-welcome-input,
.vks-welcome-select {
    box-sizing: border-box;
    width: 100%;
    min-height: 36px;
    padding: 7px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #ffffff;
    font-size: 14px;
    color: var(--cfde-ink, #33363d);
}

.vks-welcome-input:focus,
.vks-welcome-select:focus {
    outline: 2px solid rgba(44, 92, 151, 0.25);
    border-color: var(--cfde-blue, #2c5c97);
}

.vks-welcome-hint {
    margin: 6px 0 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-welcome-typeahead {
    position: relative;
}

.vks-welcome-suggestions {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 8;
    max-height: 220px;
    overflow-y: auto;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(20, 22, 30, 0.12);
}

.vks-welcome-suggestion {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
    background: #ffffff;
    text-align: left;
    cursor: pointer;
}

.vks-welcome-suggestion:last-child {
    border-bottom: none;
}

.vks-welcome-suggestion:hover {
    background: var(--cfde-orange-soft, #fbeee3);
}

.vks-welcome-suggestion-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-welcome-suggestion-meta {
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-welcome-region-preview {
    margin: 14px 0 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-welcome-region-preview strong {
    color: var(--cfde-ink, #33363d);
}

.vks-welcome-error {
    margin: 12px 0 0;
    font-size: 13px;
    color: #b42318;
}

.vks-welcome-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 18px;
}

.vks-welcome-submit {
    border: none;
    border-radius: 8px;
    padding: 10px 18px;
    background: var(--cfde-blue, #2c5c97);
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
}

.vks-welcome-submit:hover:not(:disabled) {
    background: #234a7d;
}

.vks-welcome-submit:disabled {
    opacity: 0.7;
    cursor: wait;
}

@media (max-width: 720px) {
    .vks-welcome {
        padding-right: 20px;
    }

    .vks-welcome-fields {
        grid-template-columns: 1fr;
    }
}
</style>
