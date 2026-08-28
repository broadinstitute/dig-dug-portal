<template>
    <div class="vks-assoc-filters">
        <div v-if="activeFilterCount > 1" class="vks-assoc-filter-reset-row">
            <button
                type="button"
                class="btn btn-warning btn-sm vks-assoc-filter-reset"
                @click="clearAllFilters"
            >
                Clear all filters
            </button>
        </div>

        <div class="vks-assoc-filter-columns">
            <section
                v-for="group in filterGroups"
                :key="group.id"
                class="vks-assoc-filter-column"
            >
                <h4 class="vks-assoc-filter-column-title">{{ group.label }}</h4>
                <div
                    v-for="filter in group.filters"
                    :key="filter.field"
                    class="vks-assoc-filter-field"
                    :class="{
                        'is-checkbox':
                            filter.type === 'checkbox' || filter.type === 'boolean',
                    }"
                >
                    <div
                        v-if="showFieldLabel(group, filter)"
                        class="vks-assoc-filter-label"
                    >
                        {{ filter.label }}
                    </div>
                    <template
                        v-if="
                            filter.type === 'search' ||
                            filter.type === 'search lower than' ||
                            filter.type === 'search greater than'
                        "
                    >
                        <input
                            type="text"
                            class="form-control vks-assoc-filter-input"
                            :id="inputId(filter.field)"
                            :list="
                                filter.type === 'search'
                                    ? datalistId(filter.field)
                                    : null
                            "
                            :value="textFilterValue(filter)"
                            @change="onFilterInput($event, filter)"
                        />
                        <datalist
                            v-if="filter.type === 'search'"
                            :id="datalistId(filter.field)"
                        >
                            <option
                                v-for="option in searchSuggestions(filter.field)"
                                :key="`${filter.field}-${option}`"
                                :value="option"
                            ></option>
                        </datalist>
                    </template>
                    <template v-else-if="filter.type === 'checkbox'">
                        <div
                            class="vks-assoc-filter-checkboxes"
                            role="group"
                            :aria-label="filter.label"
                        >
                            <label
                                v-for="option in checkboxOptions(filter.field)"
                                :key="`${filter.field}-${optionValue(option)}`"
                                class="vks-assoc-filter-check"
                            >
                                <input
                                    type="checkbox"
                                    :checked="
                                        isCheckboxSelected(
                                            filter.field,
                                            optionValue(option)
                                        )
                                    "
                                    @change="
                                        onCheckboxToggle(
                                            filter,
                                            optionValue(option),
                                            $event
                                        )
                                    "
                                />
                                <span>{{ optionLabel(option) }}</span>
                            </label>
                            <p
                                v-if="!checkboxOptions(filter.field).length"
                                class="vks-assoc-filter-empty"
                            >
                                No options available.
                            </p>
                        </div>
                    </template>
                    <template v-else-if="filter.type === 'boolean'">
                        <label class="vks-assoc-filter-check">
                            <input
                                type="checkbox"
                                :checked="isBooleanSelected(filter.field)"
                                @change="onBooleanToggle(filter, $event)"
                            />
                            <span>{{ filter.label }}</span>
                        </label>
                    </template>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import {
    applyAssociationsFilters,
    associationsFilterGroupsForContext,
    associationsFiltersForContext,
    buildFilterOptions,
    cloneFiltersIndex,
    createFiltersIndex,
    OVERLAPPING_VARIANTS_FILTER_FIELD,
} from "./variantSifterAssociationsFilters.js";

