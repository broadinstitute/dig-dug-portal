<template>
  <v-select
    v-model="selectedPhenotype"
    @input="$store.dispatch('onPhenotypeChange', selectedPhenotype);"
    label="name" :options="phenotypeOptions"></v-select>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
// Install BootstrapVue
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import vSelect from 'vue-select'

Vue.component('v-select', vSelect)

import 'vue-select/dist/vue-select.css';

export default Vue.component("phenotype-selectpicker", {
  props: ["phenotypes"],

  data() {
    return {
      selectedPhenotype: null
    };
  },

  updated() {
    //set initial phenotype data for Manhattan plot page
    if( this.$store.state.mPlotInitialPhenotype && this.$store.state.mPlotInitialPhenotype != null) {
      let initialPhenotype = this.$store.state.mPlotInitialPhenotype;
      var initialActionObj = this.$store;
      $.each(this.phenotypeMap, function(i,e) {
        $.each(e, function(j,r) {
          if (initialPhenotype == r.phenotype_id) {
            initialActionObj.dispatch('onInitialPhenotypeSet', r);
            initialActionObj.state.mPlotInitialPhenotype = null;
          };
        })
      });
    }
  },

  computed:{

  phenotypeOptions() {
    var phenotypes = [];

    let phenotypeList = this.phenotypes;
    for (let i in phenotypeList) {
              let phenotype = phenotypeList[i];
              var tempObj = {};
              tempObj.value = phenotype;
              tempObj.name = phenotype.name;
              phenotypes.push(tempObj);
          }

    return phenotypeList ;
  },
    phenotypeMap(){
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
  },
});
</script>
