<template>
    <b-form-select
        v-model="selectedPhenotype"
        @change="$store.dispatch('onPhenotypeChange', selectedPhenotype);"
        class="mb-3"
    >
        <template v-slot:first>
            <b-form-select-option :value="null" disabled>Please select a phenotype</b-form-select-option>
        </template>
        <b-form-select-option-group v-for="(item, index) in phenotypeMap" :label="index">
            <b-form-select-option
                v-for="phenotype in phenotypeMap[index]"
                v-bind:value="phenotype"
            >{{ phenotype.name }}</b-form-select-option>
        </b-form-select-option-group>
    </b-form-select>
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

export default Vue.component("phenotype-select", {
    props: ["phenotypes"],

    data() {
        return {
            selectedPhenotype: null
        };
    },

    updated() {
        //$("#phenotypes-select").selectpicker('refresh');

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
        phenotypeMap() {
            let phenotypeList = this.phenotypes;
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
