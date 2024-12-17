import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getResource } from "@/portals/PanKbase/utils/api";

new Vue({
    components: {
    },
    mixins: [pankbaseMixin],
    data() {
        return {};
    },
    computed: {},
    watch: {},
    created() {},

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
