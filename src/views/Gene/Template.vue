<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">
                        Gene
                        <a
                            class="edit-btn"
                            @click="$parent.showHideElement('variantSearchHolder','gene_search_input')"
                        >Set gene</a>
                    </div>
                    <div class="col-md-12 gene-page-header-body">
                        <div id="variantSearchHolder" class="gene-page-header-search-holder hidden">
                            <div class="col-md-8">
                                <input
                                    v-model="$store.state.geneName"
                                    type="text"
                                    class="form-control input-default"
                                    placeholder="Search gene"
                                    id="gene_search_input"
                                />
                            </div>
                            <div class="col-md-1 input-wrapper">
                                <button
                                    id="variantSearchGo"
                                    class="btn btn-primary"
                                    type="button"
                                    @click="$store.dispatch('queryGene')"
                                >GO</button>
                            </div>
                            <div class="col-md-3 search-example">
                                <strong>Gene sources</strong>
                                <br />Ensembl, HGNC, UCSC, RGD, MGD
                            </div>
                        </div>
                        <span v-if="$parent.symbolName">{{$parent.symbolName}}</span>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.geneFunction">
                        <h4 class="card-title">Gene Function</h4>
                        <div>{{$parent.geneFunction}}</div>
                    </div>
                    <div v-else>
                        <h4>Gene function not found</h4>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.geneNames">
                        <h4 class="card-title">Alternative Names</h4>
                        <div
                            v-for="gene in $parent.alternateNames"
                            class="gene-with-signal protein_coding"
                            :key="gene.name"
                        >
                            <a :href="`/gene.html?gene=${gene.name}`">{{gene.name}}</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.dbReference">
                        <h4 class="card-title">DB References</h4>
                        <dbreferences-table v-bind:dbreferences="$parent.dbReference"></dbreferences-table>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.accession">
                        <h4 class="card-title">Swiss Prot Accesssion IDs</h4>
                        <div
                            v-for="row in $parent.accession"
                            class="gene-with-signal protein_coding"
                        >
                            <a :href="`https://www.uniprot.org/uniprot/${row}`">{{row}}</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
