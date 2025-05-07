<template>
	<div>
		{{ subSectionData }}	
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

export default Vue.component("research-llm-options-section", {
	props: ["subSectionData"],
	components: {
	},
	data() {
		return {
			currentData:null,
		};
	},
	modules: {
	},
	created() {
		this.currentData = this.subSectionData;

	},
	mounted() {
		
	},
	computed: {
		
	},
	watch: {
		
	},
	methods: {},
});

$(function () { });
</script>
<style scoped>

</style>
