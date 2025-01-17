import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { mouseMixin } from "@/portals/MousePortal/mixins/mouseMixin.js";

new Vue({
    components: {
    },
    mixins: [mouseMixin],
    data() {
        return {
        };
    },
    watch: {},
    async created() {
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
