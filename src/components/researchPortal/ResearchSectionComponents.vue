<template>
	<div>
		<component :is="currentComponent"
			:phenotypesInUse="phenotypesInUse"
			:utilsBox="utilsBox"
			:sectionConfigs="sectionConfigs">
		</component>
		<!-- <cfde-eco-system v-if="component='cfdeEcoSystem'"></cfde-eco-system> -->
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import cfdeEcoSystem from "@/components/researchPortal/customComponents/cfdeEcoSystem.vue";
import cfdeLanding from "@/components/researchPortal/customComponents/cfdeLanding.vue";
import cfdeLanding2 from "@/components/researchPortal/customComponents/cfdeLanding2.vue";
import cfdeMechanismDiscovery from "@/components/researchPortal/customComponents/cfdeMechanismDiscovery.vue";

export default Vue.component("research-section-components", {
	props: ["component", "phenotypesInUse", "utilsBox", "sectionConfigs"],
	components: {
		cfdeEcoSystem,
		cfdeLanding,
		cfdeLanding2,
		cfdeMechanismDiscovery
	},
	data() {
		return {
			currentComponent: null,
		};
	},
	modules: {
	},
	mounted: function () {

		switch(this.component) {
			case 'cfdeEcoSystem':
				this.currentComponent = cfdeEcoSystem;
				break;
			case 'cfdeLanding':
				this.currentComponent = cfdeLanding;
				break;
			case 'cfdeLanding2':
				this.currentComponent = cfdeLanding2;
				break;
			case 'cfdeMechanismDiscovery':
				this.currentComponent = cfdeMechanismDiscovery;
				break;
		}
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
