<template>
    <div class="mbm-plot-content row">
        <h4>Genes track</h4>
        {{ plotConfig }}
        <div
            id="genesTrackWrapper"
            :class="plotType == 'score_plot' ? 'col-md-12' : 'col-md-9'"
        >
            <canvas
                id="genesTrack"
                @resize="onResize"
                width=""
                height=""
            ></canvas>
        </div>
        {{ selectedRegion }}
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-genes-track", {
    props: ["genesInRegion", "plotConfig", "plotType"],
    data() {
        return {
            plotRendered: 0,
            leftMargin: 74.5, // -0.5 to draw crisp line. adding space to the right incase dots go over the border
            rightMargin: 0.5,
            topMargin: 10.5, // -0.5 to draw crisp line
            bottomMargin: 50.5,
        };
    },
    modules: {
        uiUtils,
        Formatters,
    },
    components: {},
    mounted: function () {
        window.addEventListener("resize", this.onResize);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    },
    computed: {
        selectedRegion() {
            switch (this.plotConfig.inputType) {
                case "static":
                    break;
                case "dynamic":
                    let region = document.getElementById(
                        "search_param_" + this.plotConfig.dynamicParameter
                    ).value;

                    return region;
                    break;
            }
        },
        genesInRegionData() {
            let contents = this.$store.state.hugeampkpncms.genesInRegion;

            if (contents == "") {
                return null;
            } else {
                return contents;
            }
        },
    },
    watch: {
        genesInRegionData(data) {
            if (!!data && data != null) {
                this.getLDData();
            }
        },
    },
    methods: {
        ...uiUtils,
        onResize(e) {
            this.renderTrack();
        },

        getGenesInRegion() {
            let dataPoint =
                "https://bioindex.hugeamp.org/api/bio/query/genes?q=" +
                this.chr +
                ":" +
                this.start +
                "-" +
                this.end;

            let fetchParam = { dataPoint: dataPoint, domain: "external" };

            this.$store.dispatch("hugeampkpncms/getGenesInRegion", fetchParam);
        },

        renderTrack() {},
    },
});

$(function () {});
</script>

<style>
.region-plot-default-legend span {
    font-size: 12px;
    display: inline-block;
    margin-right: 5px;
}
.plot-legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 12px;
}
#manhattanPlot.hover,
#ldPlot.hover {
    cursor: pointer;
}
.gene-on-clicked-dot-mplot,
.content-on-clicked-dot {
    display: block !important;
}

#clicked_dot_value,
#ld_clicked_dot_value {
    padding: 8px 20px 8px 10px !important;
}

.clicked-dot-value-close {
    position: absolute;
    top: 0;
    right: 3px;
    font-size: 14px;
    color: #69f;
}

.clicked-dot-value-close:hover {
    color: #36c;
}

.dot-value-full-list,
.ld-dot-value-full-list {
    position: fixed;
    width: 400px;
    height: 300px;
    left: calc(50% - 200px);
    top: calc(50% - 150px);
    padding: 20px 0px 3px 15px;
    border-radius: 5px;
    border: solid 1px #ddd;
    background-color: #fff;
    z-index: 100;
}

#dot_value_full_list_content,
#ld_dot_value_full_list_content {
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    font-size: 14px;
}
</style>



