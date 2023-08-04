<template>
	<div>
		<div
			class="plot-legend"
			v-html="plotConfig.plotLegend"
		></div>
		<!--v-if="$parent.plotType == 'm_plot'"-->
		<research-m-plot
			v-if="plotConfig != null &&
				plotConfig['type'] ==
				'manhattan plot'
				"
			:plotData="plotData"
			:renderConfig="plotConfig"
		></research-m-plot>
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
	props: ["plotConfig","plotData"],
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
