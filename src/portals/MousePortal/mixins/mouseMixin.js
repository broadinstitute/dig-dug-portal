import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import MouseHeader from "@/portals/PanKbase/components/mouse-header.vue";
import MouseFooter from "@/portals/PanKbase/components/mouse-footer.vue";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.config.productionTip = false;

export const pankbaseMixin = {
    components: {
        MouseHeader,
        MouseFooter,
    },
};
