import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import PkbHeader from "@/portals/PanKbase/components/pkb-header.vue";
import PkbFooter from "@/portals/PanKbase/components/pkb-footer.vue";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.config.productionTip = false;

export const pankbaseMixin = {
    components: {
        PkbHeader,
        PkbFooter,
    },
};
