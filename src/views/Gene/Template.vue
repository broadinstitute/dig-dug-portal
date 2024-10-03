<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :raw-phenotypes="$parent.rawPhenotypes"
        >
        </page-header>
        <!-- warning in case gene name isn't valid -->
        <div id="invalidGeneWarning" class="invalid-gene-warning hidden">
            <a
                class="invalid-gene-hide-warning"
                @click="$parent.hideGeneWarning()"
            >
                X
            </a>
            <div id="invalidGeneMessage"></div>
            <div>
                <a id="invalidGeneRedirect" href="" class="btn btn-primary"
                    >GO</a
                >
            </div>
        </div>
        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <search-header-wrapper>
                <div>
                    <div class="region-search col filter-col-md">
                        <div class="label">Begin new search</div>
                        <research-single-search
                            :single-search-config="null"
                            :phenotypes="$parent.phenotypesInSession"
                            :utils="$parent.utilsBox"
                        ></research-single-search>
                    </div>
                </div>
            </search-header-wrapper>
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-title">Gene</div>
                    <div class="col-md-4 gene-page-header-title">Navigate</div>
                    <div class="col-md-8 gene-page-header-body">
                        <div>
                            <span>{{
                                $store.state.geneName.toUpperCase()
                            }}</span>
                        </div>
                    </div>
                    <div class="col-md-4 gene-page-header-body">
                        <div v-if="$parent.symbolName" class="input-group">
                            <button
                                class="btn btn-primary input-group-prepend explore-region-btn"
                                style="margin-right: 20px"
                                :title="$parent.regionText"
                                @click="$parent.exploreRegion()"
                            >
                                Explore Region
                            </button>
                            <button
                                class="btn btn-primary input-group-append explore-region-btn"
                                :title="$parent.regionTextExpanded"
                                @click="$parent.exploreRegion(50000)"
                            >
                                Explore &plusmn; 50 kb
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation
                        name="gene.explore.subheader"
                        :contentFill="$parent.docDetails"
                        :contentMap="$store.state.bioPortal.documentations"
                    >
                    </documentation>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4>
                        {{
                            `Functional associations for ${$store.state.geneName.toUpperCase()}`
                        }}
                        <tooltip-documentation
                            name="gene.translator.tooltip.hover"
                            :contentFill="$parent.docDetails"
                            :is-hover="true"
                            :no-icon="false"
                            :contentMap="$store.state.bioPortal.documentations"
                        >
                        </tooltip-documentation>
                    </h4>
                    <b-tabs>
                        <b-tab title="Function">
                            <div class="card-body row">
                                <div class="col-md-8">
                                    <div v-if="$parent.geneFunction">
                                        <h4>
                                            Function
                                            <tooltip-documentation
                                                name="gene.function.tooltip.hover"
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
                                        <div>{{ $parent.geneFunction }}</div>
                                    </div>
                                    <div v-else>
                                        <h5>Gene function not found</h5>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <h4>Info</h4>
                                    <div
                                        v-if="$parent.geneNames"
                                        class="alternative-names"
                                    >
                                        <strong
                                            >Alternative names:&nbsp;</strong
                                        >
                                        <span
                                            v-for="gene in $parent.alternateNames"
                                            v-if="gene.source == 'alias'"
                                            :key="gene.name"
                                        >
                                            {{ gene.name }}
                                        </span>
                                        &nbsp;
                                    </div>
                                    <div v-if="$parent.regionText">
                                        <strong>Coding sequence:</strong>
                                        {{ $parent.regionText }}
                                    </div>
                                    <div v-if="$parent.region">
                                        <strong>Length:</strong>
                                        {{
                                            " " +
                                            (
                                                $parent.region.end -
                                                $parent.region.start
                                            ).toLocaleString()
                                        }}
                                        bp
                                    </div>
                                    <div><strong>Assembly:</strong> GRCh37</div>
                                    <div>
                                        <strong>Gene sources:</strong>
                                        <span
                                            >&nbsp;Ensembl, HGNC, UCSC,
                                            RGD,MGD</span
                                        >
                                    </div>
                                </div>
                            </div>
                        </b-tab>
                        <b-tab title="Gene Ontology">
                            <translator-predicate-table
                                title="Gene Ontology (GO) Annotations"
                                :gene-symbol="$store.state.geneName"
                                :field="'go'"
                            >
                            </translator-predicate-table>
                        </b-tab>
                        <b-tab title="Pathways">
                            <translator-predicate-table
                                title="Pathway Annotations (Reactome, KEGG, BioCarta, WikiPathways)"
                                :gene-symbol="$store.state.geneName"
                                :field="'pathway'"
                            >
                            </translator-predicate-table>
                        </b-tab>
                    </b-tabs>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4>
                        {{
                            `Gene-level associations for ${$store.state.geneName.toUpperCase()}`
                        }}
                        <tooltip-documentation
                            name="gene.level.association.tooltip.hover"
                            :contentFill="$parent.docDetails"
                            :is-hover="true"
                            :no-icon="false"
                            :contentMap="$store.state.bioPortal.documentations"
                        >
                        </tooltip-documentation>
                    </h4>
                    <span>
                        <documentation
                            name="gene.level.association.subheader"
                            :contentFill="$parent.docDetails"
                            :contentMap="$store.state.bioPortal.documentations"
                        >
                        </documentation>
                    </span>
                    <criterion-function-group
                        @update:filter-list="
                            (newFilters) => $parent.filterPhenotype(newFilters)
                        "
                    >
                        <filter-enumeration-control
                            :field="'phenotype'"
                            placeholder="Select a phenotype ..."
                            :options="
                                $parent.geneassociations.map(
                                    (association) => association.phenotype
                                )
                            "
                            :label-formatter="
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
                        <filter-greater-control
                            v-if="$parent.activeTab === 'hugeScorePheWASPlot'"
                            :field="'huge'"
                            placeholder="Set HuGE..."
                        >
                            <div>
                                <strong>HuGE Score (&ge;)</strong>
                            </div>
                        </filter-greater-control>
                        <div
                            v-if="
                                $parent.activeTab === 'commonVariantPheWASPlot'
                            "
                            class="col filter-col-md"
                        >
                            <div class="label">Ancestry</div>
                            <ancestry-selectpicker
                                :ancestries="
                                    $store.state.bioPortal.datasets.map(
                                        (dataset) => dataset.ancestry
                                    )
                                "
                            >
                            </ancestry-selectpicker>
                        </div>
                        <filter-pvalue-control
                            v-if="$parent.activeTab !== 'hugeScorePheWASPlot'"
                            :field="'pValue'"
                            placeholder="Set P-Value ..."
                        >
                            <div class="label">P-Value (&le;)</div>
                        </filter-pvalue-control>
                        <div
                            v-if="
                                $parent.diseaseGroup &&
                                !$parent.noTranscriptDataPortal.includes(
                                    $parent.diseaseGroup.name
                                ) &&
                                $parent.activeTab === 'rareVariantPheWASPlot'
                            "
                            class="col filter-col-md"
                        >
                            <div class="label">Transcript</div>
                            <transcript-selectpicker
                                v-if="
                                    $store.state.geneToTranscript &&
                                    $store.state.geneToTranscript.length
                                "
                                :transcripts="
                                    $store.state.geneToTranscript.data
                                "
                            >
                            </transcript-selectpicker>
                        </div>
                        <template slot="filtered" slot-scope="{ filter }">
                            <span class="filter-pill-collection center">
                                <b-badge
                                    v-if="
                                        !!$store.state.selectedAncestry &&
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
                                                $store.state.selectedAncestry
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
                                        !!$store.state.selectedTranscript &&
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
                                        {{ $store.state.selectedTranscript }}
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
                                    <h4 class="card-title">HuGE Scores</h4>
                                    <span>
                                        <documentation
                                            name="gene.hugecal.subheader"
                                            :contentFill="$parent.docDetails"
                                            :contentMap="
                                                $store.state.bioPortal
                                                    .documentations
                                            "
                                        >
                                        </documentation>
                                    </span>
                                    <research-phewas-plot
                                        v-if="$parent.hugeScores.length > 0"
                                        ref="hugeScorePheWASPlot"
                                        canvas-id="hugeScorePlot"
                                        :plotName="`huge_scores_${$store.state.geneName}`"
                                        :phenotypes-data="$parent.hugeScores"
                                        :phenotype-map="
                                            $store.state.bioPortal.phenotypeMap
                                        "
                                        :colors="$parent.plotColors"
                                        :plot-margin="$parent.phewasPlotMargin"
                                        :render-config="
                                            $parent.hugeScoreRenderConfig
                                        "
                                        :pkg-data="null"
                                        :pkg-data-selected="null"
                                        :filter="filter"
                                        :utils="$parent.utilsBox"
                                        :options="['open phenotype page']"
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
                                        v-if="$parent.hugeScores.length > 0"
                                        :pageKey="$store.state.gene.data[0]"
                                        leadTableField="phenotype"
                                        :hugeScores="$parent.hugeScores"
                                        :phenotypeMap="
                                            $store.state.bioPortal.phenotypeMap
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
                                        Common variant gene-level associations
                                        for
                                        {{
                                            $store.state.geneName.toUpperCase()
                                        }}
                                        (Ancestry:
                                        {{
                                            $store.state.selectedAncestry == ""
                                                ? "All"
                                                : $parent.ancestryFormatter(
                                                      $store.state
                                                          .selectedAncestry
                                                  )
                                        }})
                                        <tooltip-documentation
                                            name="gene.associations.tooltip.hover"
                                            :contentFill="$parent.docDetails"
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
                                            $store.state.bioPortal.phenotypeMap
                                        "
                                        :colors="$parent.plotColors"
                                        :plot-margin="$parent.phewasPlotMargin"
                                        :render-config="
                                            $parent.commonVariantRenderConfig
                                        "
                                        :pkg-data="null"
                                        :pkg-data-selected="null"
                                        :filter="filter"
                                        :utils="$parent.utilsBox"
                                        :options="['open phenotype page']"
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
                                        v-if="$store.state.gene.data.length > 0"
                                        :gene="$store.state.gene.data[0]"
                                        :associations="$parent.geneassociations"
                                        :phenotype-map="
                                            $store.state.bioPortal.phenotypeMap
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
                                            !$store.state.selectedTranscript
                                                ? `gene-level associations for ${$store.state.geneName.toUpperCase()}`
                                                : `transcript-level associations for ${$store.state.selectedTranscript}`
                                        }}
                                        <tooltip-documentation
                                            name="gene.52k.tooltip.hover"
                                            :contentFill="$parent.docDetails"
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
                                            $parent.transcriptOr52k.length >
                                                0 &&
                                            !$store.state.selectedTranscript
                                        "
                                        ref="rareVariantPheWASPlot"
                                        canvas-id="rareVariantPlot"
                                        :plotName="`rare_variant_${$store.state.geneName}`"
                                        :phenotypes-data="
                                            $parent.transcriptOr52k
                                        "
                                        :phenotype-map="
                                            $store.state.bioPortal.phenotypeMap
                                        "
                                        :colors="$parent.plotColors"
                                        :plot-margin="$parent.phewasPlotMargin"
                                        :render-config="
                                            $parent.rareVariantRenderConfig
                                        "
                                        :pkg-data="null"
                                        :pkg-data-selected="null"
                                        :filter="filter"
                                        :utils="$parent.utilsBox"
                                        :options="['open phenotype page']"
                                    >
                                    </research-phewas-plot>
                                    <unauthorized-message
                                        :restricted="$store.state.restricted"
                                    >
                                    </unauthorized-message>
                                    <gene-associations-masks
                                        :associations="$parent.transcriptOr52k"
                                        :phenotype-map="
                                            $store.state.bioPortal.phenotypeMap
                                        "
                                        :filter="filter"
                                    >
                                    </gene-associations-masks>
                                </b-tab>
                            </b-tabs>
                        </template>
                    </criterion-function-group>
                </div>
            </div>

            <!-- NDKP only -->
            <div
                v-if="$parent.diseaseGroup.name == 'ndkp'"
                class="card mdkp-card"
            >
                <div class="card-body">
                    <h4 class="card-title">
                        ALS variant counts in
                        {{ $parent.gene.name.toUpperCase() }}
                        <tooltip-documentation
                            name="gene.als.variant.tooltip.hover"
                            :contentFill="$parent.docDetails"
                            :is-hover="true"
                            :no-icon="false"
                            :contentMap="$store.state.bioPortal.documentations"
                        >
                        </tooltip-documentation>
                    </h4>

                    <documentation
                        name="gene.als.variant.subheader"
                        :contentFill="$parent.docDetails"
                        :contentMap="$store.state.bioPortal.documentations"
                    >
                    </documentation>

                    <variant-search
                        :gene="$store.state.geneName"
                    ></variant-search>
                </div>
            </div>
            <!-- end of NDKP only -->

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Tissue-specific gene expression for
                        {{ $store.state.geneName }}
                        <tooltip-documentation
                            name="gene.gene-expression.tooltip"
                            :contentFill="$parent.docDetails"
                            :is-hover="true"
                            :no-icon="false"
                            :contentMap="$store.state.bioPortal.documentations"
                        >
                        </tooltip-documentation>
                    </h4>
                    <documentation
                        name="gene.gene-expression.subheader"
                        :contentFill="$parent.docDetails"
                        :contentMap="$store.state.bioPortal.documentations"
                    >
                    </documentation>
                    <research-expression-display
                        v-if="$parent.geneExpression.length > 0"
                        :raw-data="$parent.geneExpression"
                        :plotName="`tissue_specific_expression_${$store.state.geneName}`"
                        @expression="
                            (raw) =>
                                ($parent.geneExpressionTable = JSON.parse(raw))
                        "
                    >
                    </research-expression-display>
                </div>
            </div>
            <div
                class="card mdkp-card"
                v-if="$store.state.mouseSummary.data.length > 0"
            >
                <div class="card-body">
                    <h4 class="card-title">
                        Differential
                        {{ $store.state.geneName }} ortholog expression in mouse
                        founder strains
                        <tooltip-documentation
                            name="gene.mice-diff-exp.tooltip"
                            :contentFill="$parent.docDetails"
                            :is-hover="true"
                            :no-icon="false"
                            :contentMap="$store.state.bioPortal.documentations"
                        >
                        </tooltip-documentation>
                    </h4>
                    <documentation
                        name="gene.mice-diff-exp.subheader"
                        :contentFill="$parent.docDetails"
                        :contentMap="$store.state.bioPortal.documentations"
                    >
                    </documentation>
                    <criterion-function-group>
                            <filter-pvalue-control
                                field="P_adj_sex"
                                placeholder="Set P-Value ..."
                            >
                                <div class="label">Adjusted p-value: sex (&le;)</div>
                            </filter-pvalue-control>
                            <filter-pvalue-control
                                field="P_adj_strain"
                                placeholder="Set P-Value ..."
                            >
                                <div class="label">Adjusted p-value: strain (&le;)</div>
                            </filter-pvalue-control>
                            <filter-pvalue-control
                                field="P_adj_strain_sex"
                                placeholder="Set P-Value ..."
                            >
                                <div class="label">Adjusted p-value: strain and sex (&le;)</div>
                            </filter-pvalue-control>
                            <template slot="filtered" slot-scope="{ filter }">
                                <mouse-summary-table
                                :items="$store.state.mouseSummary.data"
                                :isGenePage="true"
                                :filter="filter">
                                </mouse-summary-table>
                                
                            </template>
                        </criterion-function-group>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.dbReference">
                        <h4 class="card-title">
                            Predicted effector gene lists containing
                            {{
                                $store.state.gene.data.length
                                    ? $store.state.gene.data[0].name
                                    : ""
                            }}
                            <tooltip-documentation
                                name="gene.effector-gene.tooltip"
                                :contentFill="$parent.docDetails"
                                :is-hover="true"
                                :no-icon="false"
                                :contentMap="
                                    $store.state.bioPortal.documentations
                                "
                            >
                            </tooltip-documentation>
                        </h4>
                        <egls-section-on-gene
                            v-if="$store.state.gene.data.length > 0"
                            :gene="$store.state.gene.data[0]"
                        >
                        </egls-section-on-gene>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.dbReference">
                        <h4 class="card-title">
                            UniProt cross-references
                            <tooltip-documentation
                                name="gene.xref.tooltip.hover"
                                :contentFill="$parent.docDetails"
                                :contentMap="
                                    $store.state.bioPortal.documentations
                                "
                                :is-hover="true"
                                :no-icon="false"
                            >
                            </tooltip-documentation>
                        </h4>
                        <criterion-function-group :inclusive="true">
                            <filter-enumeration-control
                                :field="'source'"
                                :options="
                                    $parent.dbReference.map(
                                        (reference) => reference.source
                                    )
                                "
                                :inclusive="false"
                            >
                                <div class="label">Sources</div>
                            </filter-enumeration-control>
                            <template slot="filtered" slot-scope="{ filter }">
                                <uniprot-references-table
                                    :references="$parent.dbReference"
                                    :filter="filter"
                                >
                                </uniprot-references-table>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.geneNames">
                        <h4 class="card-title">External resources</h4>
                        <div
                            v-if="$parent.accession.length > 0"
                            class="gene-with-signal none"
                        >
                            <a
                                :href="
                                    $parent.externalResources['uniprot'].link +
                                    $parent.accession[0]
                                "
                                target="_blank"
                                :title="
                                    $parent.externalResources['uniprot'].title
                                "
                            >
                                UNIPROT
                            </a>
                        </div>
                        <div
                            v-for="gene in $parent.alternateNames"
                            v-if="gene.source != 'alias'"
                            :key="gene.name"
                            class="gene-with-signal none"
                        >
                            <a
                                v-if="gene.source != 'ucsc'"
                                :href="
                                    $parent.externalResources[gene.source]
                                        .link + gene.name
                                "
                                target="_blank"
                                :title="
                                    $parent.externalResources[gene.source].title
                                "
                            >
                                {{ gene.source.toUpperCase() }}
                            </a>
                            <a
                                v-else
                                :href="
                                    $parent.externalResources[gene.source]
                                        .link + $parent.symbolName
                                "
                                target="_blank"
                                :title="
                                    $parent.externalResources[gene.source].title
                                "
                            >
                                {{ gene.source.toUpperCase() }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style>
.color-bar-plot-wrapper {
    width: calc(100% - 32px);
    margin-left: 16px;
}

.color-bars-wrapper {
    background-color: #eee;
    font-weight: 500;
    font-size: 13px;
}

.color-bar-plot-wrapper .each-bar-section {
    width: calc(100% / 7);
    text-align: center;
}

* {
    box-sizing: border-box;
}
.container {
    display: flex;
    justify-content: center;
}
.center {
    padding: 10px;
}
/* color bar plot */
.arrow-up {
    width: 0;
    /*height: 40px;*/
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid #de202c;
    animation: moveright 1s alternate 1s;
    margin-left: auto;
    margin-right: auto;
}
.arrow-side {
    width: 0;
    /*height: 40px;*/
    border-left: 10px solid transparent;
    border-bottom: 0px solid transparent;
    border-top: 10px solid black;
    animation: moveright 1s alternate 1s;
    margin-left: auto;
    margin-right: auto;
}

.arrow {
    border: solid black;
    border-width: 0 3px 3px 0;
    display: inline-block;
    padding: 3px;
}

.right {
    transform: rotate(-45deg);
    -webkit-transform: rotate(-45deg);
}

#combinedVariation .variationCausal {
    background-color: #3fb54a;
    font-weight: bold;
}
#combinedVariation .variationStrong {
    background-color: #4ebf59;
    font-weight: bold;
}
#combinedVariation .variationModerate {
    background-color: #5ecc69;
    font-weight: bold;
}
#combinedVariation .variationPossible {
    background-color: #71d97b;
    font-weight: bold;
}
#combinedVariation .variationPotential {
    background-color: #7ee087;
    font-weight: bold;
}
#combinedVariation .variationWeak {
    background-color: #91eb9a;
    font-weight: bold;
}
#combinedVariation .variationEquivocal {
    background-color: #a1f0a9;
    font-weight: bold;
}

