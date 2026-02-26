<template>
	<div>
		<div>Select a pattern:</div>
		<div class="patterns">
			<div v-for="pattern, index in patterns"
				:class='`pattern-bubble bubble-${selectedPattern === pattern ? "on" : "off"}`'>
				 <div v-if="centroidsMap !== null" class="pattern-option"  @click="viewPattern(pattern)">
					<div :id="pattern">
						<abstract-line-plot :plotId="pattern" :plotData="centroidsMap[pattern]"></abstract-line-plot>
					</div>
					<div class="bubble-label">{{ index + 1 }}</div>
				 </div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVueIcons } from "bootstrap-vue";
import keyParams from "@/utils/keyParams";
import { getCentroids } from "@/portals/MATKP/utils/adipogenesis.js";
import TimeSeriesLinePlot from "@/portals/MATKP/components/TimeSeriesLinePlot.vue";
import AbstractLinePlot from "@/portals/MATKP/components/AbstractLinePlot.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("pattern-selector", {
	props: ["patterns"],
	components: {
		TimeSeriesLinePlot,
		AbstractLinePlot
	},
	data() {
		return {
			centroids: null,
			centroidsMap: null,
			selectedPattern: ""
		};
	},
	mounted: async function () {
		if (!keyParams.datasetid){
			return;
		}
		this.centroidsMap = await this.getCentroids(keyParams.datasetid);
		this.viewPattern(this.patterns[0]);
	},
	watch: {
		async datasetid(newId, oldId){
			if (newId !== oldId){
				this.centroidsMap = await this.getCentroids(newId);
			}
		},
	},
	methods: {
		viewPattern(pattern){
			this.$emit("patternSelected", pattern);
			this.selectedPattern = pattern;
		},
		async getCentroids(datasetid){
			const newCentroids = await getCentroids(keyParams.datasetid);
			this.centroids = newCentroids;
			let centroidsMap = {};
			newCentroids.forEach(c => {
				centroidsMap[c.pattern] = c;
			});
			return centroidsMap;
		}
	},
	computed: {
		datasetid(){
			return keyParams.datasetid;
		}
	}
});
</script>

<style scoped>
.patterns {
	display:flex; 
	gap: 10px;
	justify-content: space-between;
	padding:20px 10px;
	background-color: #eee;
	margin-bottom: 20px;
	overflow-x: auto;
}
.pattern-bubble {
	display: inline;
	cursor: pointer;
}
.bubble-label{
	margin: 0 5px;
	font-size: .9em;
}
.pattern-bubble:not(.bubble-on):hover .bubble-label{
	background:  #ccc;
}
.pattern-option {
	display: inline-block;
	text-align: center;
}
.pattern-bubble button {
    border: 0px;
}
.bubble-on .bubble-label{
    background: #ff6c02;
	color: white;
	font-weight: bold;
}
</style>



