<template>
    <div>
        <div
            class="filtering-ui-wrapper search-criteria"
            id="searchCriteria"
            v-if="this.apiParameters != null"
        >
            <div
                class="open-close-search-criteria"
                id="openCloseSearch"
                @click="showHideSearch()"
            >
                Close search
            </div>
            <h4 class="card-title">Build search criteria</h4>
            <div class="filtering-ui-content row">
                <div
                    class="col"
                    v-for="parameter in this.apiParameters.parameters"
                    :key="parameter.parameter"
                >
                    <div class="label" v-html="parameter.label"></div>
                    <select
                        :id="'search_param_' + parameter.parameter"
                        class="custom-select"
                        v-if="parameter.type == 'list'"
                    >
                        <option
                            v-for="param in parameter.values"
                            :value="param.trim()"
                            v-html="getFileLabel(param.trim())"
                            :key="param.trim()"
                        ></option>
                    </select>
                    <input
                        v-if="parameter.type == 'input'"
                        type="text"
                        class="form-control"
                        :id="'search_param_' + parameter.parameter"
                    />
                </div>
                <div class="col">
                    <select id="ifMergeData" class="custom-select">
                        <option value="noSet" selected>No set</option>
                        <option value="overlapping">
                            Display only overlapping
                        </option>
                        <option value="all">Display all</option>
                    </select>
                </div>
                <div class="col">
                    <div @click="queryAPI()" class="btn btn-sm btn-primary">
                        Search
                    </div>
                </div>
                <div class="col">
                    <div
                        v-for="(value, name, index) in this.searchParamsIndex"
                        :class="'search-field f-' + index"
                        :key="name"
                    >
                        <b-badge
                            pill
                            v-if="value.search.length > 0"
                            v-for="(v, i) in value.search.filter(
                                (v, i, arr) => arr.indexOf(v) == i
                            )"
                            :key="v"
                            :class="'btn search-bubble ' + i"
                            @click="removeSearch(value.field, i)"
                            v-html="v + '&nbsp;<span class=\'remove\'>X</span>'"
                        ></b-badge>
                    </div>
                    <b-badge
                        v-if="this.numberOfSearchParams() > 1"
                        class="badge badge-secondary badge-pill btn search-bubble clear-all-filters-bubble"
                        @click="removeAllSearchParams()"
                    >
                        Clear all search
                    </b-badge>
                </div>
            </div>
        </div>
        <div
            class="filtering-ui-wrapper search-criteria"
            id="searchCriteria"
            v-if="!!this.dataFiles && this.dataFiles.length > 1"
        >
            <div
                class="open-close-search-criteria"
                id="openCloseSearch"
                @click="showHideSearch()"
            >
                Close search
            </div>
            <h4 class="card-title">Select data</h4>
            <div class="filtering-ui-content row">
                <div class="col">
                    <select
                        id="dataFiles"
                        @change="switchData($event)"
                        class="custom-select"
                    >
                        <option
                            v-for="file in this.dataFiles"
                            :value="file.trim()"
                            v-html="getFileLabel(file.trim())"
                            :key="file.trim()"
                        ></option>
                    </select>
                </div>
            </div>
        </div>
        <div
            class="filtering-ui-wrapper"
            v-if="
                (!!this.dataset && !!this.filters && this.filters.length > 1) ||
                (!!this.dataFiles && this.dataFiles.length > 1)
            "
        >
            <div class="filtering-ui-content row">
                <div
                    :class="getFilterWidthClasses()"
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
        <b-container class="search-fields-wrapper" v-if="this.dataset != null">
            <div
                v-for="(value, name, index) in this.filtersIndex"
                :class="'search-field f-' + index"
                :key="name"
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

import uiUtils from "@/utils/uiUtils";
import keyParams from "@/utils/keyParams";

