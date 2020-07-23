import Vue from "vue";
import AsyncComputed from "vue-async-computed";
import Template from "./Template.vue";
import store from "./store.js";

import bioIndexUtils from "@/utils/bioIndexUtils";

import RegionsResultCard from "./cards/RegionsResultCard.vue"
import AssociationsResultCard from "./cards/AssociationsResultCard.vue"
import VariantResultCard from "./cards/VariantResultCard.vue"

import { BootstrapVue } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import { BIOINDEX_SCHEMA, decodeHistory, hashQuery } from "./utils/resultsUtils"
import PheWASTable from "@/components/PheWASTable.vue";

Vue.use(AsyncComputed);
Vue.use(BootstrapVue);


new Vue({
    store,
    components: {
        RegionsResultCard,
        AssociationsResultCard,
        VariantResultCard,
        PheWASTable,

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
        queryHashes: function() {
            // TODO: implement hash function which can also compactify the query
            // return this.queries.map(query => this.hashQuery(query));
            return this.$store.state.resultCards.cards.map(card => {
                return this.hashQuery(card);
            });
        },
    },
    methods: {
        tap() {
            console.log('tap', arguments);
            return event;
        },

        hashQuery,
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
            // https://stackoverflow.com/a/17938519/1991892
            this.$el.querySelector(elementSelector).scrollIntoView();
        },
        elIdFormatter(text) {
            return '#'+text;
        },
        elClassFormatter(text) {
            return '.'+text;
        },

        // Data Processing Methods
        queryBioIndexForResults({ index, query, parent=-1 }) {
            console.log(index, query, parent);
            this.loading = true;

            const queryObj = { index, query, parent };
            const queryHash = this.hashQuery(queryObj);

            if (typeof this.$store.state.dataCache[queryHash] === 'undefined') {
                console.log('using load')
                const self = this;
                Promise.resolve(bioIndexUtils.query(queryObj.index, queryObj.query, { limit: null } )).then(data => {
                    self.$store.state.dataCache[queryHash] = data;
                    self.$store.dispatch('addCard', queryObj);
                    self.loading = false;
                });
            } else {
                console.log('using cache')
                this.$store.dispatch('addCard', queryObj);
                this.loading = false;
            }
        },

        decodeAndLoad(historyString) {
            const self = this;

            // NOTE: Doesn't delete the cache. Feature and not bug?
            this.$store.dispatch('clearEverything');
            decodeHistory(historyString).cards.forEach(card => {
                this.loading = true;
                console.log(Date.now())
                this.$store.dispatch('queryBioIndexForResults', { ...card })
                    .then(() => {
                        console.log(Date.now())
                        self.loading = false;
                    });
            });
        }
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
