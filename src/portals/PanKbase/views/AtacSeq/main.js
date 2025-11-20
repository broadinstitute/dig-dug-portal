import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import "../../assets/phewas.css";
import "../../assets/filtering.css";
import "../../assets/atacseq.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import AtacSeq from "../../components/AtacSeq.vue";
new Vue({
    // Based on HuGeAMP Gene page.
    //store,
    components: {
        AtacSeq
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            byorDocs: "pankbase_genomebrowser",
        };
    },
    async created() {
        let docs = await getPankbaseContent(this.byorDocs, true);
        let docDiv = document.getElementById("documentation");
        docDiv.innerHTML = docs;
    },
    computed: {
        navbar() {
            return document.getElementsByClassName("pkb-nav");
        }
    },
    methods: {},
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
