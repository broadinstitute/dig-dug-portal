import Vue from "vue";
import Template from "./Template.vue";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";

import * as d3 from "d3";
import dataConvert from "@/utils/dataConvert";
import DownloadChart from "@/components/DownloadChart";
import DataDownload from "@/components/DataDownload";
import { getTextContent } from "@/portals/SysBio/utils/content.js";
import Formatters from "@/utils/formatters";
import keyParams from "@/utils/keyParams";

import * as scUtils from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js"
import ResearchUmapPlotGL from "@/components/researchPortal/singleCellBrowser/ResearchUmapPlotGL.vue";

const colors = ["#007bff","#048845","#8490C8","#BF61A5","#EE3124","#FCD700","#5555FF","#7aaa1c","#F88084","#9F78AC","#F5A4C7","#CEE6C1","#cccc00","#6FC7B6","#D5A768","#d4d4d4"]

/*

NOTE: this is a rough assembly of SC browser do display unprocessed sample data

*/

new Vue({
    mixins: [sysbioMixin],

    components: {
        DataDownload,
        DownloadChart,
        ResearchUmapPlotGL,
    },

    data() {
        return {
            pageInfo: null,
            datasetFile: '/files/pca_3d_full.tsv',
            ready: false,
            totalCells: 0,
            coordinates: null,
            fields: null,
            labelColors: null,
            cellTypeField: '',
            colorByField: 'Tissue',
            colorByFields: ['AMP', 'Assay', 'cell_type', 'StatusLabel', 'Tissue'],
            highlightLabel: null,
            highlightLabels: [],
        };
    },

    watch: {
    },

    computed: {
        
    },

    mounted() {},

    created() {
        this.fetchData();
        this.fetchInfo();
    },
    methods: {
        async fetchData() {
            const response = await fetch(this.datasetFile);
            const text = await response.text();
            const json = dataConvert.tsv2Json(text);
            this.totalCells = json.length;
            this.coordinates = this.mapToCoordinates(json, 'PC2', 'PC3');
            this.fields = this.mapToFields(json, 'sample_id', ['AMP', 'Assay', 'cell_type', 'StatusLabel', 'Tissue'])
            this.labelColors = scUtils.calcLabelColors(this.fields, colors);
            this.ready = true;
            console.log({json});
            console.log({coordinates:this.coordinates});
            console.log({fields:this.fields});
        },
        async fetchInfo() {
            this.pageInfo = await getTextContent(
                "sysbio_singlecell",
                true
            );
        },
        mapToCoordinates(data, xColumn, yColumn){
            const coordinates = data.map(row => ({
                X: parseFloat(row[xColumn]),
                Y: parseFloat(row[yColumn])
            }))

            return coordinates;
        },
        mapToFields(data, sampleIDColumn, metadataColumns){
            const result = {
                ID: [],
                metadata_labels: {},
                metadata: {}
            }

            // initialize structures
            metadataColumns.forEach(col => {
                result.metadata_labels[col] = []
                result.metadata[col] = []
            })

            data.forEach(row => {
                // push sample_id
                result.ID.push(row[sampleIDColumn])

                // process metadata
                metadataColumns.forEach(col => {
                    const value = row[col]
                    let labels = result.metadata_labels[col]

                    // if new value, add to labels
                    let idx = labels.indexOf(value)
                    if (idx === -1 && value) {
                        labels.push(value)
                        idx = labels.length - 1
                    }

                    // push index into metadata[col]
                    result.metadata[col].push(idx)
                })
            })

            return result
        },
        emitHover(label){
            this.highlightLabel = label;
        },
        colorLabel(label){
            const idx = this.highlightLabels.indexOf(label);
            if (idx === -1) {
                this.highlightLabels.push(label);
            } else {
                this.highlightLabels.splice(idx, 1);
            }
        },
        labelIsolated(label){
            if(this.highlightLabels.length>0){
                if(!this.highlightLabels.includes(label)){
                    return 'off'
                }
            }
            return '';
        }
        
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
