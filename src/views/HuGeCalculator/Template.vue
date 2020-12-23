<template>
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">Huge Calculator</h1>

                    <documentation style="margin-bottom: 30px" name="tools.hugecal.subheader"></documentation>

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
                                            class="col-md-6"
                                            v-if="$parent.bayesFactorCombinedEvidence($parent.bayesFactorCommonVariation,$parent.bayesFactorRareVariation)"
                                        >
                                            <h4>
                                                Combined Evidence
                                                <tooltip-documentation
                                                    name="gene.function.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>
                                            <ul>
                                                <li>
                                                    <span>{{$parent.determineCategory($parent.bayesFactorCombinedEvidence($parent.bayesFactorCommonVariation,$parent.bayesFactorRareVariation))}} Evidence</span>
                                                </li>
                                                <li>
                                                    Bayes Factor:
                                                    <span>{{$parent.bayesFactorCombinedEvidence($parent.bayesFactorCommonVariation,$parent.bayesFactorRareVariation)}}</span>
                                                </li>
                                            </ul>
                                            <div style="width: 700px">
                                                <br />
                                                <color-bar-plot
                                                    v-if="$parent.bayesFactorRareVariation"
                                                    :category="$parent.determineCategory($parent.bayesFactorCombinedEvidence($parent.bayesFactorCommonVariation,$parent.bayesFactorRareVariation))"
                                                    :elementid="'combinedVariation'"
                                                ></color-bar-plot>
                                            </div>
                                        </div>
                                        <div class="col-md-6" style="border-left: 1px dashed #444">
                                            <posterior-probability-plot
                                                v-if="$parent.geneAssociations52k"
                                                :geneAssociationsData="$parent.geneAssociations52k"
                                                :priorVariance="$parent.priorVariance"
                                                :bayes_factor="$parent.bayesFactorCombinedEvidence($parent.bayesFactorCommonVariation,$parent.bayesFactorRareVariation)"
                                                :isDichotomous="true"
                                            ></posterior-probability-plot>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="card mdkp-card">
                                <div class="card-body" style="margin-block-end: 20px">
                                    <div class="row">
                                        <div
                                            class="col-md-6"
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
                                                <li>
                                                    <span>Genome-wide significant - pvalue less than 5e-8</span>
                                                </li>
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
                                                    <span>Genome-wide significant but no coding or regulatory evidence</span>
                                                </li>
                                                <li
                                                    v-if=" $parent.eglData.category == 'No Evidence'"
                                                >
                                                    <span>Genome-wide significant but no coding or regulatory evidence associated with Type 2 diabetes</span>
                                                </li>
                                                <li>
                                                    Bayes Factor:
                                                    <span>{{$parent.bayesFactorCommonVariation}}</span>
                                                </li>
                                            </ul>
                                            <!-- Common variation color bar plot -->
                                            <div style="width: 700px" v-if="$parent.eglData">
                                                <br />
                                                <color-bar-plot
                                                    v-if="$parent.bayesFactorCommonVariation"
                                                    :category="$parent.determineCategory($parent.bayesFactorCommonVariation)"
                                                    :elementid="'commonVariation'"
                                                ></color-bar-plot>
                                            </div>
                                            <hr style="margin: 40px" />
                                            <div
                                                v-if="$parent.isGWASSignificantAssociation == true"
                                            >
                                                <h5>{{$parent.selectedGene[0]}} is GWAS significant</h5>
                                                <locuszoom
                                                    v-if="$parent.region"
                                                    ref="locuszoom"
                                                    :chr="$parent.region.chromosome"
                                                    :start="$parent.region.start - 50000"
                                                    :end="$parent.region.end + 50000"
                                                    :refSeq="true"
                                                >
                                                    <lz-associations-panel
                                                        :phenotype="$parent.phenotype.name"
                                                        :finishHandler="$parent.updateAssociationsTable"
                                                    ></lz-associations-panel>
                                                </locuszoom>
                                            </div>
                                        </div>

                                        <!-- If NOT GWAS significant -->
                                        <div v-else class="col-md-6">
                                            <h4>
                                                Common Variation
                                                <tooltip-documentation
                                                    name="gene.function.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>
                                            <ul>
                                                <li v-if="$parent.eglData.genetic == '1C'">
                                                    Coding evidence:
                                                    <span
                                                        class="codingEvidence1C"
                                                    >{{$parent.eglData.genetic}}</span>
                                                    <span>GWAS significant</span>
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
                                                <li v-if="$parent.eglData.genetic != '1C'">
                                                    <span>Not Genome-wide significant - p-value greater than 5e-8</span>
                                                </li>
                                                <li>
                                                    Bayes Factor:
                                                    <span>{{$parent.bayesFactorCommonVariation}}</span>
                                                </li>
                                            </ul>
                                            <!-- <div
                                                style="display:flex; align-items:center;justify-content:center;"
                                            >-->
                                            <div style="width: 700px">
                                                <br />
                                                <color-bar-plot
                                                    v-if="$parent.bayesFactorCommonVariation"
                                                    :category="$parent.determineCategory($parent.bayesFactorCommonVariation)"
                                                    :elementid="'commonVariation'"
                                                ></color-bar-plot>
                                            </div>
                                            <hr style="margin: 40px" />
                                            <div
                                                v-if="$parent.isGWASSignificantAssociation == false && $parent.eglData.genetic != '1C'"
                                            >
                                                <h5>{{$parent.selectedGene[0]}} is not GWAS significant</h5>

                                                <locuszoom
                                                    v-if="$parent.region"
                                                    ref="locuszoom"
                                                    :chr="$parent.region.chromosome"
                                                    :start="$parent.region.start - 50000"
                                                    :end="$parent.region.end + 50000"
                                                    :refSeq="true"
                                                >
                                                    <lz-associations-panel
                                                        :phenotype="$parent.phenotype.name"
                                                        :finishHandler="$parent.updateAssociationsTable"
                                                    ></lz-associations-panel>
                                                </locuszoom>
                                            </div>

                                            <div v-else>
                                                <h5>{{$parent.selectedGene[0]}} is GWAS significant</h5>

                                                <locuszoom
                                                    v-if="$parent.region"
                                                    ref="locuszoom"
                                                    :chr="$parent.region.chromosome"
                                                    :start="$parent.region.start - 50000"
                                                    :end="$parent.region.end + 50000"
                                                    :refSeq="true"
                                                >
                                                    <lz-associations-panel
                                                        :phenotype="$parent.phenotype.name"
                                                        :finishHandler="$parent.updateAssociationsTable"
                                                    ></lz-associations-panel>
                                                </locuszoom>
                                            </div>

                                            <!-- </div> -->
                                        </div>

                                        <!-- Rare Variation - If EXOME WIDE SIGNIFICANT-->
                                        <div
                                            v-if="$parent.isExomeWideSignificant(this.$store.state.geneAssociations52k.data)"
                                            class="col-md-6"
                                            style="border-left: 1px dashed #444"
                                        >
                                            <h4>
                                                Rare Variation
                                                <tooltip-documentation
                                                    name="gene.function.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>
                                            <ul>
                                                <li>
                                                    <span>Causal</span>
                                                </li>
                                                <li>
                                                    <span>Exome-Wide significant - p-value less than 2.5e-6</span>
                                                </li>
                                                <li>
                                                    Bayes Factor:
                                                    <span>{{$parent.bayesFactorRareVariation}}</span>
                                                </li>
                                                <div style="width: 700px padding:10px">
                                                    <br />
                                                    <color-bar-plot
                                                        v-if="$parent.bayesFactorRareVariation"
                                                        :category="$parent.determineCategory($parent.bayesFactorRareVariation)"
                                                        :elementid="'rareVariation'"
                                                    ></color-bar-plot>
                                                </div>
                                            </ul>
                                        </div>

                                        <!-- Rare Variation - If not Exome wide significant -->
                                        <div
                                            v-else
                                            class="col-md-6"
                                            style="border-left: 1px dashed #444"
                                        >
                                            <h4>
                                                Rare Variation
                                                <tooltip-documentation
                                                    name="gene.function.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>
                                            <ul>
                                                <li>
                                                    <span>Not Exome-Wide significant - p-value greater than 2.5e-6</span>
                                                </li>
                                                <li>
                                                    <span>{{$parent.determineCategory($parent.bayesFactorRareVariation)}} Evidence</span>
                                                </li>

                                                <li>
                                                    Bayes Factor:
                                                    <span>{{$parent.bayesFactorRareVariation}}</span>
                                                </li>
                                                <div style="width: 700px">
                                                    <br />
                                                    <color-bar-plot
                                                        v-if="$parent.bayesFactorRareVariation"
                                                        :category="$parent.determineCategory($parent.bayesFactorRareVariation)"
                                                        :elementid="'rareVariation'"
                                                    ></color-bar-plot>
                                                </div>
                                            </ul>
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

