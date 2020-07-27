<template>
    <div class="eglt-table-wrapper" :id="dataset">
        <b-container fluid v-if="!!config && !!tableData" class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <b-col
                    v-if="config[dataset]['filters'].length > 0"
                    v-for="filter in config[dataset]['filters']"
                >
                    <div class="label">{{filter.label}}</div>
                    <template v-if="filter.type == 'search'">
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
                    <template v-else>Default filter</template>
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
                >
                    {{value.field+': '+v}}
                    <span class="remove">X</span>
                </b-badge>
            </div>
        </b-container>
        <b-container fluid v-if="!!config && !!tableData" class="legend-wrapper">
            <b-row class="each-legend" v-for="legend in config[dataset]['legend']">{{legend}}</b-row>
        </b-container>
        <div :class="'EGLT-table '+this.dataset">
            <b-container fluid v-if="!!config && !!filteredData" class>
                <b-row class="top-level-header">
                    <div
                        v-for="name in config[dataset]['topLevelRender']"
                        :class="'top-level-header-item ' + name"
                    >{{name}}</div>
                    <div class="top-level-header-item">View</div>
                </b-row>
                <b-row v-for="(value,index) in filteredData" class="top-level-value">
                    <template v-for="(col, i) in config[dataset]['topLevelRender']">
                        <div
                            :class="'top-level-value-item '+i+' '+i+'-'+value[i]"
                            :key="i"
                            v-html="formatContent(i,value[i],'top')"
                        ></div>
                    </template>
                    <div class="top-level-value-item">
                        <b-button @click="showFeatures(index)" class="view-features-btn">Features</b-button>
                        <template v-if="config[dataset]['visualizer'][0] == true">
                            {{index}}
                            <b-button
                                @click="showVisualizer(index)"
                            >{{config[dataset]['visualizer'][2]}}</b-button>
                        </template>
                    </div>

                    <effector-genes-features
                        :featureConfig="config"
                        :features="value.features"
                        :featureIndex="index"
                    ></effector-genes-features>
                </b-row>
            </b-container>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import EffectorGenesFeatures from "@/components/eg/EffectorGenesFeatures";
import uiUtils from "@/utils/uiUtils";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-table", {
    props: ["dataset", "trait"],
    data() {
        return {
            optionData: [],
            filtersIndex: {},
            highestScores: {},
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

            //console.log(this.filtersIndex);

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
        showVisualizer(INDEX) {
            console.log("show index: ", INDEX);
        },
        formatContent(COLUMN, VALUE, LEVEL) {
            let formatting = this.config[this.dataset].formatting;
            if (formatting[COLUMN] != undefined) {
                let type =
                    LEVEL == "top"
                        ? formatting[COLUMN]["type"]
                        : formatting.features[COLUMN]["type"];

                switch (type) {
                    case "link":
                        let linkPage = formatting[COLUMN]["link_to"];
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
                                    '<a href="variant.html?variant=' +
                                    VALUE +
                                    '">' +
                                    VALUE +
                                    "</a>";
                                return contentLink;

                                break;
                            case "regin":
                                contentLink = VALUE;
                                return contentLink;

                                break;
                            case "phenotype":
                                contentLink =
                                    '<a href="/phenotype.html?phenotype=' +
                                    VALUE +
                                    '">' +
                                    VALUE +
                                    "</a>";
                                return contentLink;

                                break;
                        }
                        break;
                    case "render_bg_percent":
                        let highScore;

                        let highestScoreLocation =
                            LEVEL == "top"
                                ? this.highestScores[COLUMN]
                                : this.highestScores.features[COLUMN];

                        if (highestScoreLocation != undefined) {
                            highScore = highestScoreLocation;
                        } else {
                            let tempArr = [];

                            this.tableData.map((r) => {
                                tempArr.push(r[COLUMN]);
                            });
                            tempArr.sort();

                            if (LEVEL == "top") {
                                this.highestScores[COLUMN] = tempArr.pop();
                            } else {
                                if (
                                    this.highestScores["features"] != undefined
                                ) {
                                    this.highestScores["features"][COLUMN] = 1; //teset number
                                } else {
                                    this.highestScores["features"] = {};
                                    this.highestScores["features"][COLUMN] = 1; //teset number
                                }
                            }

                            highScore = highestScoreLocation;
                        }

                        let percentileValue = Math.floor(
                            (VALUE / highScore) * 100
                        );

                        return (
                            "<span class='cell-weight-" +
                            percentileValue +
                            "'>" +
                            VALUE +
                            "</span>"
                        );
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
