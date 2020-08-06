<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-title">
                        Gene
                        <a
                            class="edit-btn"
                            @click="$parent.showHideElement('variantSearchHolder','gene_search_input')"
                        >Select gene</a>
                    </div>
                    <div class="col-md-4 gene-page-header-title">Navigate</div>

                    <div class="col-md-8 gene-page-header-body">
                        <div id="variantSearchHolder" class="gene-page-header-search-holder hidden">
                            <div class="col-md-10">
                                <input
                                    v-model="$store.state.geneName"
                                    type="text"
                                    class="form-control input-default"
                                    placeholder="Search gene"
                                    id="gene_search_input"
                                />
                            </div>
                            <div class="col-md-2 input-wrapper">
                                <button
                                    id="variantSearchGo"
                                    class="btn btn-primary"
                                    type="button btn-lg"
                                    @click="$store.dispatch('queryGeneName')"
                                >GO</button>
                            </div>
                        </div>
                        <div v-if="$parent.symbolName">
                            <span>
                                {{$parent.symbolName}}
                                <span
                                    v-if="$parent.symbolName.toLowerCase() !== $store.state.geneName.toLowerCase()"
                                >({{$store.state.geneName}})</span>
                            </span>
                        </div>
                    </div>
                    <div class="col-md-4 gene-page-header-body">
                        <div v-if="$parent.symbolName" class="input-group">
                            <button
                                class="btn btn-primary input-group-prepend explore-region-btn"
                                style="margin-right: 20px"
                                :title="$parent.regionText"
                                @click="$parent.exploreRegion()"
                            >Explore Region</button>
                            <button
                                class="btn btn-primary input-group-append explore-region-btn"
                                :title="$parent.regionTextExpanded"
                                @click="$parent.exploreRegion(50000)"
                            >Explore &plusmn; 50 kb</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation
                        name="gene.explore.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body row">
                    <div class="col-md-8">
                        <div v-if="$parent.geneFunction">
                            <h4>
                                Function
                                <tooltip-documentation
                                    name="gene.function.tooltip.hover"
                                    :content-fill="$parent.documentationMap"
                                    :isHover="true"
                                    :noIcon="false"
                                ></tooltip-documentation>
                            </h4>

                            <div>{{$parent.geneFunction}}</div>
                        </div>
                        <div v-else>
                            <h5>Gene function not found</h5>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <h4>Info</h4>
                        <div v-if="$parent.geneNames" class="alternative-names">
                            <strong>Alternative names:&nbsp;</strong>
                            <span
                                v-for="gene in $parent.alternateNames"
                                v-if="gene.source == 'alias'"
                                :key="gene.name"
                            >{{gene.name}}</span>&nbsp;
                        </div>
                        <div v-if="$parent.regionText">
                            <strong>Coding sequence:</strong>
                            {{$parent.regionText}}
                        </div>
                        <div v-if="$parent.region">
                            <strong>Length:</strong>
                            {{" "+($parent.region.end - $parent.region.start).toLocaleString()}} bp
                        </div>
                        <div>
                            <strong>Assembly:</strong> GRCh37
                        </div>
                        <div>
                            <strong>Gene sources:</strong>
                            <span>&nbsp;Ensembl, HGNC, UCSC, RGD, MGD</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.dbReference">
                        <h4 class="card-title">
                            UniProt cross-references
                            <tooltip-documentation
                                name="gene.xref.tooltip.hover"
                                :content-fill="$parent.documentationMap"
                                :isHover="true"
                                :noIcon="false"
                            ></tooltip-documentation>
                        </h4>
                        <uniprot-references-table v-bind:references="$parent.dbReference"></uniprot-references-table>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.accession">
                        <h4 class="card-title">Swiss Prot Accesssion IDs</h4>
                        <div v-for="row in $parent.accession" class="gene-with-signal none">
                            <a :href="`https://www.uniprot.org/uniprot/${row}`">{{row}}</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.geneNames">
                        <h4 class="card-title">External resources</h4>
                        <div
                            v-for="gene in $parent.alternateNames"
                            v-if="gene.source != 'alias'"
                            class="gene-with-signal none"
                            :key="gene.name"
                        >
                            <a
                                :href="$parent.externalResources[gene.source]+gene.name"
                                v-if="gene.source != 'ucsc'"
                                target="_blank"
                            >{{gene.name}}</a>
                            <a
                                :href="$parent.externalResources[gene.source]+$parent.symbolName"
                                target="_blank"
                                v-else
                            >{{gene.name}}</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
