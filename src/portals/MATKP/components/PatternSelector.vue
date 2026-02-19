<template>
	<div class="patterns">
		<div v-for="pattern in patterns"
			:class='`pattern-bubble bubble-${selectedPattern === pattern ? "on" : "off"}`'>
			<button class="btn btn-secondary btn-sm" :id="pattern" @click="viewPattern(pattern)">{{ pattern }}</button>
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
import * as d3 from 'd3';

Vue.use(BootstrapVueIcons);

export default Vue.component("pattern-selector", {
	props: [],
	components: {
		TimeSeriesLinePlot
	},
	data() {
		return {
			centroids: null,
			selectedPattern: ""
		};
	},
	mounted: async function () {
		if (!keyParams.datasetid){
			console.log("No dataset named here")
			return;
		}
		const newCentroids = await getCentroids(keyParams.datasetid);
		this.centroids = newCentroids;
	},
	computed: {
		patterns (){
			return this.centroids === null 
				? [] 
				: this.centroids.map(c => c.pattern).filter(p => p !== '');
		}
	},
	watch: {
	},
	methods: {
		viewPattern(pattern){
			this.selectedPattern = pattern;
			this.$emit("patternSelected", pattern)
		}
	},
});
</script>

<style scoped>
.pattern-bubble {
	display: inline;
}
.pattern-bubble button {
    border: 0px;
	margin: 5px;
}
.bubble-on button {
    background-color: #ff6c02;
}
</style>