/* coding and regulatory evidence */
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

/* color bar plot */
.arrow-up {
    width: 0;
    height: 40px;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid black;
    animation: moveright 1s alternate 1s;
}

#commonVariation .variationCausal {
    background-color: #884ea0;
}
#commonVariation .variationStrong {
    background-color: #9b59b6;
}
#commonVariation .variationModerate {
    background-color: #af7ac5;
}
#commonVariation .variationPossible {
    background-color: #c39bd3;
}
#commonVariation .variationPotential {
    background-color: #deb3f1;
}
#commonVariation .variationWeak {
    background-color: #e6c7f3;
}

#commonVariation .variationNoEvidence {
    background-color: #eaddee;
}
#rareVariation .variationCausal {
    background-color: #f1c206;
}
#rareVariation .variationStrong {
    background-color: #f3d14a;
}
#rareVariation .variationModerate {
    background-color: #f5db74;
}
#rareVariation .variationPossible {
    background-color: #f6e5a0;
}
#rareVariation .variationPotential {
    background-color: #f3e3a4;
}
#rareVariation .variationWeak {
    background-color: #f3e9c5;
}

#rareVariation .variationNoEvidence {
    background-color: #ebe8de;
}

#combinedVariation .variationCausal {
    background-color: rgb(20, 110, 103);
}
#combinedVariation .variationStrong {
    background-color: rgb(39, 148, 139);
}
#combinedVariation .variationModerate {
    background-color: rgb(48, 175, 164);
}
#combinedVariation .variationPossible {
    background-color: rgb(69, 192, 182);
}
#combinedVariation .variationPotential {
    background-color: rgb(78, 209, 198);
}
#combinedVariation .variationWeak {
    background-color: rgb(120, 228, 219);
}

#combinedVariation .variationNoEvidence {
    background-color: rgb(168, 240, 234);
}

/* arrow distance */
.causalclass {
    position: absolute;
    left: 70px;
}
.strongclass {
    position: absolute;
    left: 160px;
}
.moderateclass {
    position: absolute;
    left: 280px;
}
.possibleclass {
    position: absolute;
    left: 360px;
}

.potentialclass {
    position: absolute;
    left: 480px;
}
.weakclass {
    position: absolute;
    left: 580px;
}
.noEvidenceclass {
    position: absolute;
    left: 680px;
}

/* rare arrow distance */
.rarecausalclass {
    position: absolute;
    left: 1020px;
}
.rarestrongclass {
    position: absolute;
    left: 1120;
}
.raremoderateclass {
    position: absolute;
    left: 1220px;
}
.rarepossibleclass {
    position: absolute;
    left: 1320px;
}

.rarepotentialclass {
    position: absolute;
    left: 1420px;
}
.rareweakclass {
    position: relative;
    left: 1020px;
}
.rarenoEvidenceclass {
    position: absolute;
    left: 1620px;
}
</style>