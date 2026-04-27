import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import { prepareDataset } from "./datasetUtils";
import keyParams from "@/utils/keyParams";

const donorTableConfig = {
    columns: [
        { name: "Classifications", showOnLoad: false },
        { name: "Sample_terms", showOnLoad: false },
        { name: "Isolation_center", showOnLoad: false },
        { name: "Biosample_type", showOnLoad: false },
        { name: "External Resources", showOnLoad: false },
        { name: "Biosample derived from", showOnLoad: false },
        { name: "Biosample origin of", showOnLoad: false },
        { name: "Treatments", showOnLoad: false },
        { name: "Description", showOnLoad: false },
        { name: "Cold Ischaemia Time (hours)", showOnLoad: false },
        { name: "Warm Ischaemia Duration / Down Time (hours)", showOnLoad: false },
        { name: "Date Obtained", showOnLoad: false },
        { name: "Digest Time (hours)", showOnLoad: false },
        { name: "IEQ/Pancreas Weight (grams)", showOnLoad: false },
        { name: "Islet Function Available", showOnLoad: false },
        { name: "Islet Histology", showOnLoad: false },
        { name: "Islet Morphology", showOnLoad: false },
        { name: "Islet Yield (IEQ)", showOnLoad: false },
        { name: "Organ Source", showOnLoad: false },
        { name: "Percentage Trapped (percentage)", showOnLoad: false },
        { name: "Pre-Shipment Culture Time (hours)", showOnLoad: false },
        { name: "Prep Viability (percentage)", showOnLoad: false },
        { name: "Preservation Method", showOnLoad: false },
        { name: "Purity (Percentage)", showOnLoad: false },
    ],
};

new Vue({
    components: {
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            pageId: "pankbase_donor_metadata",
            info: "",
            // Temporary local test file:
            // "/data/meta-data.merged.pankbase.forAlex.txt"
            donorMetadata: "https://bioindex-dev.pankbase.org/api/raw/file/functional_data/functional_dataset_v1/meta-data.merged.pankbase.txt",
            preparedDataset: null,
            donorTableConfig,
            showConfigureControls: !!keyParams.configure,
            datasetError: "",
            isDatasetLoading: false,
        };
    },
    computed: {},
    watch: {},
    async created() {
        console.log("[Donors] created:start");

        getPankbaseContent(this.pageId, true)
            .then((content) => {
                console.log("[Donors] content:loaded");
                this.info = content;
            })
            .catch(() => {
                console.log("[Donors] content:failed");
                this.info = "";
            });

        this.isDatasetLoading = true;
        console.log("[Donors] dataset:loading", this.donorMetadata);

        try {
            const preparedDataset = await prepareDataset(this.donorMetadata);
            this.preparedDataset = preparedDataset;
            console.log("[Donors] dataset:loaded", {
                rowCount: preparedDataset.rowCount,
                columnCount: preparedDataset.columns ? preparedDataset.columns.length : 0,
                detection: preparedDataset.detection,
            });
        } catch (error) {
            console.error("[Donors] dataset:error", error);
            this.datasetError = error && error.message ? error.message : "Failed to load donor metadata.";
        } finally {
            this.isDatasetLoading = false;
            console.log("[Donors] dataset:loading-complete", {
                hasDataset: !!this.preparedDataset,
                datasetError: this.datasetError,
            });
        }
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
