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

export default Vue.component("phenotype-selectpicker", {
    props: ["phenotypes"],

    data() {
        return {
            selectedPhenotype: null
        };
    },
    computed: {
        phenotypeOptions() {
            var getUnique = function(inputArray) {
                var outputArray = [];

                for (var i = 0; i < inputArray.length; i++) {
                    if ($.inArray(inputArray[i], outputArray) == -1) {
                        outputArray.push(inputArray[i].trim());
                    }
                }

                return outputArray;
            };

            let phenotypes = [];
            let phenotypesNames = [];
            let diseaseGroup =
                this.$store.state.diseaseGroup.id == "cvd"
                    ? "mi"
                    : this.$store.state.diseaseGroup.id;
            let publishedDatasets = this.$store.state.kp4cd.datasetsInfo;

            //console.log("publishedDatasets");
            //console.log(publishedDatasets);

            publishedDatasets.forEach(function(dataset) {
                if (diseaseGroup == "md") {
                    if (
                        dataset.field_portals.indexOf("t2d") >= 0 ||
                        dataset.field_portals.indexOf("stroke") >= 0 ||
                        dataset.field_portals.indexOf("mi") >= 0 ||
                        dataset.field_portals.indexOf("sleep") >= 0
                    ) {
                        let tempPhenotypes = dataset.field_phenotypes.split(
                            "\r\n"
                        );
                        tempPhenotypes.forEach(function(p) {
                            if (phenotypes[p]) {
                                let portals =
                                    phenotypes[p] + "," + dataset.field_portals;
                                let portalsArr = portals.split(",");
                                portalsArr = getUnique(portalsArr);

                                phenotypes[p] = portalsArr.join();
                            } else {
                                phenotypes[p] = dataset.field_portals;
                            }
                        });
                    }
                } else {
                    if (dataset.field_portals.indexOf(diseaseGroup) >= 0) {
                        let tempPhenotypes = dataset.field_phenotypes.split(
                            "\r\n"
                        );
                        tempPhenotypes.forEach(function(p) {
                            if (phenotypes[p]) {
                                let portals =
                                    phenotypes[p] + "," + dataset.field_portals;
                                let portalsArr = portals.split(",");
                                portalsArr = getUnique(portalsArr);

                                phenotypes[p] = portalsArr.join();
                            } else {
                                phenotypes[p] = dataset.field_portals;
                            }
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
                });
            }

            //console.log(phenotypeList.length);

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
