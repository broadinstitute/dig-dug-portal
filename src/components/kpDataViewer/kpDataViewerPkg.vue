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
			></research-region-plot>

			<research-genes-track
				v-if="
					pkgConfig != null &&
					!!pkgConfig.genesTrack &&
					$store.state.codingGenesData != null
				"
				:region="$store.state.searchingRegion"
				:genesData="$store.state.codingGenesData"
				:plotConfig="pkgConfig.regionViewer"
				:plotType="'region_plot'"
				:plotMargin="plotMargin"
			></research-genes-track>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";

import { BootstrapVueIcons } from "bootstrap-vue";

import ResearchRegionPlot from "@/components/researchPortal/ResearchRegionPlot.vue";
import ResearchGenesTrack from "@/components/researchPortal/ResearchGenesTrack.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("kp-data-viewer-pkg", {
	props: ["pkgConfig", "dataComparisonConfig", "plotMargin"],
	data() {
		return {};
	},
	modules: {
		uiUtils,
	},
	components: { ResearchRegionPlot, ResearchGenesTrack },
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



