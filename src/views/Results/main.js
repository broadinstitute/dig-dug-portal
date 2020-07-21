import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { query } from "@/utils/bioIndexUtils";

import RegionsResultCard from "./cards/RegionsResultCard.vue"
import AssociationsResultCard from "./cards/AssociationsResultCard.vue"
import VariantResultCard from "./cards/VariantResultCard.vue"

import { BootstrapVue } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import { BIOINDEX_SCHEMA } from "./utils/resultsUtils"

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
            queryString: 'slc30a8',

            queries: [],
            dataCache: {},

            loading: false,
        }
    },
    computed: {
        queryHashes: function() {
            // TODO: implement hash function which can also compactify the query
            return this.queries.map(query => this.hashQuery(query));
        },
        placeholder() {
            return BIOINDEX_SCHEMA.data.filter(schema => schema.index === this.index)[0].schema;
        }
    },
    methods: {
        tap() {
            console.log('tap', arguments);
            return event;
        },
        bioIndexFromHash(queryHash) {
            // TODO: need to refactor use of queryHash if queryHash is not decodable into parts
            return queryHash.split('__')[0]
        },
        leftmostArgFromHash(queryHash) {
            return queryHash.split('__')[1].split('--')[0];
        },
        rightmostArgFromHash(queryHash) {
            return queryHash.split('__')[1].split('--').pop();
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
        queryBioIndexForResults(index, queryString) {
            console.log('dispatching query', index, queryString);

            this.loading = true;

            const self = this;
            const queryObj = { index: index, queryString: queryString };
            const queryHash = self.hashQuery(queryObj);
            console.log('queryHash', queryHash);

            if (typeof this.dataCache[queryHash] === 'undefined') {

                Promise.resolve(query(queryObj.index, queryObj.queryString, { limit: null } )).then(data => {
                    self.dataCache[queryHash] = data;
                    self.queries.push(queryObj);
                    self.loading = false;
                });

            } else {
                console.log("didn't have to query, using cache");
                // TODO: use jumpTo functionality here if we know that the data already exists?
                // TODO: alternately, push it up to the top?
                // Hmm, intermix this with timestamps? get a cache hit, but for data at a different time -> use the cached data but identify it by timestamp
                self.queries.push(queryObj);
                self.loading = false;
            }

            // this.$store.dispatch(`${this.index}/query`, { q: this.queryString });
        },
        hashQuery({ index, queryString }) {
            // NOTA BENE: we're going to use this under conditions where it's a div ID, so it needs to follow HTML spec
            // https://stackoverflow.com/questions/70579/what-are-valid-values-for-the-id-attribute-in-html
            // For now since 'index' refers to an english word plus hyphens, we're in the clear for HTML5, but if we can't put constraints
            // on our hashing algo we're going to have (small) problems later. (?: could just put a random letter in front? -> breaks non-determinism)

            // NOTE: Vue apparently likes even *fewer* characters than the HTML5 spec constrains. doesn't work with `.` nor `:`
            // using `_` to be consistent with HTML spec, AND what Vue can handle, for valid ids for elements (the default `,` breaks document selector behavior)
            // TODO: in thr case of locii, *for now*, we'll replace colon with an underscore...
            return [
                index,
                queryString.replace(':', '_').replace(',','--')
            ].join('__')  // double underscore since single underscore is now reserved
        },
        jumpToElementBy(elementSelector) {
            // https://stackoverflow.com/a/17938519/1991892
            console.log('attempting jump to', elementSelector, 'which gives', this.$el.querySelector(elementSelector))
            this.$el.querySelector(elementSelector).scrollIntoView();
        },
        elIdFormatter(text) {
            return '#'+text;
        },
        elClassFormatter(text) {
            return '.'+text;
        }
    },
    watch: {
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
