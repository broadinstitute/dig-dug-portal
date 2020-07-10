import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { query } from "@/utils/bioIndexUtils";

import RegionsResultCard from "./RegionsResultCard.vue"

import { BootstrapVue } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import VueScrollTo from 'vue-scrollto';

Vue.use(BootstrapVue);
Vue.use(VueScrollTo);

new Vue({
    store,
    components: {
        RegionsResultCard
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
        }
    },
    methods: {
        tap() {
            console.log('tap', arguments);
            return event;
        },
        queryBioIndex() {
            console.log('dispatching query', this.index, this.queryString);

            this.loading = true;

            const self = this;
            const queryObj = { index: self.index, queryString: self.queryString };
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
            return [index, queryString].join('_')
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
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
