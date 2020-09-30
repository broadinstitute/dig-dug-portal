import Vue from "vue";
import store from "./store";
import Template from "./Template.vue";

import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import GAEventLog from "@/components/GAEventLog";
import * as pancakePlot from "./Pancake/src/plots/pancakePlot"
import * as $ from "jquery";

Vue.config.productionTip = false;

new Vue({
    store,
    components: {
        GoogleAnalytics,
        GAEventLog
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            filterFunction: id => false,
            inclusive: false,
            initialData: [
                { pValue: 0.01, beta: 3 },
                { pValue: 0.001, beta: 3 },
                { pValue: 0.2, beta: 3 },
                { pValue: 0.01, beta: 4 },
                { pValue: 0.01, beta: 2 },
                { test: 'no matches' },
                { test: 'some matches' },
                { test: 'all matches' },
            ],

            associations: [],
            phenotypes: [{
                "name": "T2D",
                "description": "Type 2 diabetes",
                "group": "GLYCEMIC",
                "dichotomous": 1
            }],
            chr: 9,
            start: 21940000,
            end: 22190000,
            geneId: '',
            genomicRange: '',
            phenotype: '',
        }
    },
    mounted() {
        const windowQuery = this.parseQuery(window.location.search);
        const queryDefaults = {
            // geneId: "slc30a8",
            geneId: "PNPLA3",
            type: "geneId",
            genomicRange: "",
            phenotype: "t2d"
        }
        let query = this.initialQuery(windowQuery, queryDefaults);

        this.geneId = query.geneId;
        this.genomicRange = query.genomicRange;
        this.phenotype = query.phenotype;

        pancakePlot.dataPromises.makePromises(undefined, query)

        // document.getElementById('SubmitQueryRange').onclick =  function(){
        //     document.getElementById('queryGeneForm').value = ""; //clear gene form
        //     query.geneId = "";
        //     query.genomicRange = document.getElementById('queryRangeForm').value;
        //     query.phenotype = document.getElementById('queryPhenotypeForm').value;
        //     query.type = "genomicRange";
        //     $("#pancakeplot-viewer-loader").addClass("pancakeplot-viewer-loading")
        //     pancakePlot.dataPromises.makePromises(undefined, query)
        // }
        // document.getElementById('SubmitQueryGene').onclick =  function(){
        //     document.getElementById('queryRangeForm').value = ""; //clear range form
        //     query.genomicRange = "";
        //     query.geneId = document.getElementById('queryGeneForm').value;
        //     query.phenotype = document.getElementById('queryPhenotypeForm').value;
        //     query.type = "geneId";
        //     $("#pancakeplot-viewer-loader").addClass("pancakeplot-viewer-loading")
        //     pancakePlot.dataPromises.makePromises(undefined, query)
        // }

        $("#queryRangeForm").keypress(function(e){
            if(e.keyCode == 13){ // bind the enter key
                e.preventDefault(); // Note: prevent the default behavior of the enter key, which is refreshing the page
                document.getElementById('queryGeneForm').value = ""; //clear gene search
                let genomicRange = document.getElementById('queryRangeForm').value;
                query.geneId = "";
                query.genomicRange = genomicRange;
                query.phenotype = document.getElementById('queryPhenotypeForm').value;
                query.type = "genomicRange";
                $("#pancakeplot-viewer-loader").addClass("pancakeplot-viewer-loading")
                pancakePlot.dataPromises.makePromises(undefined, query)
            }
        });
        $("#queryGeneForm").keypress(function(e){
            if(e.keyCode == 13){ // bind the enter key
                e.preventDefault(); // Note: prevent the default behavior of the enter key, which is refreshing the page
                document.getElementById('queryRangeForm').value = "";
                let geneId = document.getElementById('queryGeneForm').value;
                query.geneId = geneId;
                query.genomicRange = "";
                query.phenotype = document.getElementById('queryPhenotypeForm').value;
                query.type = "geneId";
                $("#pancakeplot-viewer-loader").addClass("pancakeplot-viewer-loading")
                pancakePlot.dataPromises.makePromises(undefined, query)
            }
        });

    },
    computed: {
        filteredData() {
            return this.initialData.filter(this.filterFunction)
        },
        matches() {
            return this.filteredData.filter(obj => !!obj.test).map(obj => obj.test);
        },
        associationConsequences() {
            return this.associations
                .map((v) => v.consequence)
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter(v => v != undefined)
                .sort();
        },
        associationNearestGenes() {
            let genes = this.associations.flatMap((assoc) => assoc.nearest);
            return [...new Set(genes)].sort();
        },
    },
    methods: {
        submitQueryRange(query = {}) {
            document.getElementById('queryGeneForm').value = ""; //clear gene form
            query.geneId = "";
            query.genomicRange = document.getElementById('queryRangeForm').value;
            query.phenotype = document.getElementById('queryPhenotypeForm').value;
            query.type = "genomicRange";
            $("#pancakeplot-viewer-loader").addClass("pancakeplot-viewer-loading")
            pancakePlot.dataPromises.makePromises(undefined, query)
        },
        submitQueryGene(query = {}) {
            document.getElementById('queryRangeForm').value = ""; //clear range form
            query.genomicRange = "";
            query.geneId = document.getElementById('queryGeneForm').value;
            query.phenotype = document.getElementById('queryPhenotypeForm').value;
            query.type = "geneId";
            $("#pancakeplot-viewer-loader").addClass("pancakeplot-viewer-loading")
            pancakePlot.dataPromises.makePromises(undefined, query)
        },
        initialQuery(queryParams, defaults) {
            // the initial query is setup to prefer locus queries if all necessary information is passed, else gene information.
            function checkLocus(maybeLocusParams) {
                return !!queryParams.chr && !!queryParams.start && !!queryParams.end
            }
            return {
                    type: checkLocus(queryParams) ? "genomicRange" : !!queryParams.gene ? "geneId" : defaults.type,
                    geneId: checkLocus(queryParams) ? '' : !!queryParams.gene ? queryParams.gene : defaults.geneId,
                    genomicRange: checkLocus(queryParams)? `${queryParams.chr}:${queryParams.start}-${queryParams.end}` : defaults.genomicRange,
                    phenotype: queryParams.phenotype || defaults.phenotype,
            }
        },
        parseQuery(queryString) {
            var query = {};
            var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
            }
            return query;
        },
        toggleFilterToolbar() {
            var filterMenu = document.getElementById("pancakeplot-viewer-filter-toolbar");
            if (!expanded) {
                filterMenu.style.display = "flex";
                expanded = true;
            } else {
                filterMenu.style.display = "none";
                expanded = false;
            }
        }
    }
}).$mount("#app");
