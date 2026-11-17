<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body">
            <search-header-wrapper>

                <div class="col filter-col-lg hidden">
                    <div class="label">Search phenotype</div>
                    <phenotype-selectpicker
                        v-if="$store.state.phenotype"
                        :phenotypes="$store.state.bioPortal.phenotypes"
                        :clearOnSelected="true"
                    ></phenotype-selectpicker>
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

            <div v-if="$store.state.phenotype">


                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Top common variant gene-level associations for
                            {{ $store.state.phenotype.description }}
                            with P-Value &le; 0.05
                            <tooltip-documentation
                                name="phenotype.genes.tooltip"
                                :content-fill="$parent.documentationMap"
                                :isHover="true"
                                :noIcon="false"
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

                            <filter-pvalue-control :field="'pValue'">
                                <div class="label">P-Value (&le;)</div>
                            </filter-pvalue-control>

                            <template slot="filtered" slot-scope="{ filter }">
                                <gene-finder-table
                                    :phenotypes="[$store.state.phenotype.name]"
                                    :phenotypeMap="
                                        $store.state.bioPortal.phenotypeMap
                                    "
                                    :associations="$store.state.genes.data"
                                    :rows-per-page="10"
                                    :filter="filter"
                                    :showPlot="true"
                                ></gene-finder-table>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>


            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
