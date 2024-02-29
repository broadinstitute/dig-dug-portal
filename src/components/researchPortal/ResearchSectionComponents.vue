<template>
	<div>
		<cfde-eco-system v-if="component='cfdeEcoSystem'"></cfde-eco-system>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import cfdeEcoSystem from "@/components/researchPortal/customComponents/cfdeEcoSystem.vue";

export default Vue.component("research-section-components", {
	props: ["component"],
	components: {
		cfdeEcoSystem
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

$(function () { });
</script>
<style>

</style>
