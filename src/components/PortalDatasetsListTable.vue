<template>
	<div>
		<h3 style="margin-top: 30px" v-if="datasetsListNew.length > 0">
			New Datasets
			<small class="datasets-list-header-small"
				>(Click datasets for description)</small
			>
		</h3>
		<div class="new datasets-list-table" v-if="datasetsListNew.length > 0">
			<table class="table table-hover table-sm">
				<thead>
					<tr>
						<th
							class="column name"
							v-on:click="setSortKey('description')"
						>
							Dataset
						</th>
						<th
							class="column access"
							v-on:click="setSortKey('access')"
						>
							Access
						</th>
						<th
							class="column samples"
							v-on:click="setSortKey('subjects')"
						>
							Samples
						</th>
						<th
							class="column ancestry"
							v-on:click="setSortKey('ancestry_name')"
						>
							Ancestry
						</th>
						<th
							class="column type"
							v-on:click="setSortKey('data_type')"
						>
							Technology
						</th>
						<th
							class="column disease-group"
							v-if="
								diseaseGroup.name == 'md' ||
								diseaseGroup.name == 'a2f'
							"
						>
							Contributing community
						</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(row, i) in datasetsListNew">
						<td class="column name">
							<a :href="'/dinspector.html?dataset=' + row.name">{{
								row.description
							}}</a>
						</td>
						<td class="column access">
							<span :class="row.access">{{ row.access }}</span>
						</td>
						<td class="column samples">{{ row.subjects }}</td>
						<td class="column ancestry">
							{{ row.ancestry_name }}
						</td>
						<td class="column type">{{ row.data_type }}</td>
						<td
							class="column disease-group"
							v-if="
								diseaseGroup.name == 'md' ||
								diseaseGroup.name == 'a2f'
							"
						>
							<span
								class="community-icon"
								:class="row.community"
								:title="row.community"
								>&nbsp;</span
							>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<h3 v-if="datasetsListNotNew.length > 0">
			Datasets
			<small class="datasets-list-header-small"
				>(Click datasets for description)</small
			>
		</h3>
		<div class="datasets-list-table" v-if="datasetsListNotNew.length > 0">
			<table class="table table-hover table-sm">
				<thead>
					<tr>
						<th
							class="column name"
							v-on:click="setSortKey('description')"
						>
							Dataset
						</th>
						<th
							class="column access"
							v-on:click="setSortKey('access')"
						>
							Access
						</th>
						<th
							class="column samples"
							v-on:click="setSortKey('subjects')"
						>
							Samples
						</th>
						<th
							class="column ancestry"
							v-on:click="setSortKey('ancestry_name')"
						>
							Ancestry
						</th>
						<th
							class="column type"
							v-on:click="setSortKey('data_type')"
						>
							Technology
						</th>
						<th
							class="column disease-group"
							v-if="
								diseaseGroup.name == 'md' ||
								diseaseGroup.name == 'a2f'
							"
						>
							Contributing community
						</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(row, i) in datasetsListNotNew">
						<td class="column name">
							<a :href="'/dinspector.html?dataset=' + row.name">{{
								row.description
							}}</a>
						</td>
						<td class="column access">
							<span :class="row.access">{{ row.access }}</span>
						</td>
						<td class="column samples">{{ row.subjects }}</td>
						<td class="column ancestry">
							{{ row.ancestry_name }}
						</td>
						<td class="column type">{{ row.data_type }}</td>
						<td
							class="column disease-group"
							v-if="
								diseaseGroup.name == 'md' ||
								diseaseGroup.name == 'a2f'
							"
						>
							<span
								class="community-icon"
								:class="row.community"
								:title="row.community"
								>&nbsp;</span
							>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import sortUtils from "@/utils/sortUtils";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("portal-datasets-list-table", {
	props: [
		"diseaseGroups",
		"phenotypes",
		"diseaseGroup",
		"datasetsList",
		"filter",
	],
	modules: {
		...sortUtils,
	},
	data() {
		return {
			isAtive: false,
			selectedPhenotypeGroup: null,
			selectedPhenotype: null,
			selectedDatatype: null,
			selectedDiseaseGroup: null,
			sortKey: "subjects",
			ascending: false,
		};
	},
	computed: {
		datasetsListNew: function () {
			return this.getDatasetsList(true);
		},
		datasetsListNotNew: function () {
			return this.getDatasetsList(false);
		},
	},
	methods: {
		getDatasetsList(FEATURED) {
			let newDatasets = this.datasetsList.filter(
				(d) => d.new == FEATURED
			);

			let isNumeric = this.sortKey == "subjects" ? true : false;

			return sortUtils.sort(
				newDatasets,
				this.sortKey,
				isNumeric,
				this.ascending
			);
		},
		setSeletedDiseaseGroup(diseaseGroup) {
			this.selectedDiseaseGroup =
				diseaseGroup == "md" ? null : diseaseGroup;
		},
		setSeletedDatatype(datatype) {
			this.selectedDatatype = datatype == "Show all" ? null : datatype;
		},
		setSeletedPhenotypeGroup(phenotypeGroup) {
			this.selectedPhenotypeGroup =
				phenotypeGroup == "Show all" ? null : phenotypeGroup;

			this.selectedPhenotype = null;
		},
		setSeletedPhenotype(phenotype) {
			this.selectedPhenotype = phenotype;
		},
		setSortKey(key) {
			this.sortKey = key;
			this.ascending = this.ascending == true ? false : true;
		},
	},
});
</script>

<style>
@import url("/css/datasetsList.css");
</style>
