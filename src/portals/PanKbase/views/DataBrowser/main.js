import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getResource } from "@/portals/PanKbase/utils/api";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";

new Vue({
    components: {},
    mixins: [pankbaseMixin],
    data: {
        dataUrl: process.env.VUE_APP_DATA_BASE_URL,
        donors: [],
        biosamples: [],
        assays: [],
        processedResults: [],
        analyses: [],
        donorsTotal: 0,
        biosamplesTotal: 0,
        assaysTotal: 0,
        processedResultsTotal: 0,
        analysesTotal: 0,
        donorsFields: [
            { key: "accession", label: "Accession" },
            {
                key: "award.@id",
                label: "Award",
                formatter: (value) =>
                    value ? value.split("/").slice(-2, -1)[0] : "",
            },
            {
                key: "human_donor_identifiers",
                label: "Identifiers",
                formatter: (value) => (value ? value.join(", ") : ""),
            },
            { key: "lab.title", label: "Lab" },
            {
                key: "collections",
                label: "Collections",
                formatter: (value) => (value ? value.join(", ") : ""),
            },
            { key: "sex", label: "Sex" },
            { key: "status", label: "Status" },
        ],
        biosamplesFields: [
            { key: "accession", label: "Accession" },
            {
                key: "award.@id",
                label: "Award",
                formatter: (value) =>
                    value ? value.split("/").slice(-2, -1)[0] : "",
            },
            { key: "lab.title", label: "Lab" },
            {
                key: "collections",
                label: "Collections",
                formatter: (value) => (value ? value.join(", ") : ""),
            },
            { key: "summary", label: "Summary" },
            { key: "status", label: "Status" },
        ],
        assaysFields: [
            { key: "accession", label: "Accession" },
            { key: "assay_term.term_name", label: "Assay Name" },
            {
                key: "award.@id",
                label: "Award",
                formatter: (value) =>
                    value ? value.split("/").slice(-2, -1)[0] : "",
            },
            { key: "lab.title", label: "Lab" },

            { key: "status", label: "Status" },
        ],
        processedResultsFields: [
            { key: "accession", label: "Accession" },
            {
                key: "award.@id",
                label: "Award",
                formatter: (value) =>
                    value ? value.split("/").slice(-2, -1)[0] : "",
            },
            {
                key: "award.title",
                label: "Award Title",
                formatter: (value) => {
                    if (value) {
                        const words = value.split(" ");
                        if (words.length > 4) {
                            return words.slice(0, 4).join(" ") + " ...";
                        }
                        return value;
                    }
                    return "";
                },
            },
            { key: "lab.title", label: "Lab" },
            {
                key: "collections",
                label: "Collections",
                formatter: (value) => (value ? value.join(", ") : ""),
            },
            { key: "donors[0].taxa", label: "Taxa" },
            { key: "summary", label: "Summary" },
            { key: "status", label: "Status" },
        ],
        analysesFields: [
            { key: "accession", label: "Accession" },
            {
                key: "award.@id",
                label: "Award",
                formatter: (value) =>
                    value ? value.split("/").slice(-2, -1)[0] : "",
            },
            { key: "lab.title", label: "Lab" },
            {
                key: "collections",
                label: "Collections",
                formatter: (value) => (value ? value.join(", ") : ""),
            },
            { key: "status", label: "Status" },
        ],
        perPageDonors: 10,
        perPageBiosamples: 10,
        perPageAssays: 10,
        perPageProcessedResults: 10,
        perPageAnalyses: 10,
        currentPageDonors: 1,
        currentPageBiosamples: 1,
        currentPageAssays: 1,
        currentPageProcessedResults: 1,
        currentPageAnalyses: 1,

        pageId: "pankbase_databrowser",
        info: null,
    },
    computed: {},
    watch: {
        currentPageDonors(newPage) {
            this.fetchDonors(newPage);
        },
        currentPageBiosamples(newPage) {
            this.fetchBiosamples(newPage);
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
        this.fetchBiosamples();
        this.fetchAssays();
        this.fetchAnalyses();
        this.fetchProcessedResults();
        let content = await getPankbaseContent(this.pageId, true);
        this.info = content;
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
        async fetchBiosamples(page = 1) {
            const limit = this.perPageBiosamples;
            const from = (page - 1) * limit;
            getResource(
                `search/?type=Biosample&limit=${limit}&from=${from}`
            ).then((response) => {
                this.biosamples = response["@graph"];
                this.biosamplesTotal = response.total;
            });
        },
    },
    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