export default {
    name: "VariantSifterAssociationsFilters",
    props: {
        rows: {
            type: Array,
            default: () => [],
        },
        filters: {
            type: Array,
            default: null,
        },
        filtersIndex: {
            type: Object,
            default: null,
        },
        includeProject: {
            type: Boolean,
            default: false,
        },
        includePhenotype: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        resolvedFilters() {
            if (Array.isArray(this.filters) && this.filters.length) {
                return this.filters;
            }
            return associationsFiltersForContext({
                includeProject: this.includeProject,
                includePhenotype: this.includePhenotype,
            });
        },
        activeFiltersIndex() {
            const base = createFiltersIndex(this.resolvedFilters);
            const incoming = this.filtersIndex || {};
            Object.keys(base).forEach((field) => {
                if (!incoming[field]) {
                    return;
                }
                base[field] = {
                    ...base[field],
                    ...incoming[field],
                    search: [...(incoming[field].search || [])],
                };
            });
            return base;
        },
        filterByField() {
            const map = {};
            this.resolvedFilters.forEach((filter) => {
                map[filter.field] = filter;
            });
            return map;
        },
        filterGroups() {
            return associationsFilterGroupsForContext({
                includeProject: this.includeProject,
                includePhenotype: this.includePhenotype,
            }).map((group) => ({
                ...group,
                filters: group.fields
                    .map((field) => this.filterByField[field])
                    .filter(Boolean),
            }));
        },
        filteredRows() {
            return applyAssociationsFilters(this.rows, this.activeFiltersIndex);
        },
        activeFilterCount() {
            return Object.values(this.activeFiltersIndex).reduce((count, filter) => {
                if (filter.field === OVERLAPPING_VARIANTS_FILTER_FIELD) {
                    return (
                        count +
                        ((filter.search || []).some(
                            (value) => value === true || value === "true"
                        )
                            ? 1
                            : 0)
                    );
                }
                return count + ((filter.search || []).length > 0 ? 1 : 0);
            }, 0);
        },
    },
    watch: {
        filteredRows: {
            handler(rows) {
                this.$emit("filtered", rows);
            },
            immediate: true,
        },
    },
    methods: {
        inputId(field) {
            return `vks_assoc_filter_${this.getColumnId(field)}`;
        },
        datalistId(field) {
            return `${this.inputId(field)}_list`;
        },
        getColumnId(label) {
            return label.replace(/\W/g, "").toLowerCase();
        },
        showFieldLabel(group, filter) {
            if (filter.type === "boolean") {
                return false;
            }
            if (filter.type === "checkbox" && group.fields.length === 1) {
                return false;
            }
            if (
                filter.type === "checkbox" &&
                group.id === "phenotype" &&
                filter.field === "Phenotype"
            ) {
                return false;
            }
            return true;
        },
        checkboxOptions(field) {
            return buildFilterOptions(this.rows, field);
        },
        optionValue(option) {
            if (option && typeof option === "object") {
                return option.value;
            }
            return option;
        },
        optionLabel(option) {
            if (option && typeof option === "object") {
                return option.label || option.value;
            }
            return option;
        },
        searchSuggestions(field) {
            return buildFilterOptions(this.rows, field)
                .map((option) => this.optionValue(option))
                .slice(0, 500);
        },
        isCheckboxSelected(field, option) {
            return (this.activeFiltersIndex[field]?.search || []).includes(option);
        },
        isBooleanSelected(field) {
            return (this.activeFiltersIndex[field]?.search || []).some(
                (value) => value === true || value === "true"
            );
        },
        textFilterValue(filter) {
            const values = this.activeFiltersIndex[filter.field]?.search || [];
            return values.join(", ");
        },
        emitFiltersIndex(nextIndex) {
            this.$emit("update:filtersIndex", nextIndex);
        },
        onFilterInput(event, filter) {
            const searchValue = event.target.value.trim();
            const field = filter.field;
            const nextIndex = cloneFiltersIndex(this.activeFiltersIndex);
            const filterState = nextIndex[field];

            if (!searchValue) {
                filterState.search = [];
                this.emitFiltersIndex(nextIndex);
                return;
            }

            if (filter.type === "search") {
                filterState.search = searchValue
                    .split(",")
                    .map((term) => term.trim())
                    .filter(Boolean)
                    .filter(
                        (term, index, array) => array.indexOf(term) === index
                    );
            } else if (
                filter.type === "search lower than" ||
                filter.type === "search greater than"
            ) {
                filterState.search = [searchValue];
            }

            this.emitFiltersIndex(nextIndex);
        },
        onCheckboxToggle(filter, option, event) {
            const nextIndex = cloneFiltersIndex(this.activeFiltersIndex);
            const filterState = nextIndex[filter.field];
            const checked = Boolean(event?.target?.checked);
            const index = filterState.search.indexOf(option);

            if (checked && index < 0) {
                filterState.search.push(option);
            } else if (!checked && index >= 0) {
                filterState.search.splice(index, 1);
            }

            this.emitFiltersIndex(nextIndex);
        },
        onBooleanToggle(filter, event) {
            const nextIndex = cloneFiltersIndex(this.activeFiltersIndex);
            const filterState = nextIndex[filter.field];
            filterState.search = event?.target?.checked ? [true] : [];
            this.emitFiltersIndex(nextIndex);
        },
        clearAllFilters() {
            const nextIndex = cloneFiltersIndex(this.activeFiltersIndex);
            Object.keys(nextIndex).forEach((field) => {
                nextIndex[field].search = [];
            });
            this.emitFiltersIndex(nextIndex);
        },
    },
};
</script>

<style scoped>
.vks-assoc-filters {
    margin: 0;
}

.vks-assoc-filter-reset-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
}

.vks-assoc-filter-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px 16px;
}

.vks-assoc-filter-column-title {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.vks-assoc-filter-field + .vks-assoc-filter-field {
    margin-top: 10px;
}

.vks-assoc-filter-label {
    margin-bottom: 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-assoc-filter-input {
    font-size: 12px;
    min-height: 30px;
    padding: 4px 8px;
}

.vks-assoc-filter-checkboxes {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 180px;
    overflow-y: auto;
}

.vks-assoc-filter-check {
    display: inline-flex;
    align-items: flex-start;
    gap: 6px;
    margin: 0;
    font-size: 12px;
    font-weight: 500;
    color: var(--cfde-ink, #33363d);
    cursor: pointer;
}

.vks-assoc-filter-check input {
    margin-top: 2px;
}

.vks-assoc-filter-empty {
    margin: 0;
    font-size: 11px;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
