import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/layout.css";
import "../../assets/pkb-styles.css";

Vue.config.productionTip = false;

import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getResource } from "@/portals/PanKbase/utils/api";
import apiClient from "@/portals/PanKbase/utils/ApiClient";

new Vue({
    components: {},
    mixins: [pankbaseMixin],
    data: {
        donors: [],
        assays: [],
        processedResults: [],
        analyses: [],
        donorsFields: [
            { key: "accession", label: "Accession" },
            { key: "aliases", label: "Aliases" },
            { key: "award.@id", label: "Award" },
            { key: "human_donor_identifiers", label: "Identifiers" },
            { key: "lab.title", label: "Lab" },
            { key: "sex", label: "Sex" },
            { key: "status", label: "Status" },
        ],
        assaysFields: [],
        processedResultsFields: [],
        analysesFields: [],
    },
    computed: {},
    watch: {},
    async created() {
        getResource("human-donors/@@listing?limit=10").then((response) => {
            console.log("response", response);
            this.donors = response["@graph"];
        });
        getResource("search/?type=MeasurementSet").then((response) => {
            this.assays = response["@graph"];
        });
        // getResource("analyses").then((response) => {
        //     this.analyses = response.data;
        // });
        // getResource("processedResults").then((response) => {
        //     this.processedResults = response.data;
        // });
        // this.donors = await apiClient.get("/human-donors/");
    },

    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
