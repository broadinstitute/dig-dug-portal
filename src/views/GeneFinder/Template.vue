<template>
  <div>
    <phenotype-select v-bind:phenotypes="$parent.phenotypeMap"></phenotype-select>
    <dataset-select v-bind:datasets="$parent.datasetList"></dataset-select>
  </div>
</template>
