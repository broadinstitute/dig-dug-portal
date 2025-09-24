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
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>
<style scoped>
  .query-table {
    margin-bottom: 50px;
    padding: 10px;
    border-radius: 5px;
    background-color: white;
  }
  .cypher-single-search {
    margin-bottom: 50px;
  }
  #cypher-tables {
    background-color: #efefef;
    padding: 25px;
  }
  .show-cypher {
    text-align: right;
  }
  .show-cypher button {
    margin: 5px;
  }
  .query-copy pre {
    padding: 10px;
    color: white;
    background-color: darkslategray;
    /*background-color: #6c757d;*/
    border-radius: 5px;
    margin-top: 5px;
  }
  .copy-button {
    text-align: right;
    padding-bottom: 10px;
  }
</style>