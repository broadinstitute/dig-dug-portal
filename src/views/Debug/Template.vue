<template>
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">Huge Calculator</h1>

                    <documentation style="margin-bottom: 30px" name="tools.genefinder.subheader"></documentation>

                    <h4 class="card-title">Build search criteria</h4>

                    <criterion-list-group
                        v-model="$parent.hugecalSearchCriterion"
                        :header="'Search Criterion'"
                    >
                        <!-- select gene -->
                        <filter-enumeration-control
                            ref="gene"
                            :field="'gene'"
                            placeholder="Select a gene ..."
                            :options="$parent.matchingGenes"
                            @input-change="$parent.lookupGenes($event)"
                        >
                            <div class="label">Gene</div>
                        </filter-enumeration-control>
                        <!-- select phenotype -->
                        <filter-enumeration-control
                            ref="phenotype"
                            :field="'phenotype'"
                            placeholder="Select a phenotype ..."
                            :options="$parent.phenotypes.map((phenotype) => phenotype.name)"
                            :multiple="false"
                            :labelFormatter="
                                (phenotype) =>!!$store.state.bioPortal.phenotypeMap[phenotype.name]
                                        ? $store.state.bioPortal.phenotypeMap[phenotype].description
                                        : phenotype"
                        >
                            <div class="label">Phenotype</div>
                        </filter-enumeration-control>
                    </criterion-list-group>
                    <div v-if="$store.state.associationsData.length>1">
                        <div v-if="$parent.isGWASSignificantAssociation">Gene is GWAS significant</div>
                        <div v-else>Gene is NOT GWAS significant</div>
                    </div>
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>


