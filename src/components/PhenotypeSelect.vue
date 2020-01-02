<template>
  <select
    v-model="selectedPhenotype"
    @change="$store.dispatch('onPhenotypeChange', selectedPhenotype)"
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
