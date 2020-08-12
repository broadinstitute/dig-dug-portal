<template>
    <div class="eglt-table-wrapper" :id="dataset">
        <!--<div id="igv-div" v-show="igvBrowser">
            <div style="height:40px;">
                <b-btn-close @click="igvBrowser = false">
                    <b-icon-x-circle></b-icon-x-circle>
                </b-btn-close>
            </div>
            <div id="igv-content"></div>
        </div>-->
        <b-container
            fluid
            v-if="!!config && !!tableData && config[dataset].filters != undefined"
            class="filtering-ui-wrapper"
        >
            <b-row class="filtering-ui-content">
                <b-col v-for="filter in config[dataset]['filters']" :key="filter.field">
                    <div class="label" v-html="filter.label"></div>
                    <template v-if="filter.type.includes('search')">
                        <b-form-input
                            type="text"
                            @change="filterData($event, filter.field, filter.type)"
                        ></b-form-input>
                    </template>
                    <template v-else-if="filter.type == 'dropdown'">
                        <b-form-select
                            :options="buildOptions(filter.field)"
                            @change="filterData($event, filter.field, filter.type)"
                        ></b-form-select>
                    </template>
                </b-col>
            </b-row>
        </b-container>
        <b-container class="search-fields-wrapper">
            <div v-for="(value,name,index) in this.filtersIndex" :class="'search-field f-'+index">
                <b-badge
                    pill
                    v-if="value.search.length > 0"
                    v-for="(v,i) in value.search"
                    :key="v"
                    :class="'btn search-bubble '+i"
                    @click="removeFilter(value.field,i)"
                    v-html="v+'&nbsp;<span class=\'remove\'>X</span>'"
                ></b-badge>
            </div>
        </b-container>
        <b-container fluid v-if="!!config && !!tableData" class="legend-wrapper">
            <b-row
                class="each-legend"
                v-for="(legend, i) in config[dataset]['legend']"
                v-html="legend"
                :key="i"
            ></b-row>
        </b-container>
        <div :class="'EGLT-table '+this.dataset">
            <b-container fluid v-if="!!config && !!filteredData" class>
                <b-row class="top-level-header">
                    <div
                        v-for="name in config[dataset]['topLevelRender']"
                        :class="'top-level-header-item ' + name"
                        v-html="name"
                    ></div>
                    <div class="top-level-header-item">View</div>
                </b-row>
                <b-row v-for="(value,index) in filteredData" class="top-level-value" :key="index">
                    <template v-for="(col, i) in config[dataset]['topLevelRender']">
                        <div
                            :class="'top-level-value-item '+i+' '+i+'-'+value[i]"
                            :key="i"
                            v-html="formatContent(i,value[i],'top')"
                        ></div>
                    </template>
                    <div class="top-level-value-item">
                        <b-button
                            @click="showFeatures(index)"
                            class="view-features-btn"
                            v-html="config[dataset]['feature_btn_name']? config[dataset]['feature_btn_name']:'Features'"
                        ></b-button>
                        <template v-if="config[dataset]['plots']['render'] == true">
                            <b-button
                                @click="showVisualizer(value[config[dataset]['plots']['openerField']])"
                                class="view-visualizer-btn"
                                v-html="config[dataset]['plots']['btnName']"
                            ></b-button>
                        </template>
                        <!--<template v-if="config[dataset]['browser']">
                            <b-button
                                @click="showIGV(value.location, value.gene)"
                                class="view-igv-btn"
                            >IGV Browser</b-button>
                        </template>-->
                    </div>

                    <effector-genes-features :features="value.features" :featureIndex="index"></effector-genes-features>
                </b-row>
            </b-container>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
//import igv from "../../node_modules/igv/dist/igv.esm";
import EffectorGenesFeatures from "@/components/eglt/EffectorGenesFeatures";
import uiUtils from "@/utils/uiUtils";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-table", {
    props: ["dataset", "trait"],
    data() {
        return {
            optionData: [],
            filtersIndex: {},
            highestScores: { features: {} },
            lowestScores: { features: {} },
            /*igvBrowser: false,*/
        };
    },
    modules: {
        uiUtils,
    },
    components: { EffectorGenesFeatures },
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
    },
    computed: {
        tableData() {
            return this.$store.state.tableData;
        },
        filteredData() {
            return this.$store.state.filteredData;
        },
        config() {
            return this.$store.state.config;
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
        },
        tableData(data) {
            uiUtils.showHideElement("data-loading-indicator");
        },
    },
    methods: {
        buildOptions(field) {
            let options = this.tableData
                .map((v) => v[field])
                .filter((v, i, arr) => arr.indexOf(v) == i) //unique
                .filter((v, i, arr) => v != ""); //remove blank
            return options;
        },
        filterData(search, field, type) {
            this.filtersIndex[field]["search"].push(search);

            this.applyFilters();
        },
        applyFilters() {
            let filtered = this.tableData;
            let tempFiltered = [];
            let i = 0;
            for (var f in this.filtersIndex) {
                let searchIndex = this.filtersIndex[f];

                if (searchIndex.search.length > 0) {
                    searchIndex.search.map((s) => {
                        let targetData = filtered;
                        let search = s;

                        if (searchIndex.type == "dropdown") {
                            targetData.filter((row) => {
                                if (search === row[searchIndex.field]) {
                                    tempFiltered.push(row);
                                }
                            });
                        } else if (searchIndex.type == "search") {
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
                        }
                    });

                    filtered = tempFiltered;
                    tempFiltered = [];
                    i++;
                }
            }

            this.$store.dispatch("filteredData", filtered);
        },
        removeFilter(FIELD, ITEM) {
            this.filtersIndex[FIELD].search.splice(ITEM, 1);

            this.applyFilters();
        },
        showFeatures(INDEX) {
            uiUtils.showHideElement("feature-content-wrapper-" + INDEX);
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
                    case "link":
                        let linkPage = formatting["link_to"];
                        let contentLink = "";
                        switch (linkPage) {
                            case "gene":
                                contentLink =
                                    '<a href="/gene.html?gene=' +
                                    VALUE +
                                    '">' +
                                    VALUE +
                                    "</a>";
                                return contentLink;

                                break;
                            case "variant":
                                contentLink =
                                    '<a href="/variant.html?variant=' +
                                    VALUE +
                                    '">' +
                                    VALUE +
                                    "</a>";
                                return contentLink;

                                break;
                            case "region":
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

                                break;
                            case "phenotype":
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
                                        if (t[COLUMN[1]]) {
                                            tempArr.push(Number(t[COLUMN[1]]));
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

                            let percentileValue = Math.abs(
                                Math.floor(
                                    ((Number(VALUE) - columnLowestScore) /
                                        (columnHighestScore -
                                            columnLowestScore)) *
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
                        } else {
                            let percentileValue = Math.abs(
                                Math.floor(
                                    ((Number(VALUE) - columnLowestScore) /
                                        (columnHighestScore -
                                            columnLowestScore)) *
                                        100
                                )
                            );

                            console.log(percentileValue);

                            return (
                                "<span class='cell-weight-" +
                                percentileValue +
                                "'>" +
                                VALUE +
                                "</span>"
                            );
                        }

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
