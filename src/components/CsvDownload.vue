<template>
    <b-btn @click="downloadCsv(data, filename)">Download CSV</b-btn>
</template>
<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";

export default Vue.component("csv-download", {
    props: ["data", "filename"],
    modules: {
        uiUtils,
    },
    methods: {
        downloadCsv(DATA, FILENAME) {
            //data is in json format
            uiUtils.convertJson2Csv(DATA, FILENAME);
        },
    },
});
</script>
