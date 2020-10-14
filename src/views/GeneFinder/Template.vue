<template>
    <div class="card mdkp-card">
        <div class="card-body">
            <h4 class="card-title">
                GeneFinder
                <tooltip-documentation
                    name="phenotype.top1000.tooltip"
                    :content-fill="$parent.documentationMap"
                    :isHover="true"
                    :noIcon="false"
                ></tooltip-documentation>

                <filter-group :looseMatch="true">
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
                    <!-- Secondary Phenotype (multi select) -->
                </filter-group>

                <div>
                    <gene-finder-table
                        :phenotypes="$parent.phenotypes"
                        :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                        :associations="$parent.combined"
                        :per-page="10"
                    ></gene-finder-table>
                </div>
            </h4>
        </div>
    </div>
</template>