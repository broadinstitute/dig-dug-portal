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
                    class="col filter-col-md"
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
                        <li
                            v-for="item in $parent.filteredPhenotypesForSearch"
                            :key="item.phenotype || item.name"
                        >
                                <a
                                    href="javascript:;"
                                    @click="$parent.setSelectedPhenotype(item)"
                                    v-html="item.phenotype_name || item.description"
                                ></a>
                                <span
                                    v-if="item.trait_group"
                                    class="trait-group"
                                >
                                    ({{
                                        $parent.traitGroups[item.trait_group]
                                    }})</span
                                >
                            </li>
                    </ul>
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
                    <div class="row mb-4">
                        <div id="mechanism-graph-outer" class="col-md-12">
                            <div class="label">
                                <strong>Mechanism Graph</strong>
                            </div>
                            <div id="mechanism-graph-inner">
                                <pigean-graph-viz
                                    v-if="$parent.currentPhenotypeId"
                                    :phenotype-id="$parent.currentPhenotypeId"
                                    :geneset-size="$store.state.genesetSize"
                                    :sigma="2"
                                ></pigean-graph-viz>
                            </div>
                        </div>
                    </div>

                    <pigean-table
                        v-if="$store.state.pigeanFactor.data.length > 0 &&
                            Object.keys($parent.pigeanMap).length > 0"
                        :pigeanData="$store.state.pigeanFactor.data"
                        :config="$parent.factorTableConfig"
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

span.trait-group {
    color: #495057;
}

#mechanism-graph-outer {
    padding: 10px;
}
#mechanism-graph-inner {
    padding-top: 20px;
}

</style>

