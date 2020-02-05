<template>
    <v-select
        v-model="selectedPhenotype"
        @input="$store.dispatch('onPhenotypeChange', selectedPhenotype);"
        label="name"
        :options="phenotypeOptions"
    ></v-select>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
// Install BootstrapVue
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import vSelect from "vue-select";

Vue.component("v-select", vSelect);

import "vue-select/dist/vue-select.css";

export default Vue.component("test-phenotype-selectpicker", {
    props: ["phenotypes"],

    data() {
        return {
            selectedPhenotype: null
        };
    },

    updated() {
        //set initial phenotype data for Manhattan plot page
        if (
            this.$store.state.mPlotInitialPhenotype &&
            this.$store.state.mPlotInitialPhenotype != null
        ) {
            let initialPhenotype = this.$store.state.mPlotInitialPhenotype;
            var initialActionObj = this.$store;
            $.each(this.phenotypeMap, function(i, e) {
                $.each(e, function(j, r) {
                    if (initialPhenotype == r.phenotype_id) {
                        initialActionObj.dispatch("onInitialPhenotypeSet", r);
                        initialActionObj.state.mPlotInitialPhenotype = null;
                    }
                });
            });
        }
    },

    computed: {
        phenotypeOptions() {
            let onlyUnique = function(value, index, self) {
                return self.indexOf(value) === index;
            };
            let phenotypes = [];
            let phenotypesNames = [];
            //console.log("datasetsInfo");
            //console.log(this.$store.state.kp4cd.datasetsInfo);
            let diseaseGroup =
                this.$store.state.diseaseGroup == "cvd"
                    ? "mi"
                    : this.$store.state.diseaseGroup;
            let publishedDatasets = this.$store.state.kp4cd.datasetsInfo;

            publishedDatasets.forEach(function(dataset) {
                if (diseaseGroup == "md") {
                    if (
                        dataset.field_portals.indexOf("t2d") >= 0 ||
                        dataset.field_portals.indexOf("stroke") >= 0 ||
                        dataset.field_portals.indexOf("mi") >= 0 ||
                        dataset.field_portals.indexOf("sleep") >= 0
                    ) {
                        //console.log(dataset.field_portals);
                        //console.log(dataset.field_phenotypes.split("\r\n"));
                        let tempPhenotypes = dataset.field_phenotypes.split(
                            "\r\n"
                        );
                        tempPhenotypes.forEach(function(p) {
                            if (phenotypes[p]) {
                                phenotypes[p] =
                                    phenotypes[p] + "," + dataset.field_portals;
                            } else {
                                phenotypes[p] = dataset.field_portals;
                            }

                            //phenotypesNames.push(p);

                            //console.log(p + " : " + dataset.title);
                        });
                    }
                } else {
                    if (dataset.field_portals.indexOf(diseaseGroup) >= 0) {
                        let tempPhenotypes = dataset.field_phenotypes.split(
                            "\r\n"
                        );
                        tempPhenotypes.forEach(function(p) {
                            if (phenotypes[p]) {
                                phenotypes[p] =
                                    phenotypes[p] + "," + dataset.field_portals;
                            } else {
                                phenotypes[p] = dataset.field_portals;
                            }

                            //phenotypesNames.push(p);

                            //console.log(p + " : " + dataset.title);
                        });
                    }
                }
            });

            let phenotypeList = [];

            if (this.phenotypes != null && this.phenotypes != undefined) {
                this.phenotypes.forEach(function(p) {
                    let tempObj = p;
                    let pName = p.name;
                    if (phenotypes[pName] != undefined) {
                        tempObj["portal"] = phenotypes[pName];
                        phenotypeList.push(tempObj);
                    }

                    //console.log(pName);

                    // following is to test natches between meta data and data from KPN website
                    /*
                    if (
                        pName == "Daytime sleepiness" ||
                        pName.indexOf("Accelerometer") >= 0 ||
                        pName.indexOf("Apnea-hypopnea") >= 0
                    ) {
                        console.log(p);
                    }*/
                });
            }

            console.log(phenotypeList.length);

            return phenotypeList;
        },
        phenotypeMap() {
            let phenotypeList = this.phenotypeOptions;
            let phenotypeMap = {};
            for (let i in phenotypeList) {
                let phenotype = phenotypeList[i];
                let group = phenotype.group;
                if (!phenotypeMap[group]) {
                    phenotypeMap[group] = [phenotype];
                } else {
                    phenotypeMap[group].push(phenotype);
                }
            }
            return phenotypeMap;
        }
    }
});
</script>
