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

                <documentation style="margin-bottom: 50px" name="region.phenos_w_signal.subheader"></documentation>

                <h5 class="card-title">
                    Build search criteria
                    <tooltip-documentation
                        name="phenotype.top1000.tooltip"
                        :content-fill="$parent.documentationMap"
                        :isHover="true"
                        :noIcon="false"
                    ></tooltip-documentation>
                </h5>

                <documentation name="region.phenos_w_signal.subheader"></documentation>

                <filter-group v-model="$parent.geneFinderFilter" :looseMatch="true">
                    <!-- Primary Phenotype (single select) -->
                    <div class="col filter-col-lg">
                        <div class="label" style="margin-bottom: 5px">Set primary phenotype</div>
                        <phenotype-picker
                            :phenotypes="$store.state.bioPortal.phenotypes"
                            :default-phenotype="$store.state.phenotype.description"
                            :clearOnSelected="false"
                            @phenotypeAssociationGeneData="$parent.getPhenotypeAssociatedGeneFinderData($event)"
                        ></phenotype-picker>
                    </div>
                    <!-- Secondary Phenotype (multi select) -->
                    <div class="col filter-col-lg">
                        <div style="margin-bottom: 5px">Set secondary phenotype</div>
                        <phenotype-picker
                            :phenotypes="$parent.secondaryPhenotypeOptions"
                            :default-phenotype="$store.state.phenotype.description"
                            :clearOnSelected="true"
                            :multipleselect="true"
                            @secphenotypeAssociationGeneData="$parent.updateGeneFinderData($event)"
                        ></phenotype-picker>
                    </div>
                    <!-- pValue filter -->
                    <filter-pvalue-control :field="'pValue'">
                        <div class="label">P-Value (&le;)</div>
                    </filter-pvalue-control>
                </filter-group>

                <div>
                    <gene-finder-table
                        v-if="$parent.combined"
                        :phenotypes="$store.state.phenotypelist"
                        :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                        :associations="$parent.combined"
                        :per-page="10"
                    ></gene-finder-table>
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>