export default Vue.component("research-page-filters", {
    props: [
        "apiParameters",
        "dataComparison",
        "dataFiles",
        "dataType",
        "filesListLabels",
        "uid",
        "filters",
        "filterWidth",
        "dataset",
        "unfilteredDataset",
    ],

    data() {
        return {
            filtersIndex: {},
            searchParamsIndex: {},
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

        let configSearchParams = this.apiParameters;

        if (configSearchParams != null) {
            configSearchParams.parameters.map((p) => {
                let tempObj = {};
                tempObj["type"] = p.type;
                tempObj["field"] = p.parameter;
                tempObj["search"] = [];
                this.searchParamsIndex[p.parameter] = tempObj;
            });
        }

        if (!!this.dataFiles && this.dataFiles.length > 1) {
            let tempObj = {};
            tempObj["type"] = "list";
            tempObj["field"] = "dataFiles";
            tempObj["search"] = [];
            this.searchParamsIndex["dataFiles"] = tempObj;
        }
    },
    mounted() {
        if (
            this.apiParameters != null &&
            this.apiParameters.query.type == "array"
        ) {
            let parametersArr = this.apiParameters.query.format;

            parametersArr.map((param, index) => {
                //console.log(param, index);
                if (keyParams[param] != undefined) {
                    document.getElementById("search_param_" + param).value =
                        keyParams[param];

                    this.searchParamsIndex[param].search.push(keyParams[param]);
                }
            });

            //console.log("this.searchParamsIndex", this.searchParamsIndex);
        }
    },
    comuted: {},
    watch: {},
    methods: {
        ...uiUtils,
        showHideSearch() {
            let searchUIWrapper = document.getElementById("searchCriteria");
            let searchUIHandle = document.getElementById("openCloseSearch");
            if (searchUIWrapper.classList.contains("closed")) {
                searchUIWrapper.classList.remove("closed");
                searchUIHandle.innerText = "Close search";
            } else {
                searchUIWrapper.classList.add("closed");
                searchUIHandle.innerText = "Open search";
            }
        },
        getLength(ARR) {
            return Number(ARR.length);
        },
        getFilterWidthClasses() {
            let classes =
                !!this.filterWidth && this.filterWidth != null
                    ? "col filter-col-" + this.filterWidth
                    : "col";
            return classes;
        },
        getFileLabel(file) {
            if (this.filesListLabels != null) {
                return this.filesListLabels[file];
            } else {
                return file;
            }
        },
        queryAPI() {
            uiUtils.showElement("data-loading-indicator");

            this.$store.state.bioIndexContinue = [];

            console.log(
                "if merge data",
                document.getElementById("ifMergeData").value
            );

            console.log("this.dataset", typeof this.dataset);
            console.log("this.dataset", this.dataset);

            let ifCompareData = document.getElementById("ifMergeData").value;

            if (ifCompareData != "noSet" && this.dataset != "") {
            }

            let queryParams = "";
            if (this.apiParameters.query.type == "array") {
                let parametersArr = this.apiParameters.query.format;

                parametersArr.map((param, index) => {
                    console.log(param, index);
                    queryParams += document.getElementById(
                        "search_param_" + param
                    ).value;
                    if (index + 1 < parametersArr.length) {
                        queryParams += ",";
                    }
                });
            }

            let APIPoint = this.dataFiles[0];
            if (this.dataType == "bioindex") {
                APIPoint +=
                    "query/" +
                    this.apiParameters.query.index +
                    "?q=" +
                    queryParams;
            }

            let fetchParam = { dataPoint: APIPoint, domain: "external" };

            this.$store.dispatch("hugeampkpncms/getResearchData", fetchParam);
        },
        switchData(event) {
            uiUtils.showElement("data-loading-indicator");
            let initialData = event.target.value;

            let dataPoint =
                initialData.includes("http://") ||
                initialData.includes("https://")
                    ? initialData
                    : "https://hugeampkpncms.org/sites/default/files/users/user" +
                      this.uid +
                      "/" +
                      initialData;

            let domain =
                initialData.includes("http://") ||
                initialData.includes("https://")
                    ? "external"
                    : "hugeampkpn";

            let fetchParam = { dataPoint: dataPoint, domain: domain };

            this.$store.dispatch("hugeampkpncms/getResearchData", fetchParam);
        },
        numberOfSearches() {
            // console.log("called 3");
            let numberOfBubbles = 0;
            for (const FIELD in this.filtersIndex) {
                numberOfBubbles += this.filtersIndex[FIELD].search.length;
            }

            // console.log("numberOfBubbles", numberOfBubbles);

            return numberOfBubbles;
        },
        numberOfSearchParams() {},
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

            // console.log("this.filtersIndex", this.filtersIndex);

            this.applyFilters();
        },
        applyFilters() {
            //console.log(this.filtersIndex);
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
        removeAllSearchParams() {},
        removeFilter(FIELD, ITEM) {
            this.filtersIndex[FIELD].search.splice(ITEM, 1);

            this.applyFilters();
        },
        removeSearch(FIELD, ITEM) {
            //this.filtersIndex[FIELD].search.splice(ITEM, 1);
            //this.applyFilters();
        },
    },
});
</script>

<style>
.clear-all-filters-bubble {
    background-color: #ff0000;
}

.filtering-ui-wrapper.search-criteria {
    position: absolute;
    z-index: 200;
    width: 210px;
    left: -40px;
    top: 10px;
    text-align: left;
    padding: 15px;
    padding-left: 25px;
    transition: all 0.5s;
}

.filtering-ui-wrapper.search-criteria.closed {
    left: -240px;
    transition: all 0.5s;
}

.filtering-ui-wrapper.search-criteria .open-close-search-criteria {
    position: absolute;
    transform: rotate(90deg);
    background-color: #666;
    color: #fff;
    font-size: 12px;
    font-weight: bold;
    right: 0px;
    top: 80px;
    padding: 0px 7px;
    transform-origin: bottom right;
    transition: all 0.5s;
}

.filtering-ui-wrapper.search-criteria.closed .open-close-search-criteria {
    transform: rotate(0deg);
    right: -78px;
    transition: all 0.5s;
}

.filtering-ui-wrapper.search-criteria .open-close-search-criteria:hover {
    cursor: pointer;
}

.filtering-ui-wrapper.search-criteria > h4.card-title {
    margin-left: -7px;
}

.filtering-ui-wrapper.search-criteria div.filtering-ui-content div.col {
}
</style>
