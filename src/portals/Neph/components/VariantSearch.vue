<template>
	<div id="variant-search">
		<b-row>
			<b-col>
				<b-btn
					class="btn btn-secondary btn-sm"
					@click="showHideElement('filter_pop_up')"
					>Open Filter</b-btn
				>
			</b-col>
			<b-col class="text-right mb-2">
				<csv-download
					v-if="tableData.length"
					:data="tableData"
					filename="variants"
				></csv-download
			></b-col>
		</b-row>
		<b-row>
			<b-col>
				<div id="filter_pop_up_example">
					<div id="filter_pop_up" class="hidden">
						<div>
							<h4 style="text-align: center; margin-bottom: 20px">
								Filter variants
							</h4>
							<form>
								<fieldset>
									<h6>Select impact</h6>
									<div
										style="
											padding-left: 15px;
											margin-bottom: 15px;
										"
									>
										<tamplate
											v-for="(key, value) in this
												.disablebtn"
										>
											<b-form-checkbox
												name="impact"
												v-model="filters['impacts']"
												:disabled="key"
												:value="value"
												inline
												>{{ value }}</b-form-checkbox
											>
										</tamplate>
									</div>
									<h6>Select phenotypes</h6>
									<div style="padding-left: 15px">
										<tamplate
											v-for="(key, value) in this
												.HPOTerms"
										>
											<b-form-checkbox
												name="phenotypes"
												v-model="filters['phenotypes']"
												:value="value"
												>{{ key }}</b-form-checkbox
											>
										</tamplate>
									</div>
								</fieldset>
							</form>
						</div>
						<div style="text-align: center; margin-top: 25px">
							<b-btn
								class="btn btn-warning btn-sm"
								@click="showHideElement('filter_pop_up')"
								style="margin-right: 5px"
								>Cancel</b-btn
							>
							<b-btn
								class="btn btn-success btn-sm"
								@click="
									addfilter();
									showHideElement('filter_pop_up');
								"
								>Apply filter</b-btn
							>
						</div>
					</div>
				</div>
			</b-col>
		</b-row>

		<div v-show="tableData.length">
			<b-table
				hover
				small
				sort-icon-left
				responsive="sm"
				:fields="fields"
				:items="tableData"
				:per-page="perPage"
				:current-page="currentPage"
				><template #thead-top="data">
					<b-tr>
						<b-th colspan="4"
							><span class="sr-only"
								>Variant, Consequence, Protein Position, Amino
								Acids</span
							></b-th
						>
						<b-th
							colspan="3"
							class="text-center"
							variant="secondary"
							>Allele</b-th
						>

						<b-th
							colspan="1"
							class="text-center"
							variant="secondary"
							style="border-left: 1px solid #dee2e6"
							>Homozygous</b-th
						>
						<b-th><span class="sr-only">View VEP Data</span></b-th>
					</b-tr>
				</template>
				<template #cell(varID)="data">
					<a :href="`/variant.html?variant=${data.item.varID}`">{{
						data.item.varID
					}}</a> </template
				><template #cell(dbSNP)="data">
					<a :href="`/variant.html?variant=${data.item.dbSNP}`">{{
						data.item.dbSNP
					}}</a>
				</template>
				<template #cell(allelecount)="data">
					<div align="right">{{ data.item.allelecount }}</div>
				</template>
				<template #cell(allelnumber)="data">
					<div align="right">{{ data.item.allelnumber }}</div>
				</template>
				<template #cell(allelefrequency)="data">
					<div align="right">{{ data.item.allelefrequency }}</div>
				</template>
				<template #cell(TWO_ALT_GENO_CTS)="data">
					<div align="right">{{ data.item.TWO_ALT_GENO_CTS }}</div>
				</template>
				<template #cell(max_consequence)="data">
					<div
						v-if="data.item.Max_Impact"
						class="border-color"
						:class="data.item.Max_Impact"
					>
						{{ consequenceFormatter(data.item.max_consequence) }}
					</div>
					<div v-else class="border-color NONE"></div>
				</template>

				<template #cell(view)="data">
					<b-btn
						size="sm"
						class="btn-mini mr-2"
						variant="outline-primary"
						@click="
							toToggle(data.detailsShowing, 1)
								? data.toggleDetails()
								: ''
						"
					>
						{{
							data.detailsShowing && showButton === 1
								? "Hide"
								: "Show"
						}}
						Phenotypes</b-btn
					>
					<b-btn
						v-if="data.item.veprecords.length === 0"
						disabled
						size="sm"
						class="btn-mini"
						variant="outline-secondary"
						>No Annotation</b-btn
					>
					<b-btn
						v-else
						size="sm"
						variant="outline-primary"
						class="btn-mini showData"
						@click="
							//showVariantData(data.item.varID);
							toToggle(data.detailsShowing, 2)
								? data.toggleDetails()
								: ''
						"
						><span v-if="!!loadingData[data.item.varID]"
							><b-spinner small></b-spinner>
							<span class="sr-only">Loading...</span></span
						><span v-else>
							{{
								data.detailsShowing && showButton === 2
									? "Hide"
									: "Show"
							}}
							Annotations</span
						>
					</b-btn>
				</template>

				<template #row-details="row">
					<div class="details">
						<b-table
							v-if="showButton === 1"
							:items="row.item.hpdisplay"
							:fields="hprecordFields"
							:per-page="perPagephenotype"
							:tbody-tr-class="rowPickClass"
						>
							<template #cell(allelecount)="row">
								<div align="right">
									{{ row.item.allelecount }}
								</div>
							</template>
							<template #cell(allelnumber)="row">
								<div align="right">
									{{ row.item.allelnumber }}
								</div>
							</template>
							<template #cell(allelefrequency)="row">
								<div align="right">
									{{ row.item.allelefrequency }}
								</div>
							</template>
							<template #cell(TWO_ALT_GENO_CTS)="row">
								<div align="right">
									{{ row.item.TWO_ALT_GENO_CTS }}
								</div>
							</template>
						</b-table>

						<b-table
							v-if="
								row.item.veprecords.length > 0 &&
								showButton === 2
							"
							:items="row.item.veprecords"
							:fields="subFields"
							:per-page="perPage"
							:tbody-tr-class="rowPickClass"
							><template #cell(varID)="data">
								<a
									:href="`/variant.html?variant=${data.item.varID}`"
									>{{ data.item.varID }}</a
								>
							</template>
							<template #head(Feature)="data">
								<span class="external_source"
									>Feature
									<b-badge
										pill
										disabled
										class="ml-1"
										variant="secondary"
										title="Link to external source."
										>E</b-badge
									></span
								>
							</template>
							<template #cell(Feature)="data">
								<a
									v-if="data.item.Feature"
									:href="`https://grch37.ensembl.org/Homo_sapiens/Transcript/Summary?db=core;t=${data.item.Feature}`"
									target="_blank"
									rel="noopener noreferrer nofollow"
									>{{ data.item.Feature }}</a
								>
							</template>
							<template #cell(position)="data">
								{{
									data.item.proteinStart !==
									data.item.proteinEnd
										? `${data.item.proteinStart}-${data.item.proteinEnd}`
										: data.item.proteinStart
								}}
							</template>
							<template #cell(max_consequence)="data">
								<div
									class="border-color"
									:class="data.item.Max_Impact"
								>
									<span>{{
										consequenceFormatter(
											data.item.max_consequence
										)
									}}</span>
								</div></template
							>
							<template #cell(siftPrediction)="data">
								{{ siftFormatter(data.item.siftPrediction) }}
							</template>
						</b-table>
					</div>
				</template>
			</b-table>
			<b-pagination
				size="sm"
				v-model="currentPage"
				:total-rows="rows"
				:per-page="perPage"
				aria-controls="my-table"
			></b-pagination>
		</div>
	</div>
