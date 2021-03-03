<template>
    <b-btn size="sm" @click="downloadCsv()">Download CSV</b-btn>
</template>
<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";

export default Vue.component("csv-download", {
    props: ["data", "filename"],
    methods: {
        downloadCsv() {
            //data is in json format
            uiUtils.convertJson2Csv(this.data, this.filename);
        },
    },
});
</script>
