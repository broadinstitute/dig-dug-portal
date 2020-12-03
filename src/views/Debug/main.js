import Vue from "vue";
import Template from "./Template.vue";

import FilterListGroup from "@/components/criterion/group/FilterListGroup.vue"
import FilterFunctionGroup from "@/components/criterion/group/FilterFunctionGroup.vue"

import FilterPValue from "@/components/criterion/FilterPValue.vue"
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue"
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue"

import keyParams from "@/utils/keyParams"

Vue.config.productionTip = false;
new Vue({
    components: {
        FilterListGroup,
        FilterFunctionGroup,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan,
    },
    render(createElement) {
        return createElement(Template);
    },

    data() {
        return {
            searchCriterionList: [ { "field": "phenotype", "multiple": true, label: 'override', color: '#00FF00', "inclusive": true, "threshold": "hello" } ],
            searchCriterionFunction: id => true,
        };
    },

    methods: {
        clear() {
            this.searchCriterionList = []
        }
    }

}).$mount("#app");
