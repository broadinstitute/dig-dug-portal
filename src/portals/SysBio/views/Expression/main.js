import Vue from "vue";
import Template from "./Template.vue";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";

import * as d3 from "d3";
import BulkVolcanoPlot from "../../components/BulkVolcanoPlot.vue";
import dataConvert from "@/utils/dataConvert";
import DownloadChart from "@/components/DownloadChart"
import DataDownload from "@/components/DataDownload";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
import { getTextContent } from "@/portals/SysBio/utils/content.js";
import Formatters from "@/utils/formatters";
import keyParams from "@/utils/keyParams";

new Vue({

    mixins: [sysbioMixin],

    components: {
        BulkVolcanoPlot,
        DataDownload,
        DownloadChart,
        GeneSelectPicker
    },

    data() {
        return {
            pageInfo: null,
            deData: null,
            dePage: 1,
            highlightGene: null,
            pValMin: 0,
            pValMax: 1,
            pValThreshold: 5.8,
            bulkVolcanoConfig: {
                "type": "volcano plot",
                "label": "This is a Test",
                "legend": "This is a Test",
                "render by": "GENE",
                "x axis field": "BETA",
                "x axis label": "standardized beta",
                "y axis field": "neg_log10_p",
                "y axis label": "-log10(p-value)",
                "width": 600,
                "height": 400,
                "x condition": { 
                    "combination": "or", 
                    "greater than": 0.001, 
                    "lower than": -0.001 
                },
                //combination for condition can be "greater than", "lower than", "or" and "and."
                "y condition": { 
                    "combination": "greater than", 
                    "greater than": 5.8 
                },
                "dot label score": 2
                //number of conditions that the value of each dot to meet to have labeled
            },
            margin: {
                top: 10,
                bottom: 60,
                left: 60,
                right: 10,
                bump: 0,
                middleSpacing: 0,
                legendSpacing: 35
            },
            deTableFields: [{
                    key: 'GENE',
                    label: "Gene",
                    sortable: true
                }, {
                    key: 'BETA',
                    label: 'Standardized beta',
                    sortable: true,
                    tdClass: '',
                     formatter: (value) => value.toFixed(2)
                }, {
                    key: 'neg_log10_p',
                    label: '-log10(P)',
                    sortable: true,
                    tdClass: '', 
                    formatter: (value) => value.toFixed(2)
                }, {
                    key: 'P',
                    label: 'P-value',
                    sortable: true,
                    tdClass: '', 
                    formatter: (value) => Formatters.pValueFormatter(value)
                }
            ],
            filteredRows: [],
            showGenes: "",
            up: "upregulated",
            down: "downregulated",
            currentSort: {
                sortBy: "P",
                sortDesc: false,
            }
        };
    },

    watch: {
        pValThreshold(){
            this.bulkVolcanoConfig["y condition"]["greater than"] = this.pValThreshold;
        }
    },

    computed: {
        rows() {
            return this.tableData.length || 0;
        },
        tableData() {
            let data = [...this.deData];
            if (this.filter) {
                data = data.filter(this.filter);
            }
            if (this.showGenes){
                data = data.filter(item => this.showRegulation(item) === this.showGenes);
            }
            return data;
        }
    },

    mounted() {
    },

    created() {
        this.fetchData()
        this.fetchInfo()
    },

    methods: {
        async fetchData(){
            const datasetFile = 'https://bioindex-dev.hugeamp.org/api/raw/file/sysbio/volcano.csv.gz';
            const response = await fetch(datasetFile);
            const text = await response.text();
            this.deData = dataConvert.csv2Json(text);
            this.pValMin = d3.min(this.deData, d => d.neg_log10_p);
            this.pValMax = d3.max(this.deData, d => d.neg_log10_p);
            this.pValThreshold = 5.8
            if(keyParams.gene) {
                this.highlightGene = keyParams.gene;
            }
            this.onFiltered(this.deData);
            this.onSortChanged(this.currentSort);
        },
        async fetchInfo(){
            this.pageInfo = await getTextContent("sysbiofairplex_geneexpressionbrowser", true);
        },
        onFiltered(filteredItems) {
            this.filteredRows = filteredItems;
        },
        onSortChanged(sort) {
            this.currentSort = sort;
            this.filteredRows.sort((a, b) => {
                if (!this.currentSort.sortBy) return 0;
                let sortKey = this.currentSort.sortBy;
                let order = this.currentSort.sortDesc ? -1 : 1;
                return a[sortKey] > b[sortKey] ? order : a[sortKey] < b[sortKey] ? -order : 0;
            });
        },
        goToHighlightedRow(gene) {
            if (!this.highlightGene || !this.filteredRows) return;
            const index = this.filteredRows.findIndex(item => item.GENE === this.highlightGene);
            if (index !== -1) {
                const page = Math.floor(index / 10) + 1;
                this.dePage = page;
            }
        },
        async highlight(highlightedGene) {
            this.highlightGene = highlightedGene;
            this.goToHighlightedRow(highlightedGene);
            keyParams.set({ gene: highlightedGene});
        },
        rowClasses(item){
            let classString = this.isHighlightedGene(item).concat(this.showRegulation(item));;
            return classString;
        },
        isHighlightedGene(item){
            return item.GENE === this.highlightGene ? "row-highlight " : "";
        },
        showRegulation(item){
            if (item[this.bulkVolcanoConfig["y axis field"]] < this.bulkVolcanoConfig["y condition"]["greater than"]){
                return "";
            }
            if (item[this.bulkVolcanoConfig["x axis field"]] <= this.bulkVolcanoConfig["x condition"]["lower than"]){
                return this.down;
            }
            if (item[this.bulkVolcanoConfig["x axis field"]] >= this.bulkVolcanoConfig["x condition"]["greater than"]){
                return this.up;
            }
            return "";
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
