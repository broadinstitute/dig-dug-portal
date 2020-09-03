<template>
    <div>
        <b-container fluid class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <b-col>
                    <div class="label">Consequence</div>
                    <b-form-select
                        @change="addCompound($event, 'select_consequence','filter-consequence')"
                        :options="filter_consequence_options"
                        id="filter-consequence"
                        ref="select_consequence"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <div class="label">Closest Gene</div>
                    <b-form-select
                        id="filter-gene"
                        :options="filter_closest_gene_options"
                        @change="addCompound($event, 'select_gene','filter-gene')"
                    ></b-form-select>
                </b-col>
                <b-col class="filter-col-sm">
                    <div class="label">P-Value (&le;)</div>
                    <b-form-input
                        id="filter-pValue"
                        type="text"
                        v-model="select_pValue_text"
                        @change="addCompound($event, 'select_pValue','filter-pValue', false)"
                        ref="select_pValue"
                    ></b-form-input>
                </b-col>
                <b-col class="filter-col-sm">
                    <div class="label">Effect</div>
                    <b-form-select
                        id="filter-beta"
                        @input="addCompound($event, 'select_beta','filter-beta', false)"
                        :options="select_beta_options"
                        ref="select_beta"
                        v-model="select_beta"
                    ></b-form-select>
                </b-col>
            </b-row>
        </b-container>
        <b-container fluid class="selected-filters-ui-wrapper">
            <b-row v-if="select_consequence.length > 0 || select_gene.length > 0 || select_pValue || select_beta"
            >
                <b-col>
                    <span>Selected Filters:&nbsp;&nbsp;</span>
                    <template v-if="select_consequence.length > 0">
                        <b-badge
                            pill
                            variant="success"
                            v-for="(v,i) in select_consequence"
                            :key="v"
                            @click="removeFilter(i, 'select_consequence')"
                            class="btn"
                        >
                            {{v}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="select_gene.length > 0">
                        <b-badge
                            pill
                            variant="warning"
                            v-for="(g,i) in select_gene"
                            :key="g"
                            @click="removeFilter(i, 'select_gene')"
                            class="btn"
                        >
                            {{g}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="select_pValue.length > 0">
                        <b-badge
                            pill
                            variant="danger"
                            @click="unsetFilter('select_pValue')"
                            class="btn"
                        >
                            {{select_pValue}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="select_beta">
                        <b-badge
                            pill
                            variant="primary"
                            @click="unsetFilter('select_beta')"
                            class="btn"
                        >
                            {{select_beta_options.find(e => e.value === select_beta).text}}
                            <span
                                class="remove"
                            >X</span>
                        </b-badge>
                    </template>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";
import Filters from "@/utils/filters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("filter-widget", {
    props: ["associations", "phenotypes"],
    data() {
        return {
            // TODO: These need to be dynamically registered or collected
            select_pValue: "",
            select_pValue_text: "",
            select_consequence: [],
            select_gene: [],
            select_beta: "",
            select_beta_options: [
                { value: "p", text: "Positive" },
                { value: "n", text: "Negative" },
            ],
        };
    },
    mounted() {},
    computed: {
        groupedAssociations() {
            let data = [];
            let groups = {};

            for (let i in this.associations) {
                let r = this.associations[i];
                let dataIndex = groups[r.varId];

                if (!dataIndex) {
                    dataIndex = data.length;
                    groups[r.varId] = dataIndex;

                    data.push({
                        varId: r.varId,
                        chromosome: r.chromosome,
                        position: r.position,
                        reference: r.reference,
                        dbSNP: r.dbSNP,
                        consequence: r.consequence,
                        nearest: r.nearest,
                        alt: r.alt,
                        minP: 1.0,
                    });
                }

                // add the phenotype columns
                data[dataIndex][`${r.phenotype}_pValue`] = r.pValue;
                data[dataIndex][`${r.phenotype}_beta`] = r.beta;
                data[dataIndex][`${r.phenotype}_stdErr`] = r.stdErr;
                data[dataIndex][`${r.phenotype}_zScore`] = r.zScore;
                data[dataIndex][`${r.phenotype}_n`] = r.n;

                // lowest p-value across all phenotypes
                if (!!r.pValue && r.pValue < data[dataIndex].minP) {
                    data[dataIndex].minP = r.pValue;
                }
            }

            // remove non-overlapping associations
            data = data.filter((row) => {
                for (let i in this.phenotypes) {
                    let phenotype = this.phenotypes[i];

                    // ensure a p-value exists for each phenotype
                    if (!row[`${phenotype.name}_pValue`]) {
                        return false;
                    }
                }

                return true;
            });

            // sort all the records by phenotype p-value
            data.sort((a, b) => a.minP - b.minP);

            return data;
        },

        // Options for the sub-elements of the filter widget
        filter_consequence_options() {
            return this.groupedAssociations
                .map((v) => Formatters.consequenceFormatter(v.consequence))
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v, i, arr) => v != undefined)
                .sort();
        },
        filter_closest_gene_options() {
            let genes = this.associations.flatMap((assoc) => assoc.nearest);

            // return sorted, unique genes
            return [...new Set(genes)].sort();
        },
    },

    methods: {

        addFilter(event, obj) {
            //console.log("add" + event);
            this[obj].push(event.trim());
            this[obj + "_text"] = "";
        },
        setFilter(event, obj) {
            this[obj] = event;
            this[obj + "_text"] = "";
        },
        removeFilter(index, obj) {
            this[obj].splice(index, 1);
        },
        unsetFilter(obj) {
            this[obj] = "";
        },
        addSingle(event, obj) {
            this.addFilter(event, obj);
            this.clearCompound();
        },
        addCompound(event, obj, id, multiple = true) {
            if (multiple) this.addFilter(event, obj);
            else this.setFilter(event, obj);

            let element = document.getElementById(id);
            element.value = "";
        },

        clearCompound() {
            // These need to be made generic
            this.select_consequence = [];
            this.select_gene = [];
            this.select_pValue = "";
            this.select_beta = "";
        },
    },
});
</script>
