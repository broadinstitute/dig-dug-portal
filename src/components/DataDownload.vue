<template>
    <b-dropdown variant="secondary" right size="sm" text="Download data">
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
    },
    data() {
        return {};
    },
    methods: {
        downloadCsv() {
            uiUtils.convertJson2Csv(this.data, this.filename);
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