#combinedVariation .variationNoEvidence {
    background-color: #c4edc8;
    font-weight: bold;
}
/* basic positioning */
.legend {
    list-style: none;
}
.legend li {
    float: left;
    margin-right: 10px;
}
.legend span {
    border: 0px;
    float: left;
    width: 12px;
    height: 12px;
    margin: 2px;
}
/* your colors */
.legend .superawesome {
    background-color: #e7edf7;
}
.legend .awesome {
    background-color: #fef8dc;
}

.invalid-gene-warning {
    position: fixed;
    z-index: 20000;
    background-color: #ffcccc;
    width: 500px;
    padding: 15px 25px;
    border: solid 1px #cccccc;
    border-radius: 5px;
    left: calc(50% - 275px);
    top: calc(20% - 50px);
    text-align: center;
    box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.25);
    font-size: 20px;
}

.invalid-gene-hide-warning {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 15px;
    height: 15px;
    border-radius: 15px;
    font-size: 10px;
    background-color: #666666;
    color: #ffffff !important;
}

.invalid-gene-hide-warning:hover {
    cursor: pointer;
}

#invalidGeneRedirect {
    color: #ffffff !important;
    margin-top: 15px;
}

.gene-search-tip {
    position: absolute;
    font-weight: 300;
    font-size: 14px;
    top: 10px;
    left: 20px;
    color: #28a745;
}

.pseudoFilter {
    font-weight: bold !important;
}

.pseudoFilter a {
    color: inherit !important;
    text-decoration: inherit !important;
}
</style>
