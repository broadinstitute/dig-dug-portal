import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "@/portals/SysBio/css/sysBio.css";
import sysBioNav from "@/portals/SysBio/components/sysBioNav.vue";
import sysBioFooter from "@/portals/SysBio/components/sysBioFooter.vue";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
//Vue.config.productionTip = false;

export const sysBioMixin = {
    components: {
        sysBioNav,
        sysBioFooter,
    },
};