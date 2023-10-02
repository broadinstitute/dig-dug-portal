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
                        name="variant.explore.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <tissue-table :tissue-data="$parent.tissueData" />
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
