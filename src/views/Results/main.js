import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import bioIndexUtils from "@/utils/bioIndexUtils";

import RegionsResultCard from "./cards/RegionsResultCard.vue"
import AssociationsResultCard from "./cards/AssociationsResultCard.vue"
import VariantResultCard from "./cards/VariantResultCard.vue"

import { BootstrapVue } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import { BIOINDEX_SCHEMA } from "./utils/resultsUtils"
import PheWASTable from "@/components/PheWASTable.vue";

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

            dataCache: {},

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
        }
    },
    methods: {
        tap() {
            console.log('tap', arguments);
            return event;
        },
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
        queryBioIndexForResults(index, query, parent=-1) {
            console.log(index, query, parent);
            this.loading = true;

            const queryObj = { index, query, parent };
            const queryHash = this.hashQuery(queryObj);

            if (typeof this.dataCache[queryHash] === 'undefined') {
                const self = this;
                Promise.resolve(bioIndexUtils.query(queryObj.index, queryObj.query, { limit: null } )).then(data => {
                    self.dataCache[queryHash] = data;
                    console.log('promised queryObj', queryObj);
                    self.$store.dispatch('addCard', queryObj);
                    self.loading = false;
                });
            } else {
                console.log("didn't have to query, using cache");
                // TODO: use jumpTo functionality here if we know that the data already exists?
                // TODO: alternately, push it up to the top?
                // Hmm, intermix this with timestamps? get a cache hit, but for data at a different time -> use the cached data but identify it by timestamp
                this.$store.dispatch('addCard', queryObj);
                this.loading = false;
            }
        },
        hashQuery(queryObj) {
            // NOTA BENE: we're going to use this under conditions where it's a div ID, so it needs to follow HTML spec
            // https://stackoverflow.com/questions/70579/what-are-valid-values-for-the-id-attribute-in-html
            // For now since 'index' refers to an english word plus hyphens, we're in the clear for HTML5, but if we can't put constraints
            // on our hashing algo we're going to have (small) problems later. (?: could just put a random letter in front? -> breaks non-determinism)

            // NOTE: Vue apparently likes even *fewer* characters than the HTML5 spec constrains. doesn't work with `.` nor `:`
            // using `_` to be consistent with HTML spec, AND what Vue can handle, for valid ids for elements (the default `,` breaks document selector behavior)
            // TODO: in thr case of locii, *for now*, we'll replace colon with an underscore...
            const { index, query, parent } = queryObj;
            return [
                index,
                parent,
                query.replace(':', '_').replace(',','--'),
            ].join('__')  // double underscore since single underscore is now reserved
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
        }
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
