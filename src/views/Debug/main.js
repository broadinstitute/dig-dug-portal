import Vue from "vue";
import Template from "./Template.vue";

import FilterUser from "./FilterUser.vue"
import FilterContext from "./FilterContext/FilterContext.vue"
import FilterWidget from "./FilterWidget/FilterWidget.vue"
import FilterWidgetControl from "./FilterWidget/FilterWidgetControl.vue"
import FilterPValue from "./FilterWidget/FilterPValue.vue"
import FilterEffectDirection from "./FilterWidget/FilterEffectDirection.vue"
import FilterEnumeration from "./FilterWidget/FilterEnumeration.vue"
import FilterGreaterThan from "./FilterWidget/FilterGreaterThan.vue"

Vue.config.productionTip = false;

new Vue({
    components: {
        FilterUser,
        FilterContext,
        FilterWidget,
        FilterWidgetControl,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan,
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            filterFunction: id => id,
            inclusive: false,
            initialData: [
                { pValue: 0.01, beta: 3 }, 
                { pValue: 0.001, beta: 3 }, 
                { pValue: 0.2, beta: 3 }, 
                { pValue: 0.01, beta: 4 }, 
                { pValue: 0.01, beta:2 }, 
                { test: 'no matches' },
                { test: 'some matches' },
                { test: 'all matches' },
            ]
        }
    },
    computed: {
        filteredData() {
            return this.initialData.filter(this.filterFunction)
        },
        matches() {
            return this.filteredData.filter(obj => !!obj.test).map(obj => obj.test);
        }
    }
}).$mount("#app");
