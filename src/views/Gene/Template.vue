<template>
    <!-- Header -->
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- body -->
        <div class="container-fluid mdkp-body">
            <error-message></error-message>
            <div class="card mdkp-card">
                <div class="card-body">
                    <error-message dismissible></error-message>
                    <error-message timeout="10"></error-message>
                </div>
            </div>
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-title">
                        Chromosome: Start position - End position
                        <a
                            class="edit-btn"
                            onclick="mdkp.utility.showHideElement('regionSearchHolder');"
                        >Edit position / Search gene</a>
                    </div>
                    <div class="col-md-4 gene-page-header-title">
                        Phenotype
                        <a
                            class="edit-btn"
                            onclick="mdkp.utility.showHideElement('phenotypeSearchHolder');"
                        >Select phenotype</a>
                    </div>
                    <div class="col-md-8 gene-page-header-body regionInfo">
                        <div
                            id="regionSearchHolder"
                            class="gene-page-header-search-holder"
                            style="display: none;"
                        >
                            <div class="region-search">
                                <div class="col-md-1 input-wrapper">
                                    <input
                                        v-model="$store.state.newChr"
                                        type="text"
                                        class="form-control input-default"
                                        placeholder="Chromosome"
                                    />
                                </div>
                                <div class="col-md-3 input-wrapper">
                                    <input
                                        v-model="$store.state.newStart"
                                        type="text"
                                        class="form-control input-default"
                                        placeholder="Start position"
                                    />
                                </div>
                                <div class="col-md-3 input-wrapper">
                                    <input
                                        v-model="$store.state.newEnd"
                                        type="text"
                                        class="form-control input-default"
                                        placeholder="End position"
                                    />
                                </div>

                                <div class="col-md-3 input-wrapper">
                                    <input
                                        v-model="$store.state.gene"
                                        type="text"
                                        class="form-control input-default"
                                        style="margin-left: 15px;padding-left: 30px;"
                                        placeholder="Search gene"
                                    />
                                    <span class="gene-search-or">OR</span>
                                </div>
                                <div class="col-md-2 input-wrapper">
                                    <button
                                        id="regionSearchGo"
                                        class="btn btn-primary"
                                        type="button"
                                        @click="$store.dispatch('queryRegion')"
                                    >GO</button>
                                </div>
                            </div>
                        </div>
                        {{$store.state.chr}}:{{$store.state.start}} - {{$store.state.end}}
                    </div>
                    <div class="col-md-4 gene-page-header-body">
                        <div id="phenotypeSearchHolder" class="gene-page-header-search-holder">
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
                    <button @click="$parent.onError(Math.random())">new event error</button>
                    <h4 class="card-title">Genes overlapping region</h4>
                    <div
                        v-for="row in $parent.genes"
                        :class="'gene-with-signal '+row.type"
                    >{{row.name}}</div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">New phenotypes with signal</h4>
                    <phenotype-signal :phenotypes="$parent.topAssociations"></phenotype-signal>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4
                        class="card-title"
                    >Phenotypes with signal in {{$store.state.chr}}:{{$store.state.start}} - {{$store.state.chr}}:{{$store.state.end}}</h4>
                    <div class="phenotypes-with-signal-wrapper">
                        <div
                            @click="$store.commit('setPhenotypeByName', row.phenotype)"
                            v-for="row in $parent.topAssociations"
                            :class="row.pValue <= 5e-3 ? row.pValue <= 2.5e-6 ? 'phenotype-with-signal high' : 'phenotype-with-signal moderate' : 'phenotype-with-signal none'"
                            :title="row.pValue"
                            :slot-scope="row.phenotype.name"
                        >{{$store.state.bioPortal.phenotypeMap[row.phenotype].description}}</div>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div v-show="$parent.selectedPhenotype" class="card-body">
                    <h4
                        v-if="$parent.selectedPhenotype"
                        class="card-title"
                    >LocusZoom Associations for Phenotype: {{$parent.selectedPhenotype.description}}</h4>
                    <locuszoom
                        ref="lz"
                        v-if="$parent.selectedPhenotype !== null"
                        v-bind:panels="['association','genes','intervals']"
                        v-bind:modules="[
                            { 'module': 'associations',
                              'target': 'assoc',
                              'translator': $parent.associationsForLZ },
                        ]"
                        v-bind:chr="$store.state.chr"
                        v-bind:start="$store.state.start"
                        v-bind:end="$store.state.end"
                    ></locuszoom>
                </div>
            </div>
            <div class="card mdkp-card">
                <div v-if="$parent.selectedPhenotype" class="card-body">
                    <h4
                        class="card-title"
                    >Top variants for Phenotype: {{$parent.selectedPhenotype.description}}</h4>
                    <associations-table
                        :phenotypes="[$parent.selectedPhenotype]"
                        :associations="$parent.associations"
                    ></associations-table>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
