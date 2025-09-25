<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <div class="row front-search-section">
          <div class="col-md-8 offset-md-2" align="center">
              <div class="single-search-wrapper cypher-single-search">
                  <h4>
                      Search for gene
                  </h4>
                  <research-single-search
                      :single-search-config="$parent.searchConfig"
                      :phenotypes="[]"
                      :utils="$parent.utilsBox"
                  ></research-single-search>
              </div>
          </div>
      </div>
      <!-- Non-PanKbase specific: Basic summary -->
      <div class="card mdkp-card">
          <div class="card-body">
              <h4>
                  {{
                      `Functional associations for ${$store.state.geneName.toUpperCase()}`
                  }}
                  <tooltip-documentation
                      name="gene.translator.tooltip.hover"
                      :content-fill="$parent.docDetails"
                      :is-hover="true"
                      :no-icon="false"
                      :content-map="$store.state.bioPortal.documentations"
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
                                          :content-fill="
                                              $parent.docDetails
                                          "
                                          :is-hover="true"
                                          :no-icon="false"
                                          :content-map="
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
      <!-- PanKbase-specific cell type visualizer-->
       <div class="card mdkp-card">
          <div class="card-body">
              <h4>
                  {{
                      `${$store.state.geneName.toUpperCase()} Expression by Cell Type`
                  }}
              </h4>
              <div>
                  <research-single-cell-browser 
                      sectionId="pankbase"
                      :renderConfig="$parent.scbConfig"
                      :utils="$parent.utilsBox"
                      :data="$parent.scbData"
                  ></research-single-cell-browser>
              </div>
          </div>
      </div>
      <!-- TODO get data for gene signatures card -->
      <!-- Non-PanKbase specific GTEx visualizer and table-->
      <div class="card mdkp-card">
                <div class="card-body">
                    <h4>
                        {{
                            `GTEx tissue specificity and gene expression levels for ${$store.state.geneName.toUpperCase()}`
                        }}
                    </h4>
                        <b-tabs>
                            <b-tab
                                title="GTEx: Tissue Specificity"
                            >
                                <div class="card-body" style="display:flex; flex-direction:column; gap:20px">
                                    <h4 class="card-title">GTEx: Tissue Specificity</h4>
                                    <research-bar-plot
                                        v-if="$parent.GTExData"
                                        ref="GTExSpecificity"
                                        :phenotypesData="$parent.GTExData"
                                        :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                                        :colors="$parent.plotColors"
                                        :plotMargin="$parent.GTExRenderConfig['plot margin']"
                                        :renderConfig="$parent.GTExRenderConfig"
                                        :pkgData="null"
                                        :pkgDataSelected="null"
                                        :canvasId="'GTEx'"
                                        :utils="$parent.utilsBox"
                                    ></research-bar-plot>
                                    <data-download
                                        v-if="$parent.GTExData"
                                        :data="$parent.GTExData"
                                        :filename="`${$store.state.geneName.toUpperCase()}_tissue_specificity`"
                                        style="width: 125px; align-self: flex-end;"
                                        ></data-download>
                                    <b-table
                                        v-if="$parent.GTExData"
                                        small
                                        :items="$parent.GTExData"
                                        :fields="$parent.GTExDataFields"
                                        sortBy="tissue"
                                        :sortDesc="false"
                                        :per-page="10"
                                        :current-page="$parent.GTExPage"
                                    >
                                    </b-table>
                                    <b-pagination
                                        v-if="$parent.GTExData"
                                        v-model="$parent.GTExPage"
                                        class="pagination-sm justify-content-center"
                                        :total-rows="$parent.GTExData.length"
                                        :per-page="10"
                                    ></b-pagination>
                                </div>
                            </b-tab>
                            <b-tab
                                title="GTEx: Gene Expression Levels"
                                @click="$parent.renderGTEx('GTExExpression')"
                            >
                                <div class="card-body" style="display:flex; flex-direction:column; gap:20px">
                                    <h4 class="card-title">
                                        Absolute gene expression levels in GTEx tissues
                                        
                                    </h4>
                                    <template v-if="$parent.GTExData2">
                                        <research-box-plot
                                            ref="GTExExpression"
                                            :phenotypesData="$parent.GTExData2"
                                            :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                                            :colors="$parent.plotColors"
                                            :plotMargin="$parent.GTExRenderConfig2['plot margin']"
                                            :renderConfig="$parent.GTExRenderConfig2"
                                            :pkgData="null"
                                            :pkgDataSelected="null"
                                            :canvasId="'GTEx2'"
                                            :utils="$parent.utilsBox"
                                        ></research-box-plot>
                                        <data-download
                                            v-if="$parent.GTExData2"
                                            :data="$parent.GTExData2"
                                            :filename="`${$store.state.geneName.toUpperCase()}_gene_expression`"
                                            style="width: 125px; align-self: flex-end;"
                                        ></data-download>
                                        <b-table
                                            small
                                            :items="$parent.GTExData2"
                                            :fields="$parent.GTExData2Fields"
                                            sortBy="tissue"
                                            :sortDesc="false"
                                            :per-page="10"
                                            :current-page="$parent.GTExPage2"
                                        >
                                            <template #cell(dataset)="data">
                                                <a :href="`https://cmdga.org/search/?searchTerm=${data.value}`">
                                                    {{ data.value }}
                                                </a>
                                            </template>
                                        </b-table>
                                        <b-pagination
                                            v-model="$parent.GTExPage2"
                                            class="pagination-sm justify-content-center"
                                            :total-rows="$parent.GTExData2.length"
                                            :per-page="10"
                                        ></b-pagination>
                                    </template>
                                </div>
                            </b-tab>
                        </b-tabs>
                </div>
            </div>
      <!-- Non-PanKbase specific: Gene-level associations -->
      <div class="card mdkp-card">
          <div class="card-body">
              <h4>
                  {{
                      `Gene-level associations for ${$store.state.geneName.toUpperCase()}`
                  }}
              </h4>
              <span>
                  <documentation
                      name="gene.level.association.subheader"
                      :content-fill="$parent.docDetails"
                      :content-map="$store.state.bioPortal.documentations"
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
                                      :content-fill="$parent.docDetails"
                                      :content-map="
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
                                  :plot-name="`huge_scores_${$store.state.geneName}`"
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
                                  :page-key="$store.state.gene.data[0]"
                                  lead-table-field="phenotype"
                                  :huge-scores="$parent.hugeScores"
                                  :phenotype-map="
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
                                      :content-fill="$parent.docDetails"
                                      :is-hover="true"
                                      :no-icon="false"
                                      :content-map="
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
                                  :plot-name="`common_variant_${$store.state.geneName}`"
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
                                      :content-fill="$parent.docDetails"
                                      :is-hover="true"
                                      :no-icon="false"
                                      :content-map="
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
                                  :plot-name="`rare_variant_${$store.state.geneName}`"
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
    </div>
    <!-- FOOTER -->
    <pkb-footer></pkb-footer> 
  </div>
</template>
<style scoped>
.container {
    display: flex;
    justify-content: center;
}
.center {
    padding: 10px;
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