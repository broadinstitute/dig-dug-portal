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
                    :class="{ 'is-checkbox': filter.type === 'checkbox' }"
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
                                :key="`${filter.field}-${option}`"
                                class="vks-assoc-filter-check"
                            >
                                <input
                                    type="checkbox"
                                    :checked="isCheckboxSelected(filter.field, option)"
                                    @change="onCheckboxToggle(filter, option, $event)"
                                />
                                <span>{{ option }}</span>
                            </label>
                            <p
                                v-if="!checkboxOptions(filter.field).length"
                                class="vks-assoc-filter-empty"
                            >
                                No options available.
                            </p>
                        </div>
                    </template>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import {
    ASSOCIATIONS_FILTERS,
    ASSOCIATIONS_FILTER_GROUPS,
    applyAssociationsFilters,
    buildFilterOptions,
    cloneFiltersIndex,
    createFiltersIndex,
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
            default: () => ASSOCIATIONS_FILTERS,
        },
        filtersIndex: {
            type: Object,
            default: null,
        },
    },
    computed: {
        activeFiltersIndex() {
            return this.filtersIndex || createFiltersIndex(this.filters);
        },
        filterByField() {
            const map = {};
            this.filters.forEach((filter) => {
                map[filter.field] = filter;
            });
            return map;
        },
        filterGroups() {
            return ASSOCIATIONS_FILTER_GROUPS.map((group) => ({
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
            return Object.values(this.activeFiltersIndex).reduce(
                (count, filter) =>
                    count + ((filter.search || []).length > 0 ? 1 : 0),
                0
            );
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
            if (filter.type === "checkbox" && group.fields.length === 1) {
                return false;
            }
            return true;
        },
        checkboxOptions(field) {
            return buildFilterOptions(this.rows, field);
        },
        searchSuggestions(field) {
            return buildFilterOptions(this.rows, field).slice(0, 500);
        },
        isCheckboxSelected(field, option) {
            return (this.activeFiltersIndex[field]?.search || []).includes(option);
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
    margin-bottom: 4px;
}

.vks-assoc-filter-reset-row {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 10px;
}

.vks-assoc-filter-reset {
    font-size: 13px;
    font-weight: 700;
    padding: 6px 14px;
}

.vks-assoc-filter-columns {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px 24px;
    margin-bottom: 10px;
}

.vks-assoc-filter-column {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-left: 25px;
}

.vks-assoc-filter-column-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.vks-assoc-filter-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.vks-assoc-filter-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-assoc-filter-input {
    width: 100%;
    max-width: 180px;
    height: 30px;
    font-size: 13px;
    padding: 2px 6px;
}

.vks-assoc-filter-checkboxes {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 220px;
    overflow: auto;
    padding: 2px 0;
}

.vks-assoc-filter-check {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 0;
    font-size: 12px;
    line-height: 1.35;
    color: var(--cfde-ink, #33363d);
    cursor: pointer;
}

.vks-assoc-filter-check input {
    margin: 2px 0 0;
    flex: 0 0 auto;
}

.vks-assoc-filter-empty {
    margin: 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

@media (max-width: 900px) {
    .vks-assoc-filter-columns {
        grid-template-columns: 1fr;
    }
}
</style>
