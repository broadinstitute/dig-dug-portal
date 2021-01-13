import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css"
import BootstrapVue from "bootstrap-vue"

import NCATSPredicateTable from "@/components/NCATS/PredicateTable"
import jsonQuery from "json-query"

Vue.config.productionTip = false;
Vue.use(BootstrapVue);

new Vue({
    store,
    components: {
        NCATSPredicateTable
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            geneInfo: [],
            fields: ['pathway', 'go'],
            currentPage: 1,
        };
    },
    mounted() {
       this.$store.dispatch('myGeneInfo/infoForGeneSymbol', { geneSymbol: 'PCSK9', fields: ['pathway', 'go'] });
    },
    computed: {
        goTerms: function() {
            return this.geneInfoForField(this.$store.state.myGeneInfo.geneInfo, 'go');
        },
        pathway: function() {
            return this.geneInfoForField(this.$store.state.myGeneInfo.geneInfo, 'pathway');
        }
    },
    methods: {
        geneInfoForField(geneInfo, field) {
            const helpers = {
                aggregateNestedLists: function(elements) {
                    const element = elements.flatMap(element => Object.entries(element).filter(element => element[1].length > 0).flatMap(entry => entry[1]))
                    return element;
                }
            }
            return jsonQuery(`geneInfo[${field}]:aggregateNestedLists`, {
                data: {
                    geneInfo
                },
                allowRegexp: true,
                locals: helpers
            }).value;
        },
    },
    watch: {
    }
}).$mount("#app");
