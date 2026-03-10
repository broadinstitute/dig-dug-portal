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
				:utils="utils"
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
				:utils="utils"
			></research-genes-track>
			<div
				v-if="pkgConfig.viewers.includes('credible sets plot') == true"
				class="section-opener"
				id="credibleSetSectionOpener"
				@click="
					showHideSection(
						$event,
						'credibleSetSection',
						'Show credible sets filter',
						'credibleSetSectionOpener',
						'Hide filter'
					)
				"
			>
				Hide filter
			</div>

			<!--removing ' hidden-svg' from class -->
			<giant-credible-sets-plot
				id="credibleSetSection"
				class="svg-wrapper"
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
				:utils="utils"
			></giant-credible-sets-plot>
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
			<div
				v-if="
					pkgConfig.viewers.includes('annotations plot') == true ||
					pkgConfig.viewers.includes('annotations plot v2') == true
				"
				class="section-opener"
				id="annotationSectionOpener"
				@click="
					showHideSection(
						$event,
						'annotationSection',
						'Show annotations filter',
						'annotationSectionOpener',
						'Hide filter'
					)
				"
			>
				Hide filter
			</div>
			<!--removing ' hidden-svg' from class -->
			<research-annotations-plot
				id="annotationSection"
				class="svg-wrapper"
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
				:utils="utils"
			></research-annotations-plot>

			<research-annotations-plot-v2
				id="annotationSection"
				class="svg-wrapper"
				v-if="pkgConfig.viewers.includes('annotations plot v2') == true"
				:region="$store.state.searchingRegion"
				:phenotype="$store.state.searchingPhenotype"
				:ancestry="$store.state.searchingAncestry"
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
				:searchParameters="this.$store.state.searchParameters"
				:searchParametersArr="this.$store.state.searchParametersArr"
				ref="annotationsRef"
				:utils="utils"
			></research-annotations-plot-v2>
			<div
				v-if="
					pkgConfig.viewers.includes('biosamples plot') == true &&
					this.$store.state.pkgDataSelected.filter(
						(s) => s.type == 'Annotation'
					).length > 0 &&
					this.$store.state.pkgDataSelected.filter(
						(s) => s.type == 'Tissue'
					).length > 0
				"
				class="section-opener"
				id="biosamplesSectionOpener"
				@click="
					showHideSection(
						$event,
						'biosamplesSection',
						'Show biosamples filter',
						'biosamplesSectionOpener',
						'Hide filter'
					)
				"
			>
				Hide filter
			</div>
			<!--removing ' hidden-svg' from class -->
			<research-biosamples-plot
				id="biosamplesSection"
				class="svg-wrapper"
				v-if="pkgConfig.viewers.includes('biosamples plot') == true"
				:region="$store.state.searchingRegion"
				:phenotype="$store.state.searchingPhenotype"
				:renderConfig="pkgConfig['biosamples viewer']"
				:plotMargin="plotMargin"
				:compareGroupColors="colors.bold"
				:searchType="this.$store.state.dataComparison"
				:plotData="$store.state.filteredData"
				:pkgData="pkgData"
				:pkgDataSelected="this.$store.state.pkgDataSelected"
				:regionZoom="regionZoom"
				:regionViewArea="regionViewArea"
				:sharedPlotXpos="sharedPlotXpos"
				ref="biosamplesRef"
				:utils="utils"
			></research-biosamples-plot>

			<div
				v-if="pkgConfig.viewers.includes('gene-links plot') == true"
				class="section-opener"
				id="geneLinksSectionOpener"
				@click="
					showHideSection(
						$event,
						'geneLinksSection',
						'Show gene-links filter',
						'geneLinksSectionOpener',
						'Hide filter'
					)
				"
			>
				Hide filter
			</div>
			<!--removing ' hidden-svg' from class -->
			<research-gene-links-plot
				id="geneLinksSection"
				class="svg-wrapper"
				v-if="pkgConfig.viewers.includes('gene-links plot') == true"
				:region="$store.state.searchingRegion"
				:phenotype="$store.state.searchingPhenotype"
				:plotMargin="plotMargin"
				:methodsColors="colors.bold"
				:renderConfig="pkgConfig['gene-links viewer']"
				:dataComparison="this.$store.state.dataComparison"
				:plotData="$store.state.filteredData"
				:pkgData="pkgData"
				:pkgDataSelected="pkgDataSelected"
				:regionZoom="regionZoom"
				:regionViewArea="regionViewArea"
				:utils="utils"
			></research-gene-links-plot>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
//import uiUtils from "@/utils/uiUtils";

import { BootstrapVueIcons } from "bootstrap-vue";

import ResearchRegionPlot from "@/components/researchPortal/ResearchRegionPlot.vue";
import ResearchGenesTrack from "@/components/researchPortal/ResearchGenesTrack.vue";
import ResearchBiosamplePlot from "@/components/researchPortal/ResearchBiosamplePlot.vue";
import ResearchAnnotationsPlot from "@/components/researchPortal/ResearchAnnotationsPlot.vue";
import ResearchAnnotationsPlotV2 from "@/components/researchPortal/ResearchAnnotationsPlotV2.vue";
import GiantCredibleSets from "@/components/researchPortal/GiantCredibleSets.vue";
import ResearchGeneLinks from "@/components/researchPortal/ResearchGeneLinks.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("giant-gem-pkg", {
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
		"utils"
	],
	data() {
		return {};
	},
	modules: {
		//uiUtils,
	},
	components: {
		ResearchRegionPlot,
		ResearchGenesTrack,
		ResearchBiosamplePlot,
		ResearchAnnotationsPlot,
		ResearchAnnotationsPlotV2,
		GiantCredibleSets,
		ResearchGeneLinks,
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
		//...uiUtils,
		showHideSection(event, SECTION_ID, OPEN_LABEL, OPENER, LABEL) {
			let element = document.getElementById(OPENER);

			if (element.classList.contains("open")) {
				element.classList.remove("open");
				event.target.innerText = LABEL;
			} else {
				element.classList.add("open");
				event.target.innerText = OPEN_LABEL;
			}

			this.utils.uiUtils.showHideSvg(SECTION_ID);
		},
	},
});
</script>

<style>
.section-opener {
	/*position: relative;
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
	margin-left: -20px;*/
	position: absolute;
	right: 15px;
	margin-top: -5px;
	font-size: 12px;
	font-weight: bold;
	padding: 0px 10px;
	border: solid 1px #cccccc;
	border-radius: 10px;
	background-color: #eeeeee;
	color: #333;
	margin-bottom: 10px;
	width: auto;
	transition: all 0.75s;
	z-index: 10;
}
.section-opener:hover {
	cursor: pointer;
}
.section-opener.open {
	background-color: #666;
	color: #ffffff;
	/*transform: rotate(90deg);
	transform-origin: top left;
	margin-left: -10px;*/
}
</style>