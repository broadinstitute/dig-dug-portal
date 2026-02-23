<template>
	<div class="patterns">
		<div v-for="pattern, index in patterns"
			:class='`pattern-bubble bubble-${selectedPattern === pattern ? "on" : "off"}`'>
			 <div v-if="centroidsMap !== null" class="pattern-option">
				<abstract-line-plot :plotId="pattern" :plotData="centroidsMap[pattern]"></abstract-line-plot>
				<button class="btn btn-secondary btn-sm" :id="pattern" @click="viewPattern(pattern)">Pattern {{ index }}</button>
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
			this.selectedPattern = pattern;
			this.$emit("patternSelected", pattern)
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
	display: inline;
}
.pattern-bubble {
	display: inline;
}
.pattern-option {
	display: inline-block;
	text-align: center;
	margin: 10px;
}
.pattern-bubble button {
    border: 0px;
}
.bubble-on button {
    background-color: #ff6c02;
}
</style>



