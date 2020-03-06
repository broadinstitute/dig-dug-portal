<template>
    <!-- Header -->
    <div>
        <page-header
            :disease-groups="$store.state.bioPortal.diseaseGroups"
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-4 gene-page-header-title">
                        Genes in the region associated with phenotypes with signal
                        <a
                            class="edit-btn"
                            onclick="mdkp.utility.showHideElement('geneSearchHolder');"
                        >Edit</a>
                    </div>
                    <div class="col-md-4 gene-page-header-title">
                        Chromosome: Start position - End position
                        <a
                            class="edit-btn"
                            onclick="mdkp.utility.showHideElement('regionSearchHolder');"
                        >Edit</a>
                    </div>
                    <div class="col-md-4 gene-page-header-title">
                        Phenotype
                        <a
                            class="edit-btn"
                            onclick="mdkp.utility.showHideElement('phenotypeSearchHolder');"
                        >Edit</a>
                    </div>
                    <div class="col-md-4 gene-page-header-body">
                        <div
                            id="geneSearchHolder"
                            class="gene-page-header-search-holder"
                            style="display: none;"
                        >Genes UI</div>
                        <span v-for="row in $parent.genes">{{row.name}},</span>
                    </div>
                    <div class="col-md-4 gene-page-header-body regionInfo">
                        <div
                            id="regionSearchHolder"
                            class="gene-page-header-search-holder"
                            style="display: none;"
                        >
                            <div class="region-search">
                                <div class="col-md-2 input-wrapper">
                                    <input
                                        v-model="$store.state.newChr"
                                        type="text"
                                        class="form-control input-default"
                                    />
                                </div>
                                <div class="col-md-4 input-wrapper">
                                    <input
                                        v-model="$store.state.newStart"
                                        type="text"
                                        class="form-control input-default"
                                    />
                                </div>
                                <div class="col-md-4 input-wrapper">
                                    <input
                                        v-model="$store.state.newEnd"
                                        type="text"
                                        class="form-control input-default"
                                    />
                                </div>
                                <div class="col-md-2 input-wrapper">
                                    <button
                                        id="regionSearchGo"
                                        class="btn btn-primary"
                                        type="button"
                                        @click="$store.commit('setLocus')"
                                    >GO</button>
                                </div>
                            </div>
                        </div>
                        {{$store.state.chr}}:{{$store.state.start}} - {{$store.state.end}}
                    </div>
                    <div class="col-md-4 gene-page-header-body">
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
                    <h4
                        class="card-title"
                    >Phenotypes with signal in {{$store.state.chr}}:{{$store.state.start}} - {{$store.state.chr}}:{{$store.state.end}}</h4>
                    <div
                        @click="$store.commit('setPhenotypeByName', row.phenotype)"
                        v-for="row in $parent.topAssociations"
                        :class="row.pValue < 2.5e-6 ? 'phenotype-with-signal high' : 'phenotype-with-signal moderate'"
                        :title="row.pValue"
                        :slot-scope="row.phenotype.name"
                    >{{$store.state.bioPortal.phenotypeMap[row.phenotype].description}}</div>

                    <h4
                        class="card-title"
                    >Genes in the region associated with phenotypes with signal</h4>
                    <div
                        v-for="row in $parent.genes"
                        class="phenotype-with-signal moderate"
                    >{{row.name}}</div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div v-show="$parent.selectedPhenotype" class="card-body">
                    <h5 class="card-title">LocusZoom</h5>
                    <locuszoom
                        ref="lz"
                        v-bind:gene="$parent.geneSource"
                        v-bind:constraint="$parent.constraintSource"
                        v-bind:ld="$parent.ldSource"
                        v-bind:recomb="$parent.recombSource"
                        v-bind:assoc="['StaticJSON', { data: [] }]"
                        v-bind:panels="['association','genes','intervals']"
                        v-bind:chrom="$store.state.chr"
                        v-bind:start="$store.state.start"
                        v-bind:end="$store.state.end"
                        v-bind:intervals="$parent.intervalsSource"
                    ></locuszoom>
                </div>
            </div>
            <div class="card mdkp-card">
                <div v-if="$parent.selectedPhenotype" class="card-body">
                    <h4
                        class="card-title"
                    >Top variants for Phenotype: {{$parent.selectedPhenotype.description}}</h4>
                    <variants-table v-bind:variants="$parent.associations"></variants-table>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
