<template>
    <!-- Header -->
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :rawPhenotypes="$parent.rawPhenotypes"
        ></page-header>

        <!-- body -->
        <div class="container-fluid mdkp-body">
            <search-header-wrapper>

                <div>
                    <div class="region-search col filter-col-md">
                        <div class="label">Begin new search</div>
                        <research-single-search
                            :single-search-config="null"
                            :phenotypes="$parent.phenotypesInSession
                                "
                            :utils="$parent.utilsBox"
                        ></research-single-search>
                    </div>
                    <div class="region-search col filter-col-md">
                        <div class="label">Set Ancestry</div>
                        <ancestry-selectpicker
                            :pageLevel="true"
                            :ancestries="
                                $store.state.bioPortal.datasets.map(
                                    (dataset) => dataset.ancestry
                                )
                            "
                        ></ancestry-selectpicker>
                    </div>
                    <!--
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
                    -->
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
                    <div class="col-md-10 gene-page-header-body regionInfo">
                        <div class="viewing-region">
                            {{ $parent.regionString }}
                        </div>
                        <!--<button
                            class="btn btn-primary text-nowrap text-right explore-region-btn"
                            style="margin-left: 20px"
                            @click="$parent.exploreExpanded()"
                        >
                            Expand &plusmn; 50 kb
                        </button>-->
                        <expand-region> </expand-region>
                    </div>
                    <div class="col-md-2 text-right">
                        <h6>Download associations</h6>
                        <b-link href="https://bioindex.hugeamp.org/">
                            <b-img
                                src="/images/bioindex_logo.svg"
                                alt="BioIndex logo"
                                style="height: 34px"
                            ></b-img
                        ></b-link>
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
                            :is-hover="true"
                            :no-icon="false"
                        ></tooltip-documentation>
                    </h4>

                    <div
                        v-for="row in $parent.genes"
                        :key="row.name"
                        :class="'gene-with-signal ' + row.type"
                    >
                        <template v-if="row.type == 'protein_coding'">
                            <a :href="`/gene.html?gene=${row.name}`">
                                {{ row.name }}
                            </a></template
                        >
                        <template v-else> {{ row.name }}</template>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Most significant variant associations in the region:
                        {{ $parent.regionString }}
                        (Ancestry:
                        {{
                            $store.state.ancestry == ""
                                ? "All"
                                : $parent.ancestryFormatter(
                                      $store.state.ancestry
                                  )
                        }})
                        <tooltip-documentation
                            name="region.mostsignificantassoc.header.tooltip"
                            :is-hover="true"
                            :no-icon="false"
                        ></tooltip-documentation>
                    </h4>
                    <documentation
                        name="region.phenos_w_signal.subheader"
                    ></documentation>

                    <template v-if="$parent.topAssociations.length > 0">
                        <div
                            :class="
                                $parent.topAssociations.length < 2
                                    ? 'hidden'
                                    : ''
                            "
                        >
                            <div
                                v-if="$parent.topAssociations[0].pValue <= 5e-8"
                                style="text-align: right; padding-bottom: 5px"
                            >
                                <div
                                    href="javascript:;"
                                    class="switch-view btn btn-secondary btn-sm"
                                    @click="
                                        $parent.switchPlotViews(
                                            ['pws-merged-view', 'pws-bar-view'],
                                            [
                                                'View associations by phenotype group',
                                                'View associations by individual phenotype',
                                            ]
                                        )
                                    "
                                >
                                    View associations by phenotype group
                                </div>
                            </div>

                            <div class="pws-merged-view svg-wrapper">
                                <phenotype-signal-bar-chart
                                    v-if="
                                        $parent.topAssociations.length > 0 &&
                                        $parent.topAssociations.length <= 5
                                    "
                                    :phenotypes="$parent.topAssociations"
                                    :colors="$parent.colors"
                                    :limit="10"
                                ></phenotype-signal-bar-chart>
                                <research-phewas-plot
                                    v-if="$parent.topAssociations.length > 5"
                                    ref="rpPheWASPlot"
                                    canvas-id=""
                                    :phenotypes-data="$parent.topAssociations"
                                    :phenotype-map="
                                        $store.state.bioPortal.phenotypeMap
                                    "
                                    :colors="$parent.colors"
                                    :plot-margin="{
                                        leftMargin: 150,
                                        rightMargin: 40,
                                        topMargin: 20,
                                        bottomMargin: 100,
                                        bump: 11,
                                    }"
                                    :render-config="{
                                        type: 'phewas plot',
                                        'group by': 'phenotype group',
                                        'y axis field': 'pValue',
                                        'convert y -log10': 'true',
                                        'phenotype map': 'kp phenotype map',
                                        'render by': 'phenotype',
                                        'y axis label': '-Log10(p-value)',
                                        'x axis label': 'Phenotype',
                                        'beta field': 'beta',
                                        'hover content': ['pValue', 'beta'],
                                        thresholds: ['5e-8'],
                                        height: '600',
                                        'plot margin': {
                                            left: 150,
                                            right: 150,
                                            top: 250,
                                            bottom: 300,
                                        },
                                    }"
                                    :pkg-data="null"
                                    :pkg-data-selected="null"
                                    :filter="null"
                                    :options="[
                                        'add phenotype',
                                        'open phenotype page',
                                    ]"
                                    :utils="$parent.utilsBox"
                                ></research-phewas-plot>
                            </div>
                            <div
                                v-if="$parent.topAssociations.length > 1"
                                class="pws-bar-view svg-wrapper hidden-svg"
                            >
                                <phenotype-signal-in-group
                                    :phenotypes="$parent.topAssociations"
                                    :colors="$parent.colors"
                                    :limit="10"
                                ></phenotype-signal-in-group>
                            </div>
                        </div>
                        <div class="mt-3">
                            <clumped-variants-table
                                legends
                                :variants="$parent.topAssociations"
                                :phenotype-map="$parent.phenotypeMap"
                                :colors="$parent.colors"
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
            <div v-show="$store.state.ancestry" class="card mdkp-card">
                <div class="card-body test-ancestry">
                    <h4>
                        Variants in region (Ancestry:
                        {{ $parent.ancestryFormatter($store.state.ancestry) }})
                        &nbsp;<tooltip-documentation
                            name="region.ancestrytopassoc.tooltip"
                            :is-hover="true"
                            :no-icon="false"
                        ></tooltip-documentation>
                    </h4>
                    <documentation
                        name="region.ancestrytopassoc.subheader"
                    ></documentation>
                    <a
                        v-if="
                            $store.state.ancestryAssoc.data.length > 0 &&
                            $parent.isSifterAncestry()
                        "
                        :href="`/research.html?pageid=kp_variant_sifter_ancestry&phenotype=${$parent.selectedPhenotypes[0].name}&ancestry=${$store.state.ancestry}&region=${$store.state.chr}:${$store.state.start}-${$store.state.end}`"
                        class="btn btn-primary link-to-vs ancestry"
                        >Prioritize variants in this region&nbsp;&nbsp;</a
                    >
                    <associations-table
                        id="ancestry-associations-table"
                        :phenotypes="$parent.selectedPhenotypes"
                        :associations="$store.state.ancestryAssoc.data"
                        :filter="$parent.associationsFilter"
                        :exclusive="false"
                    ></associations-table>
                </div>
            </div>
            <div v-show="!$store.state.ancestry" class="card mdkp-card">
                <div class="card-body test-original">
                    <documentation
                        name="region.lz.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>

                    <documentation
                        name="region.igv.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>

                    <div class="filtering-ui-wrapper container-fluid">
                        <div class="row filtering-ui-content">
                            <div class="col filter-col-md filter-col-lg">
                                <div class="label">
                                    Go to the Variant Sifter to explore genetic
                                    associations, credible sets, and epigenomic
                                    annotations in this region
                                    &nbsp;<tooltip-documentation
                                        name="region.add.phenotypes.tooltip"
                                        :is-hover="true"
                                        :no-icon="false"
                                    ></tooltip-documentation>
                                </div>
                                <template
                                    v-if="$parent.selectedPhenotypes.length > 0"
                                >
                                    <a
                                        v-for="item in $parent.selectedPhenotypes"
                                        :key="item.description"
                                        :href="
                                            '/research.html?pageid=kp_variant_sifter&phenotype=' +
                                            item.name +
                                            '&region=' +
                                            $store.state.chr +
                                            ':' +
                                            $store.state.start +
                                            '-' +
                                            $store.state.end
                                        "
                                        target="_blank"
                                        class="btn btn-primary"
                                        style="
                                            color: #ffffff !important;
                                            margin: 0 5px;
                                        "
                                        >{{ item.description }}</a
                                    >
                                </template>
                            </div>
                        </div>
                    </div>
                    <pre />
                    <!--<h5 v-if="$parent.selectedPhenotypes.length > 0">
						Add tracks &nbsp;<tooltip-documentation
							name="region.add.phenotypes.tooltip"
							:is-hover="true"
							:no-icon="false"
						></tooltip-documentation>
						| Filter tracks and table &nbsp;
						<tooltip-documentation
							name="region.filter.topassoc.tooltip"
							:is-hover="true"
							:no-icon="false"
						></tooltip-documentation>
					</h5>-->

                    <b-alert
                        class="text-center my-3"
                        variant="info"
                        :show="!$parent.selectedPhenotypes.length"
                        ><b-icon icon="info-circle"></b-icon> Select a phenotype
                        to start viewing associations and annotations</b-alert
                    >

                    <b-tabs class="region-gem">
                        <b-tab key="phenotypes" title="Add phenotypes">
                            <criterion-list-group
                                v-model="$parent.regionPageSearchCriterion"
                                class="first"
                                :header="''"
                            >
                                <filter-enumeration-control
                                    class="filter-col-lg"
                                    :field="'phenotype'"
                                    :options="$parent.allphenotypes"
                                    :multiple="true"
                                    :pill-formatter="
                                        (filter) =>
                                            $store.state.bioPortal.phenotypeMap[
                                                filter.threshold
                                            ].description
                                    "
                                    :label-formatter="
                                        (phenotype) =>
                                            !!$store.state.bioPortal
                                                .phenotypeMap[phenotype]
                                                ? $store.state.bioPortal
                                                      .phenotypeMap[phenotype]
                                                      .description
                                                : phenotype
                                    "
                                    placeholder="Select one or more phenotypes"
                                >
                                    <div class="label">Add Phenotypes</div>
                                </filter-enumeration-control>
                            </criterion-list-group>
                        </b-tab>
                        <b-tab
                            key="associations"
                            title="Filter plots and table"
                            v-show="$parent.selectedPhenotypes.length"
                        >
                            <criterion-function-group
                                v-if="$parent.selectedPhenotypes.length > 0"
                                v-model="$parent.associationsFilter"
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
                            </criterion-function-group>
                        </b-tab>
                        <!--<b-tab
							title="Annotations by global enrichment"
							v-show="$parent.selectedPhenotypes.length"
						>
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
								</criterion-function-group>
							</div>
						</b-tab>-->
                    </b-tabs>

                    <locuszoom
                        v-if="$parent.selectedPhenotypes.length > 0"
                        ref="locuszoom"
                        :chr="$store.state.chr"
                        :start="$store.state.start"
                        :end="$store.state.end"
                        :filter-associations="$parent.associationsFilter"
                        :filter-annotations="$parent.annotationsFilter"
                        :ldpop="true"
                        :ref-seq="true"
                        @regionchanged="
                            ($event) => {
                                $parent.requestCredibleSets($event.data);
                            }
                        "
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
                    <!--<a
						v-if="$parent.selectedPhenotypes.length > 0"
						:href="
							'/research.html?pageid=kp_variant_sifter&phenotype=' +
							$parent.selectedPhenotypes[0].name +
							'&region=' +
							$store.state.chr +
							':' +
							$store.state.start +
							'-' +
							$store.state.end
						"
						class="btn btn-primary link-to-vs"
						style=""
						>Prioritize variants in this region&nbsp;&nbsp;</a
					>-->
                    <template
                        v-if="
                            $parent.selectedPhenotypes.length > 0 &&
                            $parent.pageAssociations.length > 0
                        "
                    >
                        <h4 class="card-title">
                            Variants in region
                            <span v-if="!$store.state.ancestry"
                                >(Ancestry: All)</span
                            >
                            &nbsp;
                            <tooltip-documentation
                                name="region.topassoc.tooltip"
                                :is-hover="true"
                                :no-icon="false"
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
.link-to-vs {
    color: #ffffff !important;
    float: right;
    margin-top: -5px;
    background-image: url(/images/icons/new.svg);
    background-repeat: no-repeat;
    background-position: top right;
}

.link-to-vs.ancestry {
    float: left;
    margin-top: -8px;
}

.link-to-vs:hover {
    color: #ffffff !important;
}

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
    border: solid 1px #ddefff;
}

.region-gem ul > li:first-child > a {
    background-color: #ddefff !important;
    border: solid 1px #ddefff !important;
}
</style>
