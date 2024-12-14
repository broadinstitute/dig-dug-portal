<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <!-- NAV -->
        <pkb-header></pkb-header>
        <!-- BODY -->

        <div class="pkb-body">
            <b-table
                :items="$parent.donors"
                :fields="$parent.donorsFields"
                striped
                hover
                responsive="sm"
                head-variant="light"
            ></b-table>
            <b-pagination
                v-model="$parent.currentPageDonors"
                class="pagination justify-content-center"
                :total-rows="$parent.donorsTotal"
                :per-page="$parent.perPageDonors"
            ></b-pagination>

            <b-table
                :items="$parent.assays"
                :fields="$parent.assaysFields"
                striped
                hover
                responsive="sm"
                head-variant="light"
            ></b-table>
            <b-pagination
                v-model="$parent.currentPageAssays"
                class="pagination justify-content-center"
                :total-rows="$parent.assaysTotal"
                :per-page="$parent.perPageAssays"
            ></b-pagination>

            <b-table
                :items="$parent.analyses"
                :fields="$parent.analysesFields"
                striped
                hover
                responsive="sm"
                head-variant="light"
            ></b-table>
            <b-pagination
                v-model="$parent.currentPageAnalyses"
                class="pagination justify-content-center"
                :total-rows="$parent.analysesTotal"
                :per-page="$parent.perPageAnalyses"
            ></b-pagination>

            <b-table
                :items="$parent.processedResults"
                :fields="$parent.processedResultsFields"
                striped
                hover
                responsive="sm"
                head-variant="light"
            ></b-table>
            <b-pagination
                v-model="$parent.currentPageProcessedResults"
                class="pagination justify-content-center"
                :total-rows="$parent.processedResultsTotal"
                :per-page="$parent.perPageProcessedResults"
            ></b-pagination>

        </div>
        <!-- FOOTER -->
        <pkb-footer></pkb-footer>
    </div>
</template>

<style scoped>
.pkb-nav {
    background: #fafafa99 !important;
}
</style>
