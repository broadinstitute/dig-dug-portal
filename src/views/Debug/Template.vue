<template>
    <!-- <div>
        <div id="queriedRange"></div>

        <div id="summary-value-credibleSetId"></div>
        <div id="summary-value-varId"></div>
        <div id="summary-value-tissue"></div>
        <div id="summary-value-lineOfEvidence"></div>

        <div id="select-set-credibleSetId"></div>

        <div id="color-select"></div>

        <div id="pancakeplot-wrapper"></div>
        <div id="pancakeplot-wrapper-svg"></div>
        <div id="igv-barcode-plot-wrapper"></div>
    </div> -->
    <div>
        <head>
            <meta charset="utf-8">
            <title>Pattern V2F Pancake Plot</title>
            <link href="https://fonts.googleapis.com/css?family=Overpass:300,400,700,900|Playfair+Display:400,400i,700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
            <link rel="stylesheet" href="css/style.css">
            <link rel="stylesheet" href="css/svg.css">

        </head>
        <body>
            <div id="node-tooltip" style="visibility: hidden;">
                <div class="tooltip-text" id="tooltip-x"></div>
                <div class="tooltip-text" id="tooltip-y"></div>
                <hr>
                <div class="tooltip-text" id="tooltip-nodes"></div>
            </div>

        <div id="pancakeplot-viewer-loader" class="pancakeplot-viewer-loading"></div>

        <div id="pancakeplot-viewer-body">

            <div class="pancakeplot-viewer-toolbar-wrapper" id="pancakeplot-viewer-genomic-query-range-toolbar">

                <div class="select-wrapper">
                    <div class="select-title">Search a phenotype</div>
                    <form>
                        <input  class="input-form" placeholder="Phenotype" type="text" id="queryPhenotypeForm" v-model="$parent.phenotype" >
                    </form>
                    <p>e.g. t2d</p>
                </div>

                <div class="select-wrapper">
                    <div class="select-title">Search a gene to determine genomic range</div>
                    <form>
                        <input  class="input-form" placeholder="GeneId" type="text" id="queryGeneForm" v-model="$parent.geneId" @click="$parent.submitQueryGene">
                        <input  class="input-button" type="button" id="SubmitQueryGene" value="Submit"/>
                    </form>
                    <p>e.g. INS-IGF2, HNF1A</p>
                </div>

                <div class="select-wrapper">
                    <div class="select-title">Search a genomic range</div>
                    <form>
                        <input  class="input-form" placeholder="Chrom:pos-pos" type="text" id="queryRangeForm" v-model="$parent.genomicRange">
                        <input  class="input-button" type="button" id="SubmitQueryRange" value="Submit" @click="$parent.submitQueryRange"/>
                    </form>
                    <p>e.g. 3:183411802-183758960</p>
                </div>

                <div class="column-wrapper">
                    <h3>Queried range:  <span id="queriedRange"></span></h3>
                </div>


            </div>

            <hr>
            <div class="pancakeplot-viewer-toolbar-wrapper">
                <div id="credibleSetId-select-wrapper">
                        <div class="select-title">Credible Sets (<span id="summary-value-credibleSetId" class="summary-value"></span>)</div>
                        <select class="select-set" id= "select-set-credibleSetId"></select>
                </div>
                <div id="igv-barcode-plot-wrapper"></div>
            </div>
            <hr>

            <div class="pancakeplot-viewer-toolbar-wrapper">

                <div class="pancakeplot-viewer-toolbar-button" id="pancakeplot-viewer-toolbar-filter-button" onclick="toggleFilterToolbar()">Filter Menu <i class="fa fa-filter"></i><span id="filter-expand"></span></div>

                <div id="pancakeplot-viewer-filter-toolbar">

                        <div class="column-block">
                            <div class="checkbox-wrapper">
                                <div class="checkbox-title">Variants (<span id="summary-value-varId" class="summary-value"></span>)</div>
                                <div class="checkbox-set" id= "checkbox-set-varId"></div>
                            </div>
                        </div>

                        <div class="column-block">
                            <div class="checkbox-wrapper">
                                <div class="checkbox-title">Genes (<span id="summary-value-gene" class="summary-value"></span>)</div>
                                <div class="checkbox-set" id= "checkbox-set-gene"></div>
                            </div>
                        </div>
                        <div class="column-block">
                            <div class="checkbox-wrapper">
                                <div class = "checkbox-title">Tissues  (<span id="summary-value-tissue" class="summary-value"></span>)</div>
                                <div class="checkbox-set" id="checkbox-set-tissue"></div>
                            </div>
                        </div>

                        <div class="column-block">
                            <div class="checkbox-wrapper">
                                <div class="checkbox-title">Lines of Evidence  (<span id="summary-value-lineOfEvidence" class="summary-value"></span>)</div>
                                <div class="checkbox-set" id= "checkbox-set-lineOfEvidence"></div>
                            </div>
                        </div>

                </div>
            </div>
            <hr>
            <div class="pancakeplot-viewer-toolbar-wrapper" id="pancakeplot-viewer-config-toolbar">

                <div class="column-block-wrapper">
                    <div class="column-block">
                        <div class="inline-block">
                            <div class="select-title"><b>Variant axis</b></div>
                            <div class="select-title">Group</div>
                            <select class="select-set data-model-features" id= "A-group"></select>
                        </div>
                        <div class="inline-block">
                            <div class="select-title">Sort</div>
                            <select class="select-set data-model-features" id= "A-sort"></select>
                        </div>
                    </div>
                </div>

                    <div class="column-block-wrapper">
                        <div class="column-block">
                            <div class="inline-block">
                                <div class="select-title"><b>Gene axis</b></div>
                                <div class="select-title">Sort</div>
                                <select class="select-set data-model-features" id= "B-sort"></select>
                            </div>
                        </div>
                        <div class="column-block">
                            <div class="inline-block">
                                <div class="select-title"><b>Tissue axis</b></div>
                                <div class="select-title">Ontology</div>
                                <select class="select-set data-model-options" id= "C-option"></select>
                            </div>
                            <div class="inline-block">
                                <div class="select-title">Group</div>
                                <select class="select-set data-model-features" id= "C-group"></select>
                            </div>
                            <div class="inline-block">
                                <div class="select-title">Sort</div>
                                <select class="select-set data-model-features" id= "C-sort"></select>
                            </div>
                        </div>
                    </div>

                    <div class="column-block-wrapper">
                        <div class="column-block">
                            <div class="select-title"><br></div>
                            <div class="select-title">Color  by</div>
                            <select class="select-set color-select" id= "color-select"></select>
                            <div id="color-legend-wrapper"></div>
                        </div>
                    </div>

                </div>

                <div id="pancakeplot-wrapper"></div>

            </div>
        </body>
    </div>
</template>
<script>
import Vue from "vue";
import * as pancakePlot from "./Pancake/src/plots/pancakePlot"
import * as $ from "jquery";

var expanded = false;

export default new Vue({
    data() {
        return {
            geneId: '',
            genomicRange: '',
            phenotype: '',
        }
    },
    created() {
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
    },
})
</script>
