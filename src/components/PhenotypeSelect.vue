<template>
  <select
    v-model="selectedPhenotype"
    @change="$store.dispatch('onPhenotypeChange', selectedPhenotype)"
  >
    <optgroup v-for="(item, index) in phenotypes" :label="{{index}}">
      <option v-for="phenotype in phenotypes[index]">{{ phenotype }}</option>
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
  }
});
</script>
