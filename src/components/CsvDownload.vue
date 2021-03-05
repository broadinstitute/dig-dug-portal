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
        downloadCsv() {
            if (this.flatten) {
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
    },
});
</script>
