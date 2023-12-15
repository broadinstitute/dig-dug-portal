<template>
	<div class="col-md-12">
		<div
			class="plot-legend"
			v-html="plotLegend"
		></div>
		<!--m_plot-->
		<!--<research-m-plot
			v-if="plotConfig != null && plotConfig['type'] == 'manhattan plot'"
			:plotData="plotData"
			:renderConfig="plotConfig"
			:utils="utils"
			:sectionId="sectionId"
		></research-m-plot>-->
		<!--'mbm_plot-->
		<research-m-bitmap-plot
			v-if="plotConfig != null && plotConfig['type'] == 'manhattan bitmap plot'"
			:plotData="plotData"
			:renderConfig="plotConfig"
			:dataComparisonConfig="dataComparisonConfig"
			:compareGroupColors="colors.moderate"
			:utils="utils"
			:sectionId="sectionId"
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
			:sectionId="sectionId"
		></research-heatmap>
		<!-- volcano_plot -->
		<research-volcano-plot
			v-if="plotConfig != null && plotConfig['type'] == 'volcano plot'"
			:plotData="plotData"
			:renderConfig="plotConfig"
			:utils="utils"
			:sectionId="sectionId"
		></research-volcano-plot>

		<research-m-qq-plot
			v-if="
				plotConfig != null && plotConfig['type'] == 'manhattan qq plot'
			"
			:plotData="plotData"
			:renderConfig="plotConfig"
			:utils="utils"
			:sectionId="sectionId"
		></research-m-qq-plot>
		<!-- region_plot -->
		<multi-region-plot
			v-if="!!plotConfig && plotConfig['type'] == 'region plot' && !!region"
			:plotData="plotData"
			:renderConfig="plotConfig"
			:searchParameters="searchParameters"
			:dataComparisonConfig="dataComparisonConfig"
			:region="region"
			:plotMargin="plotMargin"
			:compareGroupColors="colors.moderate"
			:regionZoom="regionZoom"
			:regionViewArea="regionViewArea"
			:pkgData="null"
			:pkgDataSelected="null"
			:isSectionPage="true"
			:sectionId="sectionId"
			:utils="utils"
			:starItems="starItems"
			@on-star="starColumn"
		></multi-region-plot>
		<!-- genes track -->
		<multi-genes-track
			v-if="!!plotConfig && plotConfig['type'] == 'region plot' && !!plotConfig['genes track'] && !!region"
			:region="region"
			:genesData="null"
			:plotConfig="plotConfig"
			:plotType="plotConfig['type']"
			:plotMargin="plotMargin"
			:regionZoom="regionZoom"
			:regionViewArea="regionViewArea"
			:utils="utils"
			:sectionId="sectionId"
			:starItems="starItems"
		></multi-genes-track>
		<!-- general track -->
		<research-region-track
			v-if="!!plotConfig && plotConfig['type'] == 'region track' && !!region"
			:sectionId="sectionId"
			:plotConfig="plotConfig"
			:plotData="plotData"
			:dataComparisonConfig="dataComparisonConfig"
			:region="region"
			:regionZoom="regionZoom"
			:regionViewArea="regionViewArea"
			:colors="colors"
			:utils="utils"
			:plotMargin="plotMargin"
			:starItems="starItems"
		></research-region-track>
		<!-- scatter plot -->
		<research-scatter-plot
			v-if="!!plotConfig && plotConfig['type'] == 'scatter plot'"
			:plotData="plotData"
			:renderConfig="plotConfig"
			:searchParameters="searchParameters"
			:dataComparisonConfig="dataComparisonConfig"
			:plotMargin="plotMargin"
			:compareGroupColors="colors.moderate"
			:isSectionPage="true"
			:sectionId="sectionId"
			:utils="utils"
		></research-scatter-plot>
		<!-- Annotations plot-->
		<!--<research-multi-annotations-plot
			:region="region"
			:phenotype="utils.keyParams.phenotype"
			:ancestry=""
			:renderConfig="plotConfig"
			:plotMargin="plotMargin"
			:compareGroupColors="colors.moderate"
			:dataComparison=""
			:plotData="plotData"
			:pkgData="null"
			:pkgDataSelected=""
			:regionZoom=""
			:regionViewArea=""
			:searchParameters=""
			:searchParametersArr=""
			:utils=""
			></research-multi-annotations-plot>-->
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import ResearchMPlotBitmap from "@/components/researchPortal/ResearchMPlotBitmap.vue";
import ResearchMQQPlot from "@/components/researchPortal/ResearchMQQPlot.vue";
import ResearchRegionPlot from "@/components/researchPortal/multiSectionComponents/MultiRegionPlot.vue";
import ResearchScorePlot from "@/components/researchPortal/ResearchScorePlot.vue";
import ResearchGenesTrack from "@/components/researchPortal/multiSectionComponents/MultiGenesTrack.vue";
//import ResearchMPlot from "@/components/researchPortal/ResearchMPlot.vue";
import ResearchVolcanoPlot from "@/components/researchPortal/ResearchVolcanoPlot.vue";
import ResearchHeatmap from "@/components/researchPortal/ResearchHeatmap";
import ResearchAnnotationsPlot from "@/components/researchPortal/ResearchMultiAnnotationsPlot.vue";
import ResearchScatterPlot from "@/components/researchPortal/ResearchScatterPlot.vue";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import ResearchRegionTrack from "@/components/researchPortal/ResearchRegionTrack.vue";

export default Vue.component("research-section-visualizers", {
	props: ["plotConfig","plotData","plotLegend","phenotypeMap","plotMargin","colors",
		"sectionId","utils","dataComparisonConfig","searchParameters","regionZoom","regionViewArea","starItems","region"],
	components: {
		ResearchAnnotationsPlot,
		ResearchScatterPlot,
		ResearchMPlotBitmap,
		ResearchMQQPlot,
		ResearchRegionPlot,
		ResearchScorePlot,
		ResearchGenesTrack,
		//ResearchMPlot,
		ResearchVolcanoPlot,
		ResearchHeatmap,
		ResearchPheWAS,
		ResearchRegionTrack
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
		groupedPlotData() {
			if(!!this.plotData){
				let grouped = {};
				this.plotData.map(d=>{
					grouped[this.dataComparisonConfig["key field"]] = d;
				});
				return grouped;
			}  else {
				return null
			}
			
		}
	},
	watch: {
	},
	methods: {
		starColumn(ARRAY) {
			this.$emit('on-star', ARRAY);
		},
	},
});

$(function () {});
</script>
<style>
canvas {
	border: solid 1px #fff;
}
</style>
