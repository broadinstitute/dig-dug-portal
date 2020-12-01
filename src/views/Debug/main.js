import Vue from "vue";
import Template from "./Template.vue";

import FilterListGroup from "@/components/Filter/FilterListGroup.vue"
import FilterControl from "@/components/Filter/FilterControl.vue"
import FilterPValue from "@/components/Filter/FilterPValue.vue"
import FilterEffectDirection from "@/components/Filter/FilterEffectDirection.vue"
import FilterEnumeration from "@/components/Filter/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/Filter/FilterGreaterThan.vue"

import keyParams from "@/utils/keyParams"

Vue.config.productionTip = false;
new Vue({
    components: {
        FilterListGroup,
        FilterControl,
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
            searchCriterionList: [
                {
                    field: 'phenotype',
                    threshold: keyParams.phenotype,
                }
            ],
        };
    },

    methods: {
        clear() {
            this.searchCriterionList = []
        }
    }

}).$mount("#app");
