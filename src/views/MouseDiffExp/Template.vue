<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :raw-phenotypes="$parent.rawPhenotypes"
        ></page-header>

        <!-- Body -->
        <template>
            <div class="container-fluid mdkp-body">
                <search-header-wrapper>
                    <div class="region-search col filter-col-md">
                        <div class="label">Begin new search</div>
                        <research-single-search
                            :single-search-config="null"
                            :phenotypes="$parent.phenotypesInSession"
                            :utils="$parent.utilsBox"
                        ></research-single-search>
                    </div>
                </search-header-wrapper>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4>Mouse Differential Expression Browser</h4>
                        <documentation
                            name="mouse.diff-exp-browser.subheader"
                            :contentMap="$store.state.bioPortal.documentations"
                        ></documentation>
                        <criterion-function-group>
                            <mouse-tissue-select> </mouse-tissue-select>
                            <mouse-gene-select> </mouse-gene-select>
                            <button
                                class="btn btn-primary btn-sm"
                                @click="$parent.searchDiffExp()"
                            >
                                Search
                            </button>
                        </criterion-function-group>
                    </div>
                </div>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <div>
                            <h4 v-if="$parent.diffExpData.length > 0">
                                Differential Expression for
                                {{ $store.state.gene }} in
                                {{
                                    $parent.tissueFormatter($store.state.tissue)
                                }}
                            </h4>
                            <div v-else>
                                No differential expression data found for this
                                query.
                            </div>
                            <div class="row">
                                <div class="col-md-2"></div>
                                <div class="col-md-8">
                                    <mouse-whisker-plot
                                        :plotName="`mouse_diff_exp_${
                                            $store.state.gene
                                        }_${$parent.tissueFormatter(
                                            $store.state.tissue
                                        )}`"
                                        :data="$parent.diffExpData"
                                    >
                                    </mouse-whisker-plot>
                                </div>
                                <div class="col-md-2"></div>
                            </div>
                            <mouse-diff-exp-table
                                v-if="$parent.diffExpData.length > 0"
                                :items="$parent.diffExpData"
                            >
                            </mouse-diff-exp-table>
                        </div>
                    </div>
                </div>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <div v-if="$store.state.homologGene.data.length !== 0">
                        <h4>
                            Human Homolog {{ $store.state.gene }}
                            <tooltip-documentation
                                name="mouse.diff-exp.homolog.tooltip"
                                :is-hover="true"
                                :no-icon="false"
                                :contentMap="
                                    $store.state.bioPortal.documentations
                                "
                            ></tooltip-documentation>
                        </h4>
                        <div v-if="$parent.hugeScores.length > 0">
                            <criterion-function-group
                                @update:filter-list="
                                    (newFilters) =>
                                        $parent.filterPhenotype(newFilters)
                                "
                            >
                                <filter-enumeration-control
                                    :field="'phenotype'"
                                    placeholder="Select a phenotype ..."
                                    :options="
                                        $parent.hugeScores.map(
                                            (a) => a.phenotype
                                        )
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
                                    :multiple="true"
                                >
                                    <div class="label">Phenotypes</div>
                                </filter-enumeration-control>
                                <filter-greater-control
                                    v-if="
                                        $parent.activeTab ===
                                        'hugeScorePheWASPlot'
                                    "
                                    :field="'huge'"
                                    placeholder="Set HuGE..."
                                >
                                    <div>
                                        <strong>HuGE Score (&ge;)</strong>
                                    </div>
                                </filter-greater-control>
                                <filter-pvalue-control
                                    v-if="
                                        $parent.activeTab !==
                                        'hugeScorePheWASPlot'
                                    "
                                    :field="'pValue'"
                                    placeholder="Set P-Value ..."
                                >
                                    <div class="label">P-Value (&le;)</div>
                                </filter-pvalue-control>
                                <template
                                    slot="filtered"
                                    slot-scope="{ filter }"
                                >
                                    <span class="filter-pill-collection center">
                                        <b-badge
                                            v-if="
                                                !!$store.state
                                                    .selectedAncestry &&
                                                $parent.activeTab ===
                                                    'commonVariantPheWASPlot'
                                            "
                                            pill
                                            class="btn btn-secondary search-bubble 1 pseudoFilter"
                                        >
                                            <strong>
                                                Ancestry =
                                                {{
                                                    $parent.ancestryFormatter(
                                                        $store.state
                                                            .selectedAncestry
                                                    )
                                                }}
                                                <a
                                                    @click="
                                                        $parent.clearCriterion(
                                                            'ancestry'
                                                        )
                                                    "
                                                    >X</a
                                                >
                                            </strong>
                                        </b-badge>
                                        <b-badge
                                            v-if="
                                                !!$store.state
                                                    .selectedTranscript &&
                                                $parent.diseaseGroup &&
                                                !$parent.noTranscriptDataPortal.includes(
                                                    $parent.diseaseGroup.name
                                                ) &&
                                                $parent.activeTab ===
                                                    'rareVariantPheWASPlot'
                                            "
                                            pill
                                            class="btn search-bubble 1 pseudoFilter"
                                        >
                                            <strong>
                                                Transcript =
                                                {{
                                                    $store.state
                                                        .selectedTranscript
                                                }}
                                                <a
                                                    @click="
                                                        $parent.clearCriterion(
                                                            'transcript'
                                                        )
                                                    "
                                                    >X</a
                                                >
                                            </strong>
                                        </b-badge>
                                    </span>
                                    <b-tabs>
                                        <b-tab
                                            title="HuGE Scores"
                                            @click="
                                                $parent.renderPhewas(
                                                    'hugeScorePheWASPlot'
                                                )
                                            "
                                        >
                                            <h4 class="card-title">
                                                HuGE Scores
                                            </h4>
                                            <span>
                                                <documentation
                                                    name="gene.hugecal.subheader"
                                                    :contentFill="
                                                        $parent.docDetails
                                                    "
                                                    :contentMap="
                                                        $store.state.bioPortal
                                                            .documentations
                                                    "
                                                >
                                                </documentation>
                                            </span>
                                            <research-phewas-plot
                                                ref="hugeScorePheWASPlot"
                                                :canvas-id="`huge_scores_${$store.state.gene}`"
                                                :plotName="`huge_scores_${$store.state.gene}`"
                                                :phenotypes-data="
                                                    $parent.hugeScores
                                                "
                                                :phenotype-map="
                                                    $store.state.bioPortal
                                                        .phenotypeMap
                                                "
                                                :colors="$parent.plotColors"
                                                :plot-margin="
                                                    $parent.phewasPlotMargin
                                                "
                                                :renderConfig="
                                                    $parent.hugeScoreRenderConfig
                                                "
                                                :pkg-data="null"
                                                :pkg-data-selected="null"
                                                :utils="$parent.utilsBox"
                                                :options="[
                                                    'open phenotype page',
                                                ]"
                                                :filter="filter"
                                            >
                                            </research-phewas-plot>
                                            <unauthorized-message
                                                :restricted="
                                                    $store.state.varassociations
                                                        .restricted
                                                "
                                            >
                                            </unauthorized-message>
                                            <huge-scores-table
                                                :pageKey="$store.state.gene"
                                                leadTableField="phenotype"
                                                :hugeScores="$parent.hugeScores"
                                                :phenotypeMap="
                                                    $store.state.bioPortal
                                                        .phenotypeMap
                                                "
                                                :filter="filter"
                                            >
                                            </huge-scores-table>
                                        </b-tab>
                                        <b-tab
                                            title="Common variant associations"
                                            @click="
                                                $parent.renderPhewas(
                                                    'commonVariantPheWASPlot'
                                                )
                                            "
                                        >
                                            <h4 class="card-title">
                                                Common variant gene-level
                                                associations for
                                                {{
                                                    $store.state.gene.toUpperCase()
                                                }}
                                                (Ancestry:
                                                {{
                                                    $store.state
                                                        .selectedAncestry == ""
                                                        ? "All"
                                                        : $parent.ancestryFormatter(
                                                              $store.state
                                                                  .selectedAncestry
                                                          )
                                                }})
                                                <tooltip-documentation
                                                    name="gene.associations.tooltip.hover"
                                                    :contentFill="
                                                        $parent.docDetails
                                                    "
                                                    :is-hover="true"
                                                    :no-icon="false"
                                                    :contentMap="
                                                        $store.state.bioPortal
                                                            .documentations
                                                    "
                                                >
                                                </tooltip-documentation>
                                            </h4>
                                            <research-phewas-plot
                                                v-if="
                                                    $parent.filteredAssociations
                                                        .length > 0
                                                "
                                                ref="commonVariantPheWASPlot"
                                                canvas-id="commonVariantPlot"
                                                :plotName="`common_variant_${$store.state.geneName}`"
                                                :phenotypes-data="
                                                    $parent.filteredAssociations
                                                "
                                                :phenotype-map="
                                                    $store.state.bioPortal
                                                        .phenotypeMap
                                                "
                                                :colors="$parent.plotColors"
                                                :plot-margin="
                                                    $parent.phewasPlotMargin
                                                "
                                                :renderConfig="
                                                    $parent.commonVariantRenderConfig
                                                "
                                                :pkg-data="null"
                                                :pkg-data-selected="null"
                                                :filter="filter"
                                                :utils="$parent.utilsBox"
                                                :options="[
                                                    'open phenotype page',
                                                ]"
                                            >
                                            </research-phewas-plot>
                                            <unauthorized-message
                                                :restricted="
                                                    $store.state.varassociations
                                                        .restricted
                                                "
                                            >
                                            </unauthorized-message>
                                            <gene-associations-table
                                                v-if="
                                                    !!$parent.geneassociations
                                                        .length > 0
                                                "
                                                :gene="$store.state.gene"
                                                :associations="
                                                    $parent.geneassociations
                                                "
                                                :phenotype-map="
                                                    $store.state.bioPortal
                                                        .phenotypeMap
                                                "
                                                :filter="filter"
                                            >
                                            </gene-associations-table>
                                        </b-tab>
                                        <b-tab
                                            title="Rare variant associations"
                                            @click="
                                                $parent.renderPhewas(
                                                    'rareVariantPheWASPlot'
                                                )
                                            "
                                        >
                                            <h4 class="card-title">
                                                Rare variant
                                                {{
                                                    !$store.state
                                                        .selectedTranscript
                                                        ? `gene-level associations for ${$store.state.gene}`
                                                        : `transcript-level associations for ${$store.state.selectedTranscript}`
                                                }}
                                                <tooltip-documentation
                                                    name="gene.52k.tooltip.hover"
                                                    :contentFill="
                                                        $parent.docDetails
                                                    "
                                                    :is-hover="true"
                                                    :no-icon="false"
                                                    :contentMap="
                                                        $store.state.bioPortal
                                                            .documentations
                                                    "
                                                ></tooltip-documentation>
                                            </h4>
                                            <research-phewas-plot
                                                v-if="
                                                    $parent.transcriptOr52k
                                                        .length > 0 &&
                                                    !$store.state
                                                        .selectedTranscript
                                                "
                                                ref="rareVariantPheWASPlot"
                                                canvas-id="rareVariantPlot"
                                                :plotName="`rare_variant_${$store.state.gene}`"
                                                :phenotypes-data="
                                                    $parent.transcriptOr52k
                                                "
                                                :phenotype-map="
                                                    $store.state.bioPortal
                                                        .phenotypeMap
                                                "
                                                :colors="$parent.plotColors"
                                                :plot-margin="
                                                    $parent.phewasPlotMargin
                                                "
                                                :render-config="
                                                    $parent.rareVariantRenderConfig
                                                "
                                                :pkg-data="null"
                                                :pkg-data-selected="null"
                                                :filter="filter"
                                                :utils="$parent.utilsBox"
                                                :options="[
                                                    'open phenotype page',
                                                ]"
                                            >
                                            </research-phewas-plot>
                                            <unauthorized-message
                                                :restricted="
                                                    $store.state.restricted
                                                "
                                            >
                                            </unauthorized-message>
                                            <gene-associations-masks
                                                :associations="
                                                    $parent.transcriptOr52k
                                                "
                                                :phenotype-map="
                                                    $store.state.bioPortal
                                                        .phenotypeMap
                                                "
                                                :filter="filter"
                                            >
                                            </gene-associations-masks>
                                        </b-tab>
                                    </b-tabs>
                                </template>
                            </criterion-function-group>
                        </div>
                        <div v-else>Loading...</div>
                        </div>
                        <div v-else>No human homolog found.</div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style scoped>
.row .pagination.b-pagination {
    border: none !important;
    margin-bottom: 10px !important;
}

.row li.page-item .page-link {
    width: 30px !important;
    height: 30px !important;
    min-width: 30px !important;
    padding: 5px;
    margin: 0 1px;
}

tr.b-table-details > td {
    padding: 0 !important;
}

div.card >>> span.badge.badge-secondary.badge-pill.btn.filter-pill-H {
    background-color: #14a433;
}
</style>
