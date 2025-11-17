<template>
  <div>
      <h4>ATAC-Seq coming soon</h4>
    <div id="embed" style="width: 100%; height: 100vh;"></div>

  </div>
</template>
<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import keyParams from "@/utils/keyParams";
import uiUtils from "@/utils/uiUtils";
import alertUtils from "@/utils/alertUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import dataConvert from "@/utils/dataConvert";
import { TRACKS } from "@/portals/PanKbase/utils/tracks";

const BIO_INDEX_HOST = "https://bioindex.pankbase.org";
export default Vue.component("atac-seq", {
    components: {
    },
    props: [
    ],
    data() {
        return {
            washUScriptSrc: "https://target.wustl.edu/dli/eg/epgg.js",
        };
    },
    mounted(){
        const script = document.createElement("script");
        script.src = this.washUScriptSrc;
        document.body.appendChild(script);
        this.buildAtacSeq();
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
        buildAtacSeq(){
            const container = document.getElementById("embed");
            
            
            // Parse URL parameters FIRST
            const urlParams = new URLSearchParams(window.location.search);
            const selectedCells = urlParams.get('cells')?.split(',') || [];
            const selectedTypes = urlParams.get('types')?.split(',') || [];
            // Load tracks from JSON file

            // Filter tracks if URL parameters exist
            let tracksToShow = TRACKS;
            if (selectedCells.length > 0 || selectedTypes.length > 0) {
                console.log("we made it here");
                    tracksToShow = tracksToShow.filter(track => {
                        console.log("ok now we made it here");
                        // If types are specified, check if track type matches
                        const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(track.type);
                        
                        // If cells are specified, check if track name contains any selected cell
                        // Need to handle both "Alpha" and "Alpha_" patterns
                        const cellMatch = selectedCells.length === 0 || 
                                        selectedCells.some(cell => {
                                            const trackNameLower = track.name.toLowerCase();
                                            const cellLower = cell.toLowerCase();
                                            // Match if track name contains the cell name followed by space, underscore, or nothing
                                            return trackNameLower.includes(cellLower + ' ') || 
                                                    trackNameLower.includes(cellLower + '_') ||
                                                    trackNameLower.startsWith(cellLower);
                                        });
                        
                        return typeMatch && cellMatch;
                    });
            }
            let allTracks = [
                    {
                        "type": "geneannotation",
                        "name": "refGene",
                        "genome": "hg38"
                    },
                    {
                        "type": "ruler",
                        "name": "Ruler"
                    }];
            allTracks = allTracks.concat(tracksToShow);
            let contents = {
                    genomeName: "hg38",
                    displayRegion: "chr11:2150341-2238950",
                    trackLegendWidth: 150,
                    isShowingNavigator: true,
                    tracks: allTracks,
                    metadataTerms: ["Sample"]
            };
            renderBrowserInElement(contents, container);
        }
    }
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
