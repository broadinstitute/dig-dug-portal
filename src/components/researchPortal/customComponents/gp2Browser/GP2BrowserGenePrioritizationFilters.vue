<template>
    <div class="gp2-gp-filters">
        <div class="gp2-gp-filter-row gp2-gp-filter-row-primary">
            <div class="gp2-gp-filter gp2-gp-filter-gene">
                <label class="gp2-gp-filter-label" for="gp2-gp-gene-search">Gene search</label>
                <input
                    id="gp2-gp-gene-search"
                    type="text"
                    class="gp2-gp-gene-input"
                    placeholder="e.g. LRRK2, GBA1"
                    :value="filters.geneSearch"
                    @input="onGeneSearchInput"
                />
            </div>

            <div class="gp2-gp-filter gp2-gp-filter-category">
                <label class="gp2-gp-filter-label" for="gp2-gp-evidence-category">Evidence Category</label>
                <select
                    id="gp2-gp-evidence-category"
                    class="gp2-gp-category-select"
                    :value="filters.evidenceCategory"
                    @change="onCategoryChange"
                >
                    <option value="">All</option>
                    <option v-for="category in evidenceCategories" :key="category" :value="category">
                        {{ category }}
                    </option>
                </select>
            </div>

            <div class="gp2-gp-filter gp2-gp-filter-slider">
                <label class="gp2-gp-filter-label" :for="`gp2-gp-slider-${evidenceScoreField.field}`">
                    {{ evidenceScoreField.label }}
                </label>
                <div class="gp2-gp-slider-row">
                    <span class="gp2-gp-slider-value">
                        {{ formatBound(filters.scoreMin[evidenceScoreField.field]) }}
                    </span>
                    <span class="gp2-gp-slider-bound">{{ formatBound(evidenceScoreField.min) }}</span>
                    <input
                        :id="`gp2-gp-slider-${evidenceScoreField.field}`"
                        type="range"
                        class="gp2-gp-slider"
                        :min="evidenceScoreField.min"
                        :max="sliderMax(evidenceScoreField)"
                        :step="sliderStep(evidenceScoreField)"
                        :value="filters.scoreMin[evidenceScoreField.field]"
                        @input="onScoreMinInput(evidenceScoreField.field, $event)"
                    />
                    <span class="gp2-gp-slider-bound">{{ formatBound(sliderMax(evidenceScoreField)) }}</span>
                </div>
            </div>
        </div>

        <div class="gp2-gp-filter-row gp2-gp-filter-row-sliders">
            <div
                v-for="score in otherScoreFields"
                :key="score.field"
                class="gp2-gp-filter gp2-gp-filter-slider gp2-gp-filter-slider-compact"
            >
                <label class="gp2-gp-filter-label" :for="`gp2-gp-slider-${score.field}`">
                    {{ score.label }}
                </label>
                <div class="gp2-gp-slider-row">
                    <span class="gp2-gp-slider-value">
                        {{ formatBound(filters.scoreMin[score.field]) }}
                    </span>
                    <span class="gp2-gp-slider-bound">{{ formatBound(score.min) }}</span>
                    <input
                        :id="`gp2-gp-slider-${score.field}`"
                        type="range"
                        class="gp2-gp-slider"
                        :min="score.min"
                        :max="sliderMax(score)"
                        :step="sliderStep(score)"
                        :value="filters.scoreMin[score.field]"
                        @input="onScoreMinInput(score.field, $event)"
                    />
                    <span class="gp2-gp-slider-bound">{{ formatBound(sliderMax(score)) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {
    GP2_GENE_PRIORITIZATION_SCORE_FIELDS,
    gp2GenePrioritizationEvidenceCategories,
    gp2GenePrioritizationMaxEvidenceScore,
} from "./gp2BrowserGenePrioritizationApi.js";

export default {
    name: "GP2BrowserGenePrioritizationFilters",
    props: {
        rows: {
            type: Array,
            default: () => [],
        },
        filters: {
            type: Object,
            required: true,
        },
    },
    computed: {
        evidenceScoreField() {
            return GP2_GENE_PRIORITIZATION_SCORE_FIELDS[0];
        },
        otherScoreFields() {
            return GP2_GENE_PRIORITIZATION_SCORE_FIELDS.slice(1);
        },
        evidenceCategories() {
            return gp2GenePrioritizationEvidenceCategories(this.rows);
        },
        maxEvidenceScore() {
            return gp2GenePrioritizationMaxEvidenceScore(this.rows);
        },
    },
    methods: {
        sliderMax(score) {
            return score.max == null ? this.maxEvidenceScore : score.max;
        },
        sliderStep(score) {
            return this.sliderMax(score) > 1 ? 0.1 : 0.01;
        },
        formatBound(value) {
            const number = Number(value);
            if (!Number.isFinite(number)) {
                return "0";
            }
            return (Math.round(number * 100) / 100).toString();
        },
        onGeneSearchInput(event) {
            this.emitFilters({ geneSearch: event?.target?.value || "" });
        },
        onCategoryChange(event) {
            this.emitFilters({ evidenceCategory: event?.target?.value || "" });
        },
        onScoreMinInput(field, event) {
            const value = Number(event?.target?.value);
            this.emitFilters({
                scoreMin: {
                    ...this.filters.scoreMin,
                    [field]: Number.isFinite(value) ? value : 0,
                },
            });
        },
        emitFilters(partial) {
            this.$emit("update:filters", { ...this.filters, ...partial });
        },
    },
};
</script>

<style scoped>
.gp2-gp-filters {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 14px;
    margin-bottom: 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #fafafa;
}

.gp2-gp-filter-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 14px 22px;
}

.gp2-gp-filter-row-primary {
    align-items: flex-end;
}

.gp2-gp-filter {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.gp2-gp-filter-label {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--cfde-ink, #33363d);
    white-space: normal;
    word-break: break-word;
}

.gp2-gp-filter-gene,
.gp2-gp-filter-category {
    min-width: 170px;
}

.gp2-gp-gene-input,
.gp2-gp-category-select {
    font-size: 13px;
    padding: 5px 10px;
    border-radius: 15px;
    border: solid 1px #aaa;
    background-color: #fff;
}

.gp2-gp-filter-row-sliders .gp2-gp-filter-label {
    min-height: 2.4em;
}

.gp2-gp-filter-slider {
    min-width: 150px;
    width: 150px;
}

.gp2-gp-filter-slider-compact {
    min-width: 110px;
    width: 110px;
}

.gp2-gp-slider-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;
    align-items: center;
    column-gap: 6px;
}

.gp2-gp-slider-value {
    grid-column: 1 / 4;
    grid-row: 1;
    justify-self: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.gp2-gp-slider {
    grid-column: 2;
    grid-row: 2;
    width: 100%;
}

.gp2-gp-slider-bound {
    grid-row: 2;
    font-size: 10px;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
