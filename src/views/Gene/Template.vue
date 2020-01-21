<template>
    <!-- Header -->
    <div>
        <page-header></page-header>
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
                    <span v-for="row in $parent.genesInRegion">{{row}},</span>
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
                                    v-model="$store.state.newChrom"
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
                                    @click="$store.dispatch('setLocation')"
                                >GO</button>
                            </div>
                        </div>
                    </div>
                    {{$store.state.chrom}}:{{$store.state.start}} - {{$store.state.chrom}}:{{$store.state.end}}
                </div>
                <div class="col-md-4 gene-page-header-body">
                    <div
                        id="phenotypeSearchHolder"
                        class="gene-page-header-search-holder"
                        style="display: none;"
                    >
                        <phenotype-selectpicker v-bind:phenotypes="$parent.phenotypeMap"></phenotype-selectpicker>
                    </div>
                    <span>{{$store.state.phenotypeName}}</span>
                </div>
            </div>
        </div>

        <div class="card mdkp-card">
            <div class="card-body">
                <h4
                    class="card-title"
                >Phenotypes with signal in {{$store.state.chrom}}:{{$store.state.start}} - {{$store.state.chrom}}:{{$store.state.end}}</h4>
                <div
                    @click="$store.commit('setPhenotype',{id:row.phenotype,phenotypes:$parent.phenotypeMap})"
                    v-for="(row, itemObjKey) in $parent.phenotypesData"
                    :class="row.P_VALUE < 2.5e-6 ? 'phenotype-with-signal high' : 'phenotype-with-signal moderate'"
                    :title="row.P_VALUE"
                    :slot-scope="row"
                >{{row.name}}</div>

                <h4 class="card-title">Genes in the region associated with phenotypes with signal</h4>
                <div
                    v-for="row in $parent.genesInRegion"
                    class="phenotype-with-signal moderate"
                >{{row}}</div>
            </div>
        </div>

        <div class="card mdkp-card">
            <div class="card-body">
                <h5 class="card-title">LocusZoom</h5>
                <locuszoom
                    ref="lz"
                    v-bind:gene="$parent.geneSource"
                    v-bind:constraint="$parent.constraintSource"
                    v-bind:ld="$parent.ldSource"
                    v-bind:recomb="$parent.recombSource"
                    v-bind:assoc="['StaticJSON', { data: [] }]"
                    v-bind:panels="['association','genes','intervals']"
                    v-bind:chrom="$store.state.chrom"
                    v-bind:start="$store.state.start"
                    v-bind:end="$store.state.end"
                    v-bind:intervals="$parent.intervalsSource"
                ></locuszoom>
            </div>
        </div>
        <div class="card mdkp-card">
            <div class="card-body">
                <h4 class="card-title">Top variants for Phenotype: {{$store.state.phenotypeName}}</h4>
                <variants-table v-bind:variants="$parent.variantsData"></variants-table>
            </div>
        </div>
        </div>
        <page-footer></page-footer>
    </div>
</template>
