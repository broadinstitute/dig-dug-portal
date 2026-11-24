import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";

new Vue({
    components: {
    },
    mixins: [pankbaseMixin],
    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
