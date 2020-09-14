import Vue from "vue";
import * as d3 from "d3";

import Template from "./Template.vue";

import FilterUser from "./FilterUser.vue"
import FilterContext from "./FilterContext/FilterContext.vue"
import FilterWidget from "./FilterWidget/FilterWidget.vue"
import FilterWidgetControl from "./FilterWidget/FilterWidgetControl.vue"
import FilterPValue from "./FilterWidget/FilterPValue.vue"
import FilterEffectDirection from "./FilterWidget/FilterEffectDirection.vue"
import FilterEnumeration from "./FilterWidget/FilterEnumeration.vue"
import FilterGreaterThan from "./FilterWidget/FilterGreaterThan.vue"

import AssociationsTable from "./AssociationsTable.vue"
import LocusZoom from "@/components/lz/LocusZoom.vue"
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel.vue"

import { query } from "@/utils/bioIndexUtils"

Vue.config.productionTip = false;

new Vue({
    components: {
        FilterUser,
        FilterContext,
        FilterWidget,
        FilterWidgetControl,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan,

        AssociationsTable,
        LocusZoom,
        LocusZoomAssociationsPanel,

    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            filterFunction: id => id,
            inclusive: false,
            initialData: [
                { pValue: 0.01, beta: 3 }, 
                { pValue: 0.001, beta: 3 }, 
                { pValue: 0.2, beta: 3 }, 
                { pValue: 0.01, beta: 4 }, 
                { pValue: 0.01, beta:2 }, 
                { test: 'no matches' },
                { test: 'some matches' },
                { test: 'all matches' },
            ],

            associations: [],
            phenotypes: [{
                "name": "T2D",
                "description": "Type 2 diabetes",
                "group": "GLYCEMIC",
                "dichotomous": 1
            }],
            chr: 9,
            start: 21940000,
            end: 22190000

        }
    },
    mounted() {
        query('gwas-associations', 'T2D', { limit: 100 }).then(data => { 
            this.associations = data;
        })
    },
    computed: {
        filteredData() {
            return this.initialData.filter(this.filterFunction)
        },
        matches() {
            return this.filteredData.filter(obj => !!obj.test).map(obj => obj.test);
        },
        // filter_consequence_options() {
        //     return this.groupedAssociations
        //         .map((v) => Formatters.consequenceFormatter(v.consequence))
        //         .filter((v, i, arr) => arr.indexOf(v) == i)
        //         .filter((v, i, arr) => v != undefined)
        //         .sort();
        // },
        // filter_closest_gene_options() {
        //     let genes = this.associations.flatMap((assoc) => assoc.nearest);

        //     // return sorted, unique genes
        //     return [...new Set(genes)].sort();
        // },
    }
}).$mount("#app");
