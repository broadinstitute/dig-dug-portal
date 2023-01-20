<template>
	<div>
		<input
			type="text"
			class="form-control input-default"
			v-model="searchKey"
		/>
		<div class="dr-phenotypes-list" v-if="searchKey.length > 2">
			<template v-for="item in phenotypeOptions">
				<input
					type="checkbox"
					:id="item.name"
					name="selectedPhenotypes"
					:value="item.name"
					:key="item.name"
				/>
				&nbsp;<label :for="item.name">
					{{ item.description }}<span>{{ item.group }}</span></label
				>
				<br />
			</template>
		</div>
	</div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

export default Vue.component("phenotype-combo", {
	props: ["phenotypes"],

	data() {
		return { searchKey: "" };
	},
	computed: {
		phenotypeOptions() {
			if (!this.phenotypes) {
				return [];
			}

			let pheListSorted = this.phenotypes.sort((a, b) => {
				if (a.group < b.group) return -1;
				if (b.group < a.group) return 1;

				if (a.description < b.description) return -1;
				if (b.description < a.description) return 1;

				return 0;
			});

			if (this.searchKey != "") {
				pheListSorted = pheListSorted.filter((p) =>
					p.description
						.toLowerCase()
						.includes(this.searchKey.toLowerCase())
				);
			}

			return pheListSorted;
		},
	},
	methods: {},
});
</script>
<style scoped>
.dr-phenotypes-list {
	position: absolute;
	width: 150%;
	background-color: #ffffff;
	border-radius: 5px;
	border: solid 1px #dddddd;
	padding: 20px;
	z-index: 10;
	box-shadow: 12px 12px 5px 1px rgba(60, 60, 60, 0.2);
	max-height: 500px;
	overflow: auto;
}
</style>
