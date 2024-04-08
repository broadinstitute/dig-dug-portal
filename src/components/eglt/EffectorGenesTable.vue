<template>
    <div class="eglt-table-wrapper" :id="dataset">
        <b-container
            fluid
            v-if="
                !!config &&
                config[dataset].extra_content != undefined &&
                config[dataset].extra_content.position == 'top'
            "
            v-html="config[dataset].extra_content.content"
        >
        </b-container>
        <b-container
            fluid
            v-if="
                !!config && !!tableData && config[dataset].filters != undefined
            "
            class="filtering-ui-wrapper"
        >
            <b-row class="filtering-ui-content">
                <b-col
                    v-for="filter in config[dataset]['filters']"
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
                            :id="'filter_' + filter.field"
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
                    <template v-else-if="filter.type == 'dropdown_search'">
                        <!--<select
                            :id="'filter_' + filter.field"
                            @change="
                                filterData(
                                    $event,
                                    filter.field,
                                    filter.type,
                                    filter.dataType
                                )
                            "
                            class="custom-select"
                        >-->
                        <input
                            type="text"
                            class="form-control"
                            :id="'filter_' + filter.field.replace(/ /g, '')"
                        />
                        <ul>
                            <li
                                v-for="value in buildOptions(filter.field)"
                                :key="value"
                                :value="value"
                            >
                                {{ value }}
                            </li>
                        </ul>
                    </template>
                </b-col>
            </b-row>
        </b-container>

        <b-container class="search-fields-wrapper">
            <div
                v-for="(value, name, index) in this.filtersIndex"
                :class="'search-field f-' + index"
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

        <b-container
            fluid
            v-if="
                !!config &&
                !!filteredData &&
                !!config[dataset]['render_m_plot'] == true
            "
            class="egl-m-plot-wrapper"
        >
            <effector-genes-m-plot
                :plotData="filteredData"
                :locusKey="config[dataset]['m_plot_config']['locusKey']"
                :scoreKey="config[dataset]['m_plot_config']['scoreKey']"
                :renderBy="config[dataset]['m_plot_config']['renderBy']"
                :yAxisLabel="config[dataset]['m_plot_config']['yAxisLabel']"
                :popUpContent="config[dataset]['m_plot_config']['hoverContent']"
            ></effector-genes-m-plot>
        </b-container>

        <!-- if the page view is not single_gene_view -->
        <b-container
            fluid
            v-if="
                !!config &&
                !!filteredData &&
                !!config[dataset]['render_volcano_plot'] == true
            "
            class="volcano-plot-wrapper"
        >
            <volcano-plot
                :plotData="
                    !!config[dataset].single_gene_view
                        ? tableData
                        : filteredData
                "
                :renderConfig="config[dataset]['volcano_plot_config']"
                :geneOfInterest="selectedGene"
                v-model="selectedGene"
            ></volcano-plot>
        </b-container>
        <b-container
            fluid
            v-if="
                !!config &&
                !!filteredData &&
                !!config[dataset]['mbm_plot_config']
            "
            class="mbm-plot-wrapper"
        >
            <m-bitmap-plot
                :plotData="filteredData"
                :renderConfig="config[dataset]['mbm_plot_config']"
                :geneOfInterest="selectedGene"
                v-model="selectedGene"
            ></m-bitmap-plot>
        </b-container>
        <b-container
            fluid
            v-if="
                !!config &&
                !!filteredData &&
                !!config[dataset]['heatmap_config']
            "
        >
            <heatmap
                :heatmapData="filteredData"
                :renderConfig="config[dataset]['heatmap_config']"
            ></heatmap>
        </b-container>
        <div
            v-if="!!tableData && !!config && !!config[dataset].single_gene_view"
        >
            <single-gene-view
                :geneViewData="tableData"
                :renderConfig="config[dataset]"
                :geneOfInterest="selectedGene"
                v-model="selectedGene"
            ></single-gene-view>
        </div>
        <div
            :class="
                !!config && !!config[dataset].single_gene_view ? 'hidden' : ''
            "
        >
            <b-container
                fluid
                v-if="!!config && !!tableData"
                class="legend-wrapper"
            >
                <b-row
                    class="each-legend"
                    v-for="(legend, i) in config[dataset]['legend']"
                    v-html="legend"
                    :key="i"
                ></b-row>
            </b-container>
            <b-container
                fluid
                v-if="
                    !!config &&
                    !!tableData &&
                    config[dataset]['render_feature'] == true
                "
                class="table-ui-wrapper"
            >
                <b-row>
                    <div class="col-md-12 egl-table-ui-options">
                        <div class="show-all-features-wrapper">
                            <input
                                type="checkbox"
                                v-model="showAllFeaturesChk"
                                id="show_all_features"
                                @change="showAllFeatures()"
                            />
                            <label for="show_all_features"
                                >Show all feature rows</label
                            >
                        </div>
                        <div class="hide-all-feature-headers-wrapper">
                            <input
                                type="checkbox"
                                v-model="hideAllFeatureHeadersChk"
                                id="hide_all_feature_headers"
                                @change="hideAllFeatureHeaders()"
                            />
                            <label for="hide_all_feature_headers"
                                >Hide feature headers</label
                            >
                        </div>
                        <div class="hide-top-level-wrapper">
                            <input
                                type="checkbox"
                                v-model="hideTopLevelRowsChk"
                                id="hide_top_level_rows"
                                @change="hideTopLevelRows()"
                            />
                            <label for="hide_top_level_rows"
                                >Hide top level rows</label
                            >
                        </div>
                    </div>
                </b-row>
            </b-container>
            <!-- convertJson2Csv works only for tables with no feature tables -->
            <b-container fluid class="per-page-ui-wrapper">
                <label
                    class="items-per-page-label"
                    v-if="!!config && !!config[dataset].pageUI"
                    >Rows per page:
                </label>
                <select
                    v-model="perPage"
                    class="form-control-sm items-per-page"
                    v-if="!!config && !!config[dataset].pageUI"
                >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="40">40</option>
                    <option value="100">100</option>
                    <option value="0">All</option>
                </select>
                <b-btn
                    v-if="!!config && !!config[dataset]['convert_2_csv']"
                    class="btn-sm"
                    @click="
                        convertJson2Csv(filteredData, dataset + '_filtered')
                    "
                    >Save as CSV</b-btn
                >
            </b-container>
            <div :class="'EGLT-table ' + this.dataset">
                <b-container fluid v-if="!!config && !!filteredData" class>
                    <b-row class="top-level-header">
                        <div
                            v-for="(value, key) in config[dataset][
                                'topLevelRender'
                            ]"
                            :key="key"
                            :class="'sortable top-level-header-item ' + value"
                            v-html="value"
                            @click="applySorting(key)"
                        ></div>
                        <div
                            class="top-level-header-item"
                            v-if="
                                config[dataset]['render_feature'] == true ||
                                config[dataset]['plots']['render'] == true
                            "
                        >
                            View
                        </div>
                    </b-row>
                    <b-row
                        v-for="(value, index) in pagedData"
                        class="top-level-value"
                        :key="index"
                    >
                        <template
                            v-for="(col, i) in config[dataset][
                                'topLevelRender'
                            ]"
                        >
                            <div
                                v-if="i == config[dataset]['topLevelPrime']"
                                :class="
                                    'top-level-value-item prime ' +
                                    i +
                                    ' ' +
                                    i +
                                    '-' +
                                    value[i]
                                "
                                :key="i"
                                v-html="formatContent(i, value[i], 'top')"
                            ></div>
                            <div
                                v-else
                                :class="
                                    'top-level-value-item ' +
                                    i +
                                    ' ' +
                                    i +
                                    '-' +
                                    value[i]
                                "
                                :key="i"
                                v-html="formatContent(i, value[i], 'top')"
                            ></div>
                        </template>
                        <div
                            class="top-level-value-item"
                            v-if="
                                config[dataset]['render_feature'] == true ||
                                config[dataset]['plots']['render'] == true
                            "
                        >
                            <b-button
                                v-if="config[dataset]['render_feature'] == true"
                                @click="showFeatures(index)"
                                class="view-features-btn"
                                v-html="
                                    config[dataset]['feature_btn_name']
                                        ? config[dataset]['feature_btn_name']
                                        : 'Features'
                                "
                            ></b-button>
                            <template
                                v-if="
                                    config[dataset]['plots']['render'] == true
                                "
                            >
                                <b-button
                                    @click="
                                        showVisualizer(
                                            value[
                                                config[dataset]['plots'][
                                                    'openerField'
                                                ]
                                            ]
                                        )
                                    "
                                    class="view-visualizer-btn"
                                    v-html="config[dataset]['plots']['btnName']"
                                ></b-button>
                            </template>
                        </div>
                        <effector-genes-features
                            :features="value.features"
                            :featureIndex="index"
                            :columnHeader="
                                value[config[dataset]['topLevelPrime']]
                            "
                        ></effector-genes-features>
                    </b-row>
                </b-container>
            </div>
            <b-container
                v-if="!!config && !!config[dataset].pageUI && perPage != 0"
                class="egl-table-page-ui-wrapper"
            >
                <b-pagination
                    class="pagination-sm justify-content-center"
                    v-model="currentPage"
                    :total-rows="rows"
                    :per-page="perPage"
                ></b-pagination>
            </b-container>
            <b-container
                fluid
                v-if="
                    !!config &&
                    config[dataset].extra_content != undefined &&
                    config[dataset].extra_content.position == 'bottom'
                "
                v-html="config[dataset].extra_content.content"
            >
            </b-container>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
