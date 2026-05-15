import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import { DEFAULT_DONOR_METADATA_SOURCE, loadDonorDataset } from "./donorDataset";
import keyParams from "@/utils/keyParams";

const donorTableConfig = {
    columns: [
        { name: "External link", label: "External Link" },
        { name: "Data_available_Pankbase", label: "Data Available in PanKbase" },
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
            donorMetadata: DEFAULT_DONOR_METADATA_SOURCE,
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
            const preparedDataset = await loadDonorDataset(this.donorMetadata);
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
