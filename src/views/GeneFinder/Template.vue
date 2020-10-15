<template>
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>
        <div class="card mdkp-card">
            <div class="card-body">
                <h4 class="card-title">
                    Gene Finder
                    <tooltip-documentation
                        name="phenotype.top1000.tooltip"
                        :content-fill="$parent.documentationMap"
                        :isHover="true"
                        :noIcon="false"
                    ></tooltip-documentation>
                </h4>

                <documentation style="margin-bottom: 30px" name="tools.genefinder.subheader"></documentation>

                <h5 class="card-title">
                    Build search criteria
                    <tooltip-documentation
                        name="phenotype.top1000.tooltip"
                        :content-fill="$parent.documentationMap"
                        :isHover="true"
                        :noIcon="false"
                    ></tooltip-documentation>
                </h5>

                <div class="labele" id="req">Multiple phenotypes ccan be selected.</div>
                <div
                    style="margin-bottom: 30px"
                    class="labelee"
                    id="req"
                >Required for search, otherwise returns genes with p-value<=0.05.</div>

                <!-- <documentation name="tools.genefinder.buildcriteria.subheader"></documentation> -->

                <filter-group v-model="$parent.geneFinderFilter" :looseMatch="true">
                    <!-- Primary Phenotype (single select) -->
                    <!-- <div class="col filter-col-lg">
                        <div class="labele" style="margin-bottom: 5px">
                            <strong>Set primary phenotype</strong>
                        </div>
                        <phenotype-picker
                            :phenotypes="$store.state.bioPortal.phenotypes"
                            :default-phenotype="$store.state.phenotype.description"
                            :clearOnSelected="false"
                            @phenotypeAssociationGeneData="$parent.getPhenotypeAssociatedGeneFinderData($event)"
                        ></phenotype-picker>
                    </div>-->
                    <!-- Secondary Phenotype (multi select) -->
                    <div class="col filter-col-lg">
                        <div class="labelee" style="margin-bottom: 5px">
                            <strong>Select phenotypes</strong>
                        </div>
                        <phenotype-picker
                            :phenotypes="$parent.secondaryPhenotypeOptions"
                            :default-phenotype="$store.state.phenotype.description"
                            :clearOnSelected="true"
                            :multipleselect="true"
                            @secphenotypeAssociationGeneData="$parent.updateGeneFinderData($event)"
                            @updatePhenotypeList="$parent.updatePhenotypeList($event)"
                        ></phenotype-picker>
                    </div>
                    <!-- pValue filter -->
                    <filter-pvalue-control :field="'pValue'">
                        <div class="label">P-Value (&le;)</div>
                    </filter-pvalue-control>
                </filter-group>

                <div>
                    <gene-finder-table
                        v-if="$store.state.secondaryPhenotype"
                        :phenotypes="$store.state.phenotypelist"
                        :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                        :associations="$parent.combined"
                        :per-page="10"
                        :exclusive="true"
                    ></gene-finder-table>
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style>
.labele:before {
    content: "*";
    color: red;
}
.labelee:before {
    content: "**";
    color: red;
}
</style>