<template>
	<div style="position: relative">
		<div class="text-right mt-2 mb-2">
			<csv-download
				:data="tableData"
				filename="gene_associations"
			></csv-download>
		</div>
		<span
			style="
				font-size: 12px;
				white-space: nowrap;
				position: absolute;
				top: 15px;
			"
			>Compelling: HuGE Score &gt;= 350 | Extreme: &gt;=100 | Very Strong:
			&gt;=30 | Strong: &gt;=10 | Moderate: &gt;=3 | Anecdotal: &gt;1 | No
			Evidence: &lt;=1</span
		>
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
			<template v-slot:cell(link)="r">
				<a
					target="_blank"
					class="btn view-features-btn btn-secondary"
					style="color: #ffffff !important"
					:href="`/hugecalculator.html?gene=${gene.name}&phenotype=${r.item.phenotype}&prior=0.3696`"
					>Open</a
				>
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
					label: "Common Variation Bayes Factor",
					formatter: Formatters.floatFormatter,
				},
				{
					key: "bf_rare",
					label: "Rare Variation Bayes Factor",
					formatter: Formatters.floatFormatter,
				},
				{
					key: "huge",
					label: "HuGE Score",
					formatter: Formatters.floatFormatter,

					tdClass(x) {
						//return !!x && x < 1e-5 ? "variant-table-cell high" : "";
						return !!x
							? x >= 350
								? "compelling"
								: x >= 100
								? "extreme"
								: x >= 30
								? "very-strong"
								: x >= 10
								? "strong"
								: x >= 3
								? "moderate"
								: x > 1
								? "anecdotal"
								: "no-evidence"
							: "";
					},
				},
				{
					key: "range",
					label: "Evidence Range",
				},
				{
					key: "link",
					label: "Open in HuGE Cal",
				},
			],
		};
	},

	computed: {
		rows() {
			return this.tableData.length;
		},

		tableData() {
			//console.log("this.hugeScores", this.hugeScores);
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
<style>
.compelling {
	background-color: #4ebf59;
}
.extreme {
	background-color: #5ecc69;
}
.very-strong {
	background-color: #71d97b;
}
.strong {
	background-color: #7ee087;
}
.moderate {
	background-color: #91eb9a;
}
.anecdotal {
	background-color: #a1f0a9;
}
.no-evidence {
	background-color: #ffffff;
}
</style>