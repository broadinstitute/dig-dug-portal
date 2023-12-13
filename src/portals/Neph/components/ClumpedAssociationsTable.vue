<template>
    <div id="clump-associations">
        <b-row class="mb-2">
            <b-col class="text-right">
				<b-btn
					class="btn btn-secondary btn-sm"
					@click="showHideElement('filter_pop_up')"
					>Filter Results</b-btn
				>
			<!--</b-col>
            <b-col class="text-right"> -->
                <csv-download
                    :data="associations"
                    filename="clumped-associations"
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
									<div>
										<h6>Select Consequence</h6>
										<b-btn
											class="btn btn-secondary btn-sm"
											@click="selectAllElements('consequence', true)"
											>Select All</b-btn
										>&nbsp;
										<b-btn
											class="btn btn-secondary btn-sm"
											@click="selectAllElements('consequence', false)"
											>Unselect All</b-btn
										>
									</div>
									
									<div style="padding-left: 15px">
										<tamplate v-for="value in this.consequences">
											<b-form-checkbox
												name="consequence"
												v-model="filters['consequence']"
												:value="value"
												>{{ value }}</b-form-checkbox
											>
										</tamplate>
									</div>
                                    <div>
										<h6>Select Inheritance</h6>
										<b-btn
											class="btn btn-secondary btn-sm"
											@click="selectAllElements('inheritance', true)"
											>Select All</b-btn
										>&nbsp;
										<b-btn
											class="btn btn-secondary btn-sm"
											@click="selectAllElements('inheritance', false)"
											>Unselect All</b-btn
										>
									</div>
									
									<div style="padding-left: 15px">
										<tamplate v-for="value in this.inheritances">
											<b-form-checkbox
												name="inheritance"
												v-model="filters['inheritance']"
												:value="value"
												>{{ value }}</b-form-checkbox
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
        <div v-if="tableData.length">
            <b-table
                hover
                small
                responsive="sm"
                :items="clumpedAssociations"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
            >
                <template v-slot:thead-top="data">
                    <b-th colspan="6">
                        <span class="sr-only">Clump</span>
                    </b-th>
                    <b-th
                        :key="phenotype"
                        v-for="(phenotype, i) in phenotypes"
                        colspan="3"
                        class="reference"
                        :class="'color-' + (i + 1)"
                    >
                        <span style="color: white">{{
                            phenotypeMap[phenotype].description
                        }}</span>
                        <span v-if="i == 0" style="color: white">
                            (lead SNP)
                        </span>
                    </b-th>
                </template>
                <template
                    v-slot:[phenotypePValueColumn(p)]="r"
                    v-for="p in phenotypes"
                    >{{ pValueFormatter(r.item[`${p}:pValue`]) }}</template
                >
                <template #cell(varID)="clumpedAssociations">
								<a
									:href="`/variant.html?variant=${clumpedAssociations.item.varID}`"
									>{{ clumpedAssociations.item.varID }}</a
								>
							</template>
                <template #cell(Gene)="clumpedAssociations">
								<a
									:href="`/gene.html?gene=${clumpedAssociations.item.Gene}`"
									>{{ clumpedAssociations.item.Gene }}</a
								>
							</template>
            </b-table>
            <b-pagination
                class="pagination-sm justify-content-center"
                v-model="currentPage"
                :total-rows="clumpedAssociations.length"
                :per-page="perPage"
            ></b-pagination>
            <!-- <div class="p-2 text-center">
                <documentation
                    id="aligned-beta"
                    name="table.clumped-associations.alignment"
                ></documentation>
            </div> -->
        </div>
        <div v-else>
            <h4 v-if="associations.length > 0">
                No overlapping associations across phenotypes
            </h4>
            <h4 v-else>No associations</h4>
        </div>
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

import { isEqual } from "lodash";
import uiUtils from "@/utils/uiUtils";

