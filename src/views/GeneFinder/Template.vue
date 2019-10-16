<template>
  <div>
    <phenotype-select v-bind:phenotypes="$store.state.phenotypeModule.phenotypeMap"></phenotype-select>
    <dataset-select v-bind:datasets="$store.state.datasetModule.datasetList"></dataset-select>
  </div>
</template>
