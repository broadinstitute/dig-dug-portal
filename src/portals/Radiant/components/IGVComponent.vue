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
            mounted: true,
            publicpath: "https://gnomad-browser-s3-test.s3.us-east-1.amazonaws.com/igv_data_bch/",
            config: {
                genome: "hg38",
                //locus: "chr8:127,736,588-127,739,371",
                locus: "chr"+this.variantId,
                tracks: [
                    {
                        url: "https://igv-radiant-data.s3.us-east-1.amazonaws.com/HG00103.alt_bwamem_GRCh38DH.20150718.GBR.low_coverage.cram",
                        indexURL:"https://igv-radiant-data.s3.us-east-1.amazonaws.com/HG00103.alt_bwamem_GRCh38DH.20150718.GBR.low_coverage.cram.crai",
                        format: "cram",
                        type: "alignment",
                        
                    },
                ],
            },
        };
    },
    mounted() {
        if(this.variantId){
            this.initIGV();
        }
        
        /*this.$nextTick(() => {
            if (this.$refs.igvContainer) {
                igv.createBrowser(this.$refs.igvContainer, this.igvOptions).then((browser) => {
                    console.log("IGV browser loaded", browser);
                });
            } else {
            console.error("IGV container not found!");
            }
        });*/
    },
    methods: {
        async initIGV() {
            console.log("init IGV browser");
            console.log(this.variantId);
            let results = await query("igv",this.variantId,{},true);
            console.log(results);
            //console.log(this.$refs.igv-container);
            /*for (let i = 0; i<results.length; i++){
                let obj = {};
                obj.url = this.publicpath + results[i][7]+".bam";
                obj.indexURL = this.publicpath + results[i][7]+".bai";
                obj.format = "bam";
                obj.type = "alignment";
                this.config.tracks[i] = obj;
            }
            
            console.log(this.config);*/
            igv.createBrowser(this.$refs.igvContainer, this.config).then((browser) => {
                if (!this.mounted) {
                    igv.removeBrowser(browser);
                    return;
                }

                this.browser = browser;

                const resetButton = document.createElement("i");
                resetButton.className = "igv-app-icon";
                resetButton.innerText = "⟲";
                resetButton.title = "Reset";
                resetButton.style.cssText = `
                position: relative;
                top: -1px;
                font-style: normal;
                font-size: 14px;
                font-weight: bold;
                margin: 0 10px;
                `;
                resetButton.addEventListener("click", () => {
                    browser.search(this.config.locus);
                });
                //console.log(this.$refs.igvContainer);
                this.$refs.igvContainer.querySelector(".igv-search-container").appendChild(resetButton);
            });
        },
    },
    beforeDestroy() {
        if (this.browser) {
            igv.removeBrowser(this.browser);
        }
        this.mounted = false;
    },
});
</script>

<style scoped>
.igvContainer {
  width: 100%;
  height: 500px;
}
</style>
