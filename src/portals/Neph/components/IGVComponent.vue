<template>
  <div ref="igvContainer"></div>
</template>

<script>
import Vue from "vue";
import igv from "igv";
import { match, query, request } from "@/utils/bioIndexUtils";
//import "igv/dist/igv.min.css";

export default Vue.component("igv-card",{
    props: {
		variantId: [String, Array],
	},
	data() {
        return {
            browser: null,
            publicpath: "https://aggregator.bchresearch.org/igv_data_bch/",
        };
    },
    mounted() {
        if (this.variantId) {
            this.initIGV();
        }
    },
    watch: {
        variantId(newVal) {
            if (newVal) {
                this.destroyIGV();
                this.initIGV();
            }
        },
    },
    methods: {
        // Parse "16:2071534:C:T" → "chr16:2071534"
        variantLocus(variantId) {
            const parts = variantId.split(":");
            return "chr" + parts[0] + ":" + parts[1];
        },
        destroyIGV() {
            if (this.browser) {
                try { igv.removeBrowser(this.browser); } catch (e) { /* igv v3 may not have this */ }
                this.browser = null;
            }
            // clear the container so IGV can reinitialize into a clean div
            if (this.$refs.igvContainer) {
                this.$refs.igvContainer.innerHTML = "";
            }
        },
        async initIGV() {
            console.log("init IGV browser for", this.variantId);
            let results = await query("igv", this.variantId, { query_private: true });
            console.log("igv results", results);

            if (!this.$refs.igvContainer) return;

            // Build tracks from query results
            const tracks = results.map(r => ({
                url: this.publicpath + r[7] + ".bam",
                indexURL: this.publicpath + r[7] + ".bai",
                format: "bam",
                type: "alignment",
            }));

            const locus = this.variantLocus(this.variantId);
            const config = {
                genome: "hg38",
                locus,
                tracks,
            };

            console.log("IGV config", config);
            igv.createBrowser(this.$refs.igvContainer, config).then((browser) => {
                if (!this.$refs.igvContainer) {
                    try { igv.removeBrowser(browser); } catch (e) {}
                    return;
                }
                this.browser = browser;

                // Add a reset button to the search bar if present
                const searchContainer = this.$refs.igvContainer.querySelector(".igv-search-container");
                if (searchContainer) {
                    const resetButton = document.createElement("i");
                    resetButton.className = "igv-app-icon";
                    resetButton.innerText = "⟲";
                    resetButton.title = "Reset";
                    resetButton.style.cssText =
                        "position:relative;top:-1px;font-style:normal;font-size:14px;font-weight:bold;margin:0 10px;cursor:pointer;";
                    resetButton.addEventListener("click", () => browser.search(locus));
                    searchContainer.appendChild(resetButton);
                }
            });
        },
    },
    beforeDestroy() {
        this.destroyIGV();
    },
});
</script>

<style scoped>
.igvContainer {
  width: 100%;
  height: 500px;
}
</style>
