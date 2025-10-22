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
import cfdeValidationPlanner from "@/components/researchPortal/customComponents/cfdeValidationPlanner.vue";
import cfdeLanding2 from "@/components/researchPortal/customComponents/cfdeLanding2.vue";
import cfdeMechanismDiscovery from "@/components/researchPortal/customComponents/cfdeMechanismDiscovery.vue";
import cfdeGenesValidator from "@/components/researchPortal/customComponents/cfdeGenesValidator.vue";

export default Vue.component("research-section-components", {
	props: ["component", "phenotypesInUse", "utilsBox", "sectionConfigs"],
	components: {
		cfdeEcoSystem,
		cfdeLanding,
		cfdeValidationPlanner,
		cfdeLanding2,
		cfdeMechanismDiscovery,
		cfdeGenesValidator
	},
	data() {
		return {
			currentComponent: null,
		};
	},
	modules: {
	},
	mounted: function () {
console.log('this.component', this.component);
		switch(this.component) {
			case 'cfdeEcoSystem':
				this.currentComponent = cfdeEcoSystem;
				break;
			case 'cfdeLanding':
				this.currentComponent = cfdeLanding;
				break;
			case 'cfdeValidationPlanner':
				this.currentComponent = cfdeValidationPlanner;
				break;
			case 'cfdeLanding2':
				this.currentComponent = cfdeLanding2;
				break;
			case 'cfdeMechanismDiscovery':
				this.currentComponent = cfdeMechanismDiscovery;
				break;
			case 'cfdeGenesValidator':
				this.currentComponent = cfdeGenesValidator;
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
