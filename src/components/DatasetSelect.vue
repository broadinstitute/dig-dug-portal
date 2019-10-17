<template>
  <select v-model="selectedDataset" @change="$store.dispatch('onDatasetChange', selectedDataset)">
    <option v-for="dataset in datasets">{{ dataset }}</option>
  </select>
</template>

<script>
import Vue from "vue";

export default Vue.component("dataset-select", {
  props: ["datasets"],

  data() {
    return {
      selectedDataset: null
    };
  }
});
</script>
