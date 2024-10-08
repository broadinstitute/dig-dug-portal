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
            <search-header-wrapper
                id="bayesSearch">
                <div class="col filter-col-md">
                    <b-form-textarea
                        id="bayesSearchField"
                        v-model="$parent.geneInput"
                        :placeholder="$parent.placeholder"
                        rows="10">
                    </b-form-textarea>
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
            </search-header-wrapper>
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-body">
                        <div>
                            <span>
                                PIGEAN Interactive Gene Set Explorer
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4>Pigean Factor</h4>
                    <pigean-bayes-table
                        :pigeanData="$parent.pigeanFactor"
                        :isPigeanFactor="true">
                    </pigean-bayes-table>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4>Gene Factor</h4>
                    <pigean-bayes-table
                        :pigeanData="$parent.geneFactor">
                    </pigean-bayes-table>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4>Gene Set Factor</h4>
                    <pigean-bayes-table
                        :pigeanData="$parent.genesetFactor">
                    </pigean-bayes-table>
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
}
#bayesSearchField {
    min-height: 125px !important;
}
#searchButtonDiv {
    vertical-align: top !important;
}
</style>
