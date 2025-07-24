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
				<template #cell(varid)="data">
					<a :href="`/variant.html?variant=${data.item.varid}`" target="_blank">{{
						data.item.varid
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
				<template #cell(allelecount)="data">
                    <div align="right">{{ data.item.allelecount }}</div>
                </template>
                <template #cell(allelnumber)="data">
                    <div align="right">{{ data.item.allelnumber }}</div>
                </template>
                <template #cell(allelefrequency)="data">
                    <div align="right">
                        {{ formatAlleleFrequency(data.item.allelefrequency) }}
                    </div>
                </template>
                <template #cell(homozygouscount)="data">
                    <div align="right">{{ data.item.homozygouscount }}</div>
                </template>
                <template #cell(gnomAD_exomes_AC)="row">
                    <div align="right">
                        {{ row.item.gnomAD_exomes_AC }}
                    </div>
                </template>
                <template #cell(gnomAD_exomes_AN)="row">
                    <div align="right">
                        {{ row.item.gnomAD_exomes_AN }}
                    </div>
                </template>
                <template #cell(gnomAD_exomes_AF)="row">
                    <div align="right">
                        {{ format_freq(row.item.gnomAD_exomes_AF) }}
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
				"Sensitive": "Steroid Sensitive Nephrotic Syndrome",
                "AdultSensitive": "Steroid Sensitive Nephrotic Syndrome (Adult)",
                "PediatricSensitive":
                    "Steroid Sensitive Nephrotic Syndrome (Pediatric)",
                "Uncategorized": "Uncategorized Nephrotic Syndrome",
                "AdultUncategorized": "Uncategorized Nephrotic Syndrome (Adult)",
                "PediatricUncategorized":
                    "Uncategorized Nephrotic Syndrome (Pediatric)",
                "Resistant": "Steroid Resistant Nephrotic Syndrome",
                "AdultResistant": "Steroid Resistant Nephrotic Syndrome (Adult)",
                "PediatricResistant":
                    "Steroid Resistant Nephrotic Syndrome (Pediatric)",
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
					key: "varid",
					label: "Variant (HG38)",
				},
				{
					key: "gene",
					//key: "NEAREST",
					label: "Gene",
				},
				{
					key: "max_consequence",
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
				},
				{
					key: "trioinfo2",
					label: "Inheritance",
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
					key: "c_allelecount",
					label: "Count",
					sortable: true,
					thClass: 'text-right',
    				tdClass: 'text-right',
				},
				{
					key: "c_allelnumber",
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
					key: "gnomAD_exomes_AC",
					label: "Count",
					sortable: true,
					thClass: 'text-right',
    				tdClass: 'text-right',
				},
				{
					//key: "gnomAD_exomes_AN",
					key: "gnomAD_exomes_AN",
					label: "Number",
					sortable: true,
					thClass: 'text-right',
    				tdClass: 'text-right',
				},
				{
					//key: "gnomAD_exomes_AF",
					key: "gnomAD_exomes_AF",
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
			let printColumns = ["varid","gene","Max_Impact","max_consequence","HGVSc","HGVSp","c_allelecount","c_allelnumber","allelefrequency",
				"homozygouscount","gnomAD_exomes_AC","gnomAD_exomes_AN","gnomAD_exomes_AF"];
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
			console.log("varient search");
			this.currentPage = 1;
			var genes = this.$refs.selectedgenes.getValue();
			console.log("genes: "+ genes);
			var vs = [];
			this.variants = [];
			for (var i = 0; i< genes.length; i++) {
				var gene = genes[i];
				vs[i] = await query("variants",gene,{},true);
				console.log(gene + " variants "+ i + ": "+ vs[i].length);
				if (vs[i] && vs[i].length){
					this.variants = this.variants.concat(vs[i]);
				}
			}
			console.log("variants: "+this.variants.length);
			
			if (this.variants && this.variants.length) {
                this.variantData = structuredClone(this.variants); //copy data

                //add showButton property to each variant
                this.variantData.map((variant) => {
                    variant.showButton = 0;
                });

                for (let i = 0; i < this.variants.length; i++) {
                    //get data from HP record AllSamples
                    let AllSamples = this.variants[i].hprecords.find(
                        (x) => x.HP === "AllSamples"
                    );
                    //copy all properties from AllSamples to variants[i]
                    for (let prop in AllSamples) {
                        this.variants[i][prop] = AllSamples[prop];
                    }

                    this.variants[i].allelecount =
                        2 * parseInt(AllSamples.n_hom_var_case) +
                        parseInt(AllSamples.n_het_case);
                    this.variants[i].allelnumber =
                        2 *
                        (parseInt(AllSamples.n_hom_ref_case) +
                            parseInt(AllSamples.n_het_case) +
                            parseInt(AllSamples.n_hom_var_case));
                    //this.variants[i].allelefrequency =this.variants[i].allelecount / this.variants[i].allelnumber;
                    //this.variants[i].allelefrequency = this.variants[i].allelefrequency.toExponential(2);
                    if (this.variants[i].gnomAD_info) {
                        this.variants[i].gnomAD_exomes_AC =
                            this.variants[i].gnomAD_info.gnomADg_AC;
                        this.variants[i].gnomAD_exomes_AN =
                            this.variants[i].gnomAD_info.gnomADg_AN;
                        this.variants[i].gnomAD_exomes_AF =
                            this.variants[i].gnomAD_info.gnomADg_AF;
                        //alert("gnomAD_exomes_AC"+this.variants[i].gnomAD_exomes_AC);
                    }

                    for (
                        let m = 0;
                        m < this.variants[i].hprecords.length;
                        m++
                    ) {
                        let hp = this.variants[i].hprecords[m];
                        if (hp.HP == "AllSamples") {
                            this.variants[i].c_allelecount =
                                2 * parseInt(hp.n_hom_var_case) +
                                parseInt(hp.n_het_case);
                            this.variants[i].allelecount +=
                                this.variants[i].c_allelecount;
                            this.variants[i].c_allelnumber =
                                2 *
                                (parseInt(hp.n_hom_ref_case) +
                                    parseInt(hp.n_het_case) +
                                    parseInt(hp.n_hom_var_case));
                            this.variants[i].allelnumber +=
                                this.variants[i].c_allelnumber;
                            this.variants[i].allelefrequency =
                                this.variants[i].c_allelecount /
                                this.variants[i].c_allelnumber;
                            // this.variants[i].allelefrequency =
                            //     this.variants[i].allelefrequency.toExponential(
                            //         2
                            //     );
                            //this.variants[i].c_allelefrequency =this.variants[i].c_allelecount / this.variants[i].c_allelnumber;
                            //this.variants[i].c_allelefrequency =this.variants[i].c_allelefrequency.toExponential(2);
                            //this.variants[i].c_TWO_ALT_GENO_CTS =hp.n_hom_var_case;
                            this.variants[i].homozygouscount = parseInt(
                                hp.n_hom_var_case
                                //this.variants[i].n_hom_var_case
                            );
                        }
                    }
                    //do we need vep count?
                    //this.variants[i].vep = this.variants[i].veprecords.length;
                    if (this.variants[i].veprecords.length > 0) {
                        let varrecords = this.variants[i].veprecords;

                        for (let j = 0; j < varrecords.length; j++) {
                            if (varrecords[j].PICK === true) {
                                this.variants[i].Gene_Symbol =
                                    varrecords[j].Gene_Symbol;
                                this.variants[i].Max_Impact =
                                    varrecords[j].IMPACT;
                                if (this.variants[i].Max_Impact == "LOWEST") {
                                    this.variants[i].Max_Impact = "MODIFIER";
                                }

                                this.variants[i].max_consequence =
                                    varrecords[j].Consequence;
                                this.variants[i].Protein_Position =
                                    varrecords[j].Protein_position;
                                this.variants[i].Amino_Acids =
                                    varrecords[j].Amino_acids;

								this.variants[i].gene =
                                    varrecords[j].NEAREST;

                                this.disablebtn[
                                    this.variants[i].Max_Impact
                                ] = false;

                                this.variants[i].HGVSc = varrecords[j].HGVSc;
                                this.variants[i].HGVSp = varrecords[j].HGVSp;
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
                            //if (hp.HP != "AllControl") {
                            hpdisplay[j] = {};
                            //hpdisplay[j].hpoterms = this.HPOTerms[hp.HP];
                            hpdisplay[j].hp = hp.HP;
                            hpdisplay[j].HP = Formatters.snakeFormatter(
                                this.HPOTerms[hp.HP]
                            );
                            hpdisplay[j].allelecount =
                                2 * hp.n_hom_var_case + hp.n_het_case;
                            hpdisplay[j].allelnumber =
                                2 *
                                (hp.n_hom_ref_case +
                                    hp.n_het_case +
                                    hp.n_hom_var_case);
                            hpdisplay[j].allelefrequency =
                                this.calculateAlleleFrequency(
                                    hpdisplay[j].allelecount,
                                    hpdisplay[j].allelnumber
                                );

                            hpdisplay[j].n_hom_var_case = hp.n_hom_var_case;
                            j++;
                            //}
                        }
                        //no longer sort by allelecount
                        // hpdisplay = hpdisplay.sort(function (a, b) {
                        //     //console.log(a.allelecount+"|"+b.allelecount+"|"+(a.allelecount>b.allelecount));
                        //     if (a.allelecount > b.allelecount) {
                        //         return -1;
                        //     } else if (a.allelecount < b.allelecount) {
                        //         return 1;
                        //     }
                        //     return 0;
                        // });
                        let sortOrder = [
                            "AllSamples",
                            "Resistant",
                            "PediatricResistant",
                            "AdultResistant",
                            "Sensitive",
                            "PediatricSensitive",
                            "AdultSensitive",
                            "Uncategorized",
                            "PediatricUncategorized",
                            "AdultUncategorized",
                            "Healthy",
                            "AllNephroticSyndCases",
                        ];
                        hpdisplay = hpdisplay.sort(function (a, b) {
                            return (
                                sortOrder.indexOf(a.hp) -
                                sortOrder.indexOf(b.hp)
                            );
                        });
                        this.variants[i].hpdisplay2 = hpdisplay;
                        this.variants[i].hpdisplay = hpdisplay;
                    }
                }
				console.log("before clone: "+this.variants.length);
				this.variantData2 = structuredClone(this.variants);
				this.variantData = structuredClone(this.variants);
                //if default filters are set, filter the variants
                /*if (
                    this.filters.impacts.length > 0 ||
                    this.filters.phenotypes.length > 0
                ) {
                    this.addfilter();
                }*/
            }
			this.addfilter();
			
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
			if (hgvsc != null && hgvsc.length > 18) {
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
		format_freq(frequency) {
            return frequency?.toFixed(5) || "";
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
		calculateAlleleFrequency(count, number) {
            if (count === 0 || number === 0) return "";
            else return count / number;
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
			let dataRows = structuredClone(this.variantData2);
			console.log(dataRows.length);
			
			if (this.filters["impacts"].length > 0) {
				console.log("filter impacts: "+ this.filters["impacts"]);
				dataRows = dataRows.filter((item) =>
					this.filters["impacts"].includes(item.Max_Impact)
				);
			}
			/*if (this.filters["masks"].length > 0) {
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
				
			}*/
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
