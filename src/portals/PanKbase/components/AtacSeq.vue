<template>
    <div class="atac-seq">
        <div class="row">
            <div class="col-md-2">
            <div id="tracklist">
                <h5>Select cell types</h5>
                <div>
                    <label>
                        <input type="checkbox" v-model="selectAll"
                            @change="toggleTracks()"></input>
                        <strong> Select/deselect all</strong>
                    </label>
                </div>
                <div v-for="cellType in cellTypes">
                    <label>
                        <input type="checkbox" v-model="selectedCellTypes" :value="cellType"/>
                        {{ cellType }}
                    </label>
                </div>
                <h5>Select track types</h5>
                <div v-for="trackType in trackTypes">
                    <label>
                        <input type="checkbox" v-model="selectedTrackTypes" :value="trackType"/>
                        {{ trackType }}
                    </label>
                </div>
            <button class="btn-primary btn" @click="updateBrowser">
                Update browser
            </button>
            </div>
        </div>
        <div class="col-md-10">
            <div v-if="loadError" class="alert alert-danger" role="alert">
            {{ loadError }}
        </div>
        <div v-else>
            <p v-if="isLoading" class="atac-seq__loading">
                Loading ATAC tracks…
            </p>
            <div v-show="!isLoading">
                <div id="browser"
                class="atac-seq__browser"
                aria-live="polite"
            ></div>
            </div>
        </div>
        </div>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import { fetchTracks } from "@/portals/PanKbase/utils/tracks";
import { loadWashUAssets } from "@/portals/PanKbase/utils/washU";
import { TRACKS } from "@/portals/PanKbase/utils/tracks.js";

const DEFAULT_GENOME = "hg38";
const DEFAULT_REGION = "chr11:2150341-2238950";

export default Vue.component("AtacSeq", {
    props: [ "region" ],
    data() {
        return {
            isLoading: true,
            loadError: null,
            tracksJson: TRACKS,
            allTracks: null,
            selectedCellTypes: [],
            selectAll: true,
            cellTypes: [],
            trackTypes: [],
            selectedTrackTypes: []
        };
    },
    async mounted() {
        this.initializeBrowser();
    },
    methods: {
        async initializeBrowser() {
            console.log(this.region);
            this.isLoading = true;
            this.loadError = null;

            try {
                await loadWashUAssets();
                this.allTracks = await this.loadTracks();
                this.cellTypes = Array.from(new Set(this.allTracks.map(t => t.cellType)));
                this.selectedCellTypes = this.cellTypes;
                this.trackTypes = Array.from(new Set(this.allTracks.map(t => t.trackType)));
                this.selectedTrackTypes = this.trackTypes;
                const filteredTracks = this.applyUrlFilters(this.allTracks);
                this.renderBrowser(filteredTracks);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error("Failed to initialise ATAC browser", error);
                this.loadError =
                    "Unable to load the ATAC browser. Please try again later.";
            } finally {
                this.isLoading = false;
            }
        },
        async loadTracks() {
            let tracks = await fetchTracks();
            tracks.forEach(t => {
                if (t.name.includes("signal")){
                    t.options.yMax = 5;
                    t.options.yScale = "fixed";
                }
                if (t.name.includes("peaks")){
                    t.options.maxRows = 1;
                }
            });
            let output = tracks.map((track) => ({
                ...track,
                type:
                    track.type && track.type.toLowerCase() === "bigwig"
                        ? "bigWig"
                        : track.type,
            }));
            return this.populateCellsAndTracks(output);
        },
        applyUrlFilters(tracks) {
            if (!window.location?.search) {
                return tracks;
            }

            const params = new URLSearchParams(window.location.search);
            const selectedCells = (params.get("cells") || "")
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean);
            const selectedTypes = (params.get("types") || "")
                .split(",")
                .map((value) => value.trim().toLowerCase())
                .filter(Boolean);

            if (!selectedCells.length && !selectedTypes.length) {
                return tracks;
            }

            return tracks.filter((track) => {
                const trackType = (track.type || "").toString().toLowerCase();
                const trackName = (track.name || "").toString().toLowerCase();

                const typeMatch =
                    !selectedTypes.length ||
                    selectedTypes.some((type) => type === trackType);

                const cellMatch =
                    !selectedCells.length ||
                    selectedCells.some((cell) => {
                        const value = cell.toLowerCase();
                        return (
                            trackName.includes(`${value} `) ||
                            trackName.includes(`${value}_`) ||
                            trackName.startsWith(value)
                        );
                    });

                return typeMatch && cellMatch;
            });
        },
        renderBrowser(tracks) {
            //const container = this.$refs.browser;
            const container = document.getElementById("browser");
            if (!container) {
                throw new Error("Missing WashU browser mount point");
            }

            container.innerHTML = "";

            const defaultTracks = [
                {
                    type: "geneannotation",
                    name: "refGene",
                    genome: DEFAULT_GENOME,
                },
                {
                    type: "ruler",
                    name: "Ruler",
                },
            ];

            const contents = {
                genomeName: DEFAULT_GENOME,
                displayRegion: this.region === "" ? DEFAULT_REGION : this.region,
                trackLegendWidth: 150,
                isShowingNavigator: true,
                tracks: [...defaultTracks, ...tracks],
                metadataTerms: ["Sample"],
            };
            const renderBrowserInElement = window.renderBrowserInElement;
            if (typeof renderBrowserInElement !== "function") {
                throw new Error("WashU browser script is not available");
            }

            renderBrowserInElement(contents, container);
        },
        filterTrackNames(inputTracks){
            return inputTracks.filter(t => this.selectedCellTypes.includes(t.cellType))
                .filter(t => this.selectedTrackTypes.includes(t.trackType));
        },
        updateBrowser(){
            this.isLoading = true;
            let browserdiv = document.getElementById("browser");
            let newdiv = document.createElement("div");
            newdiv.id = "browser";
            newdiv.className = "atac-seq__browser";
            newdiv.ariaLive = "polite";
            browserdiv.replaceWith(newdiv);
            
            const filteredTracks = 
                this.filterTrackNames(this.allTracks);
            this.renderBrowser(filteredTracks);
            this.isLoading = false;
        },
        toggleTracks(){
            this.selectedCellTypes = !this.selectAll ? [] : this.cellTypes;
        },
        populateCellsAndTracks(input){
            // this assumes same formatting for all track names - quick fix
            let output = structuredClone(input);
            for (let i = 0; i < output.length; i++){
                let name = output[i].name;
                let splitPoint = name.indexOf(" ");
                output[i].cellType = name.slice(0,splitPoint).toLowerCase();
                output[i].trackType = name.slice(splitPoint);
            }
            return output;
        }
    },
    watch: {
    }
});
</script>
<style scoped>
.atac-seq {
    margin-top: 20px;
    margin-bottom: 20px;
}

.atac-seq__browser {
    width: 100%;
    min-height: 70vh;
}

.atac-seq__loading {
    font-style: italic;
}
#tracklist {
    margin-top: 50px;
    margin-left: 25px;
    font-size: small;
}
#tracklist h5 {
    margin-bottom: 10px;
}
</style>
