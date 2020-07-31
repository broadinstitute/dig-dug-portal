<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card gene-page-header">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-title"></div>
                    <div class="col-md-4 gene-page-header-title">Phenotype</div>
                    <div class="col-md-8 gene-page-header-body">
                        <h2>{{$store.state.pageTitle}}</h2>
                    </div>
                    <div class="col-md-4 gene-page-header-body">
                        <h4>Phenotype: {{$parent.trait}}</h4>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <b-tabs content-class="mt-3" align="center">
                                <b-tab title="View data" active>
                                    <component
                                        v-bind:is="$parent.effectorGenesGraph"
                                        :dataset="$parent.dataset"
                                        :graphData="$store.state.tableData"
                                    ></component>
                                    <effector-genes-table
                                        :dataset="$parent.dataset"
                                        :trait="$parent.trait"
                                    ></effector-genes-table>
                                </b-tab>
                                <b-tab title="View research method">
                                    <research-method-section
                                        v-if="$parent.researchMethod != null"
                                        :researchMethod="$parent.researchMethod"
                                    ></research-method-section>
                                </b-tab>
                            </b-tabs>
                        </div>
                    </div>
                </div>
            </div>
            <div class="data-loading-indicator">Loading data...</div>
            <div class="data-rendering-indicator">Rendering data...</div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style>
@import url("/css/effectorGenes.css");
</style>
