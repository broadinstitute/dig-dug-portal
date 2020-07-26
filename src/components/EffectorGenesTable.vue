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
                <b-row fixed class="top-level-header">
                    <b-col
                        v-for="name in config[dataset]['topLevelRender']"
                        :class="'top-level-header-item ' + name"
                    >{{name}}</b-col>
                </b-row>
                <b-row v-for="row in filteredData" class="top-level-value">
                    <template v-for="(col, i) in config[dataset]['topLevelRender']">
                        <b-col
                            :class="'top-level-value-item '+i+' '+i+'-'+row[i]"
                            :key="i"
                        >{{row[i]}}</b-col>
                    </template>

                    <effector-genes-features :features="row.features"></effector-genes-features>
                </b-row>
            </b-container>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import EffectorGenesFeatures from "@/components/eg/EffectorGenesFeatures";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-table", {
    props: ["dataset", "trait"],
    data() {
        return {
            optionData: [],
            filtersIndex: {},
        };
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
    },
});
</script>
