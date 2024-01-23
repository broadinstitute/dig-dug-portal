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
            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation
                        name="tissue.explore.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <tissue-table
                        v-if="$parent.tissueData.length > 0"
                        :tissue-data="$parent.tissueData"
                        :tissue="$parent.tissue"
                    ></tissue-table>
                </div>
            </div>

            <div class="filtering-ui-wrapper container-fluid">
                <div class="row filtering-ui-content">
                    <div class="col filter-col-md filter-col-lg">Filters</div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <tissue-heritability-table
                        :tissue="$parent.tissue"
                    ></tissue-heritability-table>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
