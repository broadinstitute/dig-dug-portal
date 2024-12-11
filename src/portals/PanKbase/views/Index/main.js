import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/layout.css";
import "../../assets/pkb-styles.css";

import { pankbaseMixin } from "../../mixins/pankbaseMixin.js";

Vue.config.productionTip = false;

import pkbHero from "../../components/pkb-hero.vue";

new Vue({
    components: {
        pkbHero,
    },
    mixins: [pankbaseMixin],
    data: {},

    computed: {},

    watch: {},

    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
