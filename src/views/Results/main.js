import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import RegionsResultCard from "./cards/RegionsResultCard.vue"
import AssociationsResultCard from "./cards/AssociationsResultCard.vue"
import VariantResultCard from "./cards/VariantResultCard.vue"
import PhenotypeSignalCard from "./cards/PhenotypeSignalCard.vue"
import GeneResultCard from "./cards/GeneResultCard.vue"

import ResultsGlobalTooltip from "./navs/ResultsGlobalTooltip.vue"
import ResultsNav from "./navs/ResultsNav"

import LocusZoom from "@/components/lz/LocusZoom.vue"
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasPanel.vue"

import Multiselect from "vue-multiselect"
import "vue-multiselect/dist/vue-multiselect.min.css"

import { BootstrapVue } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import { BIOINDEX_SCHEMA, decodeHistory, provenanceHash, contentHash, encodeHistory, bioIndexFromHash, parentFromHash, phenotypeFromHash, locusFromHash, queryFromHash, dispatchSetOperation } from "./utils/resultsUtils"
import _ from "lodash";

import keyParams from "@/utils/keyParams";

Vue.component('multiselect', Multiselect)


Vue.use(BootstrapVue);
new Vue({
    store,
    components: {
        LocusZoom,
        LocusZoomPhewasPanel,

        ResultsGlobalTooltip,
        RegionsResultCard,
        AssociationsResultCard,
        VariantResultCard,
        GeneResultCard,
        PhenotypeSignalCard,
        ResultsNav,
    },
    data() {
        return {

            index: 'gene',
            query: 'pcsk9',

            decodeString: '',

            loadedHistory: keyParams.q,

            loading: false,

            operation: 'intersect',
            operations: [
                'intersect',
                'union',
                // 'difference'
            ],
            cardsForOperation: ''

        }
    },
    created() {

        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");

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

        provenanceHash,  // used for identifying cards
        contentHash,     // used for accessing data cache
        // extractors for a provenanceHash (*not* a contentHash)
        bioIndexFromHash,
        parentFromHash,
        phenotypeFromHash,
        locusFromHash,
        queryFromHash,
        dispatchSetOperation,

        jumpToElementBy(elementSelector) {
            console.log('jumping to element', this.$el.querySelector(elementSelector))
            // https://stackoverflow.com/a/17938519/1991892
            this.$el.querySelector(elementSelector).scrollIntoView();
        },
        makeURLWithEncodeHistory() {
            // need concatenate these two together because sometimes `window.location.href` will contain unecessary junk
            alert(window.location.host+window.location.pathname+'?q='+encodeHistory(this.$store.state.resultCards.cards, this.$store.state.resultCards.edges));
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
