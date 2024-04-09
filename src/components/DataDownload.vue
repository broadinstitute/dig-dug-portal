<template>
    <b-dropdown variant="secondary" right size="sm" text="Download">
        <b-dropdown-text>Save file as</b-dropdown-text>
        <b-dropdown-divider></b-dropdown-divider>
        <b-dropdown-item @click="downloadCsv()">CSV</b-dropdown-item>
        <b-dropdown-item @click="downloadTsv()">TSV</b-dropdown-item>
        <b-dropdown-item @click="downloadJson()">JSON</b-dropdown-item>
    </b-dropdown>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import flatten from "flat";

export default Vue.component("DataDownload", {
    props: {
        data: {
            type: Array,
            required: true,
        },
        filename: {
            type: String,
            required: false,
            default: "data",
        },
        flatten: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {};
    },
    methods: {
        downloadCsv() {
            if (this.flatten && this.data) {
                let flatted = this.flattenCsv(this.data, this.flatten);
                uiUtils.convertJson2Csv(flatted, this.filename);
            } else {
                uiUtils.convertJson2Csv(this.data, this.filename);
            }
        },
        //! Don't flatten unless necessary;
        // This function will flatten the input column
        flattenCsv(data, field) {
            return data.map((line) => {
                line[field] = flatten(line[field]);
                return line;
            });
        },
        downloadJson() {
            uiUtils.saveJson(this.data, this.filename);
        },
        downloadTsv() {
            uiUtils.convertJson2Tsv(this.data, this.filename);
        },
    },
});
</script>
