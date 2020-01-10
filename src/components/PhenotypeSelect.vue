<template>
  <select
    v-model="selectedPhenotype"
    @change="$store.dispatch('onPhenotypeChange', selectedPhenotype);"
    class="selectpicker" data-live-search="true" id="phenotypes-select"
  >
    <optgroup v-for="(item, index) in phenotypeMap" :label="index">
      <option v-for="phenotype in phenotypeMap[index]" v-bind:value="phenotype">{{ phenotype.name }}</option>
    </optgroup>
  </select>
</template>

<script>
import Vue from "vue";

export default Vue.component("phenotype-select", {
  props: ["phenotypes"],

  data() {
    return {
      selectedPhenotype: null
    };
  },

  updated() {
    $("#phenotypes-select").selectpicker('refresh');

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
