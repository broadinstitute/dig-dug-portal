import Vue from "vue";
import Template from "./Template.vue";

import FilterUser from "./FilterUser.vue"
import FilterProvider from "./Filter/FilterProvider.vue"

Vue.config.productionTip = false;

new Vue({
    components: {
        FilterUser,
        FilterProvider,
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            inputs: '',
            hello: 'goodbye',
            arrayOfStuff: [
                'a','b','c',
            ],
        }
    },
    computed: {
        filterFunction() {
            return item => item !== 'b';
        }
    }
}).$mount("#app");
