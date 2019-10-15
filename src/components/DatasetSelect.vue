<template>
  <select v-model="selectedDataset" @change="$store.dispatch('onDatasetChange', selectedDataset)">
    <option v-for="item in datasets" v-bind:key="item" :value="item">
      {{
      item
      }}
    </option>
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
