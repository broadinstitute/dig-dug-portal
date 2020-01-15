<template>
  <v-select v-model="selectedDataset"
    @input="$store.dispatch('onDatasetChange', selectedDataset)"
    :options="datasets">
    <option v-for="dataset in datasets">{{ dataset }}</option>
  </v-select>
</template>

<script>
import Vue from "vue";

export default Vue.component("dataset-selectpicker", {
  props: ["datasets"],

  data() {
    return {
      selectedDataset: null
    };
  },
  updated() {

  }
});
</script>
