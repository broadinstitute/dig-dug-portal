<template>
  <select
    v-model="selectedPhenotype"
    @change="$store.dispatch('onPhenotypeChange', selectedPhenotype)"
  >
    <optgroup v-for="(item, index) in phenotypes" v-bind:key="item" :label="index">
      <option
        v-for="listvalue in phenotypes[index]"
        v-bind:key="listvalue"
        :value="listvalue"
      >{{ listvalue }}</option>
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
