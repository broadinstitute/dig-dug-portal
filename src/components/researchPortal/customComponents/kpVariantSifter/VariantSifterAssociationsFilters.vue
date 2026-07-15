<template>
    <div>
        <div class="filtering-ui-wrapper">
            <h4 class="card-title filter">Filter data</h4>
            <div class="filtering-ui-content row vks-assoc-filter-row">
                <div
                    v-for="filter in filters"
                    :key="filter.field"
                    class="col vks-assoc-filter-col"
                >
                    <div class="label" v-html="filter.label"></div>
                    <template
                        v-if="
                            filter.type === 'search' ||
                            filter.type === 'search lower than' ||
                            filter.type === 'search greater than'
                        "
                    >
                        <input
                            type="text"
                            class="form-control"
                            :id="inputId(filter.field)"
                            @change="onFilterInput($event, filter)"
                        />
                    </template>
                    <template v-else-if="filter.type === 'dropdown'">
                        <select
                            :id="inputId(filter.field)"
                            class="custom-select"
                            @change="onFilterInput($event, filter)"
                        >
                            <option value=""></option>
                            <option
                                v-for="option in dropdownOptions(filter.field)"
                                :key="option"
                                :value="option"
                            >
                                {{ option }}
                            </option>
                        </select>
                    </template>
                </div>
            </div>
        </div>

        <b-container class="search-fields-wrapper" fluid>
            <div
                v-for="(filterState, field, index) in activeFiltersIndex"
                :key="field"
                :class="'search-field f-' + index"
            >
                <b-badge
                    v-for="(value, badgeIndex) in uniqueSearchValues(filterState.search)"
                    :key="field + '-' + value"
                    pill
                    :class="'btn search-bubble ' + badgeIndex"
                    @click="removeFilter(field, badgeIndex)"
                    v-html="bubbleLabel(filterState, value)"
                ></b-badge>
            </div>
            <b-badge
                v-if="activeFilterCount > 1"
                class="badge badge-secondary badge-pill btn search-bubble clear-all-filters-bubble"
                @click="clearAllFilters"
            >
                Clear all search
            </b-badge>
        </b-container>
    </div>
</template>

<script>
import {
    ASSOCIATIONS_FILTERS,
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
        filteredRows() {
            return applyAssociationsFilters(this.rows, this.activeFiltersIndex);
        },
        activeFilterCount() {
            return Object.values(this.activeFiltersIndex).reduce(
                (count, filter) => count + (filter.search?.length || 0),
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
        getColumnId(label) {
            return label.replace(/\W/g, "").toLowerCase();
        },
        dropdownOptions(field) {
            return buildFilterOptions(this.rows, field);
        },
        uniqueSearchValues(values) {
            return (values || []).filter(
                (value, index, array) => array.indexOf(value) === index
            );
        },
        bubbleLabel(filterState, value) {
            if (filterState["label in bubble"]) {
                return `${filterState.field}: ${value}&nbsp;<span class="remove">X</span>`;
            }
            return `${value}&nbsp;<span class="remove">X</span>`;
        },
        emitFiltersIndex(nextIndex) {
            this.$emit("update:filtersIndex", nextIndex);
        },
        onFilterInput(event, filter) {
            const searchValue = event.target.value.trim();
            event.target.value = "";

            if (!searchValue) {
                return;
            }

            const field = filter.field;
            const nextIndex = cloneFiltersIndex(this.activeFiltersIndex);
            const filterState = nextIndex[field];

            if (filter.type === "search") {
                searchValue.split(",").forEach((term) => {
                    const trimmed = term.trim();
                    if (trimmed && !filterState.search.includes(trimmed)) {
                        filterState.search.push(trimmed);
                    }
                });
            } else if (
                filter.type === "search lower than" ||
                filter.type === "search greater than"
            ) {
                filterState.search = [searchValue];
            } else if (filter.type === "dropdown") {
                if (!filterState.search.includes(searchValue)) {
                    filterState.search.push(searchValue);
                }
            }

            this.emitFiltersIndex(nextIndex);
        },
        removeFilter(field, index) {
            const nextIndex = cloneFiltersIndex(this.activeFiltersIndex);
            nextIndex[field].search.splice(index, 1);
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
.filtering-ui-wrapper {
    border: solid 1px #ddd;
    border-radius: 5px;
    background-color: #efefef;
    text-align: center;
    margin-bottom: 10px;
    padding: 8px 6px 6px;
    position: relative;
}

.filtering-ui-wrapper > h4.card-title {
    position: absolute;
    font-size: 13px;
    font-weight: bold;
    color: #aaaaaa;
    left: 5px;
    top: 3px;
    margin: 0;
}

.vks-assoc-filter-row {
    justify-content: flex-end;
    margin: 0;
    padding-top: 14px;
}

.vks-assoc-filter-col {
    flex: 0 0 auto;
    width: auto;
    max-width: none;
    padding: 0 6px 4px;
    vertical-align: bottom;
}

.vks-assoc-filter-col:last-child {
    padding-right: 10px;
}

.vks-assoc-filter-col .label {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 2px;
    white-space: nowrap;
}

.vks-assoc-filter-col .form-control,
.vks-assoc-filter-col .custom-select {
    width: 118px;
    min-width: 118px;
    height: 30px;
    font-size: 13px;
    padding: 2px 6px;
}

.search-fields-wrapper {
    margin-bottom: 8px;
    padding: 0;
    min-height: 1px;
}

.search-fields-wrapper .search-bubble {
    font-size: 12px;
    font-weight: 400;
    margin: 0 3px 4px;
    cursor: pointer;
}

.search-fields-wrapper .clear-all-filters-bubble {
    background-color: #ff0000;
    color: #fff;
}

.search-field.f-0 .search-bubble {
    background-color: #66bbff;
}
.search-field.f-1 .search-bubble {
    background-color: #ffcc66;
}
.search-field.f-2 .search-bubble {
    background-color: #99dd99;
}
.search-field.f-3 .search-bubble {
    background-color: #ff99cc;
}
.search-field.f-4 .search-bubble {
    background-color: #cc99ff;
}
.search-field.f-5 .search-bubble {
    background-color: #99ccff;
}
.search-field.f-6 .search-bubble {
    background-color: #ff9966;
}
.search-field.f-7 .search-bubble {
    background-color: #cccccc;
}
</style>
