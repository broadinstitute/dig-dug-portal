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
        filterData(value) {
            console.log("new value", value);
        },
    },
    methods: {
        buildOptions(field) {
            let options = this.tableData
                .map((v) => v[field])
                .filter((v, i, arr) => arr.indexOf(v) == i) //unique
                .filter((v, i, arr) => v != ""); //remove blank

            options.unshift("Show all");
            return options;
        },
        filterData(search, field, type) {
            console.log("event", search);
            console.log("field", field);
            console.log("type", type);
            //if (!search || !field) return this.tableData;
            if (!!field && !!type) {
                let filtered = [];
                if (type == "dropdown") {
                    if (search == "Show all") {
                        filtered = this.tableData.filter((row) => {
                            return row[field];
                        });
                    } else {
                        filtered = this.tableData.filter((row) => {
                            return search === row[field];
                        });
                    }
                } else if (type == "search") {
                    console.log("here");
                    filtered = this.tableData.filter((row) => {
                        return row[field]
                            .toLowerCase()
                            .includes(search.toLowerCase());
                    });
                }

                //console.log("new data", filtered);
                this.$store.dispatch("filteredData", filtered);
            }
        },
    },
});
</script>
