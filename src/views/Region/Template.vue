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
                                        placeholder="chr"
                                    />
                                </div>
                                <div class="col-md-3 input-wrapper">
                                    <input
                                        v-model="$store.state.newStart"
                                        type="text"
                                        class="form-control input-default"
                                        placeholder="start"
                                    />
                                </div>
                                <div class="col-md-3 input-wrapper">
                                    <input
                                        v-model="$store.state.newEnd"
                                        type="text"
                                        class="form-control input-default"
                                        placeholder="end"
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
                            <phenotype-selectpicker
                                v-bind:phenotypes="$store.state.bioPortal.phenotypes"
                            ></phenotype-selectpicker>
                        </div>
                        <span v-if="$store.state.phenotype">{{$store.state.phenotype.description}}</span>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Genes overlapping region</h4>
                    <div v-for="row in $parent.genes" :class="'gene-with-signal '+row.type">
                        <a :href="`/gene.html?gene=${row.name}`">{{row.name}}</a>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Trait associations with
                        <tt>P-Value &lt;&nbsp;</tt>
                        <input v-model="$store.state.signalThreshold" />
                        in the region: {{$store.state.chr}}:{{$store.state.start}} - {{$store.state.chr}}:{{$store.state.end}}
                    </h4>
                    <div class="p-bellow-section-header">
                        <sup>*</sup> Colored bars summarize bottom-line meta-analyzed associations for phenotypes in a group. Hover over bar or expand the group to see associations for individual phenotypes.
                    </div>
                    <phenotype-signal
                        :phenotypes="$parent.topAssociations"
                        :threshold="$store.state.signalThreshold"
                    ></phenotype-signal>
                </div>
            </div>
            <!--
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
            -->
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4
                        v-if="$store.state.phenotype"
                        class="card-title"
                    >Associations for {{$store.state.phenotype.description}}</h4>
                    <locuszoom
                        v-if="$store.state.phenotype"
                        :panels="['association','genes']"
                        :assoc="$parent.lzAssociations"
                        :chr="$store.state.chr"
                        :start="$store.state.start"
                        :end="$store.state.end"
                        :phenotype="$store.state.phenotype.name"
                        @lzupdate-assoc="$store.dispatch('loadAssociations', $event)"
                    ></locuszoom>
                </div>
            </div>
            <div v-if="$store.state.phenotype" class="card mdkp-card">
                <div class="card-body">
                    <h4
                        class="card-title"
                    >Top Associations for {{$store.state.phenotype.description}}</h4>
                    <associations-table
                        :phenotypes="[$store.state.phenotype]"
                        :associations="$store.state.associations.data"
                    ></associations-table>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
