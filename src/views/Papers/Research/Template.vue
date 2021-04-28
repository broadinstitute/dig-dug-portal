<template>
    <div>
        <!-- Header -->
        <!--<paper-page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :paperMenu="$parent.paperMenu[0].body"
            v-if="!!$parent.paperMenu"
        ></paper-page-header>-->

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h3 v-html="$parent.pageTitle"></h3>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="row card-body">
                    <div
                        class="col-md-12"
                        v-html="$parent.pageDescription"
                    ></div>
                    <div class="col-md-12">
                        {{ $parent.researchPage }}
                    </div>
                    <div class="col-md-12">
                        <research-data-table
                            :pageID="$parent.pageID"
                            :dataset="$parent.filteredData"
                            :tableFormat="$parent.dataTableFormat"
                        >
                        </research-data-table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <!--<paper-page-footer
            :disease-group="$parent.diseaseGroup"
        ></paper-page-footer>-->
    </div>
</template>

<style>
/*@import url("/css/effectorGenes.css");*/
</style>
