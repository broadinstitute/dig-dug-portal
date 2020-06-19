<template>
    <vue-typeahead-bootstrap
        :data="tissueOptions"
        v-model="query"
        :showOnFocus="true"
        :minMatchingChars="0"
        :maxMatches="30"
        placeholder="Type in a tissue..."
        
    >
    </vue-typeahead-bootstrap>
</template>

<script>
import Vue from "vue";
import _ from "lodash";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

export default Vue.component("tissue-selectpicker", {
    props: ['tissues'],
    data(){
        return {
            query: ''
        }
    },
    computed: {
        tissueOptions() {
            if (!this.tissues) {
                return [];
            }

            return this.tissues;
        }
    }
});
</script>
