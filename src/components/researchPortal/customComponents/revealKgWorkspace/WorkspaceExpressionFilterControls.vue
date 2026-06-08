<template>
    <div
        class="wkb-expression-filter"
        :class="{
            'wkb-expression-filter--compact': compact,
            'wkb-expression-filter--has-tissue': supportsTissue,
        }"
    >
        <label v-if="references.length" class="wkb-expression-filter-field">
            <span class="wkb-expression-filter-label">Expression reference</span>
            <select
                class="wkb-expression-filter-select"
                :value="selectedReferenceId"
                @change="onReferenceChange"
            >
                <option
                    v-for="reference in references"
                    :key="reference.reference_id"
                    :value="reference.reference_id"
                >
                    {{ reference.label }}
                </option>
            </select>
        </label>

        <label v-if="supportsTissue" class="wkb-expression-filter-field">
            <span class="wkb-expression-filter-label">Tissue</span>
            <select
                v-if="useSelectDropdowns && tissues.length"
                class="wkb-expression-filter-select"
                :value="filters.expressionTissue || ''"
                @change="onTissueChange"
            >
                <option value="">Select tissue</option>
                <option v-for="tissue in tissues" :key="tissue" :value="tissue">
                    {{ tissue }}
                </option>
            </select>
            <input
                v-else
                class="wkb-expression-filter-input"
                list="wkb-expression-filter-tissues"
                :value="filters.expressionTissue || ''"
                placeholder="Select tissue"
                @input="onTissueInput"
            />
            <datalist v-if="!useSelectDropdowns || !tissues.length" id="wkb-expression-filter-tissues">
                <option v-for="tissue in tissues" :key="tissue" :value="tissue" />
            </datalist>
        </label>

        <label class="wkb-expression-filter-field">
            <span class="wkb-expression-filter-label">{{ cellTypeLabel }}</span>
            <select
                v-if="useSelectDropdowns"
                class="wkb-expression-filter-select"
                :value="filters.expressionCellType || ''"
                :disabled="cellTypeSelectDisabled"
                @change="onCellTypeChange"
            >
                <option value="">
                    {{
                        supportsTissue && !selectedTissue
                            ? "Select tissue first"
                            : "Select cell type"
                    }}
                </option>
                <option v-for="cellType in cellTypes" :key="cellType" :value="cellType">
                    {{ cellType }}
                </option>
            </select>
            <input
                v-else
                class="wkb-expression-filter-input"
                list="wkb-expression-filter-cell-types"
                :value="filters.expressionCellType || ''"
                :placeholder="
                    supportsTissue && !selectedTissue
                        ? 'Select tissue first'
                        : 'Select cell type'
                "
                @input="onCellTypeInput"
            />
            <datalist v-if="!useSelectDropdowns" id="wkb-expression-filter-cell-types">
                <option v-for="cellType in cellTypes" :key="cellType" :value="cellType" />
            </datalist>
        </label>

        <label class="wkb-expression-filter-field wkb-expression-filter-field--narrow">
            <span class="wkb-expression-filter-label">Abs. min</span>
            <input
                class="wkb-expression-filter-input"
                type="number"
                step="any"
                :value="filters.expressionAbsoluteMin || ''"
                placeholder="per10k"
                @input="onAbsoluteMinInput"
            />
        </label>

        <label class="wkb-expression-filter-field wkb-expression-filter-field--narrow">
            <span class="wkb-expression-filter-label">Rel. max</span>
            <input
                class="wkb-expression-filter-input"
                type="number"
                step="any"
                :value="filters.expressionRelativeMax || ''"
                placeholder="p-value"
                @input="onRelativeMaxInput"
            />
        </label>
    </div>
</template>

<script>
export default {
    name: "WorkspaceExpressionFilterControls",
    props: {
        filters: {
            type: Object,
            required: true,
        },
        options: {
            type: Object,
            default: null,
        },
        compact: {
            type: Boolean,
            default: false,
        },
        cellTypeLabel: {
            type: String,
            default: "Expression",
        },
        useSelectDropdowns: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        references() {
            return this.options?.references || [];
        },
        selectedReferenceId() {
            return (
                this.filters.expressionReferenceId ||
                this.options?.default_reference_id ||
                ""
            );
        },
        reference() {
            return (
                this.references.find(
                    (item) => item.reference_id === this.selectedReferenceId
                ) || null
            );
        },
        supportsTissue() {
            return Boolean(this.reference?.supports_tissue);
        },
        tissues() {
            return this.reference?.tissues || [];
        },
        defaultTissue() {
            if (this.supportsTissue) {
                return "";
            }
            return this.reference?.default_tissue || this.reference?.tissue || "";
        },
        selectedTissue() {
            return this.supportsTissue
                ? this.filters.expressionTissue || ""
                : this.defaultTissue;
        },
        cellTypes() {
            if (this.selectedTissue) {
                return this.reference?.cell_types_by_tissue?.[this.selectedTissue] || [];
            }
            return this.reference?.cell_types || this.options?.cell_types || [];
        },
        cellTypeSelectDisabled() {
            return this.supportsTissue && !this.selectedTissue;
        },
    },
    methods: {
        onReferenceChange(event) {
            const nextReferenceId = event.target.value;
            const nextReference =
                this.references.find((item) => item.reference_id === nextReferenceId) ||
                null;
            this.$emit("change", {
                expressionReferenceId: nextReferenceId,
                expressionTissue: nextReference?.supports_tissue
                    ? ""
                    : nextReference?.default_tissue || nextReference?.tissue || "",
                expressionCellType: "",
            });
        },
        onTissueChange(event) {
            this.$emit("change", {
                expressionTissue: event.target.value,
                expressionCellType: "",
            });
        },
        onTissueInput(event) {
            this.$emit("change", {
                expressionTissue: event.target.value,
                expressionCellType: "",
            });
        },
        onCellTypeChange(event) {
            this.$emit("change", {
                expressionCellType: event.target.value,
            });
        },
        onCellTypeInput(event) {
            this.$emit("change", {
                expressionCellType: event.target.value,
            });
        },
        onAbsoluteMinInput(event) {
            this.$emit("change", {
                expressionAbsoluteMin: event.target.value,
            });
        },
        onRelativeMaxInput(event) {
            this.$emit("change", {
                expressionRelativeMax: event.target.value,
            });
        },
    },
};
</script>

<style scoped>
.wkb-expression-filter {
    display: grid;
    gap: 10px;
}

.wkb-expression-filter--compact {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.wkb-expression-filter-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    min-width: 0;
}

.wkb-expression-filter-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-expression-filter-select,
.wkb-expression-filter-input {
    width: 100%;
    padding: 6px 28px 6px 8px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;
    background-color: #ffffff;
    color: var(--cfde-ink, #33363d);
}

.wkb-expression-filter-select {
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2333363d' d='M1.5 1.5 6 6l4.5-4.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 10px 6px;
    cursor: pointer;
}

.wkb-expression-filter-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--cfde-bg, #f6f5f2);
}

.wkb-expression-filter-field--narrow {
    max-width: 120px;
}
</style>
