<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-title">Phenotypes</div>
                    <div class="col-md-4 gene-page-header-title">Add Phenotype</div>
                    <div class="col-md-8 gene-page-header-body">
                        <button
                            v-for="(phenotype, i) in $store.state.phenotypes"
                            class="btn mr-1 reference p-2 rounded phenotype-btn"
                            style="color:white"
                            :class="'color-' + (i+1)"
                            @click="$store.commit('removePhenotype', phenotype.name);"
                        >
                            <span class="remove" aria-hidden="true">&times;</span>
                            {{phenotype.description}}
                        </button>
                    </div>
                    <div class="col-md-4 gene-page-header-body">
                        <div style="font-size: 16px">
                            <phenotype-selectpicker
                                :phenotypes="$store.state.bioPortal.phenotypes"
                                :clear-selected="true"
                            ></phenotype-selectpicker>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4>Variant Finder</h4>
                    <variant-finder
                        :phenotypes="$store.state.phenotypes"
                        :associations="$parent.associations"
                    ></variant-finder>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Enriched Annotations for:
                        <span
                            v-for="phenotype in $store.state.phenotypes"
                            class="item"
                        >{{phenotype.description}}</span>
                    </h4>
                    <enrichment-table
                        :phenotypes="$store.state.phenotypes"
                        :annotations="$parent.annotations"
                        :per-page="10"
                    ></enrichment-table>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
