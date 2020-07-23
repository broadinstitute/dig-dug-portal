import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import RegionsResultCard from "./cards/RegionsResultCard.vue"
import AssociationsResultCard from "./cards/AssociationsResultCard.vue"
import VariantResultCard from "./cards/VariantResultCard.vue"

import { BootstrapVue } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import { BIOINDEX_SCHEMA, decodeHistory, provenanceHash, contentHash } from "./utils/resultsUtils"
import _ from "lodash";
// import PheWASTable from "@/components/PheWASTable.vue";

Vue.use(BootstrapVue);
new Vue({
    store,
    components: {
        RegionsResultCard,
        AssociationsResultCard,
        VariantResultCard,
    },
    data() {
        return {

            index: 'regions',
            query: 'slc30a8',

            decodeString: '',

            loading: false,
        }
    },
    computed: {
        placeholder: function() {
            return BIOINDEX_SCHEMA.data.filter(schema => schema.index === this.index)[0].schema;
        },
    },
    methods: {
        tap() {
            console.log('tap', arguments);
            return event;
        },

        provenanceHash,
        contentHash,
        // TODO: Move these to utils
        bioIndexFromHash(queryHash) {
            // TODO: need to refactor use of queryHash if queryHash is not decodable into parts
            return queryHash.split('__')[0];
        },
        parentFromHash(queryHash) {
            // TODO: need to refactor use of queryHash if queryHash is not decodable into parts
            return queryHash.split('__')[1];
        },
        leftmostArgFromHash(queryHash) {
            const queryHashTokens = queryHash.split('__');
            return queryHashTokens[queryHashTokens.length - 1].split('--')[0];
        },
        rightmostArgFromHash(queryHash) {
            const queryHashTokens = queryHash.split('__');
            return queryHashTokens[queryHashTokens.length - 1].split('--').pop();
        },
        phenotypeFromHash(queryHash) {
            // NB: doesn't check if the hash actually contains a phenotype
            // TODO: need to refactor use of queryHash if queryHash is not decodable into parts
            return this.leftmostArgFromHash(queryHash);
        },
        locusFromHash(queryHash) {
            // NB: doesn't check if the hash actually contains a locus
            // TODO: need to refactor use of queryHash if queryHash is not decodable into parts
            return this.rightmostArgFromHash(queryHash).replace("_",":")
        },
        jumpToElementBy(elementSelector) {
            console.log('jumping to element', this.$el.querySelector(elementSelector))
            // https://stackoverflow.com/a/17938519/1991892
            this.$el.querySelector(elementSelector).scrollIntoView();
        },

        decodeAndLoad(historyString) {
            const decodedHistory = decodeHistory(historyString);
            // console.log('decodedHistory', decodedHistory);
            // NOTE: Doesn't delete the cache. Feature and not bug?
            this.$store.dispatch('clearEverything');
            Promise.all(decodedHistory.cards.map(card => {
                this.$store.dispatch('queryBioIndexForResults', { ...card })
            }))
        }

    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
