import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons, BIconMouse2 } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import CriterionListGroup from "@/components/criterion/group/CriterionListGroup"
import FilterEnumeration from "@/components/criterion/FilterEnumeration"

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: {},
    components: {
        CriterionListGroup,
        FilterEnumeration,
    },

    data() {
        return {
            allDatasets: ['52k', '32k', '9001k'],
            inputChange: '',
        };
    },
    computed: {
        someDatasets() {
            console.log('updating because inputChange changed to', this.inputChange)
            if (this.inputChange === '') {
                return this.allDatasets;
            } else {
                return this.allDatasets.filter(el => el.includes(this.inputChange))                
            }
        }
    },
    render(createElement, context) {
        return createElement(Template);
    },

}).$mount("#app");
