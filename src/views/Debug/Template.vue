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

                    <div
                        v-if="$store.state.associationsData.length>0 && $parent.selectedPhenotype.length != 0"
                    >
                        <div>
                            <div class="card mdkp-card">
                                <div class="card-body" style="margin-block-end: 20px">
                                    <div class="row">
                                        <div
                                            class="column"
                                            v-if="$parent.isGWASSignificantAssociation"
                                        >
                                            <h4>
                                                Common Variation
                                                <tooltip-documentation
                                                    name="gene.function.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>
                                            <ul v-if="$parent.eglData">
                                                <li v-if="$parent.eglData.genetic == '1C'">
                                                    Coding evidence:
                                                    <span
                                                        class="codingEvidence1C"
                                                    >{{$parent.eglData.genetic}}</span>
                                                </li>
                                                <li v-else-if="$parent.eglData.genetic == '2C'">
                                                    Coding evidence:
                                                    <span
                                                        class="codingEvidence2C"
                                                    >{{$parent.eglData.genetic}}</span>
                                                </li>
                                                <li v-if="$parent.eglData.genomic == '2R'">
                                                    Regulatory evidence:
                                                    <span
                                                        class="regulatoryEvidence2R"
                                                    >{{$parent.eglData.genomic}}</span>
                                                </li>
                                                <li v-if=" $parent.eglData.genomic == '3R'">
                                                    Regulatory evidence:
                                                    <span
                                                        class="regulatoryEvidence3R"
                                                    >{{$parent.eglData.genomic }}</span>
                                                </li>
                                                <li v-if=" $parent.eglData.category == 'in GWAS'">
                                                    <span>Genome wide significant but no coding or regulatory evidence</span>
                                                </li>
                                                <li
                                                    v-if=" $parent.eglData.category == 'No Evidence'"
                                                >
                                                    <span>Genome wide significant but no coding or regulatory evidence associated with Type 2 diabetes</span>
                                                </li>
                                                <li>
                                                    Bayes Factor:
                                                    <span>{{$parent.bayesFactorCommonVariation}}</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div class="column" v-else>
                                            <h4>
                                                Common Variation
                                                <tooltip-documentation
                                                    name="gene.function.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>Gene is NOT GWAS significant
                                        </div>

                                        <!-- Rare Variation -->
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
                                </div>
                            </div>
                        </div>
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

.codingEvidence1C {
    background-color: #ffd62e;
    padding: 5px;
    border-radius: 25px;
    font-weight: 700;
}
.codingEvidence2C {
    background-color: #ffec2e;
    padding: 5px;
    border-radius: 25px;
    font-weight: 700;
}
.regulatoryEvidence2R {
    background-color: #bfd730;
    padding: 5px;
    border-radius: 25px;
    font-weight: 700;
}
.regulatoryEvidence3R {
    background-color: #bfd73050;
    padding: 5px;
    border-radius: 25px;
    font-weight: 700;
}
</style>