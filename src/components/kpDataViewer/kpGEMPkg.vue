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
			<div
				v-if="pkgConfig.viewers.includes('credible_sets_plot') == true"
				class="section-opener"
				id="credibleSetSectionOpener"
			>
				<a
					href="javascript:;"
					@click="
						showHideSection(
							$event,
							'credibleSetSection',
							'credibleSetSectionOpener',
							'Filter associated variants by credible sets'
						)
					"
					>Filter associated variants by credible sets</a
				>
			</div>
			<research-credible-sets-plot
				id="credibleSetSection"
				class="svg-wrapper hidden-svg"
				v-if="pkgConfig.viewers.includes('credible_sets_plot') == true"
				:region="$store.state.searchingRegion"
				:phenotype="$store.state.searchingPhenotype"
				:plotMargin="plotMargin"
				:compareGroupColors="colors.bold"
				:renderConfig="pkgConfig.credibleSetsViewer"
				:dataComparison="this.$store.state.dataComparison"
				:pkgData="$store.state.pkgData"
				:pkgDataSelected="pkgDataSelected"
			></research-credible-sets-plot>
			<div
				v-if="pkgConfig.viewers.includes('annotations_plot') == true"
				class="section-opener"
				id="annotationSectionOpener"
			>
				<a
					href="javascript:;"
					@click="
						showHideSection(
							$event,
							'annotationSection',
							'annotationSectionOpener',
							'Filter associated variants by tissues and annotations'
						)
					"
					>Filter associated variants by tissues and annotations</a
				>
			</div>
			<research-annotations-plot
				id="annotationSection"
				class="svg-wrapper hidden-svg"
				v-if="pkgConfig.viewers.includes('annotations_plot') == true"
				:region="$store.state.searchingRegion"
				:phenotype="$store.state.searchingPhenotype"
				:renderConfig="pkgConfig.annotationsViewer"
				:plotMargin="plotMargin"
				:compareGroupColors="colors.bold"
				:dataComparison="this.$store.state.dataComparison"
				:pkgData="pkgData"
				:pkgDataSelected="pkgDataSelected"
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

export default Vue.component("kp-gem-pkg", {
	props: [
		"pkgConfig",
		"dataComparisonConfig",
		"plotMargin",
		"colors",
		"pkgData",
		"pkgDataSelected",
	],
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
		showHideSection(event, SECTION, OPENER, LABEL) {
			let element = document.getElementById(OPENER);

			if (element.classList.contains("open")) {
				element.classList.remove("open");
				event.target.innerText = LABEL;
			} else {
				element.classList.add("open");
				event.target.innerText = "Hide Section";
			}

			uiUtils.showHideSvg(SECTION);
		},
	},
});
</script>

<style>
.section-opener {
	height: 25px;
	margin-bottom: 10px;
}

.section-opener a {
	display: block;
	font-size: 13px;
	text-align: center;
	background-color: #efefef;
	border: solid 1px #ddd;
	border-radius: 15px;
	margin-bottom: 10px;
	width: 100%;
	transition: all 0.5s;
	float: right;
}
.section-opener.open a {
	width: 25%;
	float: right;
}
</style>



