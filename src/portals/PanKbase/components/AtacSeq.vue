<template>
  <div>
      <h4>ATAC-Seq coming soon</h4>
  </div>
</template>
<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload.vue";
import keyParams from "@/utils/keyParams";
import BulkTable from "./BulkTable.vue";
import uiUtils from "@/utils/uiUtils";
import alertUtils from "@/utils/alertUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import dataConvert from "@/utils/dataConvert";

const BIO_INDEX_HOST = "https://bioindex.pankbase.org";
export default Vue.component("atac-seq", {
    components: {
    },
    props: [
    ],
    data() {
        return {};
    },
    mounted(){
    },
    computed: {
        utilsBox() {
            let utils = {
                Formatters: Formatters,
                uiUtils: uiUtils,
                alertUtils: alertUtils,
                keyParams: keyParams,
                dataConvert: dataConvert,
                sortUtils: sortUtils,
                plotUtils: plotUtils,
            };
            return utils;
        },
    },
    methods: {
        phenotypeFormatter: Formatters.phenotypeFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        annotationFormatter: Formatters.annotationFormatter,
        tissueFormatter: Formatters.tissueFormatter,
        tpmFormatter: Formatters.tpmFormatter,
    },
});
</script>
<style scoped>
@import url("/css/effectorGenes.css");

label {
    margin: 10px;
}
.bulk-subtable {
    margin-left: 15px;
    padding-left: 30px;
    background-color: #efefef;
}
.bulk-subtable .row .col-12 {
    padding: 0 0 0 5px !important;
}
ul.top-list {
    font-size: 0.8rem;
}
button {
    padding-bottom: 0px !important;
    padding-top: 0px !important;
}
.subtable-selectors{
    margin-bottom: 20px;
    padding-top: 20px;
}
.subtable-all {
    background-color: #efefef;
}
.table-total-rows {
    display: inline;
    margin-right: 35px;
    margin-bottom: 10px;
}
.show-inline {
    display: inline;
}
#bulk-table {
    margin-top: 10px;
}
</style>
