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
                            v-on:click="() => $parent.showHideElement('regionSearchHolder','region_gene_search')"
                        >Edit position / Search gene</a>
                    </div>
                    <div class="col-md-4 gene-page-header-title">
                        Phenotype
                        <a
                            class="edit-btn"
                            v-on:click="() => $parent.showHideElement('phenotypeSearchHolder')"
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
                        {{$parent.regionString}}
                        <button
                            class="btn btn-primary text-nowrap text-right explore-region-btn"
                            style="margin-left: 20px"
                            @click="$parent.exploreExpanded()"
                        >Expand &plusmn; 50 kb</button>
                        <lunaris-link
                            :diseaseGroup="$parent.diseaseGroup"
                            :chr="$store.state.chr"
                            :begin="$store.state.start"
                            :end="$store.state.end"
                            :trait="$store.state.phenotype"
                            :dataContent="this.$store.state.lunaris.dataFromLunaris"
                        ></lunaris-link>
                    </div>
                    <div class="col-md-4 gene-page-header-body">
                        <div
                            id="phenotypeSearchHolder"
                            class="gene-page-header-search-holder hidden"
                        >
                            <phenotype-selectpicker
                                v-if="$store.state.phenotype"
                                :phenotypes="$store.state.bioPortal.phenotypes"
                                :default-phenotype="$store.state.phenotype.description"
                            ></phenotype-selectpicker>
                        </div>
                        <span v-if="$store.state.phenotype">{{$store.state.phenotype.description}}</span>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation name="region.trait.info"></documentation>
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
                    >Variant associations in the region: {{$parent.regionString}}</h4>
                    <documentation name="region.phenos_w_signal.subheader"></documentation>
                    <div v-if="$parent.topAssociations.length > 0">
                        <div
                            style="text-align: right; padding-bottom: 5px;"
                            v-if="$parent.topAssociations[0].pValue <= 5e-8"
                        >
                            <div
                                href="javascript:;"
                                v-on:click="$parent.switchViews(['pws-merged-view','pws-bar-view']);"
                                class="switch-view btn btn-secondary btn-sm"
                            >View associations by phenotype group</div>
                        </div>
                        <phenotype-signal-mixed :phenotypes="$parent.topAssociations"></phenotype-signal-mixed>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4
                        v-if="$store.state.phenotype"
                        class="card-title"
                    >Visualize associations for {{$store.state.phenotype.description}}</h4>
                    <documentation
                        name="region.lz.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>

                    <locuszoom
                        ref="locuszoom"
                        v-if="$store.state.phenotype"
                        :chr="$store.state.chr"
                        :start="$store.state.start"
                        :end="$store.state.end"
                        :refSeq="true"
                    >
                        <lz-associations-panel
                            :phenotype="$store.state.phenotype.name"
                            :finishHandler="$parent.updateAssociationsTable"
                        ></lz-associations-panel>
                    </locuszoom>
                </div>
            </div>

            <div v-if="$store.state.phenotype">
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Top Associations for {{$store.state.phenotype.description}}
                            <tooltip-documentation
                                name="region.topassoc.tooltip"
                                :isHover="true"
                                :noIcon="false"
                            ></tooltip-documentation>
                        </h4>

                        <documentation name="region.variantassociation.subheader"></documentation>
                        <associations-table
                            :phenotypes="$parent.phenotypes"
                            :associations="$store.state.associations.data"
                        ></associations-table>
                    </div>
                </div>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4
                            class="card-title"
                        >Credible Sets and Annotations for {{$store.state.phenotype.description}} in the region: {{$parent.regionString}}</h4>

                        <documentation
                            name="region.igv.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>

                        <div class="filtering-ui-wrapper">
                            <div class="row filtering-ui-content">
                                <div class="col filter-col-lg">
                                    <div class="label">Annotation Method Track</div>
                                    <annotation-method-selectpicker
                                        :annotations="$parent.globalEnrichmentAnnotations"
                                        @annotation="$parent.addAnnotationTrack($event)"
                                    />
                                </div>

                                <div class="col filter-col-sm">
                                    <div class="label">p-value (&le;)</div>
                                    <input v-model.number="$parent.pValue" class="form-control" />
                                </div>
                                <div class="col filter-col-sm">
                                    <div class="label">Fold (&ge;)</div>
                                    <input v-model.number="$parent.fold" class="form-control" />
                                </div>

                                <div class="col divider">&nbsp;</div>
                                <div class="col filter-col-lg">
                                    <div class="label">Credible Sets Track</div>
                                    <credible-sets-selectpicker
                                        :credibleSets="$parent.credibleSets"
                                        @credibleset="$parent.addCredibleVariantTrack($event)"
                                    />
                                </div>

                                <div class="col divider">&nbsp;</div>
                                <div class="col filter-col-lg">
                                    <div class="label">View region in Variant Prioritizer</div>
                                    <b-button
                                        class="btn btn-sm btn-2-vptz"
                                        :href="`http://v2f-pancakeplot.broadinstitute.org/pancakeplot/index.html?phenotype=${$store.state.phenotype.name}&chr=${$store.state.chr}&start=${$store.state.start}&end=${$store.state.end}`"
                                        target="_blank"
                                    >{{`Trait: ${$store.state.phenotype.name}, Region: ${$parent.regionString}`}}</b-button>
                                </div>
                            </div>
                        </div>

                        <div v-if="!!$store.state.phenotype">
                            <!-- TODO: Refactor p-value, fold, colorscheme, scoring to providers? -->
                            <igv
                                ref="igv"
                                :chr="$store.state.chr"
                                :start="$store.state.start"
                                :end="$store.state.end"
                                :p-value="$parent.pValue"
                                :fold="$parent.fold"
                                :scoring="$parent.tissueScoring"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
