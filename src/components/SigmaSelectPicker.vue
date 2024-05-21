<template>
	<select v-model="sigma">
		<option value="sigma0">0</option>
		<option value="sigma2">2</option>
		<option value="sigma4">4</option>
	</select>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import keyParams from "@/utils/keyParams";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);


export default Vue.component("sigma-selectpicker", {
	props: [],
	data() {
		return {
			sigma: keyParams.sigma
		};
	},
	computed: {
		keyParamsSigma(){ return keyParams.sigma; }
	},
	watch: {
		sigma(newSigma){
			this.$store.state.sigmaToQuery = newSigma;
			this.$emit("onSigmaChange", newSigma);
		},
		keyParamsSigma(newKey){
			// On some pages, keyParams.sigma is set after initial page load.
			// This captures that.
			if (this.sigma === null){
				this.sigma = newKey;
			}
		}
	}
});
</script>
