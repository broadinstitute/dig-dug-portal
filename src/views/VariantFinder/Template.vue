<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">
                        Phenotype
                        <a
                            class="edit-btn"
                            v-on:click="$parent.showHideElement('phenotypeSearchHolder')"
                        >Select phenotype</a>
                    </div>

                    <div class="col-md-12 gene-page-header-body">
                        <div id="phenotypeSearchHolder" class="gene-page-header-search-holder">
                            <phenotype-selectpicker
                                :phenotypes="$store.state.bioPortal.phenotypes"
                                clearOnSelected="true"
                            ></phenotype-selectpicker>
                        </div>
                    </div>
                    <h5 v-if="$store.state.selectedPhenotypes">
                        <template v-for="(p, i) in $store.state.selectedPhenotypes">
                            <b-badge
                                pill
                                class="btn reference"
                                :key="p.name"
                                @click="$parent.removePhenotype(p, i)"
                                :class="'color-' + (i+1)"
                            >
                                {{p.description}}
                                <b-icon-x-circle></b-icon-x-circle>
                            </b-badge>
                        </template>
                    </h5>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <h4 class="card-title">Variant Finder</h4>
                            <associations-table
                                :associations="$store.state.phenotypeAssociations"
                                :phenotypes="$store.state.selectedPhenotypes"
                            ></associations-table>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <h4 class="card-title">Plot</h4>
                            <manhattan-plot
                                v-if="!!$store.state.mplotData"
                                class="mb-3"
                                :associations="$store.state.mplotData"
                                :colors="$parent.colors"
                            ></manhattan-plot>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
