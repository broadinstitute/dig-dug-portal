<template>
	<div>
		<div v-show="showPlot">
			<gene-finder-heatmap
				v-if="tableData.length > 0"
				:heatmapData="groupedAssociations"
				:phenotypes="phenotypes"
				:rareVariantList="Object.keys(rareVariantMap)"
				:minMaxTPM="minMaxTPM"
				:eglsMap="eglsMap"
				:pThreshold="pThreshold"
				:rarePThreshold="rarePThreshold"
				:currentPage="currentPage"
			></gene-finder-heatmap>
		</div>
		<pre></pre>
		<div v-if="tableData.length > 0">
			<div class="row">
				<div class="col-md-10">
					<!--<template v-for="(phenotype, i) in phenotypes">
						<span
							:key="phenotype"
							class="badge badge-secondary badge-pill btn filter-pill-x reference"
							:class="'color-' + (i + 1)"
							v-if="phenotypeMap[phenotype]"
							style="color: white"
						>
							{{ phenotypeMap[phenotype].description }}
						</span>
					</template>-->
					<span style="font-size: 13px"
						>MAGMA P-Value:
						<template v-for="tValue in pThreshold">
							<span
								:style="
									'margin-right:5px; background-color:' +
									getPColor(tValue, 'MAGMA')
								"
								>&lt;={{ tValue }}</span
							>
						</template>
					</span>
					<span
						style="font-size: 13px"
						v-if="Object.keys(rareVariantMap).length > 0"
						>Rare Variant P-Value:
						<template v-for="tValue in rarePThreshold">
							<span
								:style="
									'margin-right:5px; background-color:' +
									getPColor(tValue, 'rare')
								"
								>&lt;={{ tValue }}</span
							>
						</template>
					</span>
				</div>
				<div class="text-right col-md-2">
					<csv-download
						:data="groupedAssociations"
						filename="gene_table"
						style="margin-bottom: 5px"
					></csv-download>
				</div>
			</div>

			<table
				class="table b-table table-hover table-sm table-striped gf-table"
			>
				<thead>
					<tr>
						<th>Gene</th>
						<th v-if="egls.length > 0">PEG lists</th>
						<th v-if="tissues.length > 0">
							Tissue Gene Expression
							<small>(Mean TPM : Samples)</small>
						</th>
						<th>MAGMA P-Value(Χ²)</th>
						<!--<th class="thin-cell no-padding"></th>-->
						<th>Trait</th>
						<th>MAGMA P-Value</th>
						<th v-if="Object.keys(rareVariantMap).length > 0">
							Rare Variant P-Value
						</th>
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
						<tr
							:id="itemValue.gene"
							:class="
								currentGene == itemValue.gene
									? 'current-gene'
									: ''
							"
						>
							<td class="text-center">
								<a
									v-if="currentGene == itemValue.gene"
									href="#top"
									class="to-the-top"
									><b-icon
										icon="arrow-up-circle-fill"
									></b-icon>
									Top</a
								>
								<a
									:href="`/gene.html?gene=${itemValue.gene}`"
									>{{ itemValue.gene }}</a
								>
							</td>
							<td
								class="text-center"
								v-if="egls.length > 0"
								v-html="itemValue.egls"
							></td>
							<td
								v-if="tissues.length > 0"
								class="text-center tissues-td percentage-bg"
								:style="
									'background-image: url(../images/blue_block.png) !important; background-size: ' +
									itemValue.tpmPercent +
									'% 20px;'
								"
								v-html="itemValue.tissue"
							></td>
							<td class="text-center">
								{{ pValueFormatter(itemValue.chiSquared) }}
							</td>

							<td class="no-padding text-center">
								<template
									v-for="(
										phenotype, i
									) in itemValue.phenotypes"
								>
									<div class="multi-values-div reference">
										<small>{{ phenotype }}</small>
									</div>
								</template>
							</td>
							<td class="no-padding text-center">
								<template
									v-for="phenotype in itemValue.phenotypes"
								>
									<!--:class="
											itemValue[phenotype + ':pValue'] <
											1e-5
												? 'variant-table-cell high'
												: ''
										"
										-->
									<div
										class="multi-values-div"
										:style="
											'background-color:' +
											getPColor(
												itemValue[
													phenotype + ':pValue'
												],
												'MAGMA'
											)
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
							<td
								class="no-padding text-center"
								v-if="Object.keys(rareVariantMap).length > 0"
							>
								<template
									v-for="phenotype in itemValue.phenotypes"
								>
									<!--:class="
											itemValue[phenotype + ':pValue'] <
											1e-5
												? 'variant-table-cell high'
												: ''
										"
										-->
									<div
										class="multi-values-div"
										:style="
											'background-color:' +
											getPColor(
												itemValue[
													phenotype + ':rarePValue'
												],
												'rare'
											)
										"
									>
										{{
											pValueFormatter(
												itemValue[
													phenotype + ":rarePValue"
												]
											)
										}}
									</div>
								</template>
							</td>

							<td class="no-padding text-center">
								<template
									v-for="phenotype in itemValue.phenotypes"
								>
									<div
										class="multi-values-div"
										:class="
											hugeRange(
												itemValue[phenotype + ':huge']
											)
										"
									>
										<a
											:href="
												'/hugecalculator.html?gene=' +
												itemValue.gene +
												'&phenotype=' +
												phenotype +
												'&prior=0.3696'
											"
											><span
												:class="
													!!hugeFilter &&
													itemValue[
														phenotype + ':huge'
													] >= hugeFilter
														? 'text-bold'
														: ''
												"
												>{{
													intFormatter(
														itemValue[
															phenotype + ":huge"
														]
													)
												}}</span
											>
											<span class="evidence-range"
												>({{
													hugeRange(
														itemValue[
															phenotype + ":huge"
														]
													)
												}})</span
											>
										</a>
										<span class="evidence-tip"
											>Common BF:
											{{
												itemValue[
													phenotype + ":hugeCommon"
												]
											}}<br />
											Rare BF:{{
												itemValue[
													phenotype + ":hugeRare"
												]
											}}
										</span>
									</div>
								</template>
							</td>

							<td class="no-padding text-right">
								<template
									v-for="phenotype in itemValue.phenotypes"
								>
									<div class="multi-values-div">
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
								<template
									v-for="phenotype in itemValue.phenotypes"
								>
									<div class="multi-values-div">
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
				v-model="inComCurrentPage"
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
import GeneFinderHeatmap from "@/components/geneFinderHeatmap.vue";

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
		"eglsMap",
		"tissues",
		"minMaxTPM",
		"phenotypeMap",
		"filter",
		"exclusive",
		"showPlot",
		"showChiSquared",
		"rowsPerPage",
		"pThreshold",
		"hugeFilter",
		"currentPage",
		"currentGene",
		"rareVariantMap",
		"rarePThreshold",
	],
	components: {
		Documentation,
		TooltipDocumentation,
		CsvDownload,
		GeneFinderHeatmap,
	},
	data() {
		return {
			inComCurrentPage: 1,
		};
	},
	watch: {
		currentPage(newPage, oldPage) {
			this.inComCurrentPage = newPage;
		},
		inComCurrentPage(newPage, oldPage) {
			if (newPage != this.currentPage) {
				this.$store.dispatch("currentPage", newPage);
			}
		},
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
					if (!!this.minMaxTPM) {
						let tpmPercent =
							((this.groupedAssociations[i].maxTPM -
								this.minMaxTPM.min) /
								(this.minMaxTPM.max - this.minMaxTPM.min)) *
							100;

						this.groupedAssociations[i]["tpmPercent"] = tpmPercent;
					}

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

		/*combinedAssociations() {
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
		},*/
	},

	methods: {
		intFormatter: Formatters.intFormatter,
		floatFormatter: Formatters.floatFormatter,
		pValueFormatter: Formatters.pValueFormatter,
		getPColor(P, TYPE) {
			let pColor;
			if (!!P) {
				let thresholds =
					TYPE == "MAGMA"
						? this.pThreshold
						: TYPE == "rare"
						? this.rarePThreshold
						: [];
				let tUnit = 1 / thresholds.length;
				let tMin = thresholds[0];
				let tMax = thresholds[thresholds.length - 1];

				let pNumber = 1;

				thresholds.map((t) => {
					pNumber -= P > t ? tUnit : 0;
				});

				pColor = "rgba(112, 191, 255, " + pNumber + ")";
			} else {
				pColor = "rgba(112, 191, 255, 0)";
			}

			return pColor;
		},
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
span.text-bold {
	font-weight: 600;
}
.gene-finder-egl {
	display: block;
	float: left;
	font-size: 13px;
	border-radius: 15px;
	padding: 0px 10px;
	margin: 2.5px 5px 2.5px 0;
	color: #007bff;
	background-color: #00000022;
}

.gene-finder-egl .egl-links {
	display: none;
}

.gene-finder-egl:hover .egl-links {
	display: block;
	position: absolute;
	background-color: #fff;
	border-radius: 15px;
	padding: 3px 10px;
	border: solid 1px #dddddd;
}

.gene-finder-egl .egl-links > a {
	color: #007bff !important;
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
	border-top: solid 0.5px #dddddd !important;
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
	border-top: 1px solid #dddddd;
	padding: 2px 0 !important;
}

.evidence-tip {
	display: none;
}

.gf-table td > div {
	position: relative;
}

.gf-table td > div:hover .evidence-tip {
	display: block;
	position: absolute;
	right: 3px;
	top: 0;
	text-align: left;
	padding: 5px 10px;
	background-color: #fff;
	z-index: 100;
	font-size: 14px;
	border-radius: 5px;
	border: solid 1px #dddddd;
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

.percentage-bg {
	background-position: left center;
	background-repeat: no-repeat;
}

.tissues-td {
	border-left: solid 0.75px #ddd;
	border-right: solid 0.75px #ddd;
}

.current-gene {
	border-bottom: solid 2px #ff6666;
}

.to-the-top {
	display: block;
	position: absolute;
	left: 0;
	color: #000 !important;
	font-size: 12px;
}
</style>
