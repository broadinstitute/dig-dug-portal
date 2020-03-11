<template>
	<div>
		<!-- <b-form-select
			v-model="selectedPhenotype"
			@change="$store.dispatch('onPhenotypeChange', selectedPhenotype)"
		>
			<b-form-select-option-group v-for="(item, index) in phenotypeOptionsGroups" :label="item.name">
				<b-form-select-option
					v-for="list in phenotypeOptionsGroups[index].groups"
					v-bind:value="list.name"
					v-bind:name="list.name"
				>{{ list.description }}</b-form-select-option>
			</b-form-select-option-group>
		</b-form-select>-->
		<!-- <v-select
			v-model="selectedPhenotype"
			@input="$store.dispatch('onPhenotypeChange', selectedPhenotype);"
			label="description"
			:options="phenotypeOptions"
		></v-select>-->
		<vue-typeahead-bootstrap
			:data="phenotypeOptions"
			:serializer="s => s.description"
			@hit="$store.dispatch('onPhenotypeChange', $event.name)"
		></vue-typeahead-bootstrap>
	</div>
</template>

<script>
import Vue from "vue";
import _ from "lodash";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import vSelect from "vue-select";

Vue.component("v-select", vSelect);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

import "vue-select/dist/vue-select.css";

export default Vue.component("phenotype-selectpicker", {
	props: ["phenotypes"],

	data() {
		return {
			selectedPhenotype: null
		};
	},
	computed: {
		phenotypeOptions() {
			return this.phenotypes.sort((a, b) => {
				if (a.group < b.group) return -1;
				if (b.group < a.group) return 1;

				if (a.description < b.description) return -1;
				if (b.description < a.description) return 1;

				return 0;
			});
		}
		// phenotypeOptionsGroups() {
		// 	return _.chain(this.phenotypeOptions)
		// 		.groupBy("group")
		// 		.map((key, value) => ({ groups: key, name: value }))
		// 		.value();
		// }
	}
});
</script>
