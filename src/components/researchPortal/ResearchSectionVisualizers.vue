<template>
	<div class="col-md-12">
		<div
			class="plot-legend"
			v-html="plotLegend"
		></div>
		<!--m_plot-->
		<research-m-plot
			v-if="plotConfig != null && plotConfig['type'] == 'manhattan plot'"
			:plotData="plotData"
			:renderConfig="plotConfig"
			:utils="utils"
		></research-m-plot>
		<!--'mbm_plot-->
		<research-m-bitmap-plot
			v-if="plotConfig != null && plotConfig['type'] == 'manhattan bitmap plot'"
			:plotData="plotData"
			:renderConfig="plotConfig"
			:dataComparisonConfig="null"
			:compareGroupColors="null"
			:utils="utils"
		></research-m-bitmap-plot>
		<!-- PheWAS plot-->
		<research-phewas-plot
			v-if="plotConfig != null && plotConfig['type'] == 'phewas plot'"
			:phenotypesData="plotData"
			:phenotypeMap="phenotypeMap"
			:colors="colors.extraBold"
			:plotMargin="plotMargin"
			:renderConfig="plotConfig"
			:pkgData="null"
			:pkgDataSelected="null"
			:canvasId="sectionId"
			:utils="utils"
		></research-phewas-plot>
		<!-- Heatmap -->
		<research-heatmap
			v-if="plotConfig != null && plotConfig['type'] == 'heat map'"
			:heatmapData="plotData"
			:renderConfig="plotConfig"
			:utils="utils"
		></research-heatmap>
		<!-- volcano_plot -->
		<research-volcano-plot
			v-if="plotConfig != null && plotConfig['type'] == 'volcano plot'"
			:plotData="plotData"
			:renderConfig="plotConfig"
			:utils="utils"
		></research-volcano-plot>
		<!-- region_plot -->
		<research-region-plot
			v-if="!!plotConfig && plotConfig['type'] == 'region plot'"
			:plotData="plotData"
			:renderConfig="plotConfig"
			:searchParameters="null"
			:dataComparisonConfig="null"
			:region="utils.keyParams.region"
			:plotMargin="plotMargin"
			:compareGroupColors="colors.moderate"
			:regionZoom="0"
			:regionViewArea="null"
			:pkgData="null"
			:pkgDataSelected="null"
			:isSectionPage="true"
			:utils="utils"
		></research-region-plot>
		<!-- genes track -->
		<research-genes-track
			v-if="!!plotConfig && plotConfig['type'] == 'region plot' && !!plotConfig['genes track']"
			:region="utils.keyParams.region"
			:genesData="null"
			:plotConfig="plotConfig"
			:plotType="plotConfig['type']"
			:plotMargin="plotMargin"
			:regionZoom="0"
			:regionViewArea="null"
			:utils="utils"
		></research-genes-track>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import ResearchMPlotBitmap from "@/components/researchPortal/ResearchMPlotBitmap.vue";
import ResearchMQQPlot from "@/components/researchPortal/ResearchMQQPlot.vue";
import ResearchRegionPlot from "@/components/researchPortal/ResearchRegionPlot.vue";
import ResearchScorePlot from "@/components/researchPortal/ResearchScorePlot.vue";
import ResearchGenesTrack from "@/components/researchPortal/ResearchGenesTrack.vue";
import ResearchMPlot from "@/components/researchPortal/ResearchMPlot.vue";
import ResearchVolcanoPlot from "@/components/researchPortal/ResearchVolcanoPlot.vue";
import ResearchHeatmap from "@/components/researchPortal/ResearchHeatmap";
import ResearchAnnotationsPlot from "@/components/researchPortal/ResearchAnnotationsPlot.vue";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";

export default Vue.component("research-section-visualizers", {
	props: ["plotConfig","plotData","plotLegend","phenotypeMap","plotMargin","colors","sectionId","utils"],
	components: {
		ResearchAnnotationsPlot,
		ResearchMPlotBitmap,
		ResearchMQQPlot,
		ResearchRegionPlot,
		ResearchScorePlot,
		ResearchGenesTrack,
		ResearchMPlot,
		ResearchVolcanoPlot,
		ResearchHeatmap,
		ResearchPheWAS,
    },
	data() {
		return {
		};
	},
	modules: {
	},
	mounted: function () {
	},
	computed: {
		
	},
	watch: {
		
	},
	methods: {
		
	},
});

$(function () {});
</script>
<style>
</style>
