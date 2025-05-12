import Vue from "vue";
import Template from "./Template.vue";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";

import * as d3 from "d3";
import DownloadChart from "@/components/DownloadChart";
import DataDownload from "@/components/DataDownload";
import { getTextContent } from "@/portals/SysBio/utils/content.js";
import Formatters from "@/utils/formatters";
import keyParams from "@/utils/keyParams";

new Vue({
    mixins: [sysbioMixin],

    components: {
        DataDownload,
        DownloadChart,
    },

    data() {
        return {
            tableData: null,
            tableFields: [
                {
                    key: "varId",
                    label: "Position(CHR:POS)",
                    sortable: false,
                },
                {
                    key: "dbSNP",
                    label: "dbSNP",
                    sortable: false,
                    tdClass: "",
                },
                {
                    key: "consequence",
                    label: "Consequence",
                    sortable: false,
                    tdClass: "",
                },
                {
                    key: "pValue",
                    label: "pValue",
                    sortable: true,
                    tdClass: "",
                },
                
            ],
            currPage: 1,
        };
    },

    watch: {
    },

    computed: {
        totalRows() {
            return this.tableData?.length || 0;
        }
    },

    mounted() {},

    created() {
        //this.fetchData();
    },
    methods: {
        async fetchData() {
            //this is just a stub for now, update when needed.
            const bi = "https://sysbio.hugeampkpnbi.org/api/bio/query/dataset-associations"
            const limit = 500;
            const dataset = "SysBio_Nalls2025_ADvPD_EU";
            const phenotype = "SysBio_ADvPD";
            const url = `${bi}?limit=${limit}&q=${dataset},${phenotype}`;;
            const response = await fetch(url);
            const json = await response.json();
            this.tableData = json.data;
            console.log(json.data);
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
