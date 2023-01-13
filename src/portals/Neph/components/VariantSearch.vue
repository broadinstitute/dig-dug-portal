<template>
	<div id="variant-search">
		<b-row>
			<b-col cols="8">
                <div class="legends" v-show="tableData.length">
                    <strong class="mr-2">Impact:</strong>
                    <b-btn
                        disabled
                        variant="outline-danger"
                        size="sm"
                        class="mr-1 btn-mini"
                        >HIGH</b-btn
                    >
                    <b-btn
                        disabled
                        variant="outline-warning"
                        size="sm"
                        class="mr-1 btn-mini"
                        >MODERATE</b-btn
                    >
                    <b-btn
                        disabled
                        variant="outline-success"
                        size="sm"
                        class="mr-1 btn-mini"
                        >LOW</b-btn
                    >
                    <b-btn
                        disabled
                        variant="outline-secondary"
                        size="sm"
                        class="btn-mini"
                        >MODIFIER</b-btn
                    >
                </div>
            </b-col>
			<b-col class="text-right mb-2">
				<b-form-select v-model="perPage" :options="perPageOptions"></b-form-select>
			</b-col>
			<b-col class="text-right mb-2">
				<b-btn
					class="btn btn-secondary btn-sm"
					@click="showHideElement('filter_pop_up')"
					>Filter Results</b-btn
				>
			</b-col>
			<b-col class="text-right mb-2">
				
				<csv-download
					v-if="tableData.length"
					:data="printData"
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
										<tamplate v-for="(key, value) in this.disablebtn">
											<b-form-checkbox
												name="impact"
												v-model="filters['impacts']"
												:disabled="key"
												:value="value"
												inline
												><b-btn
													disabled
													:variant="disablebtnstyle[value]"
													size="sm"
													class="mr-1 btn-mini"
													>{{ value }}</b-btn>
											</b-form-checkbox>
										</tamplate>
									</div>
									<div>
										<h6>Select phenotypes</h6>
										<b-btn
											class="btn btn-secondary btn-sm"
											@click="selectAllElements('phenotypes', true)"
											>Select All</b-btn
										>&nbsp;
										<b-btn
											class="btn btn-secondary btn-sm"
											@click="selectAllElements('phenotypes', false)"
											>Unselect All</b-btn
										>
									</div>
									<div style="padding-left: 15px">
										<tamplate v-for="(key, value) in this.HPOTerms">
											<b-form-checkbox
												name="phenotypes"
												v-model="filters['phenotypes']"
												:value="value"
												>{{ key }}</b-form-checkbox
											>
										</tamplate>
									</div>
									<h6>Select Masks</h6>
									<div style="padding-left: 15px;margin-bottom: 15px;">
										<tamplate v-for="(key, value) in this.masksbtn">
											<b-form-checkbox
												name="masks"
												v-model="filters['masks']"
												:disabled="key"
												:value="value"
												inline
												>{{ value }}
											</b-form-checkbox>
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
							colspan="4"
							class="text-center"
							variant="secondary"
							>CRDC Allele</b-th
						>
						<b-th
							colspan="3"
							class="text-center"
							variant="secondary"
							style="border-left: 1px solid #dee2e6"
							>gnomAD Allele</b-th
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
				<template #cell(HGVSc)="data">
					<span>{{ hgvscFormmater(data.item.HGVSc) }}</span>
				</template>
				<template #cell(HGVSp)="data">
					<span>{{ hgvscFormmater(data.item.HGVSp) }}</span>
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
                        v-if="!data.item.max_consequence"
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
                            showVariantData(data.item.varID);
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
					<!-- <b-btn
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
					</b-btn> -->
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
							
						</b-table>
						<b-table
							v-if="
                                vepData[escapedVarID(row.item.varID)] &&
                                vepData[escapedVarID(row.item.varID)].length &&
								showButton === 2
                            "
							:items="
								vepData[escapedVarID(row.item.varID)]
							"
							:fields="subFields"
							:per-page="perPage"
							:tbody-tr-class="rowPickClass"
							><template #cell(varID)="data">
								<a
									:href="`/variant.html?variant=${data.item.varID}`"
									>{{ data.item.varId }}</a
								>
							</template>
							<template #head(transcriptId)="data">
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
							<template #cell(transcriptId)="data">
								<a
									v-if="data.item.transcriptId"
									:href="`https://grch37.ensembl.org/Homo_sapiens/Transcript/Summary?db=core;t=${data.item.transcriptId}`"
									target="_blank"
									rel="noopener noreferrer nofollow"
									>{{ data.item.transcriptId }}</a
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
							<template #cell(consequenceTerms)="data">
								<div
									class="border-color"
									:class="data.item.impact"
								>
								<span>{{ data.item.consequenceTerms }}</span>
								</div>
							</template> 
							<template #cell(siftPrediction)="data">
								{{
									siftFormatter(data.item.siftPrediction)
								}}
							</template>
							<template #cell(hgvsc)="data">
								<span>{{ hgvscFormmater(data.item.hgvsc) }}</span>
							</template>
							<template #cell(hgvsp)="data">
								<span>{{ hgvscFormmater(data.item.hgvsp) }}</span>
							</template>
						</b-table>

						<!--<b-table
							v-if="
								row.item.veprecords.length > 0 &&
								showButton === 2
							"
							:items="row.item.veprecords"
							:fields="subFields"
							:per-page="perPagesub"
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
						</b-table> -->

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
				masks:[],
			},
			applyfilter: false,
			disablebtn: {
				HIGH: true,
				MODERATE: true,
				LOW: true,
				MODIFIER: true,
			},
			disablebtnstyle: {
				HIGH: "outline-danger",
                MODERATE: "outline-warning",
				LOW: "outline-success",
				MODIFIER: "outline-secondary",
			},
			masksbtn: {},
			HPOTerms: {
				"HP0000119": "Abnormality of the genitourinary system",
				"HP0000152": "Abnormality of head or neck",
				"HP0000478": "Abnormality of the eye",
				"HP0000598": "Abnormality of the ear",
				"HP0000707": "Abnormality of the nervous system",
				"HP0000769": "Abnormality of the breast",
				"HP0000818": "Abnormality of the endocrine system",
				"HP0001197": "Abnormality of prenatal development or birth",
				"HP0001507": "Growth abnormality",
				"HP0001574": "Abnormality of the integument",
				"HP0001608": "Abnormality of the voice",
				"HP0001626": "Abnormality of the cardiovascular system",
				"HP0001871": "Abnormality of blood and blood-forming tissues",
				"HP0001939": "Abnormality of metabolism/homeostasis",
				"HP0002086": "Abnormality of the respiratory system",
				"HP0002664": "Neoplasm",
				"HP0002715": "Abnormality of the immune system",
				"HP0025031": "Abnormality of the digestive system",
				"HP0025142": "Constitutional symptom",
				"HP0025354": "Abnormal cellular phenotype",
				"HP0033127": "Abnormality of the musculoskeletal system",
				"HP0040064": "Abnormality of limbs",
				"HP0045027": "Abnormality of the thoracic cavity",
				"isControl": "Controls",
			},

			perPage: 10,
			perPageOptions: [10,20,30, 50, 100],
			perPagephenotype: 23,
			perPagesub: 10,
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
					key: "masks",
					label: "Masks",
					sortable: true,
				},
				/*{
					key: "Protein_Position",
					label: "Protein Position",
				},
				{
					key: "Amino_Acids",
					label: "Amino Acids",
				},*/
				{
					key: "HGVSc",
					label: "HGVSc",
				},
				{
					key: "HGVSp",
					label: "HGVSp",
				},
				{
					key: "allelecount",
					label: "Count",
					sortable: true,
					thClass: 'text-right',
    				tdClass: 'text-right',
				},
				{
					key: "allelnumber",
					label: "Number",
					thClass: 'text-right',
    				tdClass: 'text-right',
				},

				{
					key: "allelefrequency",
					label: "Frequency",
					sortable: true,
					thClass: 'text-right',
    				tdClass: 'text-right',
				},
				{
					key: "homozygouscount",
					label: "Homozygous Count",
					sortable: true,
					thClass: 'text-right',
    				tdClass: 'text-right',
				},
				{
					//key: "gnomAD_exomes_AC",
					key: "gnomADg_AC",
					label: "Count",
					sortable: true,
					thClass: 'text-right',
    				tdClass: 'text-right',
				},
				{
					//key: "gnomAD_exomes_AN",
					key: "gnomADg_AN",
					label: "Number",
					sortable: true,
					thClass: 'text-right',
    				tdClass: 'text-right',
				},
				{
					//key: "gnomAD_exomes_AF",
					key: "gnomADg_AF",
					label: "Frequency",
					sortable: true,
					thClass: 'text-right',
    				tdClass: 'text-right',
				},
				{
					key: "view",
					label: "View Additional Data",
					class: "nowrap",
				},
			],
			subFields: [
				{
					//key: "Feature",
					key: "transcriptId",
					label: "Feature",
				},
				/*{
					key: "Protein_Position",
					label: "Position",
				},
				{
					key: "Amino_Acids",
					label: "Amino Acids",
				},*/
				{
					//key: "HGVSc",
					key: "hgvsc",
					label: "HGVSc",
				},
				{
					//key: "HGVSp",
					key: "hgvsp",
					label: "HGVSp",
				},
				{
					//key: "max_consequence",
					key: "consequenceTerms",
					label: "Consequence",
					tdClass: "border-color",
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
			printData: [],
			vepData: [],
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
				this.printData = this.downloadData();
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
		downloadData() {
			let printColumns = ["varID","Max_Impact","max_consequence","HGVSc","HGVSp","allelecount","allelnumber","allelefrequency",
				"homozygouscount","gnomADg_AC","gnomADg_AN","gnomADg_AF",];
			if (this.variantData && this.variantData.length) {
				let downloadData = [];
				for(let i = 0;i<this.variantData.length; i++){
					let obj = {};
					for(let j = 0; j<printColumns.length; j++){
						let idx = printColumns[j];
						obj[idx]=this.variantData[i][idx];
					}
					downloadData[i]=obj;
				}
				return downloadData;
			} else {
				return [];
			} 
		},
		selectAllElements(name, flag) {
			//alert(name);
			const allcheckbox = document.getElementsByName(name);
			//alert(allcheckbox.length);
			for(let c in allcheckbox) {
				if(parseInt(c) >= 0){
					if(flag){
						allcheckbox[c].checked = true;
					} else {
						allcheckbox[c].checked = false;
					}
				}
				
			}
		},
		async searchVariants() {
			//alert("search variant:"+this.gene);
			this.currentPage = 1; //reset on new search
			//Helen 2022-01-09
			//this.variants = await query("variants", this.gene, {}, true);
			//alert("variant-phenotype"+this.gene);
			this.variants = await query(
				"variant-phenotype",
				this.gene,
				{},
				true
			);
			//console.log(JSON.stringify(this.variants));
			if (this.variants && this.variants.length) {
				for (let i = 0; i < this.variants.length; i++) {
					//if (this.variants[i].gnomAD_info){
					//	console.log(JSON.stringify(this.variants[i]));
					//}
					for (let x in Object.keys(this.variants[i])){
						let idx = Object.keys(this.variants[i])[x];
						if (this.variants[i][idx] =='NA'){
							this.variants[i][idx] = "-";
						}
					}
					this.variants[i].varID = this.variants[i].varID.replaceAll("_", ":")
					this.variants[i].varID = this.variants[i].varID.replaceAll("/", ":")
					//"HOM_REF_CT":"1419","GHET_REF_ALT_CTS":"0","TWO_ALT_GENO_CTS":"0","MISSING_CT":"4868"
					this.variants[i].allelecount =2 * parseInt(this.variants[i].TWO_ALT_GENO_CTS) +parseInt(this.variants[i].GHET_REF_ALT_CTS);
					this.variants[i].allelnumber =2 *(parseInt(this.variants[i].HOM_REF_CT) +parseInt(this.variants[i].GHET_REF_ALT_CTS) +parseInt(this.variants[i].TWO_ALT_GENO_CTS));
					//this.variants[i].allelefrequency =this.variants[i].allelecount / this.variants[i].allelnumber;
					//this.variants[i].allelefrequency = this.variants[i].allelefrequency.toExponential(2);
					if (this.variants[i].gnomAD_info) {
						for (let x in Object.keys(this.variants[i].gnomAD_info)){
							let idx = Object.keys(this.variants[i].gnomAD_info)[x];
							if (this.variants[i].gnomAD_info[idx] =='NA'){
								this.variants[i].gnomAD_info[idx] = "-";
							}
						}
						
						this.variants[i].gnomADg_AC = this.variants[i].gnomAD_info.gnomADg_AC;
						this.variants[i].gnomADg_AN = this.variants[i].gnomAD_info.gnomADg_AN;
						this.variants[i].gnomADg_AF = this.variants[i].gnomAD_info.gnomADg_AF;
						//alert("gnomAD_exomes_AC"+this.variants[i].gnomAD_exomes_AC);
					}
					
					for (let m = 0;m < this.variants[i].hprecords.length;m++) {
						let hp = this.variants[i].hprecords[m];
						if (hp.HP.substring(hp.HP.length - 7 ) == "Control") {
							//"HOM_REF_CT":"51","HET_REF_ALT_CTS":"0","TWO_ALT_GENO_CTS":"0","TMISSING_CT":"4868"
							this.variants[i].c_allelecount =(2 * parseInt(hp.TWO_ALT_GENO_CTS)+parseInt(hp.HET_REF_ALT_CTS));
							this.variants[i].allelecount += this.variants[i].c_allelecount;
							this.variants[i].c_allelnumber =2 *(parseInt(hp.HOM_REF_CT) +parseInt(hp.HET_REF_ALT_CTS) +parseInt(hp.TWO_ALT_GENO_CTS));
							this.variants[i].allelnumber += this.variants[i].c_allelnumber;
							this.variants[i].allelefrequency =this.variants[i].allelecount / this.variants[i].allelnumber;
							this.variants[i].allelefrequency = this.variants[i].allelefrequency.toExponential(2);
							//this.variants[i].c_allelefrequency =this.variants[i].c_allelecount / this.variants[i].c_allelnumber;
							//this.variants[i].c_allelefrequency =this.variants[i].c_allelefrequency.toExponential(2);
							//this.variants[i].c_TWO_ALT_GENO_CTS =hp.TWO_ALT_GENO_CTS;
							this.variants[i].homozygouscount = parseInt(this.variants[i].TWO_ALT_GENO_CTS) + parseInt(hp.TWO_ALT_GENO_CTS);
						}
					}

					//disablebtn
					if (this.variants[i].Max_Impact == 'LOWEST'){
						this.variants[i].Max_Impact = 'MODIFIER';
					}
					this.disablebtn[this.variants[i].Max_Impact] = false;

					//masksbtn
					if (this.variants[i].masks != ""){
						let masks = this.variants[i].masks.split(";");
						this.variants[i].masks = masks;
						for(let n = 0; n < masks.length;n++){
							this.masksbtn[masks[n]]=false;
						}
					} else {
						this.variants[i].masks = [];
					}
					
					if (this.variants[i].hprecords.length > 0) {
						let hpdisplay = [];
						let j = 0;

						for (let k = 0;k < this.variants[i].hprecords.length;k++) {
							let hp = this.variants[i].hprecords[k];
							//if (hp.HP != "AllControl") {
								hpdisplay[j] = {};
								//hpdisplay[j].hpoterms = this.HPOTerms[hp.HP];
								hpdisplay[j].hp = hp.HP;
								hpdisplay[j].hpoterms =
									Formatters.snakeFormatter(
										this.HPOTerms[hp.HP]
									);
								hpdisplay[j].allelecount =2 * parseInt(hp.TWO_ALT_GENO_CTS) +parseInt(hp.HET_REF_ALT_CTS);
								hpdisplay[j].allelnumber =2 *(parseInt(hp.HOM_REF_CT) +parseInt(hp.HET_REF_ALT_CTS) +parseInt(hp.TWO_ALT_GENO_CTS));
								hpdisplay[j].allelefrequency =
									this.formatAlleleFrequency(
										parseInt(hpdisplay[j].allelecount),
										parseInt(hpdisplay[j].allelnumber)
									);

								hpdisplay[j].TWO_ALT_GENO_CTS =
									hp.TWO_ALT_GENO_CTS;
								j++;
							//}
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
				this.variantData2 = this.variants;
				this.variantData = this.variants;
				
			}
		},
		async getTranscriptConsequences(varID) {
			//alert(varID);
			if (!!varID) {
				let data = await query("transcript-consequences", varID,{}, true);
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
		hgvscFormmater(hgvsc){
			if (hgvsc.length > 18) {
				return hgvsc.substring(18);
			} else {
				//return hgvsc;
				return "";
			}
		},
		siftFormatter(name) {
			return Formatters.snakeFormatter(name);
		},
		async showVariantData(varID) {
			//alert("showVariantData");
            let escapedVarID = this.escapedVarID(varID);

            if (this.vepData[escapedVarID] === undefined) {
                this.loadingData[escapedVarID] = true;
                let tcQuery = await this.getTranscriptConsequences(varID);
                Vue.set(this.vepData, escapedVarID, tcQuery);
                this.loadingData[escapedVarID] = false;
            }
        },
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
			//let dataRows = this.variants;
			//this.variantData = this.variantData2;
			//alert(this.filters["masks"]);
			let dataRows = [];
			for (let i = 0 ; i < this.variantData2.length; i++){
				dataRows[i]=this.variantData2[i];
			}
			//alert(dataRows.length);
			if (this.filters["impacts"].length > 0) {
				dataRows = dataRows.filter((item) =>
					this.filters["impacts"].includes(item.Max_Impact)
				);
			}
			if (this.filters["masks"].length > 0) {
				for(let m = 0; m < this.filters["masks"].length;m++){
					let mask = this.filters["masks"][m];
					dataRows = dataRows.filter((item) =>
						//this.filters["masks"].includes(item.masks)
						item.masks.includes(mask)
					);
				}
				
			}
			if (this.filters["phenotypes"].length > 0) {
				for (let i = dataRows.length - 1; i >=0; i--) {
					dataRows[i].hpdisplay = dataRows[i].hpdisplay2;
					dataRows[i].hpdisplay = dataRows[i].hpdisplay.filter((v) =>
						this.filters["phenotypes"].includes(v.hp)
					);
					let count =0;
					for (let j =0 ; j< dataRows[i].hpdisplay.length; j++){
						let hp = dataRows[i].hpdisplay;
						let hcount = hp[j]
						count = count + hcount.allelecount;
					}
					if (count == 0){
						dataRows.splice(i, 1);
					}
				}
			} else {
				for (let i = 0; i < dataRows.length; i++) {
					dataRows[i].hpdisplay = dataRows[i].hpdisplay2;
				}
			}
			this.variantData = dataRows;
			//alert(dataRows.length);
			//alert(this.variantData.length+'|'+this.variantData2.length);
			return this.tableData;
		},
		sort: function (s) {
			//if s == current sort, reverse
			//console.log("sort", this.currentSort);
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
				//alert("variant search watch:"+this.gene);	
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
