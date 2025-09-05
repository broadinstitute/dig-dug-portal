import Vue from "vue";
import Template from "./Template.vue";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";

import * as d3 from "d3";
import DownloadChart from "@/components/DownloadChart";
import DataDownload from "@/components/DataDownload";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterLess from "@/components/criterion/FilterGreaterLess.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import FilterLessThan from "@/components/criterion/FilterLessThan.vue";
import FilterPosition from "@/components/criterion/FilterPosition.vue";
import { getTextContent } from "@/portals/SysBio/utils/content.js";
import Formatters from "@/utils/formatters";
import keyParams from "@/utils/keyParams";

new Vue({
    mixins: [sysbioMixin],

    components: {
        DataDownload,
        DownloadChart,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterLess,
        FilterGreaterThan,
        FilterLessThan,
        FilterPosition
    },

    data() {
        return {
            pageInfo: null,
            tableData: null,
            tableFields: [
                {
                    key: "varId",
                    label: "Position(CHR:POS)",
                    sortable: false,
                },
                {
                    key: "allele",
                    label: "Allele(REF/ALT)",
                    sortable: false,
                    tdClass: "",
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
                    formatter: (value) => value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
                },
                {
                    key: "nearest",
                    label: "Closest Genes",
                    sortable: false,
                    tdClass: "",
                    formatter: (value) => Array.isArray(value) ? value.join(', ') : ''
                },
                {
                    key: "pValue",
                    label: "pValue",
                    sortable: true,
                    tdClass: "",
                },
                {
                    key: "beta",
                    label: "Beta",
                    sortable: false,
                    tdClass: "",
                },
                
            ],
            currPage: 1,
            currSort: {
                sortBy: "pValue",
                sortDesc: false,
            },
            chromosomeFilterSet: false,
        };
    },

    watch: {
    },

    computed: {
        totalRows() {
            return this.tableData?.length || 0;
        },
        tablePhenotype() {
            return this.tableData?.[0].phenotype || '';
        },
        nearestGenes(){
            return this.tableData !== null 
                ? this.tableData.flatMap(m => m.nearest)
                : [];
        },
        chromosomes(){
            // Sort chromosomes numerically with X and Y last
            return this.tableData.map(m => m.chromosome).sort((a,b) => 
                isNaN(parseInt(a)) && !isNaN(parseInt(b))
                ? 1 
                : parseInt(a) - parseInt(b));
        },
        disableRegionFilter(){
            return !this.chromosomeFilterSet;
        }
    },

    mounted() {},

    created() {
        this.fetchData();
        this.fetchInfo();
    },
    methods: {
        async fetchData() {
            const bi = "https://sysbio.hugeampkpnbi.org/api/bio/query/dataset-associations"
            const limit = 500;
            const dataset = "SysBio_Nalls2025_ADvPD_EU";
            const phenotype = "SysBio_ADvPD";
            const url = `${bi}?limit=${limit}&q=${dataset},${phenotype}`;;
            const response = await fetch(url);
            const json = await response.json();
            this.tableData = json.data;
            console.log(JSON.stringify(this.tableData[0]));
        },
        async fetchInfo() {
            this.pageInfo = await getTextContent(
                "sysbio_GWAS",
                true
            );
        },
        filterChromosome(filterCriterion){
            console.log(filterCriterion);
        },
        filtersUpdated(filters){
            console.log("Filters are:", JSON.stringify(filters));
            for(let i = 0; i < filters.length; i++){
                if (filters[i].field === 'chromosome'){
                    this.chromosomeFilterSet = true;
                    return;
                }
            }
            this.chromosomeFilterSet = false;
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
