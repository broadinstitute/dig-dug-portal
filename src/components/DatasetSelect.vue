<template>
  <select v-model="selectedDataset"
    @change="$store.dispatch('onDatasetChange', selectedDataset)"
    class="selectpicker" data-live-search="true" id="datasets-select">
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
  },
  updated() {
    $("#datasets-select").selectpicker('refresh');
  }
});
</script>
