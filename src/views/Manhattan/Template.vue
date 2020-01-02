<template>
    <div>
        <phenotype-select v-bind:phenotypes="$parent.phenotypes"></phenotype-select>
        <dataset-select v-bind:datasets="$parent.datasetList"></dataset-select>

        <table width="100%">
            <tr>
                <td valign="top">
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
                                <td>{{ $parent.get_pvalue(row[4]) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
                <td width="70%" valign="top">
                    <manhattan-plot
                        v-bind:variants="$store.state.manhattan.variants"
                        v-bind:dataset="$store.state.selectedDataset"
                        v-bind:phenotype="$store.state.selectedPhenotype"
                    ></manhattan-plot>
                </td>
            </tr>
        </table>
    </div>
</template>
