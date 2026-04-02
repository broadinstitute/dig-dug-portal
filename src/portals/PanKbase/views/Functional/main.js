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
import BIO_INDEX_HOST from "@/utils/bioIndexUtils";
const PANKBASE_BIOINDEX = BIO_INDEX_HOST.BIO_INDEX_HOST.replace("hugeamp", "pankbase");
new Vue({
    components: {
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            rawFilesLocation: `${PANKBASE_BIOINDEX}/api/raw/file/functional_data/functional_dataset_v1/`
        };
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
