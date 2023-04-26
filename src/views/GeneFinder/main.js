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
            geneFinderAssociationsMap: {},
        };
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {

        tissueOptions() {
            let tissues = [...new Set(this.$store.state.geneExpression.data.map(d => d.tissue))].sort();

            let options = [];

            tissues.map(t => {
                options.push({ value: t, name: t.replace(/_/g, " ") })
            })


            return options;
        },
        tissuesMap() {
            let tissuesMap = {};
            this.tissueOptions.map(t => {
                tissuesMap[t.value] = t;
            })

            return tissuesMap;
        },
        tissuesMapKeys() {
            return Object.keys(this.tissuesMap);
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
        eglsOptions() {
            if (this.$store.state.eglsFullList == null) {
                return null;
            } else {

                let options = [];




                this.geneFinderPhenotypes.map(p => {
                    this.$store.state.eglsFullList.map(e => {

                        /*if (e["Trait ID"] != undefined && e["byor_gene"] == "TRUE" && e["Trait ID"].toLowerCase() == p.toLowerCase()) {
                            options.push(e);
                        }*/

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
            let eglsMap = {};
            this.eglsOptions.map(o => {
                eglsMap[o["Page ID"]] = o;
            })

            return eglsMap;
        },

        eglsMapKeys() {
            return Object.keys(this.eglsMap);
        },

        geneFinderPhenotypes() {
            return (
                this.geneFinderSearchCriterion
                    .filter((criterion) => criterion.field === "phenotype")
                    .map((criterion) => criterion.threshold) || []
            );
        },


        eglGenes() {
            return this.$store.state.eglGenes;
        },

        combined() {
            //console.log("this.geneFinderAssociationsMap", this.geneFinderAssociationsMap);

            let combinedData = Object.entries(this.geneFinderAssociationsMap).flatMap(
                (geneFinderItem) => geneFinderItem[1]
            );



            let filteredCombined = [];

            if (combinedData.length > 0 && this.$store.state.eglGenes.length > 0) {
                // first make obj by egl genes by 1.trait 2.EGL id. !important propert name 'phenotype' is taken by combinedData

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


                let GFEglsLength = this.geneFinderEgls.length;

                combinedData.map(c => {

                    let geneId = c["gene"];

                    // Add EGL info
                    if (!!eglGenes[geneId] && eglGenes[geneId]['egls'].length == GFEglsLength) {
                        let tempGene = { ...c };

                        let eglsContent = "";

                        eglGenes[geneId]['egls'].map(e => {
                            let pIndex = this.geneFinderPhenotypes.indexOf(e.trait) + 1;
                            let eglLabel = e.shortName;
                            eglsContent += "<span class='gene-finder-egl reference color-0' title='" + e.name + "'>" + eglLabel + "<div class='egl-links'>";
                            eglsContent += (e.pmid != undefined) ? "<a target='_blank' href='https://pubmed.ncbi.nlm.nih.gov/" + e.pmid + "'>View paper</a><span class='spacer'>|</span>" : "";
                            eglsContent += "<a target='_blank' href='/research.html?pageid=" + e.eglId + "'>View effector genes list</a>";
                            eglsContent += "</div></span>"
                        })

                        tempGene['egls'] = eglsContent;

                        filteredCombined.push(tempGene);
                    }

                })
            } else {
                filteredCombined = combinedData;
            }

            // Add Tissue Gene Expression info
            let loadedTGE = this.$store.state.tissueGeneExpression;
            if (loadedTGE.length > 0) {
                let filteredGenes = {};
                filteredCombined.map(f => {
                    filteredGenes[f.gene] = f
                    filteredGenes[f.gene]['tissue'] = [];
                });

                loadedTGE.map(t => {
                    if (!!filteredGenes[t.gene]) {


                        filteredGenes[t.gene]['tissue'].push(t);
                    }
                })

                filteredCombined = [...new Set(Object.values(filteredGenes))];
            }

            return filteredCombined;
        },
        geneFinderPValue() {
            let pval = 0.05;
            for (let i in this.geneFinderSearchCriterion) {
                if (this.geneFinderSearchCriterion[i].field == "pValue") {
                    pval = Number(this.geneFinderSearchCriterion[i].threshold);
                }
            }
            return pval;
        },
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
                //egls: this.geneFinerEgls,
            };
        },
        hugePhenotype() {
            let data = this.$store.state.hugePhenotype.data;
            return data;
        },
        geneExpressionTissue() {
            let data = this.$store.state.geneExpressionTissue.data;
            return data;
        }
    },

    watch: {
        geneExpressionTissue(newData, oldData) {
            if (newData.length > 0) {

                let updatedList = this.$store.state.tissueGeneExpression.concat(newData);

                this.$store.dispatch("tissueGeneExpression", updatedList);
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

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        criterion(newCriterion, oldCriterion) {
            if (newCriterion.pValue !== oldCriterion.pValue) {
                // if the pValue updates, all phenotype associations must be updated to reflect the new bound
                // this will override all data in the geneFinderAssociationsMap
                this.updateAssociations(
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
                }
            }
        },
        geneFinderPhenotypes(newPhenotypes, oldPhenotypes) {

            //if not the same, update keyparams
            if (!isEqual(newPhenotypes, oldPhenotypes)) {
                //update phenotype parameters
                keyParams.set({
                    phenotype: newPhenotypes.join(","),
                });
            }

            newPhenotypes.map(p => {
                if (!this.$store.state.hugeScores[p]) {
                    this.$store.dispatch("getHugePhenotype", p);
                }
            })


        },
        geneFinderTissues(newTissues, oldTissues) {
            if (!isEqual(newTissues, oldTissues)) {
                //update egls parameters
                keyParams.set({
                    tissue: newTissues.join(","),
                });

                let differTissues = newTissues.filter(x => !oldTissues.includes(x));

                if (differTissues.length > 0) {
                    let tissue = this.tissuesMap[differTissues[0]];
                    this.$store.dispatch("getGeneExpressionTissue", tissue.value);
                } else {
                    let removedTissue = oldTissues.filter(x => !newTissues.includes(x));

                    let tissue = this.tissuesMap[removedTissue[0]];
                    this.$store.dispatch("removeTissueGeneExpression", tissue.value);
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

                if (differEgl.length > 0) {
                    let egl = this.eglsMap[differEgl[0]];

                    this.$store.dispatch("getEglGenes", { pageId: egl["Page ID"], trait: egl["Trait ID"] });
                } else {
                    let removedEgl = oldEgls.filter(x => !newEgls.includes(x));

                    let egl = this.eglsMap[removedEgl[0]];

                    this.$store.dispatch("removeEglGenes", { pageId: egl["Page ID"] });

                }

            }
        },
        eglsMapKeys(KEYS) {
            if (this.geneFinderEgls.length > 0) {
                this.loadInitialEgls(this.geneFinderEgls);
            }
        },
        tissuesMapKeys(KEYS) {
            if (this.geneFinderTissues.length > 0) {
                this.loadInitialTissues(this.geneFinderTissues);
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
        if (keyParams.phenotype) {
            keyParams.phenotype.split(",").forEach((phenotype) => {
                this.geneFinderSearchCriterion.push({
                    field: "phenotype",
                    threshold: phenotype,
                });
            });

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

            if (this.tissuesMapKeys.length > 0) {
                //this.loadInitialTissues(this.geneFinderTissues);
            }

            this.updateAssociations(
                this.geneFinderPhenotypes,
                this.geneFinderPValue,
                true
            );
        }
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,

        updateAssociations(updatedPhenotypes, pValue, flush) {
            //let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
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

        loadInitialEgls(EGLS) {

            EGLS.map(e => {
                let egl = this.eglsMap[e];
                this.$store.dispatch("getEglGenes", { pageId: egl["Page ID"], trait: egl["Trait ID"] });
            })

        },

        loadInitialTissues(TISSUES) {
            console.log("TISSUES", TISSUES);
            TISSUES.map(t => {
                this.$store.dispatch("getGeneExpressionTissue", t);
            })

        },
    },



    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
