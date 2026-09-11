import Vue from "vue";
import Template from "./Template.vue";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";
import { DATASET_ASSOC_URL, SYSBIO_HOST } from "@/utils/runtimeConfig";

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

const BI = DATASET_ASSOC_URL || `${SYSBIO_HOST}/api/bio/query/dataset-associations`;

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
            byorDocs: "sysbio_GWAS",
            docs: "",
            datasetKeys: [],
            dataset: null,
            subset: null,
        };
    },

    watch: {
        datasets(newDatasets){
            if (this.dataset === null){
                this.dataset = newDatasets[0];
            }
        },
        subsets(newSubsets){
            console.log("we are here");
            this.subset = newSubsets[0];
        },
        dataset(){
            this.fetchData();
        },
        subset(){
            this.fetchData();
        }
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
        },
        subsets(){
            if (this.dataset === null){
                return [];
            }
            let applicableSubsets = this.datasetKeys.filter(d => d[1] === this.dataset);
            return applicableSubsets.map(d => d[0]);
        },
        datasets(){
            return Array.from(new Set(this.datasetKeys.map(d => d[1])));
        },
        manhattanImage(){
            return `${SYSBIO_HOST}/api/raw/plot/dataset/GWAS/${this.subset}/${this.dataset}/manhattan.png`
        },
        qqImage(){
            return `${SYSBIO_HOST}/api/raw/plot/dataset/GWAS/${this.subset}/${this.dataset}/qq.png`
        }
    },

    mounted() {},

    async created() {
        this.datasetKeys = await this.fetchKeys();
        const documentation = await getTextContent(this.byorDocs, true);
        this.docs = documentation;
    },
    methods: {
        async fetchKeys(){
            const keysUrl = BI.replace("query","keys").concat("/2");
            console.log(keysUrl);
            const getKeys = await fetch(keysUrl);
            let keysJson = await getKeys.json();
            return keysJson.keys;
        },
        async fetchData() {
            const limit = 500;
            const url = `${BI}?limit=${limit}&q=${this.dataset},${this.subset}`;;
            const response = await fetch(url);
            const json = await response.json();
            this.tableData = json.data;
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
