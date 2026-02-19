<template>
	<div>
		Pattern selector coming soon
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
			centroids: null
		};
	},
	mounted: async function () {
		if (!keyParams.datasetid){
			console.log("No dataset named here")
			return;
		}
		const newCentroids = await getCentroids(keyParams.datasetid);
		console.log(JSON.stringify(newCentroids));
	},
	computed: {},
	watch: {
	},
	methods: {
	},
});
</script>

<style scoped>
</style>



