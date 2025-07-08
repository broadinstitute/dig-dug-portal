<template>
	<div id="multigene-search">
		<b-row>
			<b-col>
				<div id="filter_pop_up_example">
					<div id="filter_pop_up" class="hidden">
						<div>
							<form>
								<fieldset>
									<h6>Select genes:</h6>
									<div style="
											padding-left: 15px;
											margin-bottom: 15px;
										">
										<research-multi-search
											ref="selectedgenes"
										></research-multi-search>
										<!-- <div class="region-search col filter-col-md">
											
											<research-multi-search
												ref="selectedgenes"
												:single-multi-config="null"
												:phenotypes="$parent.phenotypesInSession"
												:utils="$parent.utilsBox"
											></research-multi-search>
										</div> -->
									</div>
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
								</fieldset>
							</form>
						</div>
						<div>
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
									//addfilter();
									searchVariants();
									showHideElement('filter_pop_up');
								"
								>Apply filter</b-btn
							>
						</div>
						</div>
					</div>
				</div>
			</b-col>
			
			<b-col class="text-right">
				<b-btn
                    class="btn-mini showData"
					@click="
						showHideElement('filter_pop_up');
					"
					><span>Search Data</span>
                    </b-btn> &nbsp;
				<csv-download
					class="btn-mini showData"
					:data="printData"
					filename="variants"
				></csv-download>
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
						<b-th colspan="5"
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
				<template #cell(varId)="data">
					<a :href="`/variant.html?variant=${data.item.varId}`" target="_blank">{{
						data.item.varId
					}}</a> </template
				><template #cell(dbSNP)="data">
					<a :href="`/variant.html?variant=${data.item.dbSNP}`">{{
						data.item.dbSNP
					}}</a>
				</template>
				<template #cell(consequence)="data">
					<div
						v-if="data.item.impact"
						class="border-color"
						:class="data.item.impact"
					>
						{{ consequenceFormatter(data.item.consequence) }}
					</div>
					<div v-else class="border-color NONE"></div>
				</template>
				<template #cell(hgvsc)="data">
					<span>{{ hgvscFormmater(data.item.hgvsc) }}</span>
				</template>
				<template #cell(hgvsp)="data">
					<span>{{ hgvscFormmater(data.item.hgvsp) }}</span>
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

import ResearchMultiSearch from "@/components/researchPortal/ResearchMultiSearch.vue";

//import PhenotypePicker from "@/components/PhenotypePicker.vue";
//import FilterWrapper from "@/portals/Neph/components/FilterWrapper.vue";
//import Multiselect from 'vue-multiselect';

import uiUtils from "@/utils/uiUtils";

// register globally
//Vue.component('multiselect', Multiselect)

