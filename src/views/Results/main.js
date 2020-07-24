import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import RegionsResultCard from "./cards/RegionsResultCard.vue"
import AssociationsResultCard from "./cards/AssociationsResultCard.vue"
import VariantResultCard from "./cards/VariantResultCard.vue"

import { BootstrapVue } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import { BIOINDEX_SCHEMA, decodeHistory, provenanceHash, contentHash, encodeHistory, bioIndexFromHash, parentFromHash, phenotypeFromHash, locusFromHash } from "./utils/resultsUtils"
import _ from "lodash";

import keyParams from "@/utils/keyParams";


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

            loadedHistory: keyParams.q,

            loading: false,
        }
    },
    created() {
        // neither an empty string nor undefined
        // NOTE: assumes loadedHistory is valid!
        // Will pass out if there's not loadedHistory attempted to be provided
        if (!!this.loadedHistory) {
            this.decodeAndLoad(this.loadedHistory);
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
        bioIndexFromHash,
        parentFromHash,
        phenotypeFromHash,
        locusFromHash,

        jumpToElementBy(elementSelector) {
            console.log('jumping to element', this.$el.querySelector(elementSelector))
            // https://stackoverflow.com/a/17938519/1991892
            this.$el.querySelector(elementSelector).scrollIntoView();
        },
        makeURLWithEncodeHistory() {
            alert(window.location+'?q='+encodeHistory(this.$store.state.resultCards.cards, this.$store.state.resultCards.edges));
        },
        decodeAndLoad(historyString) {
            const decodedHistory = decodeHistory(historyString);
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
