<template>
    <!-- Header -->
    <div>

        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">

                    <div class="col-md-1 gene-page-header-title">
                        <button @click="$parent.postAlertError('Error Alert!','Debug.vue')">
                            Test Error Alert
                        </button>
                    </div>

                    <alert></alert>

                    <ga-event-log></ga-event-log>

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
                <loading-bar
                    v-bind:moduleIndex="'top-associations'">
                </loading-bar>
                <igv
                    v-bind:modules="[
                        { 'module': 'top-associations',
                          'target': 'annotation',
                          'translator': $parent.associationsForIGV },
                        { 'module': 'top-associations',
                          'target': 'gwas',
                          'translator': $parent.associationsForIGV },
                    ]"
                    v-bind:chr="$store.state.chr"
                    v-bind:start="$store.state.start"
                    v-bind:end="$store.state.end"
                ></igv>

            </div>


        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
