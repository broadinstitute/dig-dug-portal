<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <portal-datasets-list-table
                                :diseaseGroups="$store.state.bioPortal.diseaseGroups"
                                :diseaseGroup="$parent.diseaseGroup"
                                :datasetsList="$parent.datasetsList"
                                :phenotypes="$store.state.bioPortal.phenotypes"
                            ></portal-datasets-list-table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
