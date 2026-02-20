import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";

import { getNewsFeed } from "@/portals/MATKP/utils/content.js";
import { getTextContent } from "@/portals/MATKP/utils/content";

import * as scUtils from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js"
import ResearchUmapPlotGL from "@/components/researchPortal/singleCellBrowser/ResearchUmapPlotGL.vue";
import ResearchSingleCellInfo from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellInfo.vue";

const BIO_INDEX_HOST = "https://bioindex-dev.hugeamp.org";
const colors = ["#007bff","#048845","#8490C8","#BF61A5","#EE3124","#FCD700","#5555FF","#7aaa1c","#F88084","#9F78AC","#F5A4C7","#CEE6C1","#cccc00","#6FC7B6","#D5A768","#d4d4d4"];

new Vue({
    components: {
        ResearchUmapPlotGL,
        ResearchSingleCellInfo
    },
    
    mixins: [matkpMixin],

    data() {
        return {
            infoPageId: 'matkp_nmf',
            title: null,
            info: null,

            datasetId: "SingleCell_Emont2022_Humans_SCP1376_SN_SAT",
            cellTypeLabel: "T cell",
            cellType: "t_cell",
            model: "mouse_msigdb_phi1",

            factorsURL: "https://matkp.hugeampkpnbi.org/api/bio/query/single-cell-factor?q=",
            genesURL: "https://matkp.hugeampkpnbi.org/api/bio/query/single-cell-gene-factor?q=",
            cellsURL: "https://matkp.hugeampkpnbi.org/api/bio/query/single-cell-cell-factor?q=",
            
            factorsData: null,
            factorCellLoadings: null,
            SCloaded: false,
            SC: {
                bioIndex: "https://matkp.hugeampkpnbi.org",
                endpoints:{
                    metadata: "/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz",
                    fields: "/api/raw/file/single_cell/$datasetId/fields.json.gz",
                    coordinates: "/api/raw/file/single_cell/$datasetId/coordinates.tsv.gz",
                },
                metadata: null,
                datasetMetadata: null,
                fields: null,   //raw fields
                coordinates: null,  //raw coordinates
                totalCells: null,
                labelColors: null,
                cellTypeField: null,
                colorByField: null,
                highlightLabel: null,
            }
        }
    },

    mounted() {
        this.injectScript("https://cdn.jsdelivr.net/npm/d3@7");
    },

    async created() {
        await this.getPageInfo();
        await this.fetchSCmetadata();
        await this.fetchSCdata();
        await this.loadFactors();
    },

    watch: {
    },

    computed: {
    },

    methods: {  
        async getPageInfo(){
            const content = await getTextContent(this.infoPageId, false, true);
            console.log('content', content);
            this.title = content.title;
            this.info = content.body;
        },
        injectScript(scriptPath) {
            // Dynamically create a <script> tag to load library from CDN
            const script = document.createElement("script");
            script.src = scriptPath;
            script.onload = () => {
                //console.log("Library loaded", scriptPath);
            };
            script.onerror = () => {
                //console.error("Error loading library", scriptPath);
            };
            document.head.appendChild(script);
        },
        async onDatasetChange(){
            this.SC.datasetMetadata = this.SC.metadata.find(x => x.datasetId === this.datasetId);
            await this.fetchSCdata();
            await this.loadFactors();
        },
        normalizeString(str) {
            return str
                .toLowerCase()
                .replace(/\s+/g, '_')          // spaces → underscore
                .replace(/[^a-z0-9_-]/g, '')   // remove invalid chars
        },
        async onCellTypeChange(){
            this.cellType = this.normalizeString(this.cellTypeLabel);
            await this.loadFactors();
            this.SC.highlightLabel = this.cellTypeLabel;
        },
        async fetchSCmetadata(){
            const metadataEnpoint = this.SC.bioIndex+this.SC.endpoints.metadata;
                const allMetadata = await scUtils.fetchMetadata(metadataEnpoint);
                if(!allMetadata){
                    llog('there was an error getting metadata');
                    return;
                }
                //filter out only single cell metadata
                const filterSingleCellMetadata = () => {
                    if (allMetadata[0]?.data_type) {
                        return allMetadata.filter(item => item.data_type === 'single_cell');
                    }
                    return allMetadata;
                };
                this.SC.metadata = filterSingleCellMetadata();
                this.SC.datasetMetadata = this.SC.metadata.find(x => x.datasetId === this.datasetId);
        },
        async fetchSCdata(){
            const fieldsEnpoint = this.SC.bioIndex+this.SC.endpoints.fields;
            this.SC.fields = await scUtils.fetchFields(fieldsEnpoint, this.datasetId);
            if(this.SC.fields){
                if(!this.SC.totalCells){
                    this.SC.totalCells = this.SC.fields.NAME?.length | this.SC.fields.ID?.length;
                }
                //console.log('fields', this.SC.fields);
            }else{
                console.log('there was an error getting fields');
            }

            //fetch coordinates
            this.preloadItem = 'coordinates';
            const coordinatesEnpoint = this.SC.bioIndex+this.SC.endpoints.coordinates;
            this.SC.coordinates = await scUtils.fetchCoordinates(coordinatesEnpoint, this.datasetId);
            if(this.SC.coordinates){
                //console.log('coordinates', this.SC.coordinates);
            }else{
                console.log('there was an error getting coordinates');
            }

            this.SC.labelColors = scUtils.calcLabelColors(this.SC.fields, colors);
            //console.log('colors', this.SC.labelColors);

            const fieldsList = Object.keys(this.SC.fields.metadata_labels);

            function findCellTypeField(list) {
                return list.reduce((bestMatch, str) => {
                    const normalizedStr = str.toLowerCase();
                    const score = (normalizedStr.includes("cell") ? 1 : 0) +
                                  (normalizedStr.includes("type") ? 1 : 0) + 
                                  (normalizedStr.includes("cluster") ? 1 : 0);
                    return score > bestMatch.score ? { string: str, score } : bestMatch;
                }, { string: null, score: 0 }).string;
            }

            this.SC.cellTypeField = "cell_type__kp"//findCellTypeField(fieldsList);
            this.cellTypeLabel = this.SC.fields.metadata_labels[this.SC.cellTypeField][0];
            this.cellType = this.normalizeString(this.cellTypeLabel);
            this.SC.colorByField = this.SC.cellTypeField;
            this.SC.highlightLabel = this.cellTypeLabel;

            this.SCloaded = true;

            this.$nextTick(() => {
                //this.$children[0].$refs.umapPlot.showLabels = false;
            });
        },

        async fetchData(url) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error("Network response was not ok");
                const data = await response.json();
                //console.log(data);
                return data;
            } catch (error) {
                console.error("Fetch error:", error);
            }
        },
        async loadFactors(){
            this.factorCellLoadings = null;
            d3.select("#histogram").selectAll("*").remove();
            const url = `${this.factorsURL}${this.datasetId},${this.cellType},${this.model}`;
            const factorsData = await this.fetchData(url);
            this.factorsData = factorsData.data;
        },
        async loadDetails(row) {
            // Toggle open if already loaded
            if (row.item.detailsLoaded) {
                //row.toggleDetails()
                console.log('already loaded')
                this.toggleDetails(row.item)
                return
            }

            console.log('loading')

            this.$set(row.item, 'detailsLoading', true)

            const factor = row.item.factor

            // load data and attach data directly to row
            //const url = `https://matkp.hugeampkpnbi.org/api/bio/query/single-cell-gene-factor?q=snRNA_Streets2024_Humans_VAT,t_cell,mouse_msigdb_phi1,${factor}`
            const genesURL = `${this.genesURL}${this.datasetId},${this.cellType},${this.model},${factor}`;
            const genesRespoonse = await this.fetchData(genesURL);
            const genesData = genesRespoonse.data;
            this.$set(row.item, 'genesData', genesData);
            this.$set(row.item, 'cellsPerPage', 5);
            this.$set(row.item, 'cellsCurrentPage', 1);

            const cellsURL = `${this.cellsURL}${this.datasetId},${this.cellType},${this.model},${factor}`;
            const cellsResponse = await this.fetchData(cellsURL);
            const cellsData = cellsResponse.data;
            this.$set(row.item, 'cellsData', cellsData);
            this.$set(row.item, 'genesPerPage', 5);
            this.$set(row.item, 'genesCurrentPage', 1);

            this.colorFactorLoadings(row.item.cellsData);

            //row.toggleDetails();
            this.toggleDetails(row.item);

            this.$set(row.item, 'detailsLoading', false);
            this.$set(row.item, 'detailsLoaded', true);
        },
        toggleDetails(item) {
            const isClosed = !item._showDetails;
            if (isClosed) {
                console.log(`Row is closed, opening details.`);
                if(item.detailsLoaded){
                    console.log('recalculating');
                    this.$set(item, 'detailsLoading', true);
                    this.colorFactorLoadings(item.cellsData);
                    this.$set(item, 'detailsLoading', false)
                }
                this.factorsData.forEach((row) => {
                    if (row !== item) {
                        this.$set(row, '_showDetails', false);
                    }
                });
            } else {
                console.log(`Row is open, closing details.`);
                this.factorCellLoadings = null;
                d3.select("#histogram").selectAll("*").remove();
            }
            this.$set(item, '_showDetails', !item._showDetails);
        },
        splitValues(value) {
            if (!value) return []
            return value.split(';')
        },
        colorFactorLoadings(factorCells){
            const factorLookup = {};
            factorCells.forEach(d => {
                factorLookup[d.cell] = d.value;
            });
            const umapCells = this.SC.fields.NAME || this.SC.fields.ID;
            //console.log({umapCells});
            const factorValues = umapCells.map(cell => {
                return factorLookup[cell] ?? 0;  // fallback if missing
            });
            this.factorCellLoadings = factorValues;
            //console.log({factorValues});
            this.calculateDistribution();
        },
        calculateDistribution() {
            const values = this.factorCellLoadings
                .filter(v => v > 0)
                .map(v => Math.log10(v));

            if (!values.length) return;

            const container = d3.select("#histogram");

            const margin = { top: 10, right: 10, bottom: 30, left: 40 };
            const width = 400;
            const height = 140;

            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            container.selectAll("*").remove();

            const svg = container
                .append("svg")
                .attr("width", width)
                .attr("height", height);

            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // X scale
            const x = d3.scaleLinear()
                .domain(d3.extent(values))
                .nice()
                .range([0, innerWidth]);

            // Histogram
            const histogram = d3.bin()
                .domain(x.domain())
                .thresholds(x.ticks(30));

            const bins = histogram(values);

            // Y scale
            const y = d3.scaleLinear()
                .domain([0, d3.max(bins, d => d.length)])
                .nice()
                .range([innerHeight, 0]);

            // Bars
            g.selectAll("rect")
                .data(bins)
                .join("rect")
                .attr("x", d => x(d.x0))
                .attr("y", d => y(d.length))
                .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
                .attr("height", d => innerHeight - y(d.length))
                .attr("fill", "#4c6ef5");

            // X Axis
            g.append("g")
                .attr("transform", `translate(0,${innerHeight})`)
                .call(d3.axisBottom(x).ticks(5))
                .selectAll("text")
                .style("font-size", "10px");

            // Y Axis
            g.append("g")
                .call(d3.axisLeft(y).ticks(3))
                .selectAll("text")
                .style("font-size", "10px");

            // X axis label
            svg.append("text")
                .attr("x", margin.left + innerWidth / 2)
                .attr("y", height - 3)
                .attr("text-anchor", "middle")
                .style("font-size", "11px")
                .text("log10(factor loading)");

            // Y axis label
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -(margin.top + innerHeight / 2))
                .attr("y", 12)
                .attr("text-anchor", "middle")
                .style("font-size", "11px")
                .text("# cells");
        }


    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
