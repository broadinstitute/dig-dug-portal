<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-4 gene-page-header-title"></div>

                    <div class="col-md-4 gene-page-header-title">
                        Gene
                        <a class="edit-btn">Set Gene</a>
                    </div>
                    <div class="col-md-4 gene-page-header-title"></div>
                    <div class="col-md-4 gene-page-header-body">
                        <span>
                            Gene Info
                            {{$store.state.geneName}}
                        </span>
                    </div>
                    <!-- change this class to variantInfo -->
                    <div class="col-md-4 gene-page-header-body variantInfo">
                        <div id="geneSearchHolder" class="gene-page-header-search-holder">
                            <div class="variant-search">
                                <div class="col-md-10 input-wrapper">
                                    <input
                                        v-model="$store.state.newGeneName"
                                        type="text"
                                        class="form-control input-default"
                                        style="margin-left: 15px;padding-top: 30px;padding-left:30px"
                                        placeholder="Search Gene"
                                    />

                                    <div class="col-md-2 input-wrapper">
                                        <button
                                            id="geneSearchGo"
                                            class="btn btn-primary"
                                            type="button"
                                            @click="$store.dispatch('queryGene')"
                                        >GO</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card" v-if="$parent.geneFunction">
                <h4 class="card-title">Gene Function</h4>
                <div>{{$parent.geneFunction}}</div>
            </div>
            <div class="card mdkp-card" v-else>
                <h4>Gene function not found</h4>
            </div>

            <div class="card mdkp-card" v-if="$parent.dbReference">
                <h4 class="card-title">DB References</h4>
                <dbreferences-table v-bind:dbreferences="$parent.dbReference"></dbreferences-table>
            </div>
            <div class="card mdkp-card" v-if="$parent.accession">
                <h4 class="card-title">Swiss Prot Accesssion IDs</h4>
                <div v-for="row in $parent.accession" :class="'gene-with-signal '+row">
                    <a :href="`https://www.uniprot.org/uniprot/${row}`">{{row}}</a>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
