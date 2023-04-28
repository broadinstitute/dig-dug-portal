<template>
	<div>
		<!--<div v-show="showPlot">
			<manhattan-plot
				:associations="combinedAssociations"
				:phenotypes="phenotypes"
				:phenotypeMap="phenotypeMap"
				:colorByPhenotype="true"
				style="margin-bottom: 10px"
			></manhattan-plot>
			<center style="margin-bottom: 30px">
				<b v-show="!!this.showChiSquared">
					Combined P-Value(Χ²) across
					<a
						v-for="p in phenotypes"
						class="item"
						:href="`/phenotype.html?phenotype=${p}`"
						>{{ phenotypeMap[p].description }}</a
					>
				</b>
			</center>
		</div>-->
		<div v-if="tableData.length > 0">
			<div class="row">
				<div class="col-md-10">
					<div class="col-md-12">
						<span>
							Matching genes:
							{{ groupedAssociations.length }}
						</span>
						<template v-for="(phenotype, i) in phenotypes">
							<span
								:key="phenotype"
								class="badge badge-secondary badge-pill btn filter-pill-x reference"
								:class="'color-' + (i + 1)"
								v-if="phenotypeMap[phenotype]"
								style="color: white"
							>
								{{ phenotypeMap[phenotype].description }}
							</span>
						</template>
					</div>

					<div
						class="col-md-12"
						style="font-size: 12px; white-space: nowrap"
					>
						HuGE Score: <span class="compelling">Compelling</span>
						&gt;= 350 |
						<span class="extreme">Extreme</span> &gt;=100 |
						<span class="very-strong">Very Strong</span>: &gt;=30 |
						<span class="strong">Strong</span>: &gt;=10 |
						<span class="moderate">Moderate</span>: &gt;=3 |<span
							class="anecdotal"
						>
							Anecdotal</span
						>: &gt;1 | <span class="no-evidence">No Evidence</span>:
						&lt;=1
					</div>
				</div>
				<div class="text-right col-md-2">
					<csv-download
						:data="groupedAssociations"
						filename="gene_table"
					></csv-download>
				</div>
			</div>

			<table
				class="table b-table table-hover table-sm table-striped gf-table"
			>
				<thead>
					<!--<tr>
						<th
							:colspan="!!showChiSquared ? (!!ifEgls ? 3 : 2) : 1"
						>
							<span>
								Matching genes:
								{{ groupedAssociations.length }}
							</span>
							
						</th>
						<th
							v-for="(phenotype, i) in phenotypes"
							:key="phenotype"
							colspan="2"
							class="reference"
							:class="'color-' + (i + 1)"
						>
							<span
								v-if="phenotypeMap[phenotype]"
								style="color: white"
							>
								{{ phenotypeMap[phenotype].description
								}}{{ ": " + genesPerPhenotypes[phenotype] }}
							</span>
						</th>
					</tr>-->
					<tr>
						<th>Gene</th>
						<th v-if="egls.length > 0">Effector gene lists</th>
						<th v-if="tissues.length > 0">
							Tissue Gene Expression
							<small>(Mean TPM : Samples)</small>
						</th>
						<th>P-Value(Χ²)</th>
						<th class="thin-cell no-padding"></th>
						<th>P-Value</th>
						<!--<th class="thin-cell no-padding"></th>-->
						<th>HuGE Score <small>(Evidence Range)</small></th>
						<!--<th class="thin-cell no-padding"></th>-->
						<th>Samples</th>

						<th>Variant Sifter</th>
					</tr>
				</thead>
				<tbody>
					<template
						v-for="(
							itemValue, itemIndex
						) in groupedAssociationsDisplay"
					>
						<tr>
							<td>
								<a
									:href="`/gene.html?gene=${itemValue.gene}`"
									>{{ itemValue.gene }}</a
								>
							</td>
							<td
								class="text-center"
								v-if="!!itemValue.egls"
								v-html="itemValue.egls"
							></td>
							<td
								v-if="tissues.length > 0"
								class="text-center"
								v-html="itemValue.tissue"
							></td>
							<td class="text-center">
								{{ pValueFormatter(itemValue.chiSquared) }}
							</td>

							<td class="thin-cell no-padding">
								<template v-for="(phenotype, i) in phenotypes">
									<div
										class="multi-values-div reference"
										:class="'color-' + (i + 1)"
									>
										&nbsp;
									</div>
								</template>
							</td>
							<td class="no-padding text-center">
								<template v-for="phenotype in phenotypes">
									<div
										class="multi-values-div"
										:class="
											itemValue[phenotype + ':pValue'] <
											1e-5
												? 'variant-table-cell high'
												: ''
										"
										:title="
											phenotypeMap[phenotype].description
										"
									>
										{{
											pValueFormatter(
												itemValue[phenotype + ":pValue"]
											)
										}}
									</div>
								</template>
							</td>

							<td class="no-padding text-center">
								<template v-for="phenotype in phenotypes">
									<div
										class="multi-values-div"
										:class="
											hugeRange(
												itemValue[phenotype + ':huge']
											)
										"
										:title="
											phenotypeMap[phenotype].description
										"
									>
										{{
											intFormatter(
												itemValue[phenotype + ":huge"]
											)
										}}
										<span class="evidence-range"
											>({{
												hugeRange(
													itemValue[
														phenotype + ":huge"
													]
												)
											}})</span
										>
									</div>
								</template>
							</td>

							<td class="no-padding text-right">
								<template v-for="phenotype in phenotypes">
									<div
										class="multi-values-div"
										:title="
											phenotypeMap[phenotype].description
										"
									>
										{{
											intFormatter(
												itemValue[
													phenotype + ":subjects"
												]
											)
										}}
									</div>
								</template>
							</td>

							<td class="no-padding text-center">
								<template v-for="phenotype in phenotypes">
									<div
										class="multi-values-div"
										:title="
											phenotypeMap[phenotype].description
										"
									>
										<a
											:href="
												'/research.html?pageid=kp_variant_sifter&phenotype=' +
												phenotype +
												'&region=' +
												itemValue.chromosome +
												':' +
												itemValue.start +
												'-' +
												itemValue.end
											"
											class="vs-view"
											>View</a
										>
									</div>
								</template>
							</td>
						</tr>
					</template>
				</tbody>
			</table>

			<b-pagination
				class="pagination-sm justify-content-center"
				v-model="currentPage"
				:total-rows="groupedAssociations.length"
				:per-page="rowsPerPage"
			></b-pagination>
		</div>
		<div v-else>
			<h4 v-if="associations.length > 0">No overlapping associations</h4>
			<h4 v-else>No associations</h4>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Chi from "chi-squared";
