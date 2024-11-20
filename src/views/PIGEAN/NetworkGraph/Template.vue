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
                <div class="region-search col filter-col-md hidden">
                    <div class="label">Search</div>
                    <button
                        id="regionSearchGo"
                        class="btn btn-light btn-sm go"
                        type="button"
                        @click="$parent.searchPhenotype()"
                    >
                        GO
                    </button>
                </div>
            </search-header-wrapper>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Mechanism Graph</h4>
                    <template v-if="$store.state.phenotype && $parent.genesetSize">
                        <network-graph
                            :phenotype="$store.state.phenotype.name"
                            :geneset-size="$parent.genesetSize"
                        ></network-graph>
                    </template>
                </div>
            </div>
        </div>
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
</style>