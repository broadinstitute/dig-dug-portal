<template>
  <div id="newdiv">
    <phenotype-select v-bind:phenotypes="$store.state.phenotypeModule.phenotypeMap"></phenotype-select>
    <dataset-select v-bind:datasets="$store.state.datasetModule.datasetList"></dataset-select>

    <manhattan-plot
      v-bind:variants="$store.state.manhattan.variants"
      v-bind:dataset="$store.state.selectedDataset"
      v-bind:phenotype="$store.state.selectedPhenotype"
    ></manhattan-plot>

    <!-- table -->
    <table class="table table-striped" style="margin-top:20px">
      <thead class="thead-dark">
        <th>rsid</th>
        <th>chromosomes</th>
        <th>position</th>
        <th>closest gene</th>
        <th>p-value</th>
      </thead>
      <tbody>
        <tr v-for="(row, index) in $store.state.table.variants">
          <td>{{ row[0] }}</td>
          <td>{{ row[1] }}</td>
          <td>{{ row[2] }}</td>
          <td>{{ row[3] }}</td>
          <td>{{ this.computedPvalue }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
