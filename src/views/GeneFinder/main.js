import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";

import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import Documentation from "@/components/Documentation.vue";
import uiUtils from "@/utils/uiUtils";
import sortUtils from "@/utils/sortUtils";
import PhenotypePicker from "@/components/PhenotypePicker.vue";
import GeneFinderTableWEgl from "@/components/GeneFinderTableWEgl.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import keyParams from "@/utils/keyParams";
import Formatters from "@/utils/formatters";

import sessionUtils from "@/utils/sessionUtils";


import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert,
} from "@/components/Alert";
import { query } from "@/utils/bioIndexUtils";
import { isEqual, difference } from "lodash";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: {},
    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypePicker,
        Documentation,
        GeneFinderTableWEgl,
        UnauthorizedMessage,
        CriterionFunctionGroup,
        CriterionListGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
    },

    data() {
        return {
            counter: 0,
            phenotypelist: [],
            geneFinderSearchCriterion: [],
            geneFinderFilterCriterion: [],
            geneFinderAssociationsMap: {},
            geneFinderRareVariantMap: {},
            minMaxTPM: null,
            pThresholdVal: "2.5e-6, 1e-5, 0.001",
            rarePThresholdVal: "2.5e-6, 1e-5, 0.001",
            onlyEgl: false,
            onlyRare: false,
            turnOffMagma: true,
            turnOffRare: true,
        };
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        pThreshold() {
            let threshold = []
            if (this.pThresholdVal != "") {
                threshold = this.pThresholdVal.split(",").map(v => Number(v.trim()))
                threshold = threshold.sort(function (a, b) {
                    let A = a;
                    let B = b;

                    let comparison = 0;
                    if (A > B) {
                        comparison = 1;
                    } else if (A < B) {
                        comparison = -1;
                    }


                    return comparison;

                });
            }

            return threshold;
        },
        rarePThreshold() {
            let threshold = []
            if (this.rarePThresholdVal != "") {
                threshold = this.rarePThresholdVal.split(",").map(v => Number(v.trim()))
                threshold = threshold.sort(function (a, b) {
                    let A = a;
                    let B = b;

                    let comparison = 0;
                    if (A > B) {
                        comparison = 1;
                    } else if (A < B) {
                        comparison = -1;
                    }


                    return comparison;

                });
            }

            return threshold;
        },
        tissueOptions() {

            let options = null;

            if (this.$store.state.geneExpression.data.length > 0) {
                let tissues = [...new Set(this.$store.state.geneExpression.data.map(d => d.tissue))].sort();

                options = [];

                this.geneFinderPhenotypes.map(p => {//<-- this is to disable the EGLs option when there is no phenotype selected
                    tissues.map(t => {
                        options.push({ value: t, name: t.replace(/_/g, " ") })
                    })
                });
            }

            return options;
        },
        tissuesMap() {
            let tissuesMap = null;
            if (!!this.tissueOptions) {
                tissuesMap = {};
                this.tissueOptions.map(t => {
                    tissuesMap[t.value] = t;
                })
            }
            return tissuesMap;
        },
        tissuesMapKeys() {
            if (!!this.tissuesMap) {
                return Object.keys(this.tissuesMap);
            } else {
                return [];
            }

        },
        diseaseInSession() {
            if (this.$store.state.diseaseInSession == null) {
                return "";
            } else {
                return this.$store.state.diseaseInSession;
            }
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"] || [];
        },
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap || {};
        },

        secondaryPhenotypeOptions() {
            let data;

            data = this.$store.state.bioPortal.phenotypes.filter(x => x.name != this.$store.state.phenotype);


            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(data, this.phenotypesInSession, 'name');
            }

            return data;
        },

        /* rarePhenotypeOptions() {
             let data = this.geneFinderSearchCriterion
                 .filter((criterion) => criterion.field === "phenotype")
                 .map((criterion) => criterion.threshold) || []
             return data;
         },*/
        eglsOptions() {

            if (this.$store.state.eglsFullList == null) {
                return null;
            } else {

                let options = [];


                this.geneFinderPhenotypes.map(p => { //<-- this is to disable the EGLs option when there is no phenotype selected
                    this.$store.state.eglsFullList.map(e => {

                        if (e["Trait ID"] != undefined && e["byor_gene"] == "TRUE") {
                            options.push(e);
                        }
                    })
                })

                let sorted = sortUtils.sortArrOfObjects(options, 'Effector list name', 'alphabetical', 'asc');

                return sorted;
            }
        },

        eglsMap() {
            if (!!this.eglsOptions) {
                let eglsMap = {};

                this.eglsOptions.map(o => {
                    eglsMap[o["Page ID"]] = o;
                })

                return eglsMap;
            } else {
                return null;
            }

        },

        eglsMapKeys() {
            return Object.keys(this.eglsMap);
        },

        geneFinderPhenotypes() {
            return (
                this.geneFinderSearchCriterion
                    .filter((criterion) => criterion.field === "phenotype")
                    .map((criterion) => criterion.threshold.split('MAGMA')[0]) || []
            );
        },

        /*geneFinderRareVariant() {
            return (
                this.geneFinderSearchCriterion
                    .filter((criterion) => criterion.field === "rareVariant")
                    .map((criterion) => criterion.threshold.split("Rare")[0]) || []
            );
        },*/

        eglGenes() {
            return this.$store.state.eglGenes;
        },

        rareVariantFilter() {
            let rareVariantFilterArr = this.geneFinderFilterCriterion
                .filter((f) => f.field === "rarePValue")

            let filter = rareVariantFilterArr.length > 0 ? Number(rareVariantFilterArr[0].threshold) : null;

            return filter;
        },

        hugeScoreFilter() {

            let hugeFilterArr = this.geneFinderFilterCriterion
                .filter((f) => f.field === "HuGE")

            let filter = hugeFilterArr.length > 0 ? Number(hugeFilterArr[0].threshold) : null;

            return filter;
        },

        tpmFilter() {
            let tpmFilterArr = this.geneFinderFilterCriterion
                .filter((f) => f.field === "TPM")

            let filter = tpmFilterArr.length > 0 ? Number(tpmFilterArr[0].threshold) : null;

            return filter;
        },

        geneFinderPValue() {
            let pval = null;
            for (let i in this.geneFinderFilterCriterion) {
                if (this.geneFinderFilterCriterion[i].field == "pValue") {
                    pval = Number(this.geneFinderFilterCriterion[i].threshold);
                }
            }
            return pval;
        },
        /*geneFinderRarePValue() {
            let pval = 0.05;
            for (let i in this.geneFinderFilterCriterion) {
                if (this.geneFinderFilterCriterion[i].field == "rarePValue") {
                    pval = Number(this.geneFinderFilterCriterion[i].threshold);
                }
            }
            return pval;
        },*/
        geneFinderEgls() {
            return (
                this.geneFinderSearchCriterion
                    .filter((criterion) => criterion.field === "egl")
                    .map((criterion) => criterion.threshold) || []
            );
        },
        geneFinderTissues() {
            return (
                this.geneFinderSearchCriterion
                    .filter((criterion) => criterion.field === "tissue")
                    .map((criterion) => criterion.threshold) || []
            );
        },
        criterion() {
            return {
                pValue: this.geneFinderPValue,
                phenotypes: this.geneFinderPhenotypes,
            };
        },

        /* rareCriterion() {
             return {
                 pValue: this.geneFinderRarePValue,
                 phenotypes: this.geneFinderRareVariant,
             };
         },*/

        hugePhenotype() {
            let data = this.$store.state.hugePhenotype.data;
            return data;
        },
        geneExpressionTissue() {
            let data = this.$store.state.geneExpressionTissue.data;
            return data;
        },

        combined() {

            let combinedData = Object.entries(this.geneFinderAssociationsMap).flatMap(
                (geneFinderItem) => geneFinderItem[1]
            );
            let combinedRareData = Object.entries(this.geneFinderRareVariantMap).flatMap(
                (geneFinderItem) => geneFinderItem[1]
            );

            //console.log("this.geneFinderRareVariantMap", this.geneFinderRareVariantMap)

            let grouped = {}


            if (combinedData.length > 0) {


                combinedData.map(r => {
                    if (!grouped[r.gene]) {
                        let tempObj = {
                            phenotypes: [],
                            gene: r.gene,
                            chromosome: r.chromosome,
                            start: r.start,
                            end: r.end,
                            minP: 1.0,
                        };

                        grouped[r.gene] = tempObj;
                    }

                    grouped[r.gene].phenotypes.push(r.phenotype);
                    grouped[r.gene][r.phenotype + ":pValue"] = r.pValue;
                    //grouped[r.gene][r.phenotype + ":zStat"] = r.zStat;
                    //grouped[r.gene][r.phenotype + ":nParam"] = r.nParam;
                    grouped[r.gene][r.phenotype + ":subjects"] = r.subjects;

                    // lowest p-value across all phenotypes
                    if (!!r.pValue && r.pValue < grouped[r.gene].minP) {
                        grouped[r.gene].minP = r.pValue;
                    }
                });

                for (const [gKey, gValue] of Object.entries(
                    grouped
                )) {
                    if (gValue.phenotypes.length != this.geneFinderPhenotypes.length) {
                        delete grouped[gKey];
                    }

                    let pValueFilter = Number(this.geneFinderPValue);

                    if (!!pValueFilter) {
                        let pValueCount = 0;
                        gValue.phenotypes.map(p => {
                            pValueCount += (gValue[p + ":pValue"] <= pValueFilter) ? 1 : 0;
                        })

                        if (pValueCount == 0) {
                            delete grouped[gKey];
                        }
                    }
                }

                //add HuGE Scores
                if (Object.keys(this.$store.state.hugeScores).length > 0) {
                    for (const [gKey, gValue] of Object.entries(
                        grouped
                    )) {
                        gValue['minHuge'] = null;
                        gValue['maxHuge'] = null;

                        gValue.phenotypes.map(p => {
                            if (!!this.$store.state.hugeScores[p] && !!this.$store.state.hugeScores[p][gValue.gene]) {
                                gValue[p + ":huge"] = this.$store.state.hugeScores[p][gValue.gene].huge;
                                gValue[p + ":hugeCommon"] = this.$store.state.hugeScores[p][gValue.gene].bf_common;
                                gValue[p + ":hugeRare"] = this.$store.state.hugeScores[p][gValue.gene].bf_rare;

                                if (!gValue['minHuge'] || (!!gValue['minHuge'] && gValue[p + ":huge"] < gValue['minHuge'])) {
                                    gValue['minHuge'] = gValue[p + ":huge"];
                                }
                                if (!gValue['maxHuge'] || (!!gValue['maxHuge'] && gValue[p + ":huge"] > gValue['maxHuge'])) {
                                    gValue['maxHuge'] = gValue[p + ":huge"];
                                }
                            }
                        })

                        if (!!this.hugeScoreFilter) {

                            if ((gValue.maxHuge < this.hugeScoreFilter || !gValue.maxHuge)) {
                                delete grouped[gKey];
                            }
                        }
                    }
                }

                //check if rare variant data is there
                if (combinedRareData.length > 0) {
                    combinedRareData.map(r => {
                        if (!!grouped[r.gene]) {
                            if (!grouped[r.gene].phenotypes.includes(r.phenotype)) {
                                grouped[r.gene].phenotypes.push(r.phenotype);
                            }
                            grouped[r.gene][r.phenotype + ":rarePValue"] = r.pValue;

                            console.log("r.pValue", r.pValue)

                            if ((!!this.rareVariantFilter && this.rareVariantFilter != "") && (r.pValue > this.rareVariantFilter || r.pValue == 0)) {
                                delete grouped[r.gene];
                            }
                        }
                    })
                }

                if (combinedRareData.length > 0 && !!this.onlyRare) {
                    for (const [gKey, gValue] of Object.entries(
                        grouped
                    )) {
                        let rarePcount = 0;
                        gValue.phenotypes.map(p => {
                            rarePcount += (!!gValue[p + ":rarePValue"]) ? 1 : 0;
                        })

                        if (rarePcount == 0) {
                            delete grouped[gKey];
                        }
                    }
                }

                // check if EGLs data is there.
                if (this.$store.state.eglGenes.length > 0) {

                    let eglGenes = {}

                    this.$store.state.eglGenes.map(c => {
                        let gene = c["byor_gene"];
                        let egl = this.eglsMap[c["pageId"]];

                        let tempObj = { "trait": c["traitId"], "eglId": c["pageId"], "title": egl["Title"], "pmid": egl["PMID"], "name": egl["Effector list name"], "shortName": egl["short_name"] }  //pageId, traitId

                        if (!eglGenes[gene]) {
                            eglGenes[gene] = { "egls": [] };
                            eglGenes[gene]["egls"].push(tempObj);
                        } else {
                            let ifExist = eglGenes[gene]["egls"].filter(e => e["eglId"] == c["pageId"]);

                            if (ifExist.length == 0) {
                                eglGenes[gene]["egls"].push(tempObj);
                            }
                        }
                    })

                    for (const [gKey, gValue] of Object.entries(
                        grouped
                    )) {
                        if (!!eglGenes[gKey]) {
                            let eglsContent = "";

                            grouped[gKey]["eglsArr"] = [];// added to render plot

                            eglGenes[gKey]['egls'].map(e => {

                                grouped[gKey]["eglsArr"].push(e);

                                let pIndex = this.geneFinderPhenotypes.indexOf(e.trait) + 1;
                                let eglLabel = e.shortName;
                                eglsContent += "<span class='gene-finder-egl' title='" + e.name + "'>" + eglLabel + "<div class='egl-links'>";
                                eglsContent += (e.pmid != undefined) ? "<a target='_blank' href='https://pubmed.ncbi.nlm.nih.gov/" + e.pmid + "'>View paper</a><span class='spacer'>|</span>" : "";
                                eglsContent += "<a target='_blank' href='/research.html?pageid=" + e.eglId + "'>View effector genes list</a>";
                                eglsContent += "</div></span>"
                            })

                            grouped[gKey]["egls"] = eglsContent;

                        } else if (!!this.onlyEgl) {

                            delete grouped[gKey];

                        }
                    }
                }

                //check if tissues data is there
                // Add Tissue Gene Expression info
                let loadedTGE = this.$store.state.tissueGeneExpression;
                if (loadedTGE.length > 0) {

                    loadedTGE.map(t => {
                        if (!!grouped[t.gene]) {

                            grouped[t.gene]["tissuesArr"] = (!grouped[t.gene]["tissuesArr"]) ? [] : grouped[t.gene]["tissuesArr"];

                            grouped[t.gene]["tissuesArr"].push(t);

                            if (!grouped[t.gene]['tissue']) {
                                grouped[t.gene]['tissue'] = "";
                                grouped[t.gene]['minTPM'] = null;
                                grouped[t.gene]['maxTPM'] = null;
                            }

                            let meanTPM = !t.meanTpm
                                ? 0
                                : Number(this.floatFormatter(t.meanTpm));

                            if (!grouped[t.gene].minTPM || (!!grouped[t.gene].minTPM && meanTPM < grouped[t.gene].minTPM)) {
                                grouped[t.gene].minTPM = meanTPM;
                            }

                            if (!grouped[t.gene].maxTPM || (!!grouped[t.gene].maxTPM && meanTPM > grouped[t.gene].maxTPM)) {
                                grouped[t.gene].maxTPM = meanTPM;
                            }

                            let tissueInfo = "";
                            tissueInfo += (!!this.tpmFilter && meanTPM >= this.tpmFilter) ? "<strong>" : "";
                            tissueInfo +=
                                t.tissue.replace("_", " ") +
                                " <small>(" +
                                meanTPM +
                                " : " +
                                t.nSamples +
                                ")</small>  ";
                            tissueInfo += (!!this.tpmFilter && meanTPM >= this.tpmFilter) ? "</strong>" : "";

                            grouped[t.gene]['tissue'] += tissueInfo;
                        }
                    })


                    let data = Object.values(grouped);

                    if (data.length > 0) {
                        let minMax = { min: Number(data[0].minTPM), max: Number(data[0].maxTPM) };
                        data.map((d) => {
                            minMax.min = d.minTPM < minMax.min ? d.minTPM : minMax.min;
                            minMax.max = d.maxTPM > minMax.max ? d.maxTPM : minMax.max;
                        });

                        this.minMaxTPM = minMax;



                        if (!!this.tpmFilter) {
                            for (const [gKey, gValue] of Object.entries(
                                grouped
                            )) {
                                if ((gValue.maxTPM < this.tpmFilter || !gValue.maxTPM)) {
                                    delete grouped[gKey];
                                }
                            }
                        }
                    } else {
                        this.minMaxTPM = null;
                    }


                } else {
                    this.minMaxTPM = null;
                }
            }

            let filteredCombined = Object.values(grouped);

            return filteredCombined;
        },
    },

    watch: {


        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        /*
        criterion(newCriterion, oldCriterion) {
            if (newCriterion.pValue !== oldCriterion.pValue) {
                // if the pValue updates, all phenotype associations must be updated to reflect the new bound
                // this will override all data in the geneFinderAssociationsMap
                this.updateAssociations(
                    this.geneFinderPhenotypes,
                    this.geneFinderPValue,
                    true
                );

                this.updateRareAssociations(
                    this.geneFinderPhenotypes,
                    this.geneFinderPValue,
                    true
                );
            } else {
                // if the phenotypes update, we only need to get new data based on latest phenotype
                // NOTE: this will maintain some data in the the geneFinderAssociationsMap
                const updatingPhenotypes = difference(
                    newCriterion.phenotypes,
                    oldCriterion.phenotypes
                );

                if (updatingPhenotypes.length > 0) {
                    this.updateAssociations(
                        updatingPhenotypes,
                        this.geneFinderPValue
                    );
                    this.updateRareAssociations(
                        updatingPhenotypes,
                        this.geneFinderPValue
                    );
                }
            }
        },*/
        criterion(newCriterion, oldCriterion) {

            // if the phenotypes update, we only need to get new data based on latest phenotype
            // NOTE: this will maintain some data in the the geneFinderAssociationsMap
            const updatingPhenotypes = difference(
                newCriterion.phenotypes,
                oldCriterion.phenotypes
            );

            if (updatingPhenotypes.length > 0) {
                this.updateAssociations(
                    updatingPhenotypes,
                    0.05
                );
                this.updateRareAssociations(
                    updatingPhenotypes,
                    0.05
                );
            }

        },
        /*rareCriterion(newCriterion, oldCriterion) {
            console.log("newCriterion", newCriterion)
            if (newCriterion.pValue !== oldCriterion.pValue) {
                // if the pValue updates, all phenotype associations must be updated to reflect the new bound
                // this will override all data in the geneFinderAssociationsMap
                this.updateRareAssociations(
                    this.geneFinderRareVariant,
                    this.geneFinderRarePValue,
                    true
                );
            } else {
                // if the phenotypes update, we only need to get new data based on latest phenotype
                // NOTE: this will maintain some data in the the geneFinderAssociationsMap
                const updatingPhenotypes = difference(
                    newCriterion.phenotypes,
                    oldCriterion.phenotypes
                );

                if (updatingPhenotypes.length > 0) {
                    this.updateRareAssociations(
                        updatingPhenotypes,
                        this.geneFinderRarePValue
                    );
                }
            }
        },*/
        geneFinderPhenotypes(newPhenotypes, oldPhenotypes) {

            if (newPhenotypes.length > 0) {
                //if not the same, update keyparams
                if (!isEqual(newPhenotypes, oldPhenotypes)) {

                    //update phenotype parameters
                    keyParams.set({
                        phenotypes: newPhenotypes.join(","),
                    });
                }

                let differPhenotypes = newPhenotypes.filter(x => !oldPhenotypes.includes(x));

                if (differPhenotypes.length > 0) {
                    differPhenotypes.map(p => {
                        if (!this.$store.state.hugeScores[p]) {
                            this.$store.dispatch("getHugePhenotype", p);
                        }
                    })

                } else {
                    let removedPhenotype = oldPhenotypes.filter(x => !newPhenotypes.includes(x));

                    delete this.geneFinderAssociationsMap[removedPhenotype[0]]
                    delete this.geneFinderRareVariantMap[removedPhenotype[0]]
                }
            } else {

                keyParams.set({
                    phenotypes: "",
                });
                this.geneFinderAssociationsMap = {}
                this.geneFinderRareVariantMap = {}
            }
        },
        //working part
        /*geneFinderRareVariant(newList, oldList) {
            console.log("newList", newList);
            if (newList.length > 0) {
                //if not the same, update keyparams
                if (!isEqual(newList, oldList)) {
                    //update phenotype parameters
                    keyParams.set({
                        rareVariant: newList.join(","),
                    });
                }

                let differPhenotypes = newList.filter(x => !oldList.includes(x));

                if (differPhenotypes.length > 0) {
                    differPhenotypes.map(p => {
                        if (!this.$store.state.hugeScores[p]) {
                            this.$store.dispatch("getHugePhenotype", p);
                        }
                    })

                } else {
                    let removedPhenotype = oldList.filter(x => !newList.includes(x));

                    delete this.geneFinderRareVariantMap[removedPhenotype[0]]
                }
            } else {
                keyParams.set({
                    rareVariant: "",
                });
                this.geneFinderRareVariantMap = {}
            }
        },*/
        geneExpressionTissue(newData, oldData) {
            if (newData.length > 0) {

                let updatedList = this.$store.state.tissueGeneExpression.concat(newData);
                let tissues = this.$store.state.loadedTissues.concat(newData[0].tissue);

                this.$store.dispatch("tissueGeneExpression", updatedList);
                this.$store.dispatch("loadedTissues", tissues);
            }


        },
        hugePhenotype(newData, oldData) {
            if (newData.length > 0) {
                let newPhenotype = newData[0].phenotype

                let dataByGene = {};

                newData.map(d => {
                    dataByGene[d.gene] = d;
                })

                let tempObj = {};

                for (const [hKey, hValue] of Object.entries(
                    this.$store.state.hugeScores
                )) {
                    tempObj[hKey] = hValue;
                }

                tempObj[newPhenotype] = dataByGene;

                this.$store.dispatch("hugeScores", tempObj);
            }

        },
        geneFinderTissues(newTissues, oldTissues) {
            if (!isEqual(newTissues, oldTissues)) {
                //update egls parameters
                keyParams.set({
                    tissue: newTissues.join(","),
                });

                let differTissues = newTissues.filter(x => !oldTissues.includes(x));

                if (differTissues.length > 0) {
                    differTissues.map(d => {
                        if (!this.$store.state.loadedTissues.includes(d)) {
                            this.$store.dispatch("getGeneExpressionTissue", d);
                        }
                    })

                } else {
                    let removedTissue = oldTissues.filter(x => !newTissues.includes(x));

                    // let tissue = this.tissuesMap[removedTissue[0]];
                    let tissue = removedTissue[0];
                    this.$store.dispatch("removeTissueGeneExpression", tissue);
                }
            }
        },
        geneFinderEgls(newEgls, oldEgls) {

            if (!isEqual(newEgls, oldEgls)) {
                //update egls parameters
                keyParams.set({
                    egl: newEgls.join(","),
                });

                let differEgl = newEgls.filter(x => !oldEgls.includes(x));

                if (!!this.eglsMap && this.eglsMapKeys.length > 0) {
                    if (differEgl.length > 0) {
                        let egl = this.eglsMap[differEgl[0]];

                        this.$store.dispatch("getEglGenes", { pageId: egl["Page ID"], trait: egl["Trait ID"] });
                    } else {
                        let removedEgl = oldEgls.filter(x => !newEgls.includes(x));

                        let egl = this.eglsMap[removedEgl[0]];

                        this.$store.dispatch("removeEglGenes", { pageId: egl["Page ID"] });

                    }
                }


            }
        },
        eglsMapKeys(KEYS) {
            if (this.geneFinderEgls.length > 0 && this.eglsMapKeys.length > 0) {
                this.loadInitialEgls(this.geneFinderEgls);
            }
        },
        tissuesMapKeys(KEYS) {
            if (this.geneFinderTissues.length > 0) {
                //this.loadInitialTissues(this.geneFinderTissues);
            }
        }
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("getEglsFullList");
        this.$store.dispatch("getGeneExpression", 'PCSK9');
        //check if parameter is passed, set criterion
        if (keyParams.phenotypes) {
            keyParams.phenotypes.split(",").forEach((phenotype) => {
                this.geneFinderSearchCriterion.push({
                    field: "phenotype",
                    threshold: phenotype,
                });
            });

            this.updateAssociations(
                this.geneFinderPhenotypes,
                this.geneFinderPValue,
                true
            );

            if (keyParams.rareVariant) {
                keyParams.rareVariant.split(",").forEach((e) => {
                    this.geneFinderSearchCriterion.push({
                        field: "rareVariant",
                        threshold: e,
                    });
                });

                this.updateRareAssociations(
                    this.geneFinderRareVariant,
                    this.geneFinderRarePValue,
                    true
                );
            }

            if (keyParams.egl) {
                keyParams.egl.split(",").forEach((e) => {
                    this.geneFinderSearchCriterion.push({
                        field: "egl",
                        threshold: e,
                    });
                });
            }


            if (this.eglsMapKeys.length > 0) {
                this.loadInitialEgls(this.geneFinderEgls);
            }

            if (keyParams.tissue) {
                keyParams.tissue.split(",").forEach((e) => {
                    this.geneFinderSearchCriterion.push({
                        field: "tissue",
                        threshold: e,
                    });
                });
            }


        }
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        intFormatter: Formatters.intFormatter,
        floatFormatter: Formatters.floatFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        showHideSetting() {
            uiUtils.showHideElement("tableSetting");
        },

        updateAssociations(updatedPhenotypes, pValue, flush) {

            let promises = updatedPhenotypes.map((phenotype) => {
                if (!this.geneFinderAssociationsMap[phenotype] || flush) {
                    let alertId = postAlertNotice(
                        `Loading ${this.phenotypeMap[phenotype]?.description ||
                        phenotype
                        } gene associations...`
                    );
                    return query(`gene-finder`, phenotype, {
                        limitWhile: (record) => record.pValue < pValue,
                    }).then((bioIndexData) => {
                        closeAlert(alertId);
                        Vue.set(
                            this.geneFinderAssociationsMap,
                            phenotype,
                            bioIndexData
                        );
                    });
                } else {
                    return Promise.resolve();
                }
            });

            // may await on this in the future if needed...
            Promise.all(promises);
        },

        updateRareAssociations(updatedPhenotypes, pValue, flush) {

            let promises = updatedPhenotypes.map((phenotype) => {
                if (!this.geneFinderRareVariantMap[phenotype] || flush) {
                    let alertId = postAlertNotice(
                        `Loading ${this.phenotypeMap[phenotype]?.description ||
                        phenotype
                        } rare variant associations...`
                    );
                    return query(`gene-finder-52k`, phenotype, {
                        limitWhile: (record) => record.pValue < pValue,
                    }).then((bioIndexData) => {
                        closeAlert(alertId);
                        Vue.set(
                            this.geneFinderRareVariantMap,
                            phenotype,
                            bioIndexData
                        );
                    });
                } else {
                    return Promise.resolve();
                }
            });

            // may await on this in the future if needed...
            Promise.all(promises);
        },

        loadInitialEgls(EGLS) {

            EGLS.map(e => {
                let egl = this.eglsMap[e];
                this.$store.dispatch("getEglGenes", { pageId: egl["Page ID"], trait: egl["Trait ID"] });
            })

        },

        loadInitialTissues(TISSUES) {
            TISSUES.map(t => {
                this.$store.dispatch("getGeneExpressionTissue", t);
            })

        },
    },



    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
