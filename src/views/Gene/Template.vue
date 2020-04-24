<template>
    <!-- Header -->
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-title">
                        Chromosome: Start position - End position
                        <a
                            class="edit-btn"
                            v-on:click="$parent.showHideElement('regionSearchHolder')"
                        >Edit position / Search gene</a>
                    </div>
                    <div class="col-md-4 gene-page-header-title">
                        Phenotype
                        <a
                            class="edit-btn"
                            v-on:click="$parent.showHideElement('phenotypeSearchHolder')"
                        >Select phenotype</a>
                    </div>
                    <div class="col-md-8 gene-page-header-body regionInfo">
                        <div id="regionSearchHolder" class="gene-page-header-search-holder hidden">
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
                        <div
                            id="phenotypeSearchHolder"
                            class="gene-page-header-search-holder hidden"
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
                    >Genes in the region associated with phenotypes with signal</h4>
                    <div
                        v-for="row in $parent.genes"
                        :class="'gene-with-signal '+row.type"
                    >{{row.name}}</div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4
                        class="card-title"
                    >New phenotypes with signal in {{$store.state.chr}}:{{$store.state.start}} - {{$store.state.chr}}:{{$store.state.end}}</h4>
                    <div
                        class="p-bellow-section-header"
                    >*Showing phenotypes with p-value <= 5e-3. To reset the page with a phenotype of interest, click a phenotype name. To view phenotypes in a phenotype group, click phenotype group name or expand icon. White bars indicate p-values of the phenotypes in phenotype groups. Bars are rendered in logarithmic scale</div>
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
                        v-bind:panels="['association','genes','intervals','phewas']"
                        v-bind:assoc="{
                            'data': $parent.associations,
                            'translator': $parent.lzAssociationsTransform,
                        }"
                        v-bind:phewas="{
                            'data': $parent.associations,
                            'translator': $parent.lzAssociationsTransform,
                        }"
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