//import igv from "../../node_modules/igv/dist/igv.esm";
import EffectorGenesFeatures from "@/components/eglt/EffectorGenesFeatures";
import SingleGeneView from "@/components/eglt/SingleGeneView.vue";
import EffectorGenesMPlot from "@/components/eglt/EffectorGenesMPlot";
import VolcanoPlot from "@/components/eglt/VolcanoPlot";
import MPlotBitmap from "@/components/MPlotBitmap";
import Heatmap from "@/components/Heatmap";
import uiUtils from "@/utils/uiUtils";
import sortUtils from "@/utils/sortUtils";
import keyParams from "@/utils/keyParams";
import formatters from "@/utils/formatters";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-table", {
    props: ["dataset", "trait"],
    data() {
        return {
            optionData: [],
            filtersIndex: {},
            highestScores: { features: {} },
            lowestScores: { features: {} },
            showAllFeaturesChk: null,
            hideTopLevelRowsChk: null,
            hideAllFeatureHeadersChk: null,
            sortTableSelect: null,
            sortDirection: "asc",
            /*igvBrowser: false,*/
            perPage: null,
            currentPage: 1,
            selectedGene: "",
        };
    },
    modules: {
        uiUtils,
        keyParams,
        formatters,
    },
    components: {
        EffectorGenesFeatures,
        EffectorGenesMPlot,
        VolcanoPlot,
        SingleGeneView,
        MPlotBitmap,
        Heatmap,
    },
    created() {
        this.$store.dispatch("fetchConfig", {
            dataset: this.dataset,
            trait: this.trait,
        });
        this.$store.dispatch("fetchData", {
            dataset: this.dataset,
            trait: this.trait,
        });
    },
    beforeMount() {},

    mounted() {
        uiUtils.showHideElement("data-rendering-indicator");

        this.selectedGene = keyParams.gene;
    },
    updated() {},
    computed: {
        tableData() {
            return this.$store.state.tableData;
        },
        filteredData() {
            return this.$store.state.filteredData;
        },
        pagedData() {
            if (!!this.config[this.dataset].pageUI) {
                let filtered = this.$store.state.filteredData;
                let paged = [];
                let perPage =
                    this.perPage != 0 ? this.perPage : filtered.length;

                let startIndex = (this.currentPage - 1) * perPage;
                let endIndex =
                    this.rows - this.currentPage * perPage > perPage
                        ? this.currentPage * perPage
                        : this.rows;

                for (let i = startIndex; i < endIndex; i++) {
                    paged.push(filtered[i]);
                }

                return paged;
            } else {
                return this.$store.state.filteredData;
            }
        },
        config() {
            return this.$store.state.config;
        },
        rows() {
            return this.$store.state.filteredData.length;
        },
    },
    watch: {
        config(value) {
            let configFilterFields = value[this.dataset]["filters"];

            if (configFilterFields != undefined) {
                configFilterFields.map((f) => {
                    let tempObj = {};
                    tempObj["type"] = f.type;
                    tempObj["field"] = f.field;
                    tempObj["search"] = [];
                    this.filtersIndex[f.field] = tempObj;
                });
            }
            if (value[this.dataset].pageUI != undefined) {
                this.perPage = value[this.dataset].pageUI.perPage;
            }

            console.log(this.perPage);
        },
        tableData(data) {
            uiUtils.hideElement("data-loading-indicator");
        },
    },
    methods: {
        numberOfSearches() {
            let numberOfBubbles = 0;
            for (const FIELD in this.filtersIndex) {
                numberOfBubbles += this.filtersIndex[FIELD].search.length;
            }

            return numberOfBubbles;
        },
        convert2RenderBy(GENE) {
            if (!!this.tableData && this.config) {
                let filterByArr = this.config[this.dataset].single_gene_view
                    .filterBy;
                let renderBy = this.config[this.dataset].topLevelPrime;
                let filteredGene = "";

                this.tableData.map((d) => {
                    filterByArr.map((filterBy) => {
                        if (d[filterBy].toLowerCase() == GENE.toLowerCase()) {
                            filteredGene = d[renderBy];
                        }
                    });
                });

                return filteredGene == "" ? GENE : filteredGene;
            }
        },
        convertJson2Csv(DATA, FILENAME) {
            uiUtils.convertJson2Csv(DATA, FILENAME);
        },
        buildOptions(field) {
            let options = this.tableData
                .map((v) => v[field])
                .filter((v, i, arr) => arr.indexOf(v) == i) //unique
                .filter((v, i, arr) => v != ""); //remove blank
            return options.sort();
        },
        buildWordOptions(field) {
            let wordsArr = [];
            this.tableData.map((v) => {
                let words = v[field].split(" ");
                words.map((w) => wordsArr.push(w.toLowerCase()));
            });
            let options = wordsArr
                .filter((v, i, arr) => arr.indexOf(v) == i) //unique
                .filter((v, i, arr) => v != "" && v.length > 3); //remove blank and word is longer than 3 charactors
            options.sort();
            let singularOptions = [];

            for (let i = 0; i < options.length; i++) {
                if (i == 0) {
                    singularOptions.push(options[i]);
                } else {
                    if (options[i].includes(options[i - 1]) == false) {
                        singularOptions.push(options[i]);
                    }
                }
            }
            return singularOptions;
        },
        applySorting(key) {
            if (key != this.config[this.dataset]["locus_key"]) {
                let filtered = this.filteredData;
                let sortDirection = this.sortDirection == "asc" ? false : true;
                this.sortDirection =
                    this.sortDirection == "asc" ? "desc" : "asc";
                let keyData = filtered[0][key];
                let isNumeric = typeof keyData != "number" ? false : true;

                sortUtils.sortEGLTableData(
                    filtered,
                    key,
                    isNumeric,
                    sortDirection
                );
                this.$store.dispatch("filteredData", filtered);
            } else if (key == this.config[this.dataset]["locus_key"]) {
                let sortKey = this.config[this.dataset]["locus_key"];
                let filtered = this.filteredData;
                let sortDirection = this.sortDirection == "asc" ? false : true;
                this.sortDirection =
                    this.sortDirection == "asc" ? "desc" : "asc";

                filtered.map(function (g) {
                    let locusArr = g[sortKey].split(":");
                    let chrNum = locusArr[0].trim();
                    let bpNum;
                    if (!!locusArr[1]) {
                        bpNum =
                            locusArr[1].includes("-") == true
                                ? (Number(locusArr[1].split("-")[0].trim()) +
                                      Number(
                                          locusArr[1].split("-")[1].trim()
                                      )) /
                                  2
                                : Number(locusArr[1]);
                    } else {
                        bpNum = 0;
                    }

                    g["chr"] =
                        chrNum != "X" && chrNum != "Y"
                            ? Number(chrNum)
                            : chrNum == "X"
                            ? 23
                            : 24;

                    g["bp"] = bpNum;
                });

                sortUtils.sortEGLTableData(filtered, "bp", true, sortDirection);
                sortUtils.sortEGLTableData(
                    filtered,
                    "chr",
                    true,
                    sortDirection
                );
                this.$store.dispatch("filteredData", filtered);
            }
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
                if (!!this.config[this.dataset].single_gene_view) {
                    this.selectedGene = searchValue;

                    let newUrl =
                        window.location.protocol +
                        "//" +
                        window.location.host +
                        window.location.pathname +
                        "?trait=" +
                        keyParams.trait +
                        "&dataset=" +
                        keyParams.dataset +
                        "&gene=" +
                        searchValue;

                    window.history.replaceState({}, null, newUrl);
                } else {
                    let searchTerms = searchValue.split(",");
                    searchTerms.map((searchTerm) => {
                        this.filtersIndex[FIELD]["search"].push(
                            searchTerm.trim()
                        );

                        this.filtersIndex[FIELD]["search"] = this.filtersIndex[
                            FIELD
                        ]["search"].filter((v, i, arr) => arr.indexOf(v) == i);
                    });
                }
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

            this.applyFilters();
        },
        applyFilters() {
            let filtered = this.tableData;
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
        showFeatures(INDEX) {
            uiUtils.showHideElement("feature-content-wrapper-" + INDEX);
        },
        showAllFeatures(INDEX) {
            let checked = document.getElementById("show_all_features").checked;
            let topLevelChecked = document.getElementById("hide_top_level_rows")
                .checked;

            let featureWrappers = document.querySelectorAll(
                ".feature-content-wrapper"
            );

            featureWrappers.forEach(function (featureWrapper) {
                checked == true
                    ? featureWrapper.classList.remove("hidden")
                    : featureWrapper.classList.add("hidden");
                topLevelChecked == true
                    ? featureWrapper.classList.add("open-all")
                    : featureWrapper.classList.remove("open-all");
            });
        },
        hideAllFeatureHeaders() {
            let checked = document.getElementById("hide_all_feature_headers")
                .checked;

            let primeFeatureHeadersLength = document
                .getElementsByClassName("feature-content-wrapper")[0]
                .querySelectorAll(".feature-headers").length;

            let allFeatureHeaderLength = document.querySelectorAll(
                ".feature-headers"
            ).length;

            for (
                let i = primeFeatureHeadersLength;
                i < allFeatureHeaderLength;
                i++
            ) {
                checked == true
                    ? document
                          .getElementsByClassName("feature-headers")
                          [i].classList.add("hidden")
                    : document
                          .getElementsByClassName("feature-headers")
                          [i].classList.remove("hidden");
            }
        },
        hideTopLevelRows(INDEX) {
            let checked = document.getElementById("hide_top_level_rows")
                .checked;

            checked == true
                ? document
                      .getElementsByClassName("top-level-header")[0]
                      .classList.add("hidden")
                : document
                      .getElementsByClassName("top-level-header")[0]
                      .classList.remove("hidden");

            let topLevelRows = document.querySelectorAll(".top-level-value");

            topLevelRows.forEach(function (topLevelRow) {
                let topLevelItems = topLevelRow.querySelectorAll(
                    ".top-level-value-item"
                );

                for (let i = 0; i < topLevelItems.length; i++) {
                    if (topLevelItems[i].classList.contains("prime")) {
                        checked == true
                            ? topLevelItems[i].classList.add("top-prime-column")
                            : topLevelItems[i].classList.remove(
                                  "top-prime-column"
                              );
                    } else {
                        checked == true
                            ? topLevelItems[i].classList.add("hidden")
                            : topLevelItems[i].classList.remove("hidden");
                    }
                }
            });

            let featureWrappers = document.querySelectorAll(
                ".feature-content-wrapper"
            );

            featureWrappers.forEach(function (featureWrapper) {
                checked == true
                    ? featureWrapper.classList.add("open-all")
                    : featureWrapper.classList.remove("open-all");
            });
        },
        showVisualizer(ITEM) {
            this.$store.dispatch("selectGene", ITEM);
            uiUtils.showElement("feature-scores-wrapper");
        },
        /*showIGV(LOCATION, GENE) {
            this.igvBrowser = true;

            let locus = "chr" + LOCATION.replace(/\s/g, "");
            let igvDiv = document.getElementById("igv-content");
            let options = {
                genome: "hg19",
                name: "IGV",
                locus: locus,
            };
            [].slice
                .call(igvDiv.children)
                .forEach((child) => igvDiv.removeChild(child));
            igv.createBrowser(igvDiv, options, GENE);
        },*/
        formatContent(COLUMN, VALUE, LEVEL) {
            let formatting =
                LEVEL == "top"
                    ? this.config[this.dataset].formatting[COLUMN]
                    : this.config[this.dataset].formatting.features[COLUMN[0]][
                          COLUMN[1]
                      ];

            if (formatting != undefined) {
                let type = formatting["type"];

                switch (type) {
                    case "formatPvalue":
                        if (VALUE != "" && VALUE != 0) {
                            if (VALUE < 1e-2) {
                                return VALUE.toExponential(2);
                            } else {
                                return VALUE;
                            }
                        } else if (VALUE == 0) {
                            return VALUE;
                        } else {
                            return "";
                        }
                        break;
                    case "shorten":
                        if (VALUE != "") {
                            let shortenBy =
                                LEVEL == "top"
                                    ? this.config[this.dataset].formatting[
                                          COLUMN
                                      ]["shortenBy"]
                                    : this.config[this.dataset].formatting
                                          .features[COLUMN[0]][COLUMN[1]][
                                          "shortenBy"
                                      ];

                            let shortString = VALUE.slice(0, shortenBy);
                            let remaningString = VALUE.slice(
                                -(VALUE.length - shortenBy)
                            );
                            let content =
                                '<span class="shrtened-string">' +
                                shortString +
                                '<span class="remaining-string">' +
                                remaningString +
                                '</span><br /><a href="javascript:;">Show more</a></span>';

                            return content;
                        } else {
                            return "";
                        }

                        break;
                    case "image":
                        if (VALUE != "") {
                            let imageLinkRoot =
                                LEVEL == "top"
                                    ? this.config[this.dataset].formatting[
                                          COLUMN
                                      ]
                                    : this.config[this.dataset].formatting
                                          .features[COLUMN[0]][COLUMN[1]];

                            let imageLink =
                                imageLinkRoot["image_link"] +
                                imageLinkRoot["before_value"] +
                                VALUE +
                                imageLinkRoot["after_value"];
                            contentLink =
                                '<div class="single-gene-image-wrapper" href="javascript:;"><img src="' +
                                imageLink +
                                '" ></div>';
                            return contentLink;
                        } else {
                            return "";
                        }
                        break;
                    case "image_popup":
                        if (VALUE != "") {
                            let imageLinkRoot =
                                LEVEL == "top"
                                    ? this.config[this.dataset].formatting[
                                          COLUMN
                                      ]
                                    : this.config[this.dataset].formatting
                                          .features[COLUMN[0]][COLUMN[1]];

                            let imageLink =
                                imageLinkRoot["image_link"] +
                                imageLinkRoot["before_value"] +
                                VALUE +
                                imageLinkRoot["after_value"];
                            contentLink =
                                '<a class="image-popup-link" href="javascript:;"><img src="' +
                                imageLink +
                                '" style="width: 50%;margin-left:auto;margin-right: auto;"><span class="image-popup-wrapper"><img src="' +
                                imageLink +
                                '"></span></a>';
                            return contentLink;
                        } else {
                            return "";
                        }
                        break;
                    case "custom_link":
                        let linkTo = formatting["link_to"];
                        if (VALUE != "") {
                            contentLink =
                                '<a href="' +
                                linkTo +
                                VALUE +
                                '">' +
                                VALUE +
                                "</a>";
                            return contentLink;
                        } else {
                            return "";
                        }
                        break;
                    case "link":
                        let linkPage = formatting["link_to"];
                        let contentLink = "";
                        switch (linkPage) {
                            case "gene":
                                if (VALUE != "") {
                                    contentLink =
                                        '<a href="/gene.html?gene=' +
                                        VALUE +
                                        '">' +
                                        VALUE +
                                        "</a>";
                                    return contentLink;
                                } else {
                                    return "";
                                }

                                break;
                            case "variant":
                                if (VALUE != "") {
                                    contentLink =
                                        '<a href="/variant.html?variant=' +
                                        VALUE +
                                        '">' +
                                        VALUE +
                                        "</a>";
                                    return contentLink;
                                } else {
                                    return "";
                                }

                                break;
                            case "region":
                                if (VALUE != "") {
                                    let chr = VALUE.split(":")[0];
                                    let start = VALUE.split(":")[1]
                                        .split("-")[0]
                                        .trim();
                                    let end = VALUE.split(":")[1]
                                        .split("-")[1]
                                        .trim();
                                    contentLink =
                                        '<a href="/region.html?chr=' +
                                        chr +
                                        "&start=" +
                                        start +
                                        "&end=" +
                                        end +
                                        '">' +
                                        VALUE +
                                        "</a>";
                                    return contentLink;
                                } else {
                                    return "";
                                }

                                break;
                            case "phenotype":
                                if (VALUE != "") {
                                    let valueName = null;

                                    this.$store.state.bioPortal.phenotypes.map(
                                        (x) => {
                                            if (
                                                x.name.toLowerCase() ==
                                                VALUE.toLowerCase()
                                            ) {
                                                valueName = x.description;
                                            }
                                        }
                                    );

                                    contentLink =
                                        valueName != null
                                            ? '<a href="/phenotype.html?phenotype=' +
                                              VALUE +
                                              '">' +
                                              valueName +
                                              "</a>"
                                            : VALUE;

                                    return contentLink;
                                } else {
                                    return "";
                                }

                                break;
                        }
                        break;
                    case "render_bg_boolean":
                        let booleanVal =
                            VALUE == false || VALUE == "0" ? "false" : "true";
                        return (
                            "<span class='boolean-" +
                            booleanVal +
                            "'>&nbsp;</span>"
                        );
                        break;
                    case "render_bg_percent":
                        let highScore, columnHighestScore, columnLowestScore;

                        if (LEVEL == "top") {
                            columnHighestScore = this.highestScores[COLUMN];
                            columnLowestScore = this.lowestScores[COLUMN];
                        } else if (LEVEL == "feature") {
                            if (
                                this.highestScores.features[COLUMN[0]] ==
                                undefined
                            ) {
                                this.highestScores.features[COLUMN[0]] = {};
                                this.lowestScores.features[COLUMN[0]] = {};
                            }

                            columnHighestScore = this.highestScores.features[
                                COLUMN[0]
                            ][COLUMN[1]];

                            columnLowestScore = this.lowestScores.features[
                                COLUMN[0]
                            ][COLUMN[1]];
                        }

                        if (columnHighestScore == undefined) {
                            let countingColumns = formatting["count"];

                            if (LEVEL == "top") {
                                let tempArr = [];
                                this.tableData.map((r) => {
                                    if (r[COLUMN]) {
                                        tempArr.push(Number(r[COLUMN]));
                                    }
                                });

                                tempArr.sort(function (a, b) {
                                    return a - b;
                                });

                                this.highestScores[COLUMN] =
                                    tempArr[tempArr.length - 1];

                                this.lowestScores[COLUMN] = tempArr[0];

                                columnHighestScore = this.highestScores[COLUMN];
                                columnLowestScore = this.lowestScores[COLUMN];
                            } else if (LEVEL == "feature") {
                                let tempArr = [];
                                this.tableData.map((r) => {
                                    let tempData = r.features[COLUMN[0]];

                                    tempData.map((t) => {
                                        if (countingColumns != undefined) {
                                            countingColumns.map((cc) => {
                                                tempArr.push(Number(t[cc]));
                                            });
                                        } else {
                                            if (t[COLUMN[1]] != undefined) {
                                                tempArr.push(
                                                    Number(t[COLUMN[1]])
                                                );
                                            }
                                        }
                                    });
                                });

                                tempArr.sort(function (a, b) {
                                    return a - b;
                                });

                                this.highestScores.features[COLUMN[0]][
                                    COLUMN[1]
                                ] = tempArr[tempArr.length - 1];

                                this.lowestScores.features[COLUMN[0]][
                                    COLUMN[1]
                                ] = tempArr[0];

                                columnHighestScore = this.highestScores
                                    .features[COLUMN[0]][COLUMN[1]];

                                columnLowestScore = this.lowestScores.features[
                                    COLUMN[0]
                                ][COLUMN[1]];
                            }
                        } else {
                        }

                        let percentileValue = Math.abs(
                            Math.floor(
                                ((Number(VALUE) - columnLowestScore) /
                                    (columnHighestScore - columnLowestScore)) *
                                    100
                            )
                        );

                        return (
                            "<span class='cell-weight-" +
                            percentileValue +
                            "'>" +
                            VALUE +
                            "</span>"
                        );

                        break;

                    case "decimal":
                        let fixedBy = formatting["fixed"];
                        return parseFloat(VALUE).toFixed(fixedBy);
                        break;
                }
            } else {
                return VALUE;
            }
            return VALUE;
        },
    },
});
</script>

<style>
.clear-all-filters-bubble {
    background-color: #ff0000;
}
</style>
