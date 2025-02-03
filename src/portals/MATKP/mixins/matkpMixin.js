import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import matkpNav from "@/portals/MATKP/components/matkp-nav.vue";
import matkpFooter from "@/portals/MATKP/components/matkp-footer.vue";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.config.productionTip = false;

export const matkpMixin = {
    components: {
        matkpNav,
        matkpFooter,
    },
};