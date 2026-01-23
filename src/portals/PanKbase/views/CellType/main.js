import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import "../../assets/phewas.css";
import "../../assets/filtering.css";
import "../../assets/atacseq.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";
const HUGEAMP_GENE_BIOINDEX = "https://bioindex.hugeamp.org/api/bio/query/gene?q=";
new Vue({
    components: {
    },
    mixins: [pankbaseMixin],
    data() {
        return {};
    },
    async created() {
    },
    computed: {
        utilsBox() {
            let utils = {
                regionUtils: regionUtils,
            };
            return utils;
        },
    },
    methods: {
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
