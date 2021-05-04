<template>
    <div>
        <div class="filtering-ui-wrapper">
            <div class="filtering-ui-content row">
                <div
                    class="col"
                    v-for="filter in this.filters"
                    :key="filter.field"
                >
                    <div class="label" v-html="filter.label"></div>
                    <template
                        v-if="
                            filter.type == 'search' ||
                            filter.type == 'search_gt' ||
                            filter.type == 'search_lt' ||
                            filter.type == 'search_or' ||
                            filter.type == 'search_and'
                        "
                    >
                        <input
                            type="text"
                            class="form-control"
                            :id="'filter_' + filter.field.replace(/ /g, '')"
                            @change="
                                filterData($event, filter.field, filter.type)
                            "
                        />
                    </template>
                    <template v-if="filter.type == 'search_cd'">
                        <select
                            class="egl-filter-direction"
                            :id="
                                'filter_' +
                                filter.field.replace(/ /g, '') +
                                '_direction'
                            "
                        >
                            <option value="lt" selected="selected">
                                &lt;&equals;
                            </option>
                            <option value="gt">&gt;&equals;</option>
                        </select>
                        <input
                            type="text"
                            class="form-control egl-filter-cd-input"
                            :id="'filter_' + filter.field.replace(/ /g, '')"
                            @change="
                                filterData($event, filter.field, filter.type)
                            "
                        />
                    </template>
                    <template v-else-if="filter.type == 'dropdown'">
                        <select
                            :id="'filter_' + filter.field.replace(/ /g, '')"
                            @change="
                                filterData(
                                    $event,
                                    filter.field,
                                    filter.type,
                                    filter.dataType
                                )
                            "
                            class="custom-select"
                        >
                            <option></option>
                            <option
                                v-for="value in buildOptions(filter.field)"
                                :key="value"
                                :value="value"
                            >
                                {{ value }}
                            </option>
                        </select>
                    </template>
                </div>
            </div>
        </div>
        <b-container class="search-fields-wrapper">
            <div
                v-for="(value, name, index) in this.filtersIndex"
                :class="'search-field f-' + index"
                :key="value.field"
            >
                <b-badge
                    pill
                    v-if="value.search.length > 0"
                    v-for="(v, i) in value.search.filter(
                        (v, i, arr) => arr.indexOf(v) == i
                    )"
                    :key="v"
                    :class="'btn search-bubble ' + i"
                    @click="removeFilter(value.field, i)"
                    v-html="v + '&nbsp;<span class=\'remove\'>X</span>'"
                ></b-badge>
            </div>
            <b-badge
                v-if="this.numberOfSearches() > 1"
                class="badge badge-secondary badge-pill btn search-bubble clear-all-filters-bubble"
                @click="removeAllFilters()"
            >
                Clear all search
            </b-badge>
        </b-container>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("research-page-filters", {
    props: ["filters", "dataset", "unfilteredDataset"],

    data() {
        return {
            filtersIndex: {},
        };
    },
    created() {
        let configFilterFields = this.filters;

        if (configFilterFields != undefined) {
            configFilterFields.map((f) => {
                let tempObj = {};
                tempObj["type"] = f.type;
                tempObj["field"] = f.field;
                tempObj["search"] = [];
                this.filtersIndex[f.field] = tempObj;
            });
        }
    },
    comuted: {},
    watch: {},
    methods: {
        numberOfSearches() {
            let numberOfBubbles = 0;
            for (const FIELD in this.filtersIndex) {
                numberOfBubbles += this.filtersIndex[FIELD].search.length;
            }

            console.log("numberOfBubbles", numberOfBubbles);

            return numberOfBubbles;
        },
        buildOptions(field) {
            let options = this.dataset
                .map((v) => v[field])
                .filter((v, i, arr) => arr.indexOf(v) == i) //unique
                .filter((v, i, arr) => v != ""); //remove blank
            return options.sort();
        },
        filterData(EVENT, FIELD, TYPE, DATATYPE) {
            let searchValue = document.getElementById(
                "filter_" + FIELD.replace(/ /g, "")
            ).value; //EVENT.target.value;
            let id = "#filter_" + FIELD.replace(/ /g, "");
            let inputField = document.querySelector(id);

            inputField.blur();
            inputField.value = "";

            if (TYPE == "search") {
                let searchTerms = searchValue.split(",");
                searchTerms.map((searchTerm) => {
                    this.filtersIndex[FIELD]["search"].push(searchTerm.trim());

                    this.filtersIndex[FIELD]["search"] = this.filtersIndex[
                        FIELD
                    ]["search"].filter((v, i, arr) => arr.indexOf(v) == i);
                });
            } else if (
                TYPE == "search_gt" ||
                TYPE == "search_lt" ||
                TYPE == "search_or" ||
                TYPE == "search_and"
            ) {
                this.filtersIndex[FIELD]["search"] = [searchValue];
            } else {
                if (DATATYPE == "number") {
                    this.filtersIndex[FIELD]["search"].push(
                        Number(searchValue)
                    );
                } else {
                    this.filtersIndex[FIELD]["search"].push(searchValue);
                }
            }

            console.log(
                "this.$store.state.filtersIndex",
                this.$store.state.filtersIndex
            );

            this.applyFilters();
        },
        applyFilters() {
            console.log(this.filtersIndex);
            let filtered = this.unfilteredDataset;
            let tempFiltered = [];
            let i = 0;

            for (var f in this.filtersIndex) {
                let searchIndex = this.filtersIndex[f];

                if (searchIndex.search.length > 0) {
                    searchIndex.search
                        .filter((v, i, arr) => arr.indexOf(v) == i)
                        .map((s) => {
                            let targetData = filtered;
                            let search = s;

                            if (searchIndex.type == "dropdown") {
                                targetData.filter((row) => {
                                    if (search === row[searchIndex.field]) {
                                        tempFiltered.push(row);
                                    }
                                });
                            } else if (
                                searchIndex.type == "search" ||
                                searchIndex.type == "dropdown_word"
                            ) {
                                targetData.filter((row) => {
                                    if (
                                        row[searchIndex.field]
                                            .toLowerCase()
                                            .includes(search.toLowerCase())
                                    ) {
                                        tempFiltered.push(row);
                                    }
                                });
                            } else if (searchIndex.type == "search_gt") {
                                targetData.filter((row) => {
                                    if (row[searchIndex.field] >= search) {
                                        tempFiltered.push(row);
                                    }
                                });
                            } else if (searchIndex.type == "search_lt") {
                                targetData.filter((row) => {
                                    if (row[searchIndex.field] <= search) {
                                        tempFiltered.push(row);
                                    }
                                });
                            } else if (searchIndex.type == "search_or") {
                                let searchVals = search.split(",");
                                targetData.filter((row) => {
                                    if (
                                        row[searchIndex.field] <=
                                            searchVals[0].trim() ||
                                        row[searchIndex.field] >=
                                            searchVals[1].trim()
                                    ) {
                                        tempFiltered.push(row);
                                    }
                                });
                            } else if (searchIndex.type == "search_cd") {
                                let searchDirection = document.getElementById(
                                    "filter_" +
                                        searchIndex.field.replace(/ /g, "") +
                                        "_direction"
                                ).value;

                                targetData.filter((row) => {
                                    if (searchDirection == "lt") {
                                        if (row[searchIndex.field] <= search) {
                                            tempFiltered.push(row);
                                        }
                                    } else if (searchDirection == "gt") {
                                        if (row[searchIndex.field] >= search) {
                                            tempFiltered.push(row);
                                        }
                                    }
                                });
                            } else if (searchIndex.type == "search_and") {
                                let searchVals = search.split(",");
                                targetData.filter((row) => {
                                    if (
                                        row[searchIndex.field] >=
                                            searchVals[0].trim() &&
                                        row[searchIndex.field] <=
                                            searchVals[1].trim()
                                    ) {
                                        tempFiltered.push(row);
                                    }
                                });
                            }
                        });

                    filtered = tempFiltered;
                    tempFiltered = [];
                    i++;
                }
            }

            this.$store.dispatch("filteredData", filtered);
        },
        removeAllFilters() {
            for (const FIELD in this.filtersIndex) {
                this.filtersIndex[FIELD].search = [];
            }
            this.applyFilters();
        },
        removeFilter(FIELD, ITEM) {
            this.filtersIndex[FIELD].search.splice(ITEM, 1);

            this.applyFilters();
        },
    },
});
</script>

<style>
.clear-all-filters-bubble {
    background-color: #ff0000;
}
</style>
