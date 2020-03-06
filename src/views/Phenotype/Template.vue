<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-groups="$store.state.bioPortal.diseaseGroups"
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-4 gene-page-header-title"></div>
                    <div class="col-md-4 gene-page-header-title">
                        Phenotype
                        <a
                            class="edit-btn"
                            onclick="mdkp.utility.showHideElement('phenotypeSearchHolder');"
                        >Set phenotype</a>
                    </div>
                    <div class="col-md-4 gene-page-header-title"></div>
                    <div class="col-md-4 gene-page-header-body">
                        <span>Manhattan Plot</span>
                    </div>
                    <div class="col-md-4 gene-page-header-body regionInfo">
                        <div
                            id="phenotypeSearchHolder"
                            class="gene-page-header-search-holder"
                            style="display: none;"
                        >
                            <phenotype-selectpicker v-bind:phenotypes="$parent.phenotypes"></phenotype-selectpicker>
                        </div>
                        <span
                            v-if="$parent.selectedPhenotype"
                        >{{$parent.selectedPhenotype.description}}</span>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <manhattan-plot
                        v-bind:variants="$store.state.associations.data"
                        v-bind:phenotype="$store.state.selectedPhenotype"
                    ></manhattan-plot>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <mplot-variants-table v-bind:variants="$parent.topVariants"></mplot-variants-table>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
