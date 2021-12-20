<template>
	<div>
		<div :id="pkgID"></div>
		<div id="viewers_collection">
			<research-region-plot
				v-if="pkgConfig.viewers.includes('region_plot') == true"
				:plotData="$store.state.filteredData"
				:renderConfig="pkgConfig.regionViewer"
				:dataComparisonConfig="dataComparisonConfig"
				:region="$store.state.searchingRegion"
				:plotMargin="plotMargin"
				:compareGroupColors="colors.moderate"
			></research-region-plot>

			<research-genes-track
				v-if="
					pkgConfig.viewers.includes('genes_plot') == true &&
					$store.state.codingGenesData != null
				"
				:region="$store.state.searchingRegion"
				:genesData="$store.state.codingGenesData"
				:plotConfig="pkgConfig.regionViewer"
				:plotType="'region_plot'"
				:plotMargin="plotMargin"
			></research-genes-track>
			<research-credible-sets-plot
				v-if="pkgConfig.viewers.includes('credible_sets_plot') == true"
				:region="$store.state.searchingRegion"
				:phenotype="$store.state.searchingPhenotype"
				:plotMargin="plotMargin"
				:compareGroupColors="colors.bold"
				:renderConfig="pkgConfig.credibleSetsViewer"
			></research-credible-sets-plot>

			<research-annotations-plot
				v-if="pkgConfig.viewers.includes('annotations_plot') == true"
				:region="$store.state.searchingRegion"
				:phenotype="$store.state.searchingPhenotype"
				:renderConfig="pkgConfig.annotationsViewer"
				:plotMargin="plotMargin"
				:compareGroupColors="colors.bold"
				:dataComparison="this.$store.state.dataComparison"
			></research-annotations-plot>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";

import { BootstrapVueIcons } from "bootstrap-vue";

import ResearchRegionPlot from "@/components/researchPortal/ResearchRegionPlot.vue";
import ResearchGenesTrack from "@/components/researchPortal/ResearchGenesTrack.vue";
import ResearchAnnotationsPlot from "@/components/researchPortal/ResearchAnnotationsPlot.vue";
import ResearchCredibleSets from "@/components/researchPortal/ResearchCredibleSets.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("kp-data-viewer-pkg", {
	props: ["pkgConfig", "dataComparisonConfig", "plotMargin", "colors"],
	data() {
		return {};
	},
	modules: {
		uiUtils,
	},
	components: {
		ResearchRegionPlot,
		ResearchGenesTrack,
		ResearchAnnotationsPlot,
		ResearchCredibleSets,
	},
	mounted: function () {
		if (this.pkgConfig != null) {
			//console.log("mounted", this.pkgConfig.viewers);
			let viewersWrapper = document.getElementById(this.pkgConfig.pkgID);
			this.pkgConfig.viewers.map((v) => {
				let viewer = document.getElementById(
					this.pkgConfig.pkgID + "_" + v
				);
				//viewersWrapper.appendChild(viewer);
			});
		}
	},
	beforeDestroy() {},
	computed: {
		pkgID() {
			if (this.pkgConfig == null) {
				return null;
			} else {
				return this.pkgConfig.pkgID;
			}
		},
	},
	watch: {},
	methods: {
		...uiUtils,
	},
});
</script>

<style>
</style>