import Formatters from "@/utils/formatters";
import ManhattanPlot from "@/components/ManhattanPlot.vue";
import Documentation from "@/components/Documentation.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import EffectorGenesMPlot from "@/components/eglt/EffectorGenesMPlot.vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import CsvDownload from "@/components/CsvDownload";

export default Vue.component("gene-finder-w-egl-table", {
	props: [
		"associations",
		"hugeScores",
		"phenotypes",
		"egls",
		"tissues",
		"phenotypeMap",
		"filter",
		"exclusive",
		"showPlot",
		"showChiSquared",
		"rowsPerPage",
	],
	components: {
		Documentation,
		TooltipDocumentation,
		EffectorGenesMPlot,
		CsvDownload,
	},
	data() {
		return {
			currentPage: 1,
		};
	},

	computed: {
		rows() {
			return this.tableData.length;
		},

		tableData() {
			if (!!this.filter) {
				return this.associations.filter(this.filter);
			}
			return this.associations;
		},
		ifEgls() {
			if (this.egls.length > 0) {
				return true;
			} else {
				return null;
			}
		},

		groupedAssociations() {
			let groups = {};
			let associations = this.tableData;

			let data = associations; //Object.values(groups);

			// calculate the chiSquared for each row

			data.forEach((r) => (r.chiSquared = this.chiSquared(r)));

			// sort all the records by combined p-value
			data.sort((a, b) => a.chiSquared - b.chiSquared);

			return data;
		},

		groupedAssociationsDisplay() {
			let returnList = [];
			let startIndex =
				this.currentPage * this.rowsPerPage - this.rowsPerPage;
			let endIndex = this.currentPage * this.rowsPerPage - 1;
			for (let i = startIndex; i <= endIndex; i++) {
				if (!!this.groupedAssociations[i]) {
					returnList.push(this.groupedAssociations[i]);
				}
			}

			return returnList;
		},

		genesPerPhenotypes() {
			let content = {};
			let data = this.tableData;
			let phenotypes = this.phenotypes;

			phenotypes.map((p) => {
				content[p] = 0;
			});
			data.map((g) => {
				content[g.phenotype]++;
			});

			return content;
		},

		combinedAssociations() {
			let groups = [];

			this.groupedAssociations.forEach((a) => {
				a.phenotypes.forEach((phenotype) => {
					groups.push({
						phenotype,
						pValue: a[`${phenotype}:pValue`],
						chromosome: a.chromosome,
						position: Math.floor((a.start + a.end) / 2),
					});
				});
			});

			return groups;
		},
	},

	methods: {
		intFormatter: Formatters.intFormatter,
		floatFormatter: Formatters.floatFormatter,
		pValueFormatter: Formatters.pValueFormatter,

		phenotypePValueColumn(phenotype) {
			return `cell(${phenotype}:pValue)`;
		},

		phenotypeVariantsColumn(phenotype) {
			return `cell(${phenotype}:nParam)`;
		},

		phenotypeSubjectsColumn(phenotype) {
			return `cell(${phenotype}:subjects)`;
		},

		chiSquared(row) {
			let X = 0.0;

			for (let i in this.phenotypes) {
				let p = row[`${this.phenotypes[i]}:pValue`];

				if (!!p) {
					X += -2 * Math.log(p);
				}
			}

			// calculate the combined p-value
			let pdf = Chi.pdf(X, 2 * this.phenotypes.length);

			return 2 * pdf;
		},
		hugeRange(x) {
			let range =
				x >= 350
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
					: "no-evidence";

			return range;
		},
	},
});
</script>

