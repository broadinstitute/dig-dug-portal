<template>
    <div class="EGL-table-wrapper" :id="dataset">
        <b-container fluid v-if="!!config && !!tableData" class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <b-col v-for="filter in config[dataset]['filters']">
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
        <b-container fluid v-if="!!config && !!filteredData">
            <b-row class="headers">
                <b-col v-for="name in config[dataset]['render']">{{name}}</b-col>
            </b-row>
            <b-row v-for="row in filteredData">
                <template v-for="(col, i) in config[dataset]['render']">
                    <b-col :class="i" :key="i">{{row[i]}}</b-col>
                </template>

                <effector-genes-features :features="row.features"></effector-genes-features>
            </b-row>
        </b-container>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import EffectorGenesFeatures from "@/components/eg/EffectorGenesFeatures";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-mccarthy", {
    //props: ["tableData"], //ignore for now, data comes from static file
    data() {
        return {
            // staticTableData: null,
            // config: null,
            dataset: "mccarthy",
            trait: "t2d",
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
            return this.tableData
                .map((v) => v[field])
                .filter((v, i, arr) => arr.indexOf(v) == i) //unique
                .filter((v, i, arr) => v != ""); //remove blank
        },
        filterData(search, field, type) {
            console.log("event", search);
            console.log("field", field);
            console.log("type", type);
            //if (!search || !field) return this.tableData;
            if (!!field && !!type) {
                let filtered = [];
                if (type == "dropdown") {
                    filtered = this.tableData.filter((row) => {
                        return search === row[field];
                    });
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
