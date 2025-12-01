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
import cfdeDesign from "@/components/researchPortal/customComponents/cfdeDesign.vue";
import cfdeLanding2 from "@/components/researchPortal/customComponents/cfdeLanding2.vue";
import cfdeMechanismDiscovery from "@/components/researchPortal/customComponents/cfdeMechanismDiscovery.vue";
import kpReveal from "@/components/researchPortal/customComponents/kpReveal.vue";
import cfdeExplore from "@/components/researchPortal/customComponents/cfdeExplore.vue";

export default Vue.component("research-section-components", {
	props: ["component", "phenotypesInUse", "utilsBox", "sectionConfigs"],
	components: {
		kpReveal,
		cfdeEcoSystem,
		cfdeLanding,
		cfdeDesign,
		cfdeLanding2,
		cfdeMechanismDiscovery,
		cfdeExplore
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
			case 'kpReveal':
				this.currentComponent = kpReveal;
				break;
			case 'cfdeValidationPlanner'://remove after update
				this.currentComponent = cfdeDesign;
				break;
			case 'cfdeDesign':
				this.currentComponent = cfdeDesign;
				break;
			case 'cfdeLanding2':
				this.currentComponent = cfdeLanding2;
				break;
			case 'cfdeMechanismDiscovery':
				this.currentComponent = cfdeMechanismDiscovery;
				break;
			case 'cfdeGenesValidator'://remove after update
				this.currentComponent = cfdeExplore;
				break;
			case 'cfdeExplore':
				this.currentComponent = cfdeExplore;
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
