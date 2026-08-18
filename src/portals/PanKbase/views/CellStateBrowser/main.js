import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";

import LigerBrowser from "@/components/researchPortal/LIGER/LigerBrowser.vue";

new Vue({
    mixins: [pankbaseMixin],

    components: {
        LigerBrowser
    },

    data() {
        return {
             liger_config: {
                exampleGenes: ["CFTR", "PDX1", "INS"]
             },
        };
    },

    render(createElement) {
        return createElement(Template);
    }
}).$mount("#app");
