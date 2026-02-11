<template>
    <div class="row">
        <div class="col-md-9">
            <time-series-heatmap
                :heatmapData="heatmapData"
                :minScore="minScore"
                :maxScore="maxScore"
                :utils="utilsBox"
                sectionId="time-series-heatmap"
                :zoomedIn="zoomedIn"
                :activeTab="activeTab"
                :avgRep="avgRep">
            </time-series-heatmap>
        </div>
        <div class="col-md-3">
            Line plot goes here
        </div>
    </div>
</template>
<script>
import Vue from "vue";
export default Vue.component("time-series-display", {
	props: ["heatmapData","utils","sectionId", "zoomedIn", "activeTab", "filter", "avgRep", "minScore", "maxScore"],
	data() {
		return {};
	},
});
</script>