export default Vue.component("clumped-associations-table", {
    props: [
        "associations",
        "associations2",
        "phenotypes",
        "consequences",
        "inheritances",
        "phenotypeMap",
        "filter",
        "exclusive",
    ],
    components: {
        Documentation,
        TooltipDocumentation,
        CsvDownload,
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            filters: {
				consequence: [],
                inheritance: [],
			},
            baseFields: [
                {
					key: "varID",
					label: "Variant",
                    sortable: true,
				},
				{
					key: "max_consequence",
					label: "Consequence",
					tdClass: "border-color",
				},
				{
					key: "inheritance",
					sortable: true,
                    label: "Inheritance",
				},
				{
					key: "Gene",
					label: "Gene",
                    sortable: true,
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
        };
    },
    computed: {
        fields() {
            let fields = this.baseFields;
            //alert(this.phenotypes.length);
                
            for (let i in this.phenotypes) {
                let p = this.phenotypes[i];
                if (i==0){
                    //alert("here");
                    this.sortKey = `${p}:allelecount`;
                    this.reverse = true;
                }
                fields = fields.concat([
                    {
                        key: `${p}:allelecount`,
                        label: "Allele Count",
                        sortable: true,
                        thClass: 'text-right',
    				    tdClass: 'text-right',
                    },
                    {
                        key: `${p}:allelenumber`,
                        label: `Allele Number`,
                        thClass: 'text-right',
    				    tdClass: 'text-right',
                    },
                    {
                        key: `${p}:allelefrequency`,
                        label: `Allele Frequency`,
                        sortable: true,
                        thClass: 'text-right',
    				    tdClass: 'text-right',
                    },
                ]);
                //let dichotomous = this.phenotypeMap[p].dichotomous;
                //alert(i);
            }
            //console.log(fields);
            return fields;
        },
        clumpedAssociations() {
            let data = [];
            let varIDs = {};
            let associations = this.tableData;
            //let inheritances = {};

            for (let i in associations) {
                let r = associations[i];
                let dataIndex = varIDs[r.varID];

                if (!(r.varID in varIDs)) {
                    dataIndex = data.length;
                    varIDs[r.varID] = dataIndex;
                    let inheritanceText = '';
                    if ('inheritance' in r){
                        inheritanceText = r.inheritance.toString();
                    }
                    data.push({
                        //chromosome: r.chromosome,
                        varID: r.varID,
                        max_consequence: r.max_consequence,
                        Gene: r.Gene,
                        HGVSc: r.HGVSc,
                        HGVSp: r.HGVSp,
                        inheritance: inheritanceText,
                        //clumpStart: r.clumpStart,
                        //clumpEnd: r.clumpEnd,
                        //minP: 1.0,
                    });
                    
                    /*if (r.inheritance){
                        for (let x in r.inheritance){
                            let ind = r.inheritance[x];
                            inheritances[ind]=1;
                        }
                    }*/
                }
                // add the phenotype columns
                
                data[dataIndex][`${r.phenotype}:allelecount`] = r.allelecount;
                data[dataIndex][`${r.phenotype}:allelefrequency`] = r.allelefrequency;
                data[dataIndex][`${r.phenotype}:allelenumber`] = r.allelenumber;
                
                // lowest p-value across all phenotypes
                /*if (!!r.pValue && r.pValue < data[dataIndex].minP) {
                    data[dataIndex].minP = r.pValue;
                }*/
            }
            //console.log(inheritances);
            //this.inheritances = Object.keys(inheritances);
            return data;
        },
        tableData() {
            let dataRows = this.associations;
            //console.log('clumped association table:'+this.filter);
            if (!!this.filter) {
                dataRows = this.associations.filter(this.filter);
            }
            //console.log(dataRows);
            return dataRows;
        },
    },
    methods: {
        ...uiUtils,
		showHideElement(ELEMENT) {
			uiUtils.showHideElement(ELEMENT);
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
        phenotypeBetaColumn(phenotype) {
            return `cell(${phenotype}:beta)`;
        },
        phenotypePValueColumn(phenotype) {
            return `cell(${phenotype}:pValue)`;
        },
        phenotypeVariantColumn(phenotype) {
            return `cell(${phenotype}:varId)`;
        },
        phenotypeDbSNPColumn(phenotype) {
            return `cell(${phenotype}:dbSNP)`;
        },
        phenotypeConsequenceColumn(phenotype) {
            return `cell(${phenotype}:consequence)`;
        },
        phenotypeGeneColumn(phenotype) {
            return `cell(${phenotype}:nearest)`;
        },
        clumpFormatter({ chromosome, clumpStart, clumpEnd }) {
            return Formatters.locusFormatter(chromosome, clumpStart, clumpEnd);
        },
        dbSNPFormatter(dbSNP) {
            return Formatters.dbSNPFormatter(dbSNP);
        },
        alignedBeta(phenotype, r) {
            let beta = r[`${phenotype}:beta`];
            let alignment = r[`${phenotype}:alignment`] || 1.0;

            return beta * alignment;
        },
        effectFormatter(phenotype, r) {
            let effect = this.alignedBeta(phenotype, r);

            if (this.phenotypeMap[phenotype].dichotomous) {
                effect = Math.exp(effect);
            }

            return Formatters.effectFormatter(effect);
        },
        pValueFormatter(pValue) {
            return Formatters.pValueFormatter(pValue);
        },
        consequenceFormatter(consequence) {
            return Formatters.consequenceFormatter(consequence);
        },
        addfilter: function () {
			let dataRows = [];
			for (let i = 0 ; i < this.associations2.length; i++){
				dataRows[i]=this.associations2[i];
			}
			//console.log(dataRows.length);
            if (this.filters["consequence"].length > 0) {
				dataRows = dataRows.filter((item) =>
					this.filters["consequence"].includes(item.max_consequence)
				);
			}
            if (this.filters["inheritance"].length > 0) {
                //console.log("apply inheritance"+this.filters['inheritance']);
				dataRows = dataRows.filter((item) => {
                    {   
                        if ('inheritance' in item){
                            for (let x in item['inheritance']){
                                let ind = item['inheritance'][x];
                                if (this.filters["inheritance"].includes(ind)){
                                    return true;
                                }
                            }
                        }
                        return false;
                    };
                });
			}
			this.associations = dataRows;
			
            return this.tableData;
		},
    },
    watch: {
        phenotypes: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.currentPage = 1;
                }
            },
            deep: true,
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
