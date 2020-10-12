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

                <filter-group v-model="$parent.annotationsFilter" :looseMatch="true">
                    <div class="col filter-col-lg">
                        <div class="label" style="margin-bottom: 5px">Set primary phenotype</div>
                        <phenotype-picker
                            :phenotypes="$store.state.bioPortal.phenotypes"
                            :default-phenotype="$store.state.phenotype.description"
                            :clearOnSelected="true"
                            @phenotypeAssociationGeneData="$parent.getPhenotypeAssociatedGeneFinderData($event)"
                        ></phenotype-picker>
                    </div>
                </filter-group>

                <gene-finder-table
                    v-if="$parent.geneFinderData"
                    :phenotypes="['T2D']"
                    :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                    :associations="$parent.geneFinderData"
                    :per-page="10"
                ></gene-finder-table>
            </h4>
        </div>
    </div>
</template>