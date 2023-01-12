<template>
	<div>
		<b-table small :fields="fields" :items="items" responsive="sm">
			<template #head(huGeScore)="data">
				<span style="color: #3fb54a">{{ data.label }}</span>
			</template>

			<template slot="bottom-row" slot-scope="data">
				<td style="white-space: nowrap">Set prior</td>
				<td>
					<input
						v-model.number="suggestedPriorinput"
						type="number"
						id="prior_input"
						@keyup.enter="addToItems($event)"
					/>
				</td>
			</template>
			<template #cell(removeItem)="data">
				<b-button
					style="
						padding: 0;
						border: none;
						background: none;
						cursor: pointer;
					"
					v-on:click="removeItems(data.item)"
				>
					<span style="color: green; background: white">
						<b-icon-x-circle-fill></b-icon-x-circle-fill>
					</span>
				</b-button>
			</template>
		</b-table>
	</div>
</template>
        
<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Autocomplete from "@/components/Autocomplete.vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import { match } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);
Vue.component("autocomplete", Autocomplete);

export default Vue.component("hugecal-table", {
	props: {
		hugeScore: {
			type: Number,
			required: true,
		},
	},

	data() {
		return {
			suggestedPriorinput: "Prior",
			// resetflag: { default: false },
			fields: [
				{ key: "prefix", label: "" },
				{ key: "suggestedPrior", label: "Suggested prior" },

				{
					key: "posteriorProbability",
					label: "Posterior probability",
					formatter: this.pValueFormatter,
				},
				{
					key: "removeItem",
					label: "",
				},
			],
			items: [
				{
					suggestedPrior: 0.2,

					posteriorProbability: this.posteriorProbability(0.2),
				},
				{
					suggestedPrior: 0.05,

					posteriorProbability: this.posteriorProbability(0.05),
				},
			],
			universalSuggestedPriorList: [0.2, 0.05],
		};
	},
	computed: {},
	methods: {
		addToItems(event) {
			this.universalSuggestedPriorList.push(this.suggestedPriorinput);
			/*console.log(
                "updated suggested list after adding",
                this.universalSuggestedPriorList
            );*/
			var my_object = {
				suggestedPrior: this.suggestedPriorinput,

				posteriorProbability: this.posteriorProbability(
					this.suggestedPriorinput
				),
			};
			this.items.push(my_object);
			this.$store.dispatch(
				"updatedUniversalSuggestedPriorList",
				this.universalSuggestedPriorList
			);
		},
		removeItems(item) {
			this.items.pop(item);
			this.universalSuggestedPriorList.pop(item);
			/*console.log(
                "updated suggestedPrior after removing",
                this.universalSuggestedPriorList
            );*/
			this.$store.dispatch(
				"updatedUniversalSuggestedPriorList",
				this.universalSuggestedPriorList
			);
		},

		pValueFormatter(pValue) {
			return Formatters.pValueFormatter(pValue);
		},
		posteriorProbability(p) {
			let bayes_factor = this.hugeScore; //combined bayes factor
			let f5 = p / (1 - p);
			let p0 = bayes_factor * f5;
			let ppa = p0 / (1 + p0);
			return ppa;
		},
	},
});
</script>

<style scoped>
.enable {
	background-color: rgb(204, 241, 241);
}
.disable {
	background-color: rgb(114, 129, 129);
}
</style>
