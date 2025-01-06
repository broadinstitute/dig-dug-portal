<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <!-- HEADER -->
        <pkb-header></pkb-header>

        <!-- BODY -->
        <div class="pkb-body">
            <div v-html="$parent.info"></div>
            <b-card no-body>
                <b-tabs card>
                    <b-tab title="Donors" active>
                        <b-card-text>
                            <b-table
                                :items="$parent.donors"
                                :fields="$parent.donorsFields"
                                striped
                                hover
                                responsive="sm"
                                head-variant="light"
                            >
                                <template #cell(accession)="data">
                                    <a
                                        :href="
                                            $parent.dataUrl + data.item['@id']
                                        "
                                        target="_blank"
                                        >{{ data.item.accession }}</a
                                    >
                                </template>
                            </b-table>
                            <b-pagination
                                v-model="$parent.currentPageDonors"
                                class="pagination justify-content-center"
                                :total-rows="$parent.donorsTotal"
                                :per-page="$parent.perPageDonors"
                            ></b-pagination>
                            Total rows: {{ $parent.donorsTotal }}</b-card-text
                        >
                    </b-tab>
                    <b-tab title="BioSamples">
                        <b-card-text
                            ><b-table
                                :items="$parent.biosamples"
                                :fields="$parent.biosamplesFields"
                                striped
                                hover
                                responsive="sm"
                                head-variant="light"
                            >
                                <template #cell(accession)="data">
                                    <a
                                        :href="
                                            $parent.dataUrl + data.item['@id']
                                        "
                                        target="_blank"
                                        >{{ data.item.accession }}</a
                                    >
                                </template>
                            </b-table>
                            <b-pagination
                                v-model="$parent.currentPageBiosamples"
                                class="pagination justify-content-center"
                                :total-rows="$parent.biosamplesTotal"
                                :per-page="$parent.perPageBiosamples"
                            ></b-pagination>
                            Total rows:
                            {{ $parent.biosamplesTotal }}</b-card-text
                        >
                    </b-tab>
                    <b-tab title="Assays">
                        <b-card-text
                            ><b-table
                                :items="$parent.assays"
                                :fields="$parent.assaysFields"
                                striped
                                hover
                                responsive="sm"
                                head-variant="light"
                            >
                                <template #cell(accession)="data">
                                    <a
                                        :href="
                                            $parent.dataUrl + data.item['@id']
                                        "
                                        target="_blank"
                                        >{{ data.item.accession }}</a
                                    >
                                </template>
                            </b-table>
                            <b-pagination
                                v-model="$parent.currentPageAssays"
                                class="pagination justify-content-center"
                                :total-rows="$parent.assaysTotal"
                                :per-page="$parent.perPageAssays"
                            ></b-pagination>
                            Total rows: {{ $parent.assaysTotal }}</b-card-text
                        >
                    </b-tab>
                    <b-tab title="Analyses">
                        <b-card-text
                            ><b-table
                                :items="$parent.analyses"
                                :fields="$parent.analysesFields"
                                striped
                                hover
                                responsive="sm"
                                head-variant="light"
                                ><template #cell(accession)="data">
                                    <a
                                        :href="
                                            $parent.dataUrl + data.item['@id']
                                        "
                                        target="_blank"
                                        >{{ data.item.accession }}</a
                                    >
                                </template></b-table
                            >
                            <b-pagination
                                v-model="$parent.currentPageAnalyses"
                                class="pagination justify-content-center"
                                :total-rows="$parent.analysesTotal"
                                :per-page="$parent.perPageAnalyses"
                            ></b-pagination>
                            Total rows: {{ $parent.analysesTotal }}</b-card-text
                        >
                    </b-tab>
                    <b-tab title="Processed Results">
                        <b-card-text
                            ><b-table
                                :items="$parent.processedResults"
                                :fields="$parent.processedResultsFields"
                                striped
                                hover
                                responsive="sm"
                                head-variant="light"
                                ><template #cell(accession)="data">
                                    <a
                                        :href="
                                            $parent.dataUrl + data.item['@id']
                                        "
                                        target="_blank"
                                        >{{ data.item.accession }}</a
                                    >
                                </template></b-table
                            >
                            <b-pagination
                                v-model="$parent.currentPageProcessedResults"
                                class="pagination justify-content-center"
                                :total-rows="$parent.processedResultsTotal"
                                :per-page="$parent.perPageProcessedResults"
                            ></b-pagination>
                            Total rows:
                            {{ $parent.processedResultsTotal }}</b-card-text
                        >
                    </b-tab>
                </b-tabs>
            </b-card>
        </div>

        <!-- FOOTER -->
        <pkb-footer></pkb-footer>
    </div>
</template>

<style scoped></style>
