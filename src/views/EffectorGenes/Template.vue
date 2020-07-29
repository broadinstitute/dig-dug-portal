<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h2>{{$store.state.pageTitle}}</h2>
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
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style>
@import url("/css/effectorGenes.css");
</style>
