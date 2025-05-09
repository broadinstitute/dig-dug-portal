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
                <!-- Wrap page level searchs with "pageSearchParameters" div -->

                <div
                    class="col filter-col-md hidden"
                    style="vertical-align: -8px !important"
                >
                    <div class="label">Phenotype</div>
                    <div class="form-control new-phenotype-search-key">
                        {{
                            !$parent.newPhenotypeSearchKey
                                ? "Search phenotype"
                                : $parent.newPhenotypeSearchKey
                        }}
                    </div>
                    <input
                        v-model="$parent.phenotypeSearchKey"
                        class="form-control phenotype-search-input"
                        type="text"
                    />

                    <ul
                        v-if="!!$parent.phenotypeSearchKey"
                        class="page-phenotypes-list"
                    >
                        <template
                            v-for="item in $store.state.pigeanAllPhenotypes
                                .data"
                        >
                            <li
                                v-if="
                                    !!$parent.ifPhenotypeInSearch(
                                        item.phenotype_name
                                    )
                                "
                                :key="item.phenotype"
                            >
                                <a
                                    href="javascript:;"
                                    @click="$parent.setSelectedPhenotype(item)"
                                    v-html="item.phenotype_name"
                                ></a>
                                <span class="trait-group">
                                    ({{
                                        $parent.traitGroups[item.trait_group]
                                    }})</span
                                >
                            </li>
                        </template>
                    </ul>
                </div>
                <div class="col filter-col-md">
                    <div class="label">Number of gene sets included</div>
                    <geneset-size-selectpicker></geneset-size-selectpicker>
                </div>
                <div class="region-search col filter-col-md hidden">
                    <div class="label">Search</div>
                    <button
                        id="regionSearchGo"
                        class="btn btn-light btn-sm go"
                        type="button"
                        @click="$store.dispatch('queryPhenotype')"
                    >
                        GO
                    </button>
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
                <div class="card-body">
                    <h4 class="card-title">Genes with genetic support</h4>
                    <div style="margin-bottom: 1rem">
                        Combined genetic support is composed of direct support
                        (from GWAS associations near the gene) and indirect
                        support (membership in gene sets with genetic support).
                        Units are log-odds of probability.
                    </div>
                    <criterion-function-group>
                        <filter-enumeration-control
                            field="gene"
                            placeholder="Select a gene ..."
                            :options="
                                $store.state.pigeanPhenotype.data.map(
                                    (d) => d.gene
                                )
                            "
                            :multiple="true"
                        >
                            <div class="label">Filter by Genes</div>
                        </filter-enumeration-control>
                        <filter-greater-less
                            v-for="filterField in $parent.geneFilterFields"
                            :key="filterField.key"
                            :field="filterField.key"
                            :label="filterField.label"
                        >
                            <div class="label">{{ filterField.label }}</div>
                        </filter-greater-less>
                        <template slot="filtered" slot-scope="{ filter }">
                            <pigean-plot
                                v-if="$store.state.pigeanPhenotype.data.length > 0 &&
                                    Object.keys($parent.pigeanMap).length > 0"
                                :pigeanData="$store.state.pigeanPhenotype.data"
                                :config="$parent.genePigeanPlotConfig"
                                :phenotypeMap="$parent.pigeanMap"
                                :filter="filter"
                            >
                            </pigean-plot>
                            <pigean-table
                                v-if="$store.state.pigeanPhenotype.data.length > 0 &&
                                    Object.keys($parent.pigeanMap).length > 0"
                                :pigeanData="$store.state.pigeanPhenotype.data"
                                :config="$parent.tableConfig"
                                :filter="filter"
                                :phenotypeMap="$parent.pigeanMap"
                            >
                            </pigean-table>
                        </template>
                    </criterion-function-group>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Gene sets that affect genetic support
                    </h4>
                    <div style="margin-bottom: 1rem">
                        Gene sets affect the log-odds of the probability that a
                        gene is involved in a trait. Effect sizes are calculated
                        for the gene set in isolation (marginal) and in a joint
                        model with all gene sets together (joint).
                    </div>
                    <criterion-function-group>
                        <filter-enumeration-control
                            field="gene_set"
                            placeholder="Select a gene set..."
                            :options="
                                $store.state.genesetPhenotype.data.map(
                                    (d) => d.gene_set
                                )
                            "
                            :multiple="true"
                        >
                            <div class="label">Filter by Gene Sets</div>
                        </filter-enumeration-control>
                        <filter-greater-less
                            v-for="filterField in $parent.genesetFilterFields"
                            :key="filterField.key"
                            :field="filterField.key"
                            :label="filterField.label"
                        >
                            <div class="label">{{ filterField.label }}</div>
                        </filter-greater-less>

                        <template slot="filtered" slot-scope="{ filter }">
                            <pigean-plot
                                v-if="$store.state.genesetPhenotype.data.length > 0 &&
                                    Object.keys($parent.pigeanMap).length > 0"
                                :pigeanData="$store.state.genesetPhenotype.data"
                                :config="$parent.genesetPigeanPlotConfig"
                                :phenotypeMap="$parent.pigeanMap"
                                :filter="filter"
                            >
                            </pigean-plot>
                            <pigean-table
                                v-if="$store.state.genesetPhenotype.data.length > 0 &&
                                    Object.keys($parent.pigeanMap).length > 0"
                                :pigeanData="$store.state.genesetPhenotype.data"
                                :config="$parent.genesetTableConfig"
                                :phenotypeMap="$parent.pigeanMap"
                                :filter="filter"
                            >
                            </pigean-table>
                        </template>
                    </criterion-function-group>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Biological mechanisms underlying the trait
                        <tooltip-documentation
                            name="gene.translator.tooltip.hover"
                            :content-fill="$parent.documentationMap"
                            :is-hover="true"
                            :no-icon="false"
                            :supplyText="$parent.mechanismTooltip"
                        >
                        </tooltip-documentation>
                    </h4>
                    <div>
                        Mechanisms are determined by latent factorization of the
                        membership matrix of significant genes and gene sets.
                    </div>
                    <criterion-function-group>
                        <div class="col filter-col-md">
                            <div class="label">P-value (<=)</div>
                            <input
                                type="number"
                                class="form-control"
                                v-model.lazy="$parent.heatmapMaxP"
                            />
                        </div>
                    </criterion-function-group>
                    <div class="row mb-4">
                        <div id="mechanism-graph-outer" class="col-md-4">
                            <div class="label">
                                <strong>Mechanism Graph</strong>
                            </div>
                            <div id="mechanism-graph-inner">
                                <template
                                    v-if="
                                        $store.state.phenotype &&
                                        $store.state.genesetSize
                                    "
                                >
                                    <div class="text-right mb-2">
                                        <b-button
                                            size="sm"
                                            variant="outline-primary"
                                            :to="`/pigean/network_graph.html?phenotype=${$store.state.phenotype.name}&genesetSize=${$store.state.genesetSize}`"
                                            target="_blank"
                                            ><b-icon icon="node-plus"></b-icon>
                                            View Detailed Graph
                                        </b-button>
                                    </div>

                                    <network-graph
                                        :phenotype="$store.state.phenotype"
                                        :geneset-size="$store.state.genesetSize"
                                        :is-embed="true"
                                    ></network-graph>
                                </template>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <heatmap
                                v-if="
                                    $store.state.pigeanTopPhewas.data.length > 0
                                "
                                :heatmapData="$parent.heatmapData"
                                :renderConfig="$parent.heatmapConfig"
                                :sectionId="`${$store.state.phenotype.name}_topPhewas`"
                            >
                            </heatmap>
                        </div>
                    </div>
                    <pigean-table
                        v-if="$store.state.pigeanFactor.data.length > 0 &&
                            Object.keys($parent.pigeanMap).length > 0"
                        :pigeanData="$store.state.pigeanFactor.data"
                        :config="$parent.factorTableConfig"
                        :phewasRenderConfig="$parent.renderConfig"
                        :phenotypeMap="$parent.pigeanMap"
                    >
                    </pigean-table>
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

.mechanism-info {
    font-size: 0.75em;
    color: #007bff;
}
.b-tooltip {
    color: green !important;
}
span.trait-group {
    color: #495057;
}
a.btn-outline-primary:hover {
    color: #ffffff !important;
    border-color: #007bff;
}
#mechanism-graph-outer {
    padding: 10px;
}
#mechanism-graph-inner {
    padding-top: 20px;
}
/* .network-container >>> div.vis-network {
    border: none;
} */
</style>
