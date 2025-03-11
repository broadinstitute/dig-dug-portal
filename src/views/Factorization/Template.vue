<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :raw-phenotypes="$parent.rawPhenotypes"
        >
        </page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <search-header-wrapper>
                
            </search-header-wrapper>
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-body">
                        <div>
                            <span>
                                Interactive Gene Set Explorer
                            </span>
                        </div>
                    </div>
                </div>
                <div class="row card-body" id="bayesSearch">
                    <div class="col-md-12">
                        <div class="filtering-ui-wrapper">
                            <div class="filtering-ui-content row">
                                <div class="col filter-col-md">
                                    <div class="label">Genes</div>
                                    <b-form-textarea
                                        id="bayesSearchField"
                                        v-model="$parent.geneInput"
                                        :placeholder="$parent.placeholder"
                                        rows="10">
                                    </b-form-textarea>
                                </div>
                                <div class="col filter-col-md" id="dropdownDiv">
                                    <div class="label">
                                        Gene Sets
                                    </div>
                                    <select class="form-control"
                                        v-model="$parent.genesetParam"
                                    >
                                        <option v-for=" o in $store.state.genesetOptions"
                                            :value="o">
                                                {{ o }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col filter-col-md"
                                    id="searchButtonDiv">
                                    <div class="label">Search</div>
                                    <button
                                        id="regionSearchGo"
                                        class="btn btn-light btn-sm go"
                                        type="button"
                                        @click="$parent.search()"
                                    >
                                        GO
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4>Factors</h4>
                    <factorization-network-graph
                        :factorGraphData="$parent.networkGraph"
                        :isEmbed="true">
                    </factorization-network-graph>
                    <pigean-bayes-table
                        :pigeanData="$parent.pigeanFactor"
                        :geneData="$parent.geneFactor"
                        :genesetData="$parent.genesetFactor"
                        :fields="$parent.topFields"
                        :geneFields="$parent.geneFields"
                        :genesetFields="$parent.genesetFields">
                    </pigean-bayes-table>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4>Gene Factor</h4>
                    <criterion-function-group>
                        <filter-enumeration-control
                            field="label"
                            placeholder="Select a label ..."
                            :options="
                                $parent.geneFactor.map(d => d.label)
                            "
                            :multiple="true"
                        >
                            <div class="label">Filter by Factor Label</div>
                        </filter-enumeration-control>
                        <filter-enumeration-control
                            field="inQuery"
                            placeholder="Is gene in original query?"
                            :options="$parent.geneFactor.map(d => d.inQuery)"
                        >
                            <div class="label">Filter by Genes in Query</div>
                        </filter-enumeration-control>
                        <template slot="filtered" slot-scope="{ filter }">
                            <pigean-bayes-table
                                :pigeanData="$parent.geneFactor"
                                :fields="$parent.geneFields"
                                :filter="filter">
                            </pigean-bayes-table>
                        </template>
                    </criterion-function-group>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4>Gene Set Factor</h4>
                    <criterion-function-group>
                        <filter-enumeration-control
                            field="label"
                            placeholder="Select a label ..."
                            :options="
                                $parent.genesetFactor.map(d => d.label)
                            "
                            :multiple="true"
                        >
                            <div class="label">Filter by Factor Label</div>
                        </filter-enumeration-control>
                        <template slot="filtered" slot-scope="{ filter }">
                            <pigean-bayes-table
                                :pigeanData="$parent.genesetFactor"
                                :fields="$parent.genesetFields"
                                :filter="filter">
                            </pigean-bayes-table>
                        </template>
                    </criterion-function-group>
                    
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4>Phenotypes</h4>
                    <b-table :items="$store.state.phenotypeData">
                    </b-table>
                </div>
            </div>
        </div>
        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style scoped>
.card-body.pigean-plots {
    padding-bottom: 0;
    padding-top: 0;
}
.card-body.pigean-title {
    padding-bottom: 0;
}
.card-body.pigean-table {
    padding-top: 0;
}
#bayesSearch {
    min-height: 150px !important;
    vertical-align: top !important;
}
#bayesSearchField {
    min-height: 125px !important;
}
#searchButtonDiv, #dropdownDiv {
    vertical-align: top !important;
}
#searchButtonDiv button {
    border: solid 1px #ddd;
}
</style>
