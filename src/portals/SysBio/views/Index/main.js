import Vue from "vue";
import Template from "./Template.vue";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";

new Vue({
    components: {
    },
    mixins: [sysbioMixin],
    render: (h) => h(Template),
}).$mount("#app");
