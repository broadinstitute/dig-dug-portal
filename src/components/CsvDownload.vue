<template>
    <b-btn size="sm" @click="downloadCsv()">Download CSV</b-btn>
</template>
<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import flatten from "flat";

export default Vue.component("csv-download", {
    props: ["data", "filename", "flatten"],
    data() {
        return {};
    },
    methods: {
        async downloadCsv() {
            console.log("here", this.csvData);
            if (this.flatten) {
                let csvData = Object.assign([], this.data);
                let flatted = await this.flattenCsv(csvData, this.flatten);
                //uiUtils.convertJson2Csv(flatted, this.filename);
                flatted.then(console.log("where", flatted));
            } else {
                uiUtils.convertJson2Csv(this.data, this.filename);
            }
            //uiUtils.convertJson2Csv(this.csvData, this.filename);
        },
        flattenCsv(data, field) {
            return data.map(async (line) => {
                line[field] = await flatten(line[field]);
                return line;
            });
        },
    },
});
</script>
