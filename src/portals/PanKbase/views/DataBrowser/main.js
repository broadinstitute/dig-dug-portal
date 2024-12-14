import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/layout.css";
import "../../assets/pkb-styles.css";

Vue.config.productionTip = false;

import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getResource } from "@/portals/PanKbase/utils/api";


new Vue({
    components: {},
    mixins: [pankbaseMixin],
    data: {
        donors: [],
        assays: [],
        processedResults: [],
        analyses: [],
        donorsTotal: 0,
        assaysTotal: 0,
        processedResultsTotal: 0,
        analysesTotal: 0,
        donorsFields: [
            { key: "accession", label: "Accession" },

            { key: "award.@id", label: "Award" },
            { key: "human_donor_identifiers", label: "Identifiers" },
            { key: "lab.title", label: "Lab" },
            { key: "sex", label: "Sex" },
            { key: "status", label: "Status" },
        ],
        assaysFields: [
            { key: "accession", label: "Accession" },

            { key: "assay_term.term_name", label: "Assay Name" },
            { key: "award.@id", label: "Award" },
            { key: "lab.title", label: "Lab" },
            { key: "status", label: "Status" },
        ],
        processedResultsFields: [
            { key: "accession", label: "Accession" },

            { key: "award.@id", label: "Award" },
            { key: "award.title", label: "Award Title" },
            { key: "lab.title", label: "Lab" },
            { key: "summary", label: "Summary" },
            { key: "status", label: "Status" },
        ],
        analysesFields: [
            { key: "accession", label: "Accession" },

            { key: "award.@id", label: "Award" },
            { key: "lab.title", label: "Lab" },
            { key: "status", label: "Status" },
        ],
        perPageDonors: 10,
        perPageAssays: 10,
        perPageProcessedResults: 10,
        perPageAnalyses: 10,
        currentPageDonors: 1,
        currentPageAssays: 1,
        currentPageProcessedResults: 1,
        currentPageAnalyses: 1,
    },
    computed: {},
    watch: {
        currentPageDonors(newPage) {
            this.fetchDonors(newPage);
        },
        currentPageAssays(newPage) {
            this.fetchAssays(newPage);
        },
        currentPageAnalyses(newPage) {
            this.fetchAnalyses(newPage);
        },
        currentPageProcessedResults(newPage) {
            this.fetchProcessedResults(newPage);
        },
    },
    async created() {
        // Initial data load
        this.fetchDonors();
        this.fetchAssays();
        this.fetchAnalyses();
        this.fetchProcessedResults();
    },
    methods: {
        async fetchDonors(page = 1) {
            const limit = this.perPageDonors;
            const from = (page - 1) * limit;
            getResource(
                `human-donors/@@listing?limit=${limit}&from=${from}`
            ).then((response) => {
                this.donors = response["@graph"];
                this.donorsTotal = response.total;
            });
        },
        async fetchAssays(page = 1) {
            const limit = this.perPageAssays;
            const from = (page - 1) * limit;
            getResource(
                `search/?type=MeasurementSet&limit=${limit}&from=${from}`
            ).then((response) => {
                this.assays = response["@graph"];
                this.assaysTotal = response.total;
            });
        },
        async fetchAnalyses(page = 1) {
            const limit = this.perPageAnalyses;
            const from = (page - 1) * limit;
            getResource(
                `search/?type=AnalysisSet&file_set_type=intermediate+analysis&limit=${limit}&from=${from}`
            ).then((response) => {
                this.analyses = response["@graph"];
                this.analysesTotal = response.total;
            });
        },
        async fetchProcessedResults(page = 1) {
            const limit = this.perPageProcessedResults;
            const from = (page - 1) * limit;
            getResource(
                `search/?type=AnalysisSet&file_set_type=principal+analysis&limit=${limit}&from=${from}`
            ).then((response) => {
                this.processedResults = response["@graph"];
                this.processedResultsTotal = response.total;
            });
        },
    },
    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
