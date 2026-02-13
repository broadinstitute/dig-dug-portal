<template>
    <div class="row">
        <div class="col-md-9">
            <time-series-heatmap
                :heatmapData="heatmapData"
                :minScore="minScore"
                :maxScore="maxScore"
                :utils="utils"
                :sectionId="sectionId"
                :zoomedIn="zoomedIn"
                :avgRep="avgRep"
                :rowNorm="rowNorm"
                @hover="d => changeTranscript(d)"
                @dataFiltered="d => getFilteredData(d)">
            </time-series-heatmap>
        </div>
        <div class="col-md-3 line-plot-wrapper">
            <div v-if="transcript.length > 0">
                <div><strong>{{rowName}}</strong></div>
                <div>{{columnName}}</div>
			    <div><strong>score: </strong>{{scoreVal}}</div>
                <time-series-line-plot
                    v-if="filteredData.length > 0"
                    :plotData="filteredData"
                    :utils="utils"
                    :tx="transcript"
                    :config="linePlotConfig"
                    :plotId="`${sectionId}_line`">
                </time-series-line-plot>
            </div>
            <div v-else>Hover over a cell to view individual time-point information.</div>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
export default Vue.component("time-series-display", {
	props: ["heatmapData","utils","sectionId", "zoomedIn", "filter", "avgRep", "minScore", "maxScore", "rowNorm"],
	data() {
		return {
            filteredData: [],
            transcript: [],
            rowName: "",
            columnName: "",
            scoreVal: ""
        };
	},
    computed: {
        linePlotConfig(){
            return {
                xField: "days",
                xAxisLabel: "Time (days)",
                xMin: -2, // TODO calculate this dynamically rather than hardcoding it
                xMax: 7,
                yField: "score",
                yAxisLabel: "",
                yMin: this.minScore,
                yMax: this.maxScore,
                dotKey: "identifier",
                hoverBoxPosition: "both",
                hoverFields: [
                    {key: "transcript_id", label: "Transcript"},
                    {key: "days", label: "Day"},
                ],
            }
        },
    },
    methods: {
        changeTranscript(data){
            this.transcript = [data.transcript];
            this.rowName = data.rowName;
            this.columnName = data.columnName;
            this.scoreVal = data.scoreVal;
        },
        getFilteredData(data){
            this.filteredData = data;
        }
    }
});
</script>
<style scoped>
.line-plot-wrapper{
    margin-top: 30px;
    vertical-align: bottom;
}
</style>