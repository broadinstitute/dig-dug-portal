<template>
    <!-- Header -->
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- body -->
        <div class="container-fluid mdkp-body">
            <search-header-wrapper>
                <!-- Wrap page level searchs with "pageSearchParameters" div -->

                <div>
                    <div class="region-search col filter-col-md">
                        <div class="label">Search gene</div>
                        <gene-selectpicker
                            @onGeneChange="
                                $store.dispatch('onGeneChange', $event)
                            "
                        ></gene-selectpicker>
                    </div>
                    <div class="col divider" style="background: none">
                        <span class="or-text">or</span>
                    </div>
                    <div class="region-search col filter-col-sm">
                        <div class="label">Chromosome</div>
                        <input
                            v-model="$store.state.newChr"
                            type="text"
                            class="form-control input-default"
                            placeholder="Chromosome"
                        />
                    </div>
                    <div class="region-search col filter-col-md">
                        <div class="label">Start</div>
                        <input
                            v-model="$store.state.newStart"
                            type="text"
                            class="form-control input-default"
                            placeholder="Start position"
                        />
                    </div>

                    <div class="region-search col filter-col-md">
                        <div class="label">End</div>
                        <input
                            v-model="$store.state.newEnd"
                            type="text"
                            class="form-control input-default"
                            placeholder="End position"
                        />
                    </div>
                    <div class="region-search col filter-col-md">
                        <div class="label">Search</div>
                        <button
                            id="regionSearchGo"
                            class="btn btn-light btn-sm go"
                            type="button"
                            @click="$store.dispatch('queryRegion')"
                        >
                            GO
                        </button>
                    </div>
                    <div class="col divider"></div>
                    <!-- <div class="region-search col filter-col-md">
                        <div class="label">Search phenotype</div>
                        <phenotype-selectpicker
                            v-if="$store.state.phenotype"
                            :phenotypes="$store.state.bioPortal.phenotypes"
                            :clearOnSelected="true"
                        ></phenotype-selectpicker>
                    </div>-->
                </div>
            </search-header-wrapper>

            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">
                        Chromosome: Start position - End position
                    </div>
                    <!-- <div class="col-md-4 gene-page-header-title">Phenotype</div> -->
                    <div class="col-md-6 gene-page-header-body regionInfo">
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
                            :trait="$parent.selectedPhenotypes[0]"
                            :dataContent="
                                this.$store.state.lunaris.dataFromLunaris
                            "
                        ></lunaris-link>
                    </div>
                    <!-- <div class="col-md-4 gene-page-header-body">
                        <span v-if="$store.state.phenotype">
                            {{
                            $store.state.phenotype.description
                            }}
                        </span>
                    </div>-->
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation name="region.trait.info"></documentation>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Genes overlapping region
                        <tooltip-documentation
                            name="region.genesoverlapping.header.tooltip"
                            :isHover="true"
                            :noIcon="false"
                        ></tooltip-documentation>
                    </h4>

                    <div
                        v-for="row in $parent.genes"
                        :class="'gene-with-signal ' + row.type"
                        :key="row.name"
                    >
                        <a :href="`/gene.html?gene=${row.name}`">
                            {{ row.name }}
                        </a>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Most significant variant associations in the region:
                        {{ $parent.regionString }}
                        <tooltip-documentation
                            name="region.mostsignificantassoc.header.tooltip"
                            :isHover="true"
                            :noIcon="false"
                        ></tooltip-documentation>
                    </h4>
                    <documentation
                        name="region.phenos_w_signal.subheader"
                    ></documentation>
                    <template v-if="$parent.topAssociations.length > 0">
                        <div>
                            <div
                                style="text-align: right; padding-bottom: 5px"
                                v-if="$parent.topAssociations[0].pValue <= 5e-8"
                            >
                                <div
                                    href="javascript:;"
                                    v-on:click="
                                        $parent.switchViews(
                                            ['pws-merged-view', 'pws-bar-view'],
                                            [
                                                'View associations by phenotype group',
                                                'View associations by individual phenotype',
                                            ]
                                        )
                                    "
                                    class="switch-view btn btn-secondary btn-sm"
                                >
                                    View associations by phenotype group
                                </div>
                            </div>
                            <phenotype-signal-mixed
                                :phenotypes="$parent.topAssociations"
                                :limit="10"
                            ></phenotype-signal-mixed>
                        </div>
                        <div class="mt-3">
                            <clumped-variants-table
                                legends
                                :variants="$parent.topAssociations"
                                :phenotypeMap="$parent.phenotypeMap"
                            ></clumped-variants-table>
                        </div>
                    </template>
                    <template v-else>
                        <b-alert show variant="warning" class="text-center">
                            <b-icon icon="exclamation-triangle"></b-icon>There
                            is no significant association found in this region.
                        </b-alert>
                    </template>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <documentation
                        name="region.lz.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>

                    <documentation
                        name="region.igv.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>

                    <h6>
                        Add tracks &nbsp;<tooltip-documentation
                            name="region.add.phenotypes.tooltip"
                            :isHover="true"
                            :noIcon="false"
                        ></tooltip-documentation>
                    </h6>

                    <criterion-list-group
                        class="first"
                        v-model="$parent.regionPageSearchCriterion"
                        :header="''"
                    >
                        <!-- Phenotype Selector -->
                        <filter-enumeration-control
                            class="filter-col-lg"
                            :field="'phenotype'"
                            :options="$parent.allphenotypes"
                            :multiple="true"
                            :pillFormatter="
                                (filter) =>
                                    $store.state.bioPortal.phenotypeMap[
                                        filter.threshold
                                    ].description
                            "
                            :labelFormatter="
                                (phenotype) =>
                                    !!$store.state.bioPortal.phenotypeMap[
                                        phenotype
                                    ]
                                        ? $store.state.bioPortal.phenotypeMap[
                                              phenotype
                                          ].description
                                        : phenotype
                            "
                            placeholder="Select one ore more phenotypes"
                        >
                            <div class="label">Phenotypes:</div>
                        </filter-enumeration-control>

                        <div class="col filter-col-md">
                            <div class="label" style="margin-bottom: 5px">
                                Add credible set
                            </div>
                            <credible-sets-selectpicker
                                :credibleSets="$parent.credibleSets"
                                :clearOnSelected="true"
                                @credibleset="
                                    $parent.addCredibleVariantsPanel($event)
                                "
                            />
                        </div>

                        <div class="col filter-col-md">
                            <div class="label" style="margin-bottom: 5px">
                                Add tissue
                            </div>
                            <tissue-selectpicker
                                :tissues="$parent.globalEnrichmentTissues"
                                :clearOnSelected="true"
                                @tissue="
                                    $parent.addTissueIntervalsPanel($event)
                                "
                            />
                        </div>

                        <div class="col filter-col-md">
                            <div class="label" style="margin-bottom: 5px">
                                Add annotation
                            </div>
                            <annotation-selectpicker
                                :annotations="
                                    $parent.globalEnrichmentAnnotations
                                "
                                :clearOnSelected="true"
                                @annotation="
                                    $parent.addAnnotationIntervalsPanel($event)
                                "
                            />
                        </div>
                    </criterion-list-group>
                    <h6 v-if="$parent.selectedPhenotypes.length > 0">
                        Filter tracks &nbsp;
                        <tooltip-documentation
                            name="region.filter.topassoc.tooltip"
                            :isHover="true"
                            :noIcon="false"
                        ></tooltip-documentation>
                    </h6>

                    <b-alert
                        class="text-center my-3"
                        variant="info"
                        :show="!$parent.selectedPhenotypes.length"
                        ><b-icon icon="info-circle"></b-icon> Select a phenotype
                        to start viewing associations and annotations</b-alert
                    >

                    <b-tabs
                        ><b-tab title="Variant associations" key="associations">
                            <criterion-function-group
                                v-model="$parent.associationsFilter"
                                v-if="$parent.selectedPhenotypes.length > 0"
                            >
                                <filter-enumeration-control
                                    :field="'consequence'"
                                    :options="$parent.associationConsequences"
                                    :inclusive="false"
                                >
                                    <div class="label">Consequence</div>
                                </filter-enumeration-control>

                                <filter-enumeration-control
                                    class="filter-col-sm"
                                    :field="'nearest'"
                                    :options="$parent.associationNearestGenes"
                                    :inclusive="false"
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
                                <!--
                                <template
                                    slot="filtered"
                                    slot-scope="{ filter }"
                                >
                                </template> -->
                            </criterion-function-group>
                        </b-tab>
                        <b-tab title="Annotations by global enrichment">
                            <div v-if="$parent.selectedPhenotypes.length > 0">
                                <criterion-function-group
                                    v-model="$parent.annotationsFilter"
                                >
                                    <filter-pvalue-control :field="'pValue'">
                                        <div class="label">P-Value (&le;)</div>
                                    </filter-pvalue-control>
                                    <filter-greater-control :field="'fold'">
                                        <div class="label">Fold (&ge;)</div>
                                    </filter-greater-control>

                                    <!-- <template
                                        slot="filtered"
                                        slot-scope="{ filter }"
                                    >
                                    </template> -->
                                </criterion-function-group>
                            </div>
                        </b-tab>
                    </b-tabs>

                    <locuszoom
                        v-if="$parent.selectedPhenotypes.length > 0"
                        ref="locuszoom"
                        :chr="$store.state.chr"
                        :start="$store.state.start"
                        :end="$store.state.end"
                        :filterAssociations="$parent.associationsFilter"
                        :filterAnnotations="$parent.annotationsFilter"
                        @regionchanged="
                            ($event) => {
                                $parent.requestCredibleSets($event.data);
                            }
                        "
                        :ldpop="true"
                        :refSeq="true"
                    >
                        <p
                            v-for="phenotype in $parent.selectedPhenotypes"
                            :key="phenotype.name"
                        >
                            <lz-associations-panel
                                :phenotype="phenotype.name"
                                :title="phenotype.description"
                                @input="
                                    $parent.updatePageAssociations({
                                        phenotype: phenotype.name,
                                        data: $event,
                                    })
                                "
                            ></lz-associations-panel>
                            <lz-catalog-annotations-panel
                                :phenotype="phenotype.name"
                                :title="phenotype.description"
                            ></lz-catalog-annotations-panel>
                        </p>
                    </locuszoom>

                    <template
                        v-if="
                            $parent.selectedPhenotypes.length > 0 &&
                            $parent.pageAssociations.length > 0
                        "
                    >
                        <h4 class="card-title">
                            Variants in region
                            <!--<span
                            v-for="p in $parent.selectedPhenotypes"
                            class="item"
                            >{{ p.description }}</span
                        >-->
                            &nbsp;
                            <tooltip-documentation
                                name="region.topassoc.tooltip"
                                :isHover="true"
                                :noIcon="false"
                            ></tooltip-documentation>
                        </h4>
                        <documentation
                            name="region.variantassociation.subheader"
                        ></documentation>
                        <associations-table
                            id="associations-table"
                            :phenotypes="$parent.selectedPhenotypes"
                            :associations="$parent.pageAssociations"
                            :filter="$parent.associationsFilter"
                            :exclusive="false"
                        ></associations-table
                    ></template>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style>
ul.nav-tabs {
    border-bottom: unset;
    margin-left: 5px;
}
.nav-tabs a.nav-link.active {
    background-color: #efefef;
}
.tab-pane div.filtering-ui-wrapper {
    border-top: none;
    /* border-radius: 0 0 5px 5px; */
}
.first div.filtering-ui-wrapper {
    background-color: #ddefff;
    border: solid 1px #bbdfff;
}
</style>
