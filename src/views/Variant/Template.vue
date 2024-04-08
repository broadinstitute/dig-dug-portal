<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :rawPhenotypes="$parent.rawPhenotypes"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <search-header-wrapper>
                <!-- Wrap page level searchs with "pageSearchParameters" div -->

                <div class="col filter-col-md">
                    <div class="label">Variant</div>
                    <input
                        v-model="$store.state.newVariantId"
                        type="text"
                        class="form-control"
                        placeholder="Search Variant"
                        id="variant_search_input"
                        @click="$parent.clearBadSearch()"
                    />
                </div>
                <div class="col filter-col-md">
                    <div class="label">Ancestry</div>
                    <ancestry-selectpicker
                        :ancestries="
                            $store.state.bioPortal.datasets.map(
                                (dataset) => dataset.ancestry
                            )
                        "
                    ></ancestry-selectpicker>
                </div>
                <div class="col filter-col-sm">
                    <button
                        id="variantSearchGo"
                        class="btn btn-light btn-sm go"
                        type="button"
                        @click="
                            $store.dispatch(
                                'queryVariant',
                                $store.state.newVariantId
                            )
                        "
                    >
                        GO
                    </button>
                </div>
                <div class="col divider"></div>
                <div class="col filter-col-md search-example">
                    <div class="label">Search format examples</div>
                    <div>
                        rs11716727, chr3:12489012_C_T, 3_12489012:C/T,
                        chr3_12489012-C-T
                    </div>
                </div>
                <div v-if="$store.state.badSearch">
                    <p :style="{ color: '#FF0000' }">
                        Search term "{{ $store.state.newVariantId }}" did not
                        match a variant. Enter a variant to view associations.
                    </p>
                </div>
            </search-header-wrapper>

            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-9 gene-page-header-title">
                        Variant
                        <tooltip-documentation
                            name="variant.alleles.tooltip.hover"
                            :isHover="true"
                        ></tooltip-documentation>
                    </div>
                    <div class="col-md-3 gene-page-header-title">Navigate</div>

                    <div class="col-md-9 gene-page-header-body">
                        <span
                            >{{ $parent.varId }}
                            <span v-if="$parent.dbSNP">
                                <span style="color: gray">/</span>
                                {{ $parent.dbSNP }}
                            </span>
                        </span>
                    </div>
                    <div class="col-md-3 gene-page-header-body">
                        <button
                            class="btn btn-primary explore-region-btn"
                            @click="$parent.exploreRegion()"
                        >
                            Explore region
                        </button>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation
                        name="variant.explore.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Closest genes</h4>
                    <documentation
                        name="variant.genes.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>
                    <div
                        v-if="
                            $parent.variantData && $parent.variantData.nearest
                        "
                    >
                        <div
                            v-for="gene in $parent.variantData.nearest"
                            :key="gene"
                            class="gene-with-signal protein_coding"
                        >
                            <a :href="`/gene.html?gene=${gene}`">{{ gene }}</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div
                        v-if="
                            $store.state.transcriptConsequences.data.length > 0
                        "
                    >
                        <h4 class="card-title">
                            Predicted variant consequences
                            <tooltip-documentation
                                name="variant.consequences.tooltip"
                                :content-fill="$parent.documentationMap"
                                :isHover="true"
                                :noIcon="false"
                            ></tooltip-documentation>
                        </h4>
                        <documentation
                            name="variant.effect.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>

                        <transcript-consequence-table
                            v-bind:transcriptConsequences="
                                $store.state.transcriptConsequences.data
                            "
                        ></transcript-consequence-table>
                    </div>
                    <div v-else-if="$store.state.variant">
                        <h4 class="card-title">
                            Most severe variant consequence
                        </h4>
                        {{
                            $parent.consequenceFormatter(
                                $store.state.variant.consequence
                            )
                        }}
                        &mdash;
                        {{
                            $parent.consequenceMeaning(
                                $store.state.variant.consequence
                            )
                        }}
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        {{ $parent.varId }}
                        <span v-if="$parent.dbSNP">
                            <span style="color: gray">/</span>
                            {{ $parent.dbSNP }}
                        </span>
                        PheWAS associations (Ancestry:
                        {{
                            !$store.state.ancestry
                                ? "All"
                                : $parent.ancestryFormatter(
                                      $store.state.ancestry
                                  )
                        }})
                        <tooltip-documentation
                            name="variant.assoc.tooltip"
                            :content-fill="$parent.documentationMap"
                            :isHover="true"
                            :noIcon="false"
                        ></tooltip-documentation>
                    </h4>

                    <documentation
                        name="variant.phewas.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>
                    <unauthorized-message
                        :restricted="$store.state.phewas.restricted"
                    ></unauthorized-message>

                    <criterion-function-group>
                        <filter-enumeration-control
                            :field="'phenotype'"
                            :options="
                                $parent.phenotypesInSession.map((p) => p.name)
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
                            :multiple="true"
                        >
                            <div class="label">Phenotypes</div>
                        </filter-enumeration-control>

                        <filter-pvalue-control
                            :field="'pValue'"
                            :inclusive="true"
                        >
                            <div class="label">P-Value (&le;)</div>
                        </filter-pvalue-control>

                        <filter-effect-direction-control
                            :field="'beta'"
                            :inclusive="true"
                        >
                            <div class="label">Effect (+/-)</div>
                        </filter-effect-direction-control>

                        <template slot="filtered" slot-scope="{ filter }">
                            <b-tabs content-class="mt-3" align="center">
                                <b-tab title="PheWAS plot" active>
                                    <b-button
                                        size="sm"
                                        variant="outline-secondary"
                                        @click="
                                            $refs.rpPheWASPlot.renderPheWas()
                                        "
                                        style="
                                            position: absolute;
                                            right: 25px;
                                            z-index: 10;
                                        "
                                        >Re-render PheWAS plot</b-button
                                    >
                                    <research-phewas-plot
                                        v-if="$parent.pheWasData.length > 0"
                                        canvasId=""
                                        :phenotypesData="$parent.pheWasData"
                                        :phenotypeMap="
                                            $store.state.bioPortal.phenotypeMap
                                        "
                                        :colors="[
                                            '#007bff',
                                            '#048845',
                                            '#8490C8',
                                            '#BF61A5',
                                            '#EE3124',
                                            '#FCD700',
                                            '#5555FF',
                                            '#7aaa1c',
                                            '#9F78AC',
                                            '#F88084',
                                            '#F5A4C7',
                                            '#CEE6C1',
                                            '#cccc00',
                                            '#6FC7B6',
                                            '#D5A768',
                                            '#d4d4d4',
                                        ]"
                                        :plotMargin="{
                                            leftMargin: 75,
                                            rightMargin: 20,
                                            topMargin: 10,
                                            bottomMargin: 50,
                                            bump: 5.5,
                                        }"
                                        :renderConfig="{
                                            type: 'phewas plot',
                                            'group by': 'phenotype group',
                                            'phenotype map': 'kp phenotype map',
                                            'y axis field': 'pValue',
                                            'convert y -log10': 'true',
                                            'y axis label': '-Log10(p-value)',
                                            'render by': 'phenotype',
                                            'x axis label': 'beta',
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
                                        :pkgData="null"
                                        :pkgDataSelected="null"
                                        :filter="filter"
                                        ref="rpPheWASPlot"
                                        :utils="$parent.utilsBox"
                                    ></research-phewas-plot>
                                </b-tab>
                                <b-tab title="Forest plot">
                                    <forest-plot-html
                                        v-if="
                                            ($store.state.phewas.data.length >
                                                0 &&
                                                !$store.state.ancestry) ||
                                            $store.state.ancestryPhewas.data
                                                .length > 0
                                        "
                                        :forestPlotData="$parent.pheWasData"
                                        :labelMap="
                                            $store.state.bioPortal.phenotypeMap
                                        "
                                        :sortBy="'pValue'"
                                        :significant="5e-8"
                                        :moderate="2.5e-6"
                                        :weak="0.05"
                                        :bulletBy="'beta'"
                                        :stdErr="'stdErr'"
                                        :labelBy="'phenotype'"
                                        :countDichotomous="0"
                                        :filter="filter"
                                    ></forest-plot-html>
                                </b-tab>
                            </b-tabs>

                            <unauthorized-message
                                :restricted="
                                    $store.state.datasetAssociations.restricted
                                "
                            ></unauthorized-message>
                            <phewas-datasets
                                v-if="$store.state.phewas.data"
                                :associations="$parent.pheWasData"
                                :ancestry="$store.state.ancestry"
                                :datasets="
                                    $store.state.datasetAssociations.data
                                "
                                :datasetMap="$store.state.bioPortal.datasetMap"
                                :phenotypeMap="
                                    $store.state.bioPortal.phenotypeMap
                                "
                                :filter="filter"
                            ></phewas-datasets>
                        </template>
                    </criterion-function-group>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Transcription factor binding motifs altered by
                        {{ $parent.variantName }}
                        <tooltip-documentation
                            name="variant.tfbinding.tooltip"
                            :content-fill="$parent.documentationMap"
                            :isHover="true"
                            :noIcon="false"
                        ></tooltip-documentation>
                    </h4>
                    <documentation
                        name="variant.tfbinding.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>
                    <unauthorized-message
                        :restricted="
                            $store.state.transcriptionFactors.restricted
                        "
                    ></unauthorized-message>
                    <div v-if="$store.state.transcriptionFactors.data">
                        <transcription-factors-table
                            v-bind:transcriptionFactors="
                                $store.state.transcriptionFactors.data
                            "
                        ></transcription-factors-table>
                    </div>
                    <div v-else class="card-body">
                        <h4>None found</h4>
                    </div>
                </div>
            </div>
            <!--
			<div class="card mdkp-card">
				<div class="card-body">
					<h4 class="card-title">
						Annotated regions overlapping {{ $parent.variantName }}
						<tooltip-documentation
							name="variant.annotregions.tooltip"
							:content-fill="$parent.documentationMap"
							:isHover="true"
							:noIcon="false"
						></tooltip-documentation>
					</h4>
					<documentation
						name="variant.annotated.subheader"
						:content-fill="$parent.documentationMap"
					></documentation>
					<unauthorized-message
						:restricted="$store.state.regions.restricted"
					></unauthorized-message>

					<criterion-function-group>
						<filter-enumeration-control
							:field="'annotation'"
							:options="
								$parent.regions.map(
									(region) => region.annotation
								)
							"
						>
							<div class="label">Annotations</div>
						</filter-enumeration-control>

						<filter-enumeration-control
							:field="'method'"
							:options="
								$parent.regions.map((region) => region.method)
							"
						>
							<div class="label">Methods</div>
						</filter-enumeration-control>

						<filter-enumeration-control
							:field="'tissue'"
							:options="
								$parent.regions.map((region) => region.tissue)
							"
						>
							<div class="label">Tissues</div>
						</filter-enumeration-control>
						<template slot="filtered" slot-scope="{ filter }">
							<regions-table
								:regions="$parent.regions"
								:filter="filter"
							></regions-table>
						</template>
					</criterion-function-group>
				</div>
			</div>-->
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
