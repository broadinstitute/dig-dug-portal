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
						'annotationSectionOpener',
						'Filter associated variants by annotations'
					)
				"
			>
				Filter associated variants by annotations
			</div>

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

			<research-annotations-plot-v2
				id="annotationSection"
				class="svg-wrapper hidden-svg"
				v-if="pkgConfig.viewers.includes('annotations plot v2') == true"
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
			></research-annotations-plot-v2>
			<div
				v-if="pkgConfig.viewers.includes('biosamples plot') == true"
				class="section-opener"
				id="biosamplesSectionOpener"
				@click="
					showHideSection(
						$event,
						'biosamplesSection',
						'biosamplesSectionOpener',
						'Filter associated variants by biosamples'
					)
				"
			>
				Filter associated variants by biosamples
			</div>

			<research-biosamples-plot
				id="biosamplesSection"
				class="svg-wrapper hidden-svg"
				v-if="pkgConfig.viewers.includes('biosamples plot') == true"
				:region="$store.state.searchingRegion"
				:phenotype="$store.state.searchingPhenotype"
				:renderConfig="pkgConfig['biosamples viewer']"
				:plotMargin="plotMargin"
				:compareGroupColors="colors.bold"
				:dataComparison="this.$store.state.dataComparison"
				:plotData="$store.state.filteredData"
				:pkgData="pkgData"
				:pkgDataSelected="this.$store.state.pkgDataSelected"
				:regionZoom="regionZoom"
				:regionViewArea="regionViewArea"
				:sharedPlotXpos="sharedPlotXpos"
				ref="biosamplesRef"
			></research-biosamples-plot>

			<div
				v-if="pkgConfig.viewers.includes('gene-links plot') == true"
				class="section-opener"
				id="geneLinksSectionOpener"
				@click="
					showHideSection(
						$event,
						'geneLinksSection',
						'geneLinksSectionOpener',
						'Filter associated variants by linked genes'
					)
				"
			>
				Filter associated variants by linked genes
			</div>

			<research-gene-links-plot
				id="geneLinksSection"
				class="svg-wrapper hidden-svg"
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
			></research-gene-links-plot>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";

import { BootstrapVueIcons } from "bootstrap-vue";

import ResearchRegionPlot from "@/components/researchPortal/ResearchRegionPlot.vue";
import ResearchGenesTrack from "@/components/researchPortal/ResearchGenesTrack.vue";
import ResearchBiosamplePlot from "@/components/researchPortal/ResearchBiosamplePlot.vue";
import ResearchAnnotationsPlot from "@/components/researchPortal/ResearchAnnotationsPlot.vue";
import ResearchAnnotationsPlotV2 from "@/components/researchPortal/ResearchAnnotationsPlotV2.vue";
import ResearchCredibleSets from "@/components/researchPortal/ResearchCredibleSets.vue";
import ResearchGeneLinks from "@/components/researchPortal/ResearchGeneLinks.vue";

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
		ResearchBiosamplePlot,
		ResearchAnnotationsPlot,
		ResearchAnnotationsPlotV2,
		ResearchCredibleSets,
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