</template>
<script>
import Vue from "vue";
import { match, query } from "@/utils/bioIndexUtils";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import Formatters from "@/utils/formatters";
import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";
import CsvDownload from "@/components/CsvDownload";
//import PhenotypePicker from "@/components/PhenotypePicker.vue";
//import FilterWrapper from "@/portals/Neph/components/FilterWrapper.vue";
//import Multiselect from 'vue-multiselect';

import uiUtils from "@/utils/uiUtils";

// register globally
//Vue.component('multiselect', Multiselect)

export default Vue.component("variant-search", {
	components: {
		CriterionListGroup,
		FilterEnumeration,
		Documentation,
		TooltipDocumentation,
		Formatters,
		CsvDownload,
		//PhenotypePicker,
		//FilterWrapper,
	},
	props: {
		gene: [String, Array],
	},
	data() {
		return {
			filters: {
				impacts: [],
				phenotypes: [],
			},
			applyfilter: false,
			disablebtn: {
				HIGH: true,
				LOW: true,
				LOWEST: true,
				MODERATE: true,
				MODIFIER: true,
				//"REMOVE": false,
			},
			HPOTerms: {
				"HP-0000119": "Abnormality of the genitourinary system",
				"HP-0000152": "Abnormality of head or neck",
				"HP-0000478": "Abnormality of the eye",
				"HP-0000598": "Abnormality of the ear",
				"HP-0000707": "Abnormality of the nervous system",
				"HP-0000769": "Abnormality of the breast",
				"HP-0000818": "Abnormality of the endocrine system",
				"HP-0001197": "Abnormality of prenatal development or birth",
				"HP-0001507": "Growth abnormality",
				"HP-0001574": "Abnormality of the integument",
				"HP-0001608": "Abnormality of the voice",
				"HP-0001626": "Abnormality of the cardiovascular system",
				"HP-0001871": "Abnormality of blood and blood-forming tissues",
				"HP-0001939": "Abnormality of metabolism/homeostasis",
				"HP-0002086": "Abnormality of the respiratory system",
				"HP-0002664": "Neoplasm",
				"HP-0002715": "Abnormality of the immune system",
				"HP-0025031": "Abnormality of the digestive system",
				"HP-0025142": "Constitutional symptom",
				"HP-0025354": "Abnormal cellular phenotype",
				"HP-0033127": "Abnormality of the musculoskeletal system",
				"HP-0040064": "Abnormality of limbs",
				"HP-0045027": "Abnormality of the thoracic cavity",
				AllControl: "Controls",
			},

			perPage: 10,
			perPagephenotype: 23,
			currentPage: 1,
			showButton: null,
			variants: [],
			consequences: {},
			currentSort: "allelecount",
			currentSortDir: "desc",
			fields: [
				{
					key: "varID",
					label: "Variant",
				},
				{
					key: "max_consequence",
					label: "Consequence",
					tdClass: "border-color",
				},
				{
					key: "Protein_Position",
					label: "Protein Position",
				},
				{
					key: "Amino_Acids",
					label: "Amino Acids",
				},
				{
					key: "allelecount",
					label: "Count",
					sortable: true,
				},
				{
					key: "allelnumber",
					label: "Number",
				},

				{
					key: "allelefrequency",
					label: "Frequency",
					sortable: true,
				},
				{
					key: "TWO_ALT_GENO_CTS",
					label: "Count",
					sortable: true,
				},
				{
					key: "view",
					label: "View Additional Data",
					class: "nowrap",
				},
			],
			subFields: [
				{
					key: "Feature",
					label: "Feature",
				},
				{
					key: "Protein_Position",
					label: "Position",
				},
				{
					key: "Amino_Acids",
					label: "Amino Acids",
				},
				{
					key: "max_consequence",
					label: "Consequence",
					tdClass: "border-color",
				},
				{
					key: "HGNC",
					label: "HGNC",
				},
				{
					key: "HGVSc",
					label: "HGVSc",
				},
				{
					key: "HGVSp",
					label: "HGVSp",
				},
			],
			hprecordFields: [
				{
					key: "hpoterms",
					label: "Phenotype",
				},
				{
					key: "allelecount",
					label: "Allele Count",
					sortable: true,
				},
				{
					key: "allelnumber",
					label: "Allele Number",
					sortable: true,
				},

				{
					key: "allelefrequency",
					label: "Allele Frequency",
					sortable: true,
				},
				{
					key: "TWO_ALT_GENO_CTS",
					label: "Homozygotes",
					sortable: true,
				},
			],
			variantData: [],
			loadingData: {},
		};
	},
	created() {
		if (this.gene) {
			this.searchVariants();
		}
	},
	computed: {
		//This works to display all data fro BI
		tableData() {
			if (this.variantData && this.variantData.length) {
				return this.variantData;
			} else {
				return [];
			}
		},
		rows() {
			//alert("call rows");
			if (this.tableData) return this.tableData.length;
		},
		// sortedData(hprecords) {
		//     console.log(hprecords);
		//     return hprecords.sort(function (a, b) {
		//         return a.allelecount > b.allelecount;
		//     });
		// },
	},
	methods: {
		...uiUtils,
		showHideElement(ELEMENT) {
			uiUtils.showHideElement(ELEMENT);
		},
		async searchVariants() {
			this.currentPage = 1; //reset on new search
			//Helen 2022-01-09
			//this.variants = await query("variants", this.gene, {}, true);
			this.variants = await query(
				"variant-phenotype",
				this.gene,
				{},
				true
			);
			if (this.variants && this.variants.length) {
				for (let i = 0; i < this.variants.length; i++) {
					this.variants[i].allelecount =
						2 * parseInt(this.variants[i].TWO_ALT_GENO_CTS) +
						parseInt(this.variants[i].GHET_REF_ALT_CTS);
					this.variants[i].allelnumber =
						2 *
						(parseInt(this.variants[i].HOM_REF_CT) +
							parseInt(this.variants[i].GHET_REF_ALT_CTS) +
							parseInt(this.variants[i].TWO_ALT_GENO_CTS));
					this.variants[i].allelefrequency =
						this.variants[i].allelecount /
						this.variants[i].allelnumber;
					this.variants[i].allelefrequency =
						this.variants[i].allelefrequency.toExponential(2);
					for (
						let m = 0;
						m < this.variants[i].hprecords.length;
						m++
					) {
						let hp = this.variants[i].hprecords[m];
						if (hp.HP == "AllControl") {
							this.variants[i].c_allelecount =
								2 * parseInt(hp.TWO_ALT_GENO_CTS) +
								parseInt(hp.HET_REF_ALT_CTS);
							this.variants[i].c_allelnumber =
								2 *
								(parseInt(hp.HOM_REF_CT) +
									parseInt(hp.HET_REF_ALT_CTS) +
									parseInt(
										this.variants[i].TWO_ALT_GENO_CTS
									));
							this.variants[i].c_allelefrequency =
								this.variants[i].c_allelecount /
								this.variants[i].c_allelnumber;
							this.variants[i].c_allelefrequency =
								this.variants[
									i
								].c_allelefrequency.toExponential(2);
							this.variants[i].c_TWO_ALT_GENO_CTS =
								hp.TWO_ALT_GENO_CTS;
						}
					}
					//do we need vep count?
					//this.variants[i].vep = this.variants[i].veprecords.length;
					if (this.variants[i].veprecords.length > 0) {
						let varrecords = this.variants[i].veprecords;

						for (let j = 0; j < varrecords.length; j++) {
							console.log("this gene", this.gene);
							if (varrecords[j].Gene_Symbol === this.gene) {
								this.variants[i].Gene_Symbol =
									varrecords[j].Gene_Symbol;
								this.variants[i].Max_Impact =
									varrecords[j].Max_Impact;
								//helen test 2022-01-17
								this.variants[i].max_consequence =
									varrecords[j].max_consequence;
								this.variants[i].Protein_Position =
									varrecords[j].Protein_Position;
								this.variants[i].Amino_Acids =
									varrecords[j].Amino_Acids;

								this.disablebtn[
									this.variants[i].Max_Impact
								] = false;
							}
						}
						//Max_Impact	Biotype Gene_Symbol	Transcript_count	Amino_Acids	Protein_Position	CDS_position	Refgene	max_consequence
					}

					if (this.variants[i].hprecords.length > 0) {
						let hpdisplay = [];
						let j = 0;

						for (
							let k = 0;
							k < this.variants[i].hprecords.length;
							k++
						) {
							let hp = this.variants[i].hprecords[k];
							if (hp.HP != "AllControl") {
								hpdisplay[j] = {};
								//hpdisplay[j].hpoterms = this.HPOTerms[hp.HP];
								hpdisplay[j].hp = hp.HP;
								hpdisplay[j].hpoterms =
									Formatters.snakeFormatter(
										this.HPOTerms[hp.HP]
									);
								hpdisplay[j].allelecount =
									2 * hp.TWO_ALT_GENO_CTS +
									hp.HET_REF_ALT_CTS;
								hpdisplay[j].allelnumber =
									2 *
									(hp.HOM_REF_CT +
										hp.HET_REF_ALT_CTS +
										hp.TWO_ALT_GENO_CTS);
								hpdisplay[j].allelefrequency =
									this.formatAlleleFrequency(
										hpdisplay[j].allelecount,
										hpdisplay[j].allelnumber
									);

								hpdisplay[j].TWO_ALT_GENO_CTS =
									hp.TWO_ALT_GENO_CTS;
								j++;
							}
						}
						hpdisplay = hpdisplay.sort(function (a, b) {
							//console.log(a.allelecount+"|"+b.allelecount+"|"+(a.allelecount>b.allelecount));
							if (a.allelecount > b.allelecount) {
								return -1;
							} else if (a.allelecount < b.allelecount) {
								return 1;
							}
							return 0;
						});
						this.variants[i].hpdisplay2 = hpdisplay;
						this.variants[i].hpdisplay = hpdisplay;
					}
				}
				this.variantData = this.variants;
			}
		},
		async getTranscriptConsequences(varID) {
			if (!!varID) {
				let data = await query("transcript-consequences", varID);
				return data;
			}
		},
		consequenceFormatter(consequence) {
			if (!!consequence) {
				let trim = consequence
					.replace("_prime_", "' ")
					.replace("_variant", "");
				return Formatters.snakeFormatter(trim);
			}
			return;
		},
		siftFormatter(name) {
			return Formatters.snakeFormatter(name);
		},
		/*async showVariantData(varID) {
            let escapedVarID = this.escapedVarID(varID);

            if (this.variantData[escapedVarID] === undefined) {
                this.loadingData[escapedVarID] = true;
                let tcQuery = await this.getTranscriptConsequences(varID);
                Vue.set(this.variantData, escapedVarID, tcQuery);
                this.loadingData[escapedVarID] = false;
            }
        },*/
		escapedVarID(varID) {
			if (!!varID) return varID.replace(/:\s*/g, "_");
			else {
				return "";
			}
		},
		rowPickClass(item, type) {
			if (!item || type !== "row") return;
			if (item.pick === 1) return "row-pick";
		},
		formatAlleleFrequency(count, number) {
			if (count === 0 || number === 0) return 0;
			else return Number.parseFloat(count / number).toExponential(2);
		},
		toToggle(isShowing, buttonClicked) {
			if (isShowing) {
				if (this.showButton === buttonClicked) return true;
				else {
					this.showButton = buttonClicked;
					return false;
				}
			} else {
				this.showButton = buttonClicked;
				return true;
			}
		},

		addfilter: function () {
			let dataRows = this.variants;
			if (this.filters["impacts"].length > 0) {
				dataRows = dataRows.filter((item) =>
					this.filters["impacts"].includes(item.Max_Impact)
				);
			}
			if (this.filters["phenotypes"].length > 0) {
				for (let i = 0; i < dataRows.length; i++) {
					dataRows[i].hpdisplay = dataRows[i].hpdisplay2;
					dataRows[i].hpdisplay = dataRows[i].hpdisplay.filter((v) =>
						this.filters["phenotypes"].includes(v.hp)
					);
				}
			}
			this.variantData = dataRows;
			return this.tableData;
		},
		sort: function (s) {
			//if s == current sort, reverse
			console.log("sort", this.currentSort);
			if (s === this.currentSort) {
				this.currentSortDir =
					this.currentSortDir === "asc" ? "desc" : "asc";
			}
			this.currentSort = s;
		},
	},
	watch: {
		gene: {
			handler(val) {
				if (!!val) this.searchVariants();
			},
			//immediate: true,
		},
	},
});
</script>
<style>
@import url("/css/table.css");

#filter_pop_up {
	position: fixed;
	width: 40%;
	height: 50%;
	overflow: auto;
	margin-left: -5px;
	top: 200px;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 25px 15px;
	left: 25%;
	top: 25%;
	box-shadow: 0px 7px 5px 5px rgba(100, 100, 100, 0.35);
	z-index: 10;
	font-size: 14px;
}
</style>
