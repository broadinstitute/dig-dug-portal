<template>
    <div>
        <!-- Header -->
        <page-header></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <phenotype-select v-bind:phenotypes="$parent.phenotypes"></phenotype-select>
            <dataset-select v-bind:datasets="$parent.datasetList"></dataset-select>
        </div>

        <!-- Footer-->
        <page-footer></page-footer>
    </div>
</template>
