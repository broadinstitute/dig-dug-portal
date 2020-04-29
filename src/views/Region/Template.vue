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
                            v-on:click="$parent.showHideElement('regionSearchHolder','region_gene_search')"
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
                                        v-model="$store.state.searchGene"
                                        type="text"
                                        class="form-control input-default"
                                        style="margin-left: 15px;padding-left: 30px;"
                                        placeholder="Search gene"
                                        id="region_gene_search"
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
                    <h4
                        class="card-title"
                    >Variant associations with p-value &lt;= 5e-3 in the region: {{$store.state.chr}}:{{$store.state.start}} - {{$store.state.chr}}:{{$store.state.end}}</h4>

                    <div style="text-align: right; padding-bottom: 5px;">
                        <div
                            href="javascript:;"
                            v-on:click="$parent.switchViews(['pws-bubble-view','pws-bar-view']);"
                            class="switch-view btn btn-secondary btn-sm"
                        >Switch view</div>
                    </div>

                    <phenotype-signal :phenotypes="$parent.topAssociations"></phenotype-signal>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4
                        v-if="$store.state.phenotype"
                        class="card-title"
                    >Associations for {{$store.state.phenotype.description}}</h4>
                    <locuszoom
                        v-if="$store.state.phenotype"
                        :panels="['association','genes','intervals']"
                        :assoc="$parent.lzAssociations"
                        :chr="$store.state.chr"
                        :start="$store.state.start"
                        :end="$store.state.end"
                        :phenotype="$store.state.phenotype.name"
                        @lzupdate="$store.dispatch('loadAssociations', $event)"
                    ></locuszoom>
                </div>
            </div>
            <div v-if="$store.state.phenotype" class="card mdkp-card">
                <div class="card-body">
                    <h4
                        class="card-title"
                    >Top Associations for {{$store.state.phenotype.description}}</h4>
                    <associations-table
                        :phenotypes="$parent.phenotypes"
                        :associations="$store.state.associations.data"
                    ></associations-table>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
