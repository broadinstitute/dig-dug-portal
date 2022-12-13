<template>
	<div class="card-body"></div>
</template>
        
<script>
import Vue from "vue";
import "bootstrap/dist/css/bootstrap.css";
import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";

import TooltipDocumentation from "@/components/TooltipDocumentation.vue";

export default Vue.component("hugecal-score-section", {
	props: [],
	data() {
		return {};
	},
	components: { TooltipDocumentation },
	computed: {},
	methods: {},
});
</script>

<style scoped>
</style>
