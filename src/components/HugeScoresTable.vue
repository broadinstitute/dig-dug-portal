<template>
	<div>
		<div class="text-right mt-2 mb-2">
			<csv-download
				:data="tableData"
				filename="gene_associations"
			></csv-download>
		</div>
		<b-table
			v-if="gene && rows > 0"
			hover
			small
			responsive="sm"
			:items="tableData"
			:fields="fields"
			:per-page="perPage"
			:current-page="currentPage"
		>
			<template v-slot:cell(phenotype)="r">
				<a href="javascript:;" class="phenotype-gene-association">
					{{ phenotypeFormatter(phenotypeMap[r.item.phenotype]) }}
					<div class="options-4-actions">
						<div>
							<a
								:href="`/phenotype.html?phenotype=${r.item.phenotype}`"
								v-if="phenotypeMap"
								>Open phenotype page</a
							>
						</div>
						<div>
							<a
								:href="`/region.html?phenotype=${r.item.phenotype}&chr=${gene.chromosome}&start=${gene.start}&end=${gene.end}`"
								v-if="phenotypeMap"
								>Open region page with selected phenotype</a
							>
						</div>
					</div>
				</a>
				&nbsp;
			</template>
		</b-table>
		<div v-else>No data available for this query.</div>
		<b-pagination
			class="pagination-sm justify-content-center"
			v-model="currentPage"
			:total-rows="rows"
			:per-page="perPage"
		></b-pagination>
	</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";
import CsvDownload from "@/components/CsvDownload";

export default Vue.component("huge-scores-table", {
	props: ["gene", "hugeScores", "phenotypeMap"],
	components: {
		Documentation,
		TooltipDocumentation,
		CsvDownload,
	},
	data() {
		return {
			perPage: 10,
			currentPage: 1,
			fields: [
				{
					key: "phenotype",
					label: "Phenotype",
				},
				{
					key: "group",
					label: "Group",
				},
				{
					key: "bf_common",
					label: "Common variant BF",
				},
				{
					key: "bf_rare",
					label: "Rare variant BF",
				},
				{
					key: "huge",
					label: "HuGE score",
				},
			],
		};
	},

	computed: {
		rows() {
			return this.tableData.length;
		},

		tableData() {
			let assocs = this.hugeScores;
			let phenotypeMap = this.phenotypeMap;

			if (!phenotypeMap) {
				return [];
			}

			// remove unknown phenotypes
			assocs = assocs.filter((a) => phenotypeMap[a.phenotype]);

			return assocs;
		},
	},

	methods: {
		phenotypeFormatter: Formatters.phenotypeFormatter,
		floatFormatter: Formatters.floatFormatter,
	},
	watch: {
		tableData(DATA) {
			this.$store.dispatch("commonVariantsLength", DATA.length);
		},
	},
});
</script>
