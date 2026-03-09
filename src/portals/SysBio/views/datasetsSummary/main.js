import Vue from "vue";
import Template from "./template.vue";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";
import { getTextContent } from "../../utils/content.js";

new Vue({
    mixins: [sysbioMixin],
    data() {
        return {
            convertedData: null,
            rawDataApi: "https://hugeampkpncms.org/rest/directcsv?id=sysbio_data_summary",
            byor_docs: "sysbio_data_summary"
        };
    },
    async mounted() {
        const docs = await getTextContent(this.byor_docs);
        console.log(JSON.stringify(docs));
        await this.loadSummaryData();
    },
    computed: {},
    methods: {
        async loadSummaryData() {
            try {
                const response = await fetch(this.rawDataApi);
                if (!response.ok) throw new Error("Failed to fetch summary data");
                const data = await response.json();
                const firstItem = Array.isArray(data) && data.length > 0 ? data[0] : null;
                const rawTsvData = firstItem && firstItem.field_data_points != null
                    ? firstItem.field_data_points
                    : "";
                this.convertedData = this.convertTsvToJson(rawTsvData);
            } catch (err) {
                console.error("loadSummaryData", err);
                this.convertedData = {};
            }
        },
        /**
         * Converts TSV (source_short, field, category, n_donors) into nested object:
         * { [source_short]: { [field]: { [category]: n_donors, ... }, ... }, ... }
         */
        convertTsvToJson(rawTsvData) {
            const text = (rawTsvData || "").trim();
            if (!text) return {};
            const lines = text.split(/\r?\n/).filter((line) => line.trim());
            if (lines.length < 2) return {};
            const header = lines[0].split("\t").map((h) => h.trim());
            const srcIdx = header.indexOf("source_short");
            const fieldIdx = header.indexOf("field");
            const categoryIdx = header.indexOf("category");
            const nDonorsIdx = header.indexOf("n_donors");
            if (srcIdx === -1 || fieldIdx === -1 || categoryIdx === -1 || nDonorsIdx === -1) {
                return {};
            }
            const out = {};
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split("\t");
                const sourceShort = cols[srcIdx] != null ? String(cols[srcIdx]).trim() : "";
                const field = cols[fieldIdx] != null ? String(cols[fieldIdx]).trim() : "";
                const category = cols[categoryIdx] != null ? String(cols[categoryIdx]).trim() : "";
                const nDonors = cols[nDonorsIdx] != null ? parseInt(cols[nDonorsIdx], 10) : 0;
                if (!sourceShort || !field) continue;
                if (!out[sourceShort]) out[sourceShort] = {};
                if (!out[sourceShort][field]) out[sourceShort][field] = {};
                out[sourceShort][field][category] = isNaN(nDonors) ? 0 : nDonors;
            }
            return out;
        },
    },
    render(h) {
        return h(Template);
    },
}).$mount("#app");