<style>
@import url("/css/effectorGenes.css");
.gene-finder-egl {
	display: block;
	float: left;
	font-size: 13px;
	border-radius: 15px;
	padding: 3px 10px;
	margin-right: 5px;
	color: #fff;
}

.gene-finder-egl .egl-links {
	display: none;
}

.gene-finder-egl:hover .egl-links {
	display: block;
	position: absolute;
	background-color: #000;
	border-radius: 15px;
	padding: 3px 10px;
}

.gene-finder-egl .egl-links > a {
	color: #fff !important;
}

.gene-finder-egl .egl-links span.spacer {
	margin: 0 8px;
}

.thin-cell {
	width: 5px !important;
}

.no-padding {
	padding: 3px 0 !important;
}

.multi-values-div {
	/*border-top: solid 1px #dddddd !important;*/
	padding-left: 15px;
	padding-right: 15px;
}

.multi-values-div.reference {
	padding-left: 0;
	padding-right: 0;
}

.gf-table td > div.multi-values-div:nth-child(2) {
	border-top: solid 1px #dddddd !important;
}

.gf-table td,
.gf-table th {
	/*width: calc((100% - 45px) / 7);*/
}

.gf-table th {
	text-align: center;
}

.gf-table td.thin-cell,
.gf-table th.thin-cell {
	width: 5px !important;
}

.gf-table td {
	vertical-align: middle !important;
}

.compelling {
	background-color: #4ebf59ff;
}
.extreme {
	background-color: #4ebf59cf;
}
.very-strong {
	background-color: #4ebf598f;
}
.strong {
	background-color: #4ebf5966;
}
.moderate {
	background-color: #4ebf5944;
}
.anecdotal {
	background-color: #4ebf5922;
}
.no-evidence {
	background-color: #4ebf5900;
}

span.evidence-range {
	font-size: 12px;
}

.vs-view {
	font-size: 14px;
}
</style>
