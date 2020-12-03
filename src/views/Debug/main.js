import Vue from "vue";
import Template from "./Template.vue";

import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue"
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"

import FilterPValue from "@/components/criterion/FilterPValue.vue"
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue"
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue"

import keyParams from "@/utils/keyParams"

Vue.config.productionTip = false;
new Vue({
    components: {
        CriterionListGroup,
        CriterionFunctionGroup,
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
            searchCriterionList: [ { "field": "phenotype", "multiple": true, "inclusive": true, "threshold": "hello" } ],
            searchCriterionFunction: id => true,
        };
    },

    methods: {
        clear() {
            this.searchCriterionList = []
        }
    }

}).$mount("#app");
