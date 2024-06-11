<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :raw-phenotypes="$parent.rawPhenotypes"
        ></page-header>

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
                </div>
            </search-header-wrapper>
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">
                        Phenotype
                    </div>

                    <div class="col-md-12 gene-page-header-body">
                        <span v-if="$store.state.phenotype">
                            {{ $store.state.phenotype.description }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation
                        name="phenotype.page.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>
                </div>
            </div>

            <div
                v-if="
                    $store.state.phenotype &&
                    $store.state.manhattanPlotAvailable
                "
            >
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Genome-wide single-variant associations for
                            {{ $store.state.phenotype.description }}
                            (Ancestry:
                            {{
                                $store.state.ancestry == ""
                                    ? "All"
                                    : $parent.ancestryFormatter(
                                          $store.state.ancestry
                                      )
                            }})
                        </h4>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card" style="width: 95%; border: 0">
                                    <raw-img
                                        id="manhattanPlot"
                                        :src="$parent.manhattanPlot"
                                        alt="Manhattan Plot"
                                        :documentation="'phenotype.associationplots.manhattan'"
                                        :content-fill="
                                            $store.getters['documentationMap']
                                        "
                                        :custom-failure-msg="'No Manhattan plot available for this query.'"
                                    />
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card" style="width: 95%; border: 0">
                                    <raw-img
                                        id="qqPlot"
                                        :src="$parent.qqPlot"
                                        alt="QQ Plot"
                                        :documentation="'phenotype.associationplots.qq'"
                                        :content-fill="
                                            $store.getters['documentationMap']
                                        "
                                        :custom-failure-msg="'No Q-Q plot available for this query.'"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Top single-variant association signals for
                            {{ $store.state.phenotype.description }}
                            (Ancestry:
                            {{
                                $store.state.ancestry == ""
                                    ? "All"
                                    : $parent.ancestryFormatter(
                                          $store.state.ancestry
                                      )
                            }})
                            <tooltip-documentation
                                name="phenotype.topvariants.tooltip"
                                :content-fill="$parent.documentationMap"
                                :is-hover="true"
                                :no-icon="false"
                            ></tooltip-documentation>
                        </h4>

                        <criterion-function-group>
                            <filter-enumeration-control
                                :field="'nearest'"
                                :options="
                                    $store.state.associations.data.map(
                                        (association) => association.nearest[0]
                                    )
                                "
                                :inclusive="false"
                            >
                                <div class="label">Closest Genes</div>
                            </filter-enumeration-control>

                            <filter-pvalue-control :field="'pValue'">
                                <div class="label">P-Value (&le;)</div>
                            </filter-pvalue-control>

                            <filter-effect-direction-control :field="'beta'">
                                <div class="label">Effect (+/-)</div>
                            </filter-effect-direction-control>

                            <template slot="filtered" slot-scope="{ filter }">
                                <associations-table
                                    :phenotypes="[$store.state.phenotype]"
                                    :associations="
                                        !$store.state.ancestry
                                            ? $store.state.associations.data
                                            : $store.state.ancestryGlobalAssoc
                                                  .data
                                    "
                                    :filter="filter"
                                    :per-page="10"
                                ></associations-table>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Credible Sets to Cell Type (CS2CT) results for
                            {{ $store.state.phenotype.description }}
                            (Ancestry:
                            {{
                                $store.state.ancestry == ""
                                    ? "All"
                                    : $parent.ancestryFormatter(
                                          $store.state.ancestry
                                      )
                            }})
                            <tooltip-documentation
                                name="phenotype.cs2ct.tooltip"
                                :content-fill="$parent.documentationMap"
                                :is-hover="true"
                                :no-icon="false"
                            ></tooltip-documentation>
                        </h4>
                        <criterion-function-group>
                            <filter-enumeration-control
                                :field="'annotation'"
                                :options="
                                    $store.state.c2ct.data.map(
                                        (d) => d.annotation
                                    )
                                "
                            >
                                <div class="label">Annotation</div>
                            </filter-enumeration-control>
                            <filter-enumeration-control
                                :field="'biosample'"
                                :options="
                                    $parent.c2ctData.map((d) => d.biosample)
                                "
                            >
                                <div class="label">Biosample</div>
                            </filter-enumeration-control>
                            <template slot="filtered" slot-scope="{ filter }">
                                <c2ct-table
                                    :c2ctData="$parent.c2ctData"
                                    :filter="filter"
                                    :per-page="10"
                                >
                                </c2ct-table>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Datasets with genetic associations for
                            {{ $store.state.phenotype.description }}
                            (Ancestry:
                            {{
                                $store.state.ancestry == ""
                                    ? "All"
                                    : $parent.ancestryFormatter(
                                          $store.state.ancestry
                                      )
                            }})
                        </h4>
                        <documentation
                            name="pheno.assocdatasets.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>

                        <criterion-function-group>
                            <filter-enumeration-control
                                :field="'tech'"
                                :options="
                                    $parent.ancestryDatasets
                                        .filter((dataset) =>
                                            dataset.phenotypes.includes(
                                                $store.state.phenotype.name
                                            )
                                        )
                                        .map((dataset) => dataset.tech)
                                "
                            >
                                <div class="label">Technology</div>
                            </filter-enumeration-control>
                            <template slot="filtered" slot-scope="{ filter }">
                                <datasets-table
                                    :datasets="$parent.ancestryDatasets"
                                    :phenotype="$store.state.phenotype"
                                    :filter="filter"
                                ></datasets-table>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body geneLevelAssoc">
                        <h4 class="card-title">
                            Top gene-level associations for
                            {{ $store.state.phenotype.description }}
                            <tooltip-documentation
                                name="phenotype.genes.tooltip"
                                :content-fill="$parent.documentationMap"
                                :is-hover="true"
                                :no-icon="false"
                            ></tooltip-documentation>
                        </h4>

                        <criterion-function-group>
                            <filter-enumeration-control
                                :field="'gene'"
                                :options="
                                    $store.state.genes.data.map(
                                        (gene) => gene.gene
                                    )
                                "
                            >
                                <div class="label">Gene</div>
                            </filter-enumeration-control>

                            <filter-pvalue-control
                                :field="'pValue'"
                                v-if="!$parent.hidePValueFilter"
                            >
                                <div class="label">P-Value (&le;)</div>
                            </filter-pvalue-control>

                            <template slot="filtered" slot-scope="{ filter }">
                                <b-tabs>
                                    <b-tab
                                        title="HuGE Scores"
                                        @click="$parent.clickedTab('hugescore')"
                                    >
                                        <phenotype-huge-scores
                                            :scores="
                                                $store.state.hugePhenotype.data
                                            "
                                            :filter="filter"
                                            :phenotypeMap="
                                                $store.state.bioPortal
                                                    .phenotypeMap
                                            "
                                            :phenotype="
                                                $store.state.phenotype.name
                                            "
                                        >
                                        </phenotype-huge-scores>
                                    </b-tab>
                                    <b-tab
                                        @click="$parent.clickedTab('commmon')"
                                        :title="`Common variant
                                        (Ancestry: ${
                                            !$store.state.ancestry
                                                ? 'All'
                                                : $parent.ancestryFormatter(
                                                      $store.state.ancestry
                                                  )
                                        })`"
                                    >
                                        <gene-finder-table
                                            :phenotypes="[
                                                $store.state.phenotype.name,
                                            ]"
                                            :phenotype-map="
                                                $store.state.bioPortal
                                                    .phenotypeMap
                                            "
                                            :associations="
                                                $store.state.genes.data
                                            "
                                            :rows-per-page="10"
                                            :filter="filter"
                                            :show-plot="true"
                                        ></gene-finder-table>
                                    </b-tab>
                                    <b-tab
                                        @click="$parent.clickedTab('rare')"
                                        title="Rare variant (all ancestries)"
                                    >
                                        <gene-finder-table
                                            :phenotypes="[
                                                $store.state.phenotype.name,
                                            ]"
                                            :phenotype-map="
                                                $store.state.bioPortal
                                                    .phenotypeMap
                                            "
                                            :associations="
                                                $store.state.genes52k.data
                                            "
                                            :rows-per-page="10"
                                            :filter="filter"
                                            :show-plot="true"
                                        ></gene-finder-table>
                                    </b-tab>
                                </b-tabs>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Top pathways for
                            {{ $store.state.phenotype.description }}
                            (Ancestry:
                            {{
                                $store.state.ancestry == ""
                                    ? "All"
                                    : $parent.ancestryFormatter(
                                          $store.state.ancestry
                                      )
                            }})&nbsp;<tooltip-documentation
                                name="phenotype.pathway.tooltip"
                                :content-fill="$parent.documentationMap"
                                :is-hover="true"
                                :no-icon="false"
                            ></tooltip-documentation>
                        </h4>
                        <pathway-table
                            :pathway-data="$store.state.pathwayAssoc.data"
                        >
                        </pathway-table>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Genetic correlations for
                            {{ $store.state.phenotype.description }} (Ancestry:
                            {{
                                $store.state.ancestry == ""
                                    ? "All"
                                    : $parent.ancestryFormatter(
                                          $store.state.ancestry
                                      )
                            }})
                            <tooltip-documentation
                                name="phenotype.correlation.tooltip"
                                :content-fill="$parent.documentationMap"
                                :is-hover="true"
                                :no-icon="false"
                            ></tooltip-documentation>
                        </h4>
                        <documentation
                            name="phenotype.correlation.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>
                        <criterion-function-group>
                            <filter-pvalue-control :field="'pValue'">
                                <div class="label">P-Value (&le;)</div>
                            </filter-pvalue-control>
                            <filter-greater-control :field="'rg'">
                                <div class="label">Correlation (&ge;)</div>
                            </filter-greater-control>
                            <template slot="filtered" slot-scope="{ filter }">
                                <correlation-table
                                    :correlation-data="
                                        $store.state.geneticCorrelation.data
                                    "
                                    :phenotype-map="
                                        $store.state.bioPortal.phenotypeMap
                                    "
                                    :phenotypes-in-session="
                                        $parent.phenotypesInSession
                                    "
                                    :filter="filter"
                                >
                                </correlation-table>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Globally enriched annotations for
                            {{ $store.state.phenotype.description }}
                            (Ancestry:
                            {{
                                $store.state.ancestry == ""
                                    ? "All"
                                    : $parent.ancestryFormatter(
                                          $store.state.ancestry
                                      )
                            }})
                            <tooltip-documentation
                                name="phenotype.annot.tooltip"
                                :content-fill="$parent.documentationMap"
                                :is-hover="true"
                                :no-icon="false"
                            ></tooltip-documentation>
                        </h4>
                        <documentation
                            name="pheno.globalenrich.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>

                        <criterion-function-group>
                            <filter-enumeration-control
                                :field="'annotation'"
                                :options="
                                    $store.state.annotations.data.map(
                                        (annotation) => annotation.annotation
                                    )
                                "
                            >
                                <div class="label">Annotation</div>
                            </filter-enumeration-control>

                            <filter-enumeration-control
                                :field="'tissue'"
                                :options="
                                    $store.state.annotations.data.map(
                                        (annotation) => annotation.tissue
                                    )
                                "
                            >
                                <div class="label">Tissue</div>
                            </filter-enumeration-control>
                            <filter-pvalue-control :field="'pValue'">
                                <div class="label">P-Value (&le;)</div>
                            </filter-pvalue-control>

                            <filter-greater-control :field="'fold'">
                                <div class="label">Fold (&ge;)</div>
                            </filter-greater-control>

                            <template slot="filtered" slot-scope="{ filter }">
                                <enrichment-table
                                    :phenotypes="[$store.state.phenotype]"
                                    :annotations="$parent.ancestryAnnotations"
                                    :filter="filter"
                                    :per-page="10"
                                ></enrichment-table>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>
                <div v-if="!!$store.state.phenotype" class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Effector gene predictions for
                            {{ $store.state.phenotype.description }}
                            <tooltip-documentation
                                name="phenotype.effector-gene.tooltip"
                                :content-fill="$parent.documentationMap"
                                :is-hover="true"
                                :no-icon="false"
                            ></tooltip-documentation>
                        </h4>

                        <egls-section :phenotype="$store.state.phenotype">
                        </egls-section>
                    </div>
                </div>
            </div>
            <div v-else>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <b-alert show variant="warning">
                            <b-icon icon="exclamation-triangle"></b-icon>No data
                            available for this query.
                        </b-alert>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style scoped>
.phenotype-search-input {
    display: block !important;
    position: absolute;
    top: 25px;
    background: none;
    border: none;
}

.phenotype-search-input:focus {
    background-color: #fff;
}

.new-phenotype-search-key {
    text-align: left;
    overflow: hidden;
}

.page-phenotypes-list {
    position: absolute;
    z-index: 20;
    list-style: none;
    text-align: left;
    white-space: nowrap;
    padding: 0;
    display: block;
    overflow-x: hidden;
    overflow-y: auto;
    max-height: 300px;
    border-radius: 5px;
    border: solid 1px #eeeeee;
}

.page-phenotypes-list li {
    background-color: #fff;
    padding: 3px 12px;
    border-bottom: solid 1px #eeeeee;
}
</style>
