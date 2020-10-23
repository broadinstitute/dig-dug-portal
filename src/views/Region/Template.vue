<template>
    <!-- Header -->
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-title">
                        Chromosome: Start position - End position
                        <a
                            class="edit-btn"
                            v-on:click="
                                () =>
                                    $parent.showHideElement(
                                        'regionSearchHolder',
                                        'region_gene_search'
                                    )
                            "
                            >Edit position / Search gene</a
                        >
                    </div>
                    <div class="col-md-4 gene-page-header-title">
                        Phenotype
                        <a
                            class="edit-btn"
                            v-on:click="
                                () =>
                                    $parent.showHideElement(
                                        'phenotypeSearchHolder'
                                    )
                            "
                            >Select phenotype</a
                        >
                    </div>
                    <div class="col-md-8 gene-page-header-body regionInfo">
                        <div
                            id="regionSearchHolder"
                            class="gene-page-header-search-holder hidden"
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
                                    <gene-selectpicker
                                        @onGeneChange="
                                            $store.dispatch(
                                                'onGeneChange',
                                                $event
                                            )
                                        "
                                    ></gene-selectpicker>
                                </div>

                                <div class="col-md-2 input-wrapper">
                                    <button
                                        id="regionSearchGo"
                                        class="btn btn-primary"
                                        type="button"
                                        @click="$store.dispatch('queryRegion')"
                                    >
                                        GO
                                    </button>
                                </div>
                            </div>
                        </div>
                        {{ $parent.regionString }}
                        <button
                            class="btn btn-primary text-nowrap text-right explore-region-btn"
                            style="margin-left: 20px"
                            @click="$parent.exploreExpanded()"
                        >
                            Expand &plusmn; 50 kb
                        </button>
                        <lunaris-link
                            :diseaseGroup="$parent.diseaseGroup"
                            :chr="$store.state.chr"
                            :begin="$store.state.start"
                            :end="$store.state.end"
                            :trait="$store.state.phenotype"
                            :dataContent="
                                this.$store.state.lunaris.dataFromLunaris
                            "
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
                                :default-phenotype="
                                    $store.state.phenotype.description
                                "
                            ></phenotype-selectpicker>
                        </div>
                        <span v-if="$store.state.phenotype">{{
                            $store.state.phenotype.description
                        }}</span>
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
                    <div
                        v-for="row in $parent.genes"
                        :class="'gene-with-signal ' + row.type"
                        :key="row.name"
                    >
                        <a :href="`/gene.html?gene=${row.name}`">{{
                            row.name
                        }}</a>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Variant associations in the region:
                        {{ $parent.regionString }}
                    </h4>
                    <documentation
                        name="region.phenos_w_signal.subheader"
                    ></documentation>
                    <div v-if="$parent.topAssociations.length > 0">
                        <div
                            style="text-align: right; padding-bottom: 5px"
                            v-if="$parent.topAssociations[0].pValue <= 5e-8"
                        >
                            <div
                                href="javascript:;"
                                v-on:click="
                                    $parent.switchViews([
                                        'pws-merged-view',
                                        'pws-bar-view',
                                    ])
                                "
                                class="switch-view btn btn-secondary btn-sm"
                            >
                                View associations by phenotype group
                            </div>
                        </div>
                        <phenotype-signal-mixed
                            :phenotypes="$parent.topAssociations"
                        ></phenotype-signal-mixed>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="!!$store.state.phenotype">
                        <h4 class="card-title">
                            Top Associations for
                            {{ $store.state.phenotype.description }}
                            <tooltip-documentation
                                name="region.topassoc.tooltip"
                                :isHover="true"
                                :noIcon="false"
                            ></tooltip-documentation>
                        </h4>
                        <documentation
                            name="region.variantassociation.subheader"
                        ></documentation>


                        <filter-group
                            v-model="$parent.associationsFilter"
                            :looseMatch="true"
                        >
                            <filter-enumeration-control
                                :field="'consequence'"
                                :options="
                                    $parent.associationConsequences
                                "
                                :inclusive="true"
                            >
                                <div class="label">Consequence</div>
                            </filter-enumeration-control>

                            <filter-enumeration-control
                                :field="'nearest'"
                                :options="
                                    $parent.associationNearestGenes
                                "
                                :inclusive="true"
                            >
                                <div class="label">Closest Genes</div>
                            </filter-enumeration-control>

                            <filter-pvalue-control :field="'pValue'">
                                <div class="label">P-Value (&le;)</div>
                            </filter-pvalue-control>

                            <filter-effect-direction-control
                                :field="'beta'"
                            >
                                <div class="label">Effect (+/-)</div>
                            </filter-effect-direction-control>
                            <template slot="filtered" slot-scope="{filter}">
                                <associations-table
                                    v-if="$store.state.associations.data.length > 0"
                                    :phenotypes="$parent.phenotypes"
                                    :associations="$store.state.associations.data"
                                    :filter="filter"
                                ></associations-table>
                            </template>
                        </filter-group>


                        <br />
                        <documentation
                            name="region.lz.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>

                        <documentation
                            name="region.igv.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>

                        <filter-group
                            :looseMatch="true"
                        >
                            <div class="col filter-col-lg">
                                <div
                                    class="label"
                                    style="margin-bottom: 5px"
                                >
                                    Add annotation method track
                                </div>
                                <annotation-method-selectpicker
                                    :annotations="
                                        $parent.globalEnrichmentAnnotations
                                    "
                                    :clearOnSelected="true"
                                    @annotation="
                                        $parent.addAnnotationIntervalsPanel(
                                            $event
                                        )
                                    "
                                />
                            </div>

                            <div class="col filter-col-lg">
                                <div
                                    class="label"
                                    style="margin-bottom: 5px"
                                >
                                    Add credible sets track
                                </div>
                                <credible-sets-selectpicker
                                    :credibleSets="$parent.credibleSets"
                                    :clearOnSelected="true"
                                    @credibleset="
                                        $parent.addCredibleVariantsPanel(
                                            $event
                                        )
                                    "
                                />
                            </div>

                            <div class="col divider">&nbsp;</div>

                            <span style="display: inline-block;">
                                <div class="label">Filter annotation track</div>
                                <filter-pvalue-control :field="'pValue'">
                                    <span class="label">
                                        P-Value (&le;)
                                    </span>
                                </filter-pvalue-control>
                                <filter-greater-control :field="'fold'">
                                    <span class="label">
                                        Fold (&ge;)
                                    </span>
                                </filter-greater-control>
                            </span>

                            <template slot="filtered" slot-scope="{filter}">
                                <locuszoom
                                    v-if="$parent.tissueScoring !== null"
                                    ref="locuszoom"
                                    :chr="$store.state.chr"
                                    :start="$store.state.start"
                                    :end="$store.state.end"
                                    :filterAssociations="$parent.associationsFilter"
                                    :filterAnnotations="filter"
                                    @regionchanged="
                                        $parent.requestCredibleSets($event.data)
                                    "
                                    :loglog="true"
                                    :refSeq="true">
                                    <lz-associations-panel
                                        :phenotype="$store.state.phenotype.name"
                                        @input="$parent.updateAssociationsTable"
                                    ></lz-associations-panel>
                                </locuszoom>
                            </template>

                        </filter-group>



                    </div>
                </div>
            </div>
        </div>
        <!-- TODO: collapse tables -->
        <b-collapse id="collapse-1" class="mt-2">
            <b-card>
                <p class="card-text">Collapse contents Here</p>
                <b-button v-b-toggle.collapse-1-inner size="sm"
                    >Toggle Inner Collapse</b-button
                >
                <b-collapse id="collapse-1-inner" class="mt-2">
                    <b-card>Hello!</b-card>
                </b-collapse>
            </b-card>
        </b-collapse>
        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
