import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import sysbioHeader from "@/portals/SysBio/components/sysbioHeader.vue";
import sysbioFooter from "@/portals/SysBio/components/sysbioFooter.vue";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.config.productionTip = false;

export const sysbioMixin = {
    components: {
        sysbioHeader,
        sysbioFooter,
    },
};