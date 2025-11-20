<template>
    <div class="atac-seq">
        <h4>PanKbase ATAC-Seq Browser</h4>
        <div class="row">
            <div class="col-md-2">
            <div id="tracklist">
                <h5>Select tracks</h5>
                <div>
                    <label>
                        <input type="checkbox" v-model="selectAll"
                            @change="toggleTracks()"></input>
                        <strong> Select/deselect all</strong>
                    </label>
                </div>
                <div v-for="track in tracksJson">
                <label>
                    <input type="checkbox" v-model="selectedNames" :value="track.name"/>
                    {{ track.name }}
                </label>
            </div>
            <button class="btn-primary btn" @click="updateTracks">
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
    data() {
        return {
            isLoading: true,
            loadError: null,
            tracksJson: TRACKS,
            allTracks: null,
            selectedNames: [],
            selectAll: true,
        };
    },
    async mounted() {
        this.selectedNames = TRACKS.map(t => t.name);
        this.initializeBrowser();
    },
    methods: {
        async initializeBrowser() {
            this.isLoading = true;
            this.loadError = null;

            try {
                await loadWashUAssets();
                this.allTracks = await this.loadTracks();
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
            const tracks = await fetchTracks();

            return tracks.map((track) => ({
                ...track,
                type:
                    track.type && track.type.toLowerCase() === "bigwig"
                        ? "bigWig"
                        : track.type,
            }));
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
                displayRegion: DEFAULT_REGION,
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
            return inputTracks.filter(t => 
                this.selectedNames.includes(t.name)
            );
        },
        updateTracks(){
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
            console.log("toggling");
            this.selectedNames = !this.selectAll ? [] : TRACKS.map(t => t.name);
        }
    },
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
