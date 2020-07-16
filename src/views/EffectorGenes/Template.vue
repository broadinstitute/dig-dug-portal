<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h2>Predicted Effector Genes</h2>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <b-tabs content-class="mt-3" align="center">
                                <b-tab title="Explore genes" active>
                                    <component
                                        v-bind:is="$parent.effectorGenesGraph"
                                        :graphData="$parent.effectorGenesData"
                                    ></component>
                                    <component
                                        v-bind:is="$parent.effectorGenesTable"
                                        :tableData="$parent.effectorGenesData"
                                    ></component>
                                </b-tab>
                                <b-tab title="Research method">
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
