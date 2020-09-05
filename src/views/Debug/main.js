import Vue from "vue";
import Template from "./Template.vue";

import FilterUser from "./FilterUser.vue"
import FilterProvider from "./Filter/FilterProvider.vue"
import FilterWidget from "./FilterWidget.vue"
import FilterWidgetControl from "./FilterWidgetControl.vue"

Vue.config.productionTip = false;

new Vue({
    components: {
        FilterUser,
        FilterProvider,
        FilterWidget,
        FilterWidgetControl,
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
