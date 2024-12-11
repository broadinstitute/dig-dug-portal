import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/layout.css";
import "../../assets/pkb-styles.css";

Vue.config.productionTip = false;

import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";

new Vue({
    components: {},
    mixins: [pankbaseMixin],
    data: {},
    computed: {},
    watch: {},

    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