export default Vue.component("multi-gene-download-form", {
	components: {
		CriterionListGroup,
		FilterEnumeration,
		Documentation,
		TooltipDocumentation,
		Formatters,
		CsvDownload,
		ResearchMultiSearch,
		//PhenotypePicker,
		//FilterWrapper,
	},
	props: {
		genes: [Array],
	},
	data() {
		return {
			myValue:'',
			filters: {
				impacts: ['HIGH','MODERATE'], //['HIGH','MODERATE','LOW'],
				trioinfos: [],
				phenotypes: [],
				masks:[],
			},
			applyfilter: false,
			disablebtn: {
				//HIGH: true,
				//MODERATE: true,
				//LOW: true,
				//MODIFIER: true,
				HIGH: false,
				MODERATE: false,
				LOW: false,
				MODIFIER: false,
			},
			disablebtnstyle: {
				HIGH: "outline-danger",
                MODERATE: "outline-warning",
				LOW: "outline-success",
				MODIFIER: "outline-secondary",
			},
			masksbtn: {},
			trioinfobtn: {},
			masksDescription: {
                "LoF_HC": { description: "LofTee", sort: 0 },
                "15of15": { description: "15/15", sort: 1 },
                "11of11": { description: "11/11 ", sort: 2 },
                "5of5": { description: "5/5", sort: 3 },
                "5of5_LoF_LC_1pct": { description: "5/5 + LofTee LC 1%", sort: 4 },
                "1of5_1pct": { description: "5/5 + 1/5 1%", sort: 5 },
                "0of5_1pct": { description: "5/5 + 0/5 1%", sort: 6 },
				"0of5": { description: "0/5", sort: 7 },
                "1of5_noLoF": { description: "1/5 - LoFTee", sort: 8 },
                "5of5_noLoF": { description: "5/5 - LofTee", sort: 10 },
				//"5of5": { description: "5/5", sort: 3 },
				//"5of5_LoF_LC": { description: "5/5 + LofTee LC", sort: 4 },
                //"1of5_1pct": { description: "5/5 + 1/5 1%", sort: 5 },
                //"0of5_1pct": { description: "5/5 + 0/5 1% ", sort: 6 },
                //"0of5": { description: "5/5 + 0/5 ", sort: 7 },
                //"1of5_noLoF": { description: "5/5 + 1/5 noLoF", sort: 8 },
                //"5of5_noLoF": { description: "5/5 + 1/5 noLoF", sort: 10 }
				
            },
			HPOTerms: {
				"HP-0000009":"Functional abnormality of the bladder",
                "HP-0000020":"Urinary incontinence",
                "HP-0000079":"Abnormality of the urinary system",
                "HP-0000095":"Abnormal renal glomerulus morphology",
                "HP-0000118":"Phenotypic abnormality",
                "HP-0000119":"Abnormality of the genitourinary system",
                "HP-0000152":"Abnormality of head or neck",
                "HP-0000359":"Abnormality of the inner ear",
                "HP-0000407":"Sensorineural hearing impairment",
                "HP-0000478":"Abnormality of the eye",
                "HP-0000486":"Strabismus",
                "HP-0000598":"Abnormality of the ear",
                "HP-0000707":"Abnormality of the nervous system",
                "HP-0000709":"Psychosis",
                "HP-0000716":"Depressivity",
                "HP-0000717":"Autism",
                "HP-0000725":"Psychotic episodes",
                "HP-0000738":"Hallucinations",
                "HP-0000769":"Abnormality of the breast",
                "HP-0000787":"Nephrolithiasis",
                "HP-0000795":"Abnormality of the urethra",
                "HP-0000818":"Abnormality of the endocrine system",
                "HP-0000826":"Precocious puberty",
                "HP-0001197":"Abnormality of prenatal development or birth",
                "HP-0001388":"Joint laxity",
                "HP-0001507":"Growth abnormality",
                "HP-0001574":"Abnormality of the integument",
                "HP-0001608":"Abnormality of the voice",
                "HP-0001622":"Premature birth",
                "HP-0001626":"Abnormality of the cardiovascular system",
                "HP-0001679":"Abnormal aortic morphology",
                "HP-0001699":"Sudden death",
                "HP-0001871":"Abnormality of blood and blood-forming tissues",
                "HP-0001877":"Abnormal erythrocyte morphology",
                "HP-0001903":"Anemia",
                "HP-0001939":"Abnormality of metabolism/homeostasis",
                "HP-0001945":"Fever",
                "HP-0002028":"Chronic diarrhea",
                "HP-0002032":"Esophageal atresia",
                "HP-0002086":"Abnormality of the respiratory system",
                "HP-0002088":"Abnormal lung morphology",
                "HP-0002110":"Bronchiectasis",
                "HP-0002186":"Apraxia",
                "HP-0002197":"Generalized-onset seizure",
                "HP-0002533":"Abnormal posturing",
                "HP-0002589":"Gastrointestinal atresia",
                "HP-0002664":"Neoplasm",
                "HP-0002715":"Abnormality of the immune system",
                "HP-0002836":"Bladder exstrophy",
                "HP-0003011":"Abnormality of the musculature",
                "HP-0004322":"Short stature",
                "HP-0004386":"Gastrointestinal inflammation",
                "HP-0005341":"Autonomic bladder dysfunction",
                "HP-0005528":"Bone marrow hypocellularity",
                "HP-0007018":"Attention deficit hyperactivity disorder",
                "HP-0008373":"Puberty and gonadal disorders",
                "HP-0008443":"Spinal deformities",
                "HP-0009826":"Limb undergrowth",
                "HP-0011035":"Abnormal renal cortex morphology",
                "HP-0012639":"Abnormal nervous system morphology",
                "HP-0020110":"Bone fracture",
                "HP-0025031":"Abnormality of the digestive system",
                "HP-0025142":"Constitutional symptom",
                "HP-0025354":"Abnormal cellular phenotype",
                "HP-0031263":"Abnormal renal corpuscle morphology",
                "HP-0033127":"Abnormality of the musculoskeletal system",
                "HP-0040064":"Abnormality of limbs",
                "HP-0040069":"Abnormal lower limb bone morphology",
                "HP-0045027":"Abnormality of the thoracic cavity",
                "HP-0100021":"Cerebral palsy",
                "HP-0100280":"Crohn's disease",
                "HP-0100820":"Glomerulopathy",
                "HP-0200134":"Epileptic encephalopathy",
				"isControl": "Controls",
				"isUnknown": "Unknown phenotype",
			},

			perPage: 100,
			perPageOptions: [10,20,30, 50, 100,500,1000],
			perPagephenotype:74,
			perPagesub: 10,
			currentPage: 1,
			showButton: null,
			variants: [],
			consequences: {},
			currentSort: "allelecount",
			currentSortDir: "desc",
			fields: [
				{
					key: "varId",
					label: "Variant (HG38)",
				},
				{
					key: "gene",
					label: "Gene",
				},
				{
					key: "consequence",
					label: "Consequence",
					tdClass: "border-color",
				},
				/*{
					key: "masks",
					label: "Masks",
					sortable: true,
				},
				{
					key: "Protein_Position",
					label: "Protein Position",
				},
				{
					key: "Amino_Acids",
					label: "Amino Acids",
				},*/
				{
					key: "trioinfo2",
					label: "Inheritance",
				},
				{
					key: "hgvsc",
					label: "HGVSc",
				},
				{
					key: "hgvsp",
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
				/*{
					key: "view",
					label: "View Additional Data",
					class: "nowrap",
				},*/
			],
			variantData: [],
			loadingData: {},
			printData: [],
			vepData: [],
			sampleData: [],
			geneFeatures:["Default"],
			selectedFeature: "Default",
		};
	},
	created() {
		/*if (this.genes) {
			this.searchVariants();
		}*/
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
			if (this.tableData) return this.tableData.length;
		},
		
	},
	methods: {
		...uiUtils,
		showHideElement(ELEMENT) {
			uiUtils.showHideElement(ELEMENT);
		},
		downloadData() {
			let printColumns = ["varId","gene","impact","consequence","hgvsc","hgvsp","allelecount","allelnumber","allelefrequency",
				"homozygouscount","gnomADg_AC","gnomADg_AN","gnomADg_AF"];
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
		/*async updateFeatures() {
			console.log("update features: " + this.selectedFeature);
			if (this.selectedFeature != "Default"){
				let searchquery = this.genes+"+"+this.selectedFeature;
				let selectedVep = await query("transcript-consequences-gene",searchquery,{},true);
				//console.log(JSON.stringify(selectedVep));
				//console.log(this.variantData2.length);
				//console.log(this.variantData.length);

				let dataRows = structuredClone(this.variants);
				
				for (let i=0; i< dataRows.length; i++){
					let varId = dataRows[i]['varId'];
					for (let j=0;j<selectedVep.length; j++){
						let varId2 = selectedVep[j]['varId'];
						//console.log(varId+"|"+varId2);
						if (varId == varId2){
							//console.log(varId);
							dataRows[i]['consequence'] = selectedVep[j]['consequenceTerms'];
							dataRows[i]['impact'] = selectedVep[j]['impact'];
							dataRows[i]['hgvsc'] = selectedVep[j]['hgvsc'];
							dataRows[i]['hgvsp'] = selectedVep[j]['hgvsp'];
							//dataRows[i]['hgvsp'] = 'testteststestsetse:testteststestsetse';
						}
					}
				}
				this.variantData2 = dataRows;
			} else {
				this.variantData2 = structuredClone(this.variants);
			}
			this.addfilter();
		},*/
		async searchVariants() {
			console.log("varient search");
			this.currentPage = 1;
			var genes = this.$refs.selectedgenes.getValue();
			console.log("genes: "+ genes);
			var vs = [];
			this.variants = [];
			for (var i = 0; i< genes.length; i++) {
				var gene = genes[i];
				vs[i] = await query("gene-variants2",gene,{},true);
				console.log(gene + " variants "+ i + ": "+ vs[i].length);
				if (vs[i] && vs[i].length){
					this.variants = this.variants.concat(vs[i]);
				}
			}
			//console.log("variants: "+this.variants.length);
			if (this.variants && this.variants.length) {
				for (let i = 0; i < this.variants.length; i++) {
					for (let x in Object.keys(this.variants[i])){
						let idx = Object.keys(this.variants[i])[x];
						if (this.variants[i][idx] =='NA'){
							this.variants[i][idx] = "-";
						}
					}
					this.variants[i].varId = this.variants[i].varId.replaceAll("_", ":")
					this.variants[i].varId = this.variants[i].varId.replaceAll("/", ":")
					//"HOM_REF_CT":"1419","GHET_REF_ALT_CTS":"0","TWO_ALT_GENO_CTS":"0","MISSING_CT":"4868"
					this.variants[i].allelecount =2 * parseInt(this.variants[i].twoAlterGenoCount) +parseInt(this.variants[i].herterozygousAltCount);
					this.variants[i].allelnumber =2 *(parseInt(this.variants[i].homozygousCount) +parseInt(this.variants[i].herterozygousAltCount) +parseInt(this.variants[i].twoAlterGenoCount));
					this.variants[i].allelefrequency =this.variants[i].allelecount / this.variants[i].allelnumber;
					this.variants[i].allelefrequency = this.variants[i].allelefrequency.toExponential(2);
					this.variants[i].homozygouscount = parseInt(this.variants[i].twoAlterGenoCount);
					if (this.variants[i].gnomADInfo) {
						for (let x in Object.keys(this.variants[i].gnomADInfo)){
							let idx = Object.keys(this.variants[i].gnomADInfo)[x];
							if (this.variants[i].gnomADInfo[idx] =='NA'){
								this.variants[i].gnomADInfo[idx] = "-";
							}
						}
						
						this.variants[i].gnomADg_AC = this.variants[i].gnomADInfo.gnomADg_AC;
						this.variants[i].gnomADg_AN = this.variants[i].gnomADInfo.gnomADg_AN;
						this.variants[i].gnomADg_AF = this.variants[i].gnomADInfo.gnomADg_AF;
						//alert("gnomAD_exomes_AC"+this.variants[i].gnomAD_exomes_AC);
					}
					
					//disablebtn
					if (this.variants[i].impact == 'LOWEST'){
						this.variants[i].impact = 'MODIFIER';
					}
					this.disablebtn[this.variants[i].impact] = false;

					//masksbtn
					if (this.variants[i].masks != ""){
						let masks = [];
						if (typeof masks ==="string"){
							masks = this.variants[i].masks.split(";");
						}
						this.variants[i].masks = masks;
						for(let n = 0; n < masks.length;n++){
							//if (!masks[n].includes("noLoF") && (!masks[n].includes("LoF_LC"))){
								this.masksbtn[masks[n]]=false;
							//}
							
						}
					} else {
						this.variants[i].masks = [];
					}
					//trioinfo
					//console.log(this.variants[i]);
					if ("trioinfo" in this.variants[i] && this.variants[i].trioinfo != ""){
						//console.log(this.variants[i].trioinfo[0]);
						let ts =[];
						if (typeof this.variants[i].trioinfo === "string"){
							ts= this.variants[i].trioinfo.split(",");
						}
						//console.log(ts);
						this.variants[i].trioinfo2 = this.variants[i].trioinfo;
						this.variants[i].trioinfo = ts;
						for(let n = 0; n < ts.length;n++){
							//if (!masks[n].includes("noLoF") && (!masks[n].includes("LoF_LC"))){
								this.trioinfobtn[ts[n]]=false;
							//}
							
						}
					} else {
						this.variants[i].trioinfo = [];
					}
					
					
					if (this.variants[i].hprecords.length > 0) {
						let hpdisplay = [];
						let j = 0;
						for (let k = 0;k < this.variants[i].hprecords.length;k++) {
							let hp = this.variants[i].hprecords[k];
							//let allelecount = 2 * parseInt(hp.TWO_ALT_GENO_CTS) +parseInt(hp.HET_REF_ALT_CTS);
							//if (allelecount > 0) {
								hpdisplay[j] = {};
								//hpdisplay[j].hpoterms = this.HPOTerms[hp.HP];
								hpdisplay[j].hp = hp.phenotype;
								//console.log(hpdisplay[j].hp);
								//hp.HP = hp.HP.replace("-","");
								hpdisplay[j].hpoterms =
									Formatters.snakeFormatter(
										this.HPOTerms[hp.phenotype]
									);
								hpdisplay[j].allelecount =2 * parseInt(hp.twoAlterGenoCount) +parseInt(hp.herterozygousAltCount);
								hpdisplay[j].allelnumber =2 *(parseInt(hp.homozygousCount) +parseInt(hp.herterozygousAltCount) +parseInt(hp.twoAlterGenoCount));
								hpdisplay[j].allelefrequency =
									this.formatAlleleFrequency(
										parseInt(hpdisplay[j].allelecount),
										parseInt(hpdisplay[j].allelnumber)
									);

								hpdisplay[j].twoAlterGenoCount =
									hp.twoAlterGenoCount;
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
						hpdisplay = hpdisplay.filter((item) =>
							item.allelecount > 0
						);
						this.variants[i].hpdisplay2 = hpdisplay;
						this.variants[i].hpdisplay = hpdisplay;
						this.variants[i].hpdisplay = this.variants[i].hpdisplay.filter((item) =>
							item.allelecount > 0
						);
					}
					
				}
				
				//alert(this.variants.length);
				//filter out allele count = 0 
				//20241205 temper block
				this.variants = this.variants.filter((item) =>
					item.allelecount > 0
				); 
				//alert(this.variants.length);
				this.variantData2 = structuredClone(this.variants);
				this.variantData = structuredClone(this.variants);
				
			}
			this.addfilter();
			//this.disablebtn[this.variants[i].Max_Impact] = false;
			/*if (this.filters["impacts"].length > 0) {
				for(let i=this.filters["impacts"].length-1 ; i>=0;i--){
					if (this.disablebtn[this.filters["impacts"][i]] == true) {
						//console.log("delete");
						this.filters["impacts"].splice(i, 1);
					}
				}
			} */
			console.log("variant search done");
		},
		async getTranscriptConsequences(varId) {
			//alert(varID);
			if (!!varId) {
				let data = await query("transcript-consequences", varId,{query_private:true}, true);
				return data;
			}
		},
		async getVariantSamples(varId) {
			//alert(varID);
			if (!!varId) {
				let data = await query("variant-sample", varId,{query_private:true}, true);
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
				let strs = hgvsc.split(":");
				//return strs[1];
				hgvsc = decodeURIComponent(strs[1]);
				//console.log(hgvsc);
				return hgvsc;
				//return hgvsc.substring(18);
			} else {
				//return hgvsc;
				return "";
			}
		},
		siftFormatter(name) {
			return Formatters.snakeFormatter(name);
		},
		async showVariantData(varId) {
			//alert("showVariantData");
            let escapedVarID = this.escapedVarID(varId);

            if (this.vepData[escapedVarID] === undefined) {
                this.loadingData[escapedVarID] = true;
                let tcQuery = await this.getTranscriptConsequences(varId);
                Vue.set(this.vepData, escapedVarID, tcQuery);
                this.loadingData[escapedVarID] = false;
            }
        },
		async showSampleData(varId){
			let escapedVarID = this.escapedVarID(varId);
			if (this.vepData[escapedVarID] === undefined) {
                this.loadingData[escapedVarID] = true;
                let vsQuery = await this.getVariantSamples(varId);
				
				let user = Vue.prototype.$useremail.toLowerCase();
				let accessgroup = Vue.prototype.$sampleIDaccess;
				
				let oldsampleid = [];
				let m=0;
				for(var i=vsQuery.length-1; i>=0; i--){
					if (oldsampleid.indexOf(vsQuery[i]['sample_ID']) >= 0) {
						vsQuery.splice(i, 1);
					} else {
						oldsampleid[m] = vsQuery[i]['sample_ID'];
						m++;
						
						if (! accessgroup.includes(user)){
							//if (!this.variantsample[n]['sample_ID'].startsWith('BCH') || this.variantsample[n]['investigator']=='clinical_sequencing'){
							//if (vsQuery[i]['inCRDC']=="no"){
								//console.log(vsQuery[i]['sample_ID']);
							//	vsQuery[i]['sample_ID'] = '******';
							//}
						}
					}
					
				}
				Vue.set(this.sampleData, escapedVarID, vsQuery);
                this.loadingData[escapedVarID] = false;
            }
		},                  
        escapedVarID(varId) {
			if (!!varId) return varId.replace(/:\s*/g, "_");
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
			console.log("addfilter");
			//let dataRows = this.variants;
			//this.variantData = this.variantData2;
			//alert(this.filters["trioinfos"]);
			
			//console.log(this.variantData2.length);
			let dataRows = structuredClone(this.variantData2);
			//let dataRows = [];
			/*for (let i = 0 ; i < this.variantData2.length; i++){
				dataRows[i]=this.variantData2[i];
			}*/
			console.log(dataRows.length);
			if (this.filters["impacts"].length > 0) {
				dataRows = dataRows.filter((item) =>
					this.filters["impacts"].includes(item.impact)
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
			if (this.filters["trioinfos"].length > 0) {
				for(let m = 0; m < this.filters["trioinfos"].length;m++){
					let t = this.filters["trioinfos"][m];
					dataRows = dataRows.filter((item) =>
						//this.filters["masks"].includes(item.masks)
						item.trioinfo.includes(t)
					);
				}
				
			}
			if (this.filters["phenotypes"].length > 0) {
				console.log("phenotypes: "+ this.filters["phenotypes"]);
				for (let i = dataRows.length - 1; i >=0; i--) {
					dataRows[i].hpdisplay = dataRows[i].hpdisplay2;
					/*dataRows[i].hpdisplay = dataRows[i].hpdisplay.filter((v) =>
						this.filters["allelecount"] > 0
					);*/
					dataRows[i].hpdisplay = dataRows[i].hpdisplay.filter((v) =>
						this.filters["phenotypes"].includes(v.hp)
					);
					let count =0;
					for (let j =0 ; j< dataRows[i].hpdisplay.length; j++){
						let hp = dataRows[i].hpdisplay;
						let hcount = hp[j];
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
			console.log(dataRows.length);
			console.log(this.variantData.length+'|'+this.variantData2.length);
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
		selectedFeature: {
			handler(val) {
				//alert("selected feature watch:"+val);		
				if (!!val) this.updateFeatures();			
			},
		}
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
