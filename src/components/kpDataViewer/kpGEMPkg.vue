<template>
	<div>
		<div :id="pkgID"></div>
		<div id="viewers_collection">
			<research-region-plot
				v-if="pkgConfig.viewers.includes('region plot') == true"
				:plotData="$store.state.filteredData"
				:renderConfig="pkgConfig['region viewer']"
				:dataComparisonConfig="dataComparisonConfig"
				:region="$store.state.searchingRegion"
				:plotMargin="plotMargin"
				:compareGroupColors="colors.moderate"
				:regionZoom="regionZoom"
				:regionViewArea="regionViewArea"
				:sharedPlotXpos="sharedPlotXpos"
				:pkgData="pkgData"
				:pkgDataSelected="pkgDataSelected"
			></research-region-plot>
			<research-genes-track
				v-if="
					pkgConfig.viewers.includes('genes plot') == true &&
					$store.state.codingGenesData != null
				"
				:region="$store.state.searchingRegion"
				:genesData="$store.state.codingGenesData"
				:plotConfig="pkgConfig['region viewer']"
				:plotType="'region plot'"
				:plotMargin="plotMargin"
				:regionZoom="regionZoom"
				:regionViewArea="regionViewArea"
			></research-genes-track>
			<div
				v-if="pkgConfig.viewers.includes('credible sets plot') == true"
				class="section-opener"
				id="credibleSetSectionOpener"
				@click="
					showHideSection(
						$event,
						'credibleSetSection',
						'credibleSetSectionOpener',
						'Filter associated variants by credible sets'
					)
				"
			>
				Filter associated variants by credible sets
			</div>
			<research-credible-sets-plot
				id="credibleSetSection"
				class="svg-wrapper hidden-svg"
				v-if="pkgConfig.viewers.includes('credible sets plot') == true"
				:region="$store.state.searchingRegion"
				:phenotype="$store.state.searchingPhenotype"
				:plotMargin="plotMargin"
				:compareGroupColors="colors.bold"
				:renderConfig="pkgConfig['credible sets viewer']"
				:dataComparison="this.$store.state.dataComparison"
				:pkgData="$store.state.pkgData"
				:pkgDataSelected="pkgDataSelected"
				:regionZoom="regionZoom"
				:regionViewArea="regionViewArea"
			></research-credible-sets-plot>
			<div
				v-if="pkgConfig.viewers.includes('annotations plot') == true"
				class="section-opener"
				id="annotationSectionOpener"
				@click="
					showHideSection(
						$event,
						'annotationSection',
						'annotationSectionOpener',
						'Filter associated variants by annotations'
					)
				"
			>
				Filter associated variants by annotations
			</div>
			<!--<button
				id="external-button"
				@click="$refs.annotationsRef.removeAnnoTrack('binding_sites')"
			>
				remove binding_sites
			</button>

			<button
				id="external-button"
				@click="
					$refs.annotationsRef.addRemoveTissueTrack(null, 'pancreas')
				"
			>
				remove pancreas
			</button>-->

			<research-annotations-plot
				id="annotationSection"
				class="svg-wrapper hidden-svg"
				v-if="pkgConfig.viewers.includes('annotations plot') == true"
				:region="$store.state.searchingRegion"
				:phenotype="$store.state.searchingPhenotype"
				:renderConfig="pkgConfig['annotations viewer']"
				:plotMargin="plotMargin"
				:compareGroupColors="colors.bold"
				:dataComparison="this.$store.state.dataComparison"
				:plotData="$store.state.filteredData"
				:pkgData="pkgData"
				:pkgDataSelected="pkgDataSelected"
				:regionZoom="regionZoom"
				:regionViewArea="regionViewArea"
				:sharedPlotXpos="sharedPlotXpos"
				ref="annotationsRef"
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
		"regionZoom",
		"regionViewArea",
		"sharedPlotXpos",
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
	position: relative;
	display: inline-block;
	font-size: 12px;
	font-weight: bold;
	padding: 0px 5px;
	border: solid 1px #cccccc;
	border-left: none;
	background-color: #eeeeee;
	color: #333;
	margin-bottom: 10px;
	width: auto;
	transition: all 0.75s;
	z-index: 10;
	transform-origin: top left;
	margin-left: -20px;
}
.section-opener:hover {
	cursor: pointer;
}
.section-opener.open {
	background-color: #666;
	color: #ffffff;
	transform: rotate(90deg);
	transform-origin: top left;
	margin-left: -10px;
}
</style>



