import Vue from "vue";
import Template from "./Template.vue";

import FilterUser from "./FilterUser.vue"
import FilterContext from "./FilterContext/FilterContext.vue"
import FilterWidget from "./FilterWidget/FilterWidget.vue"
import FilterWidgetControl from "./FilterWidget/FilterWidgetControl.vue"

Vue.config.productionTip = false;

new Vue({
    components: {
        FilterUser,
        FilterContext,
        FilterWidget,
        FilterWidgetControl,
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            filterFunction: id => id,
            inclusive: false,
        }
    },
}).$mount("#app");
