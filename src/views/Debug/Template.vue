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

                    <div v-if="$store.state.associationsData.length>0">
                        <div v-if="$parent.isGWASSignificantAssociation">
                            <div class="card mdkp-card">
                                <div class="card-body" style="margin-block-end: 20px">
                                    <div class="row">
                                        <div class="column">
                                            <h4>
                                                Common Variation
                                                <tooltip-documentation
                                                    name="gene.function.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>
                                        </div>

                                        <div class="column" style="border-left: 1px dashed #444">
                                            <h4>
                                                Rare Variation
                                                <tooltip-documentation
                                                    name="gene.function.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>
                                        </div>
                                    </div>
                                    <!-- <div class="col-md-6">
                                           
                                        </div>
                                        <div class="col-md-6" style="border-left: 1px dashed #444">
                                          
                                    </div>-->
                                </div>
                            </div>
                        </div>
                        <div v-else>Gene is NOT GWAS significant</div>
                    </div>
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>


<style>
* {
    box-sizing: border-box;
}

/* Container for flexboxes */
.row {
    display: flex;
    flex-wrap: wrap;
}

/* Create four equal columns */
.column {
    flex: 25%;
    padding: 20px;
}

/* On screens that are 992px wide or less, go from four columns to two columns */
@media screen and (max-width: 992px) {
    .column {
        flex: 50%;
    }
}

/* On screens that are 600px wide or less, make the columns stack on top of each other instead of next to each other */
@media screen and (max-width: 600px) {
    .row {
        flex-direction: column;
    }
}
</style>