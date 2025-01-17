import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import MouseHeader from "@/portals/MousePortal/components/mouse-header.vue";
import MouseFooter from "@/portals/MousePortal/components/mouse-footer.vue";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.config.productionTip = false;

export const mouseMixin = {
    components: {
        MouseHeader,
        MouseFooter,
    },
};
