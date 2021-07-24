<template>
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation name="hugecal.header.info"></documentation>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">HuGE Calculator</h1>

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
                            :options="$store.state.geneAssociations52k.data.map((association) => association.phenotype)"
                            :multiple="false"
                            :labelFormatter="(phenotype) =>
                                        !!$store.state.bioPortal.phenotypeMap[phenotype]
                                            ? $store.state.bioPortal.phenotypeMap[phenotype].description
                                            : phenotype"
                        >
                            <div class="label">Phenotype</div>
                        </filter-enumeration-control>
                    </criterion-list-group>

                    <div
                        v-if="this.$store.state.associations.data.length >0 && $parent.selectedPhenotype.length != 0"
                    >
                        <div>
                            <div class="card mdkp-card">
                                <div class="card-body">
                                    <span class="lead" style="font-size: 12px;">
                                        *BF=Bayes Factor
                                        <div
                                            class="row"
                                            id="suggestionBox"
                                            style="color: #8fb512; font-size: 15px; font-weight : bold; border-radius: 10px; background-color: #dae8ac; padding:5px 5px 5px 5px"
                                        >
                                            <div class="col-md-8">
                                                HuGe Score(Combined Evidence)
                                                <tooltip-documentation
                                                    name="hugecal.combined.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </div>
                                            <div class="col-md-4">
                                                {{$parent.bayesFactorCommonVariation}}(Common variation BF) * {{$parent.bayesFactorRareVariation}}(Rare variation BF) = {{
                                                $parent.bayesFactorCombinedEvidence($parent.bayesFactorCommonVariation,$parent.bayesFactorRareVariation)
                                                }}
                                            </div>
                                        </div>*HuGe Score(combined evidence) = BF of common variation * BF of rare variation
                                    </span>
                                    <div style="margin-block-end: 60px"></div>

                                    <div style="padding:10px 250px 10px 250px">
                                        <br />
                                        <span
                                            style="padding:10px 310px 10px 310px; font-weight:bold"
                                        >
                                            HuGe score {{$parent.bayesFactorCombinedEvidence($parent.bayesFactorCommonVariation,$parent.bayesFactorRareVariation)}} falls in {{$parent.determineCategory($parent.bayesFactorCombinedEvidence(
                                            $parent.bayesFactorCommonVariation,
                                            $parent.bayesFactorRareVariation))}} evidence scale
                                        </span>
                                        <color-bar-plot
                                            v-if="$parent.bayesFactorRareVariation"
                                            :category=" $parent.determineCategory($parent.bayesFactorCombinedEvidence(
                                                                $parent.bayesFactorCommonVariation,
                                                                $parent.bayesFactorRareVariation))"
                                            :elementid="'combinedVariation'"
                                            :score=" $parent.bayesFactorCombinedEvidence(
                                                                $parent.bayesFactorCommonVariation,
                                                                $parent.bayesFactorRareVariation)"
                                        ></color-bar-plot>
                                    </div>
                                    <div style="margin-block-end: 50px"></div>
                                    <div class="divider">Posterior probability
                                        <!-- <div class="arrow-side"></div> -->
                                    </div>
                                    <div class="row">
                                        <div class="col-md-8">
                                            <hugecal-table></hugecal-table>
                                        </div>
                                        <div class="col-md-4">
                                            <posterior-probability-plot
                                                v-if="$parent.geneAssociations52k"
                                                :geneAssociationsData=" $parent.geneAssociations52k"
                                                :priorVariance="this.$store.state.prior"
                                                :bayes_factor="$parent.bayesFactorCombinedEvidence(
                                                        $parent.bayesFactorCommonVariation,
                                                        $parent.bayesFactorRareVariation)"
                                                :isDichotomous="this.$store.state.bioPortal.phenotypeMap[$parent.selectedPhenotype[0]].dichotomous"
                                            ></posterior-probability-plot>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- <div class="card mdkp-card">
                                <div class="card-body" style="margin-block-end: 20px">
                                    <div class="row">
                                        <div
                                            class="col-md-6"
                                            v-if="$parent.bayesFactorCombinedEvidence(
                                                    $parent.bayesFactorCommonVariation,
                                                    $parent.bayesFactorRareVariation) "
                                        >
                                            <h4>
                                                Combined Evidence
                                                <tooltip-documentation
                                                    name="hugecal.combined.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>
                                            <ul>
                                                <li>
                                                    Combined HuGE Score = Bayes Factor of Common Variation * Bayes Factor of Rare Variation
                                                    <ul>
                                                        <li>
                                                            <span>
                                                                {{$parent.bayesFactorCommonVariation}} * {{$parent.bayesFactorRareVariation}} = {{
                                                                $parent.bayesFactorCombinedEvidence(
                                                                $parent.bayesFactorCommonVariation,
                                                                $parent.bayesFactorRareVariation
                                                                )
                                                                }}
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    <span>
                                                        {{
                                                        $parent.determineCategory(
                                                        $parent.bayesFactorCombinedEvidence(
                                                        $parent.bayesFactorCommonVariation,
                                                        $parent.bayesFactorRareVariation
                                                        )
                                                        )
                                                        }}
                                                        Evidence
                                                    </span>
                                                </li>
                                            </ul>
                                            <div>
                                                <br />
                                                <color-bar-plot
                                                    v-if="$parent.bayesFactorRareVariation"
                                                    :category=" $parent.determineCategory($parent.bayesFactorCombinedEvidence(
                                                                $parent.bayesFactorCommonVariation,
                                                                $parent.bayesFactorRareVariation))"
                                                    :elementid="'combinedVariation'"
                                                    :score=" $parent.bayesFactorCombinedEvidence(
                                                                $parent.bayesFactorCommonVariation,
                                                                $parent.bayesFactorRareVariation)"
                                                ></color-bar-plot>
                                            </div>
                                        </div>
                                        <div class="col-md-6" style="border-left: 1px dashed #444">
                                            <posterior-probability-plot
                                                v-if="$parent.geneAssociations52k"
                                                :geneAssociationsData=" $parent.geneAssociations52k"
                                                :priorVariance="this.$store.state.prior"
                                                :bayes_factor="$parent.bayesFactorCombinedEvidence(
                                                        $parent.bayesFactorCommonVariation,
                                                        $parent.bayesFactorRareVariation)"
                                                :isDichotomous="this.$store.state.bioPortal.phenotypeMap[$parent.selectedPhenotype[0]].dichotomous"
                                            ></posterior-probability-plot>
                                        </div>
                                    </div>
                                </div>
                            </div>-->

                            <!-- COMMON VARIATION -->
                            <div class="card mdkp-card">
                                <div class="card-body" style="margin-block-end: 20px">
                                    <div class="row" v-if="this.$store.state.associations.data">
                                        <div
                                            class="col-md-6"
                                            v-if="$parent.isGenomeWideSignificant(this.$store.state.associations.data, $parent.selectedPhenotype[0])"
                                        >
                                            <h4>
                                                Common Variation
                                                <tooltip-documentation
                                                    name="hugecal.commonvariation.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>
                                            <ul v-if="$parent.eglData">
                                                <li>
                                                    <span>
                                                        Genome-wide significant
                                                        - pvalue less than 5e-8
                                                    </span>
                                                    <ul>
                                                        <li>Bayes Factor = 3</li>
                                                    </ul>
                                                </li>
                                                <li v-if="$parent.eglData.genetic == '1C'">
                                                    Coding evidence: Confirmed causal coding variant
                                                    <span
                                                        class="codingEvidence1C"
                                                    >{{$parent.eglData.genetic}}</span>
                                                    <ul>
                                                        <li>Bayes Factor = 116</li>
                                                    </ul>
                                                </li>
                                                <li v-else-if="$parent.eglData.genetic == '2C' ">
                                                    Coding evidence: Likely causal coding variant
                                                    <span
                                                        class="codingEvidence2C"
                                                    >{{$parent.eglData.genetic}}</span>
                                                    <ul>
                                                        <li>Bayes Factor = 5</li>
                                                    </ul>
                                                </li>
                                                <li v-if="$parent.eglData.genomic == '2R' ">
                                                    Regulatory evidence: >1 line of regulatory evidence
                                                    <span
                                                        class="regulatoryEvidence2R"
                                                    >{{ $parent.eglData.genomic }}</span>
                                                    <ul>
                                                        <li>Bayes Factor = 5</li>
                                                    </ul>
                                                </li>
                                                <li v-if=" $parent.eglData.genomic == '3R'">
                                                    Regulatory evidence: 1 line of regulatory evidence
                                                    <span
                                                        class="regulatoryEvidence3R"
                                                    >{{ $parent.eglData.genomic}}</span>
                                                    <ul>
                                                        <li>Bayes Factor = 2.2</li>
                                                    </ul>
                                                </li>
                                                <li v-if=" $parent.eglData.category == 'in GWAS' ">
                                                    <span>Genome-wide significant but no coding or regulatory evidence</span>
                                                </li>
                                                <li v-else>
                                                    <span>Genome-wide significant but no coding or regulatory evidence</span>
                                                </li>
                                                <!-- //please check this clause -->
                                                <!-- <li v-if="$parent.eglData.category =='No Evidence'">
                                                    <span>
                                                        Genome-wide significant but no coding or regulatory evidence
                                                        associated with Type 2 diabetes
                                                    </span>
                                                </li>-->
                                                <li>
                                                    Total Bayes Factor(Multiply all):
                                                    <span>{{$parent.bayesFactorCommonVariation}}</span>
                                                </li>

                                                <li>{{$parent.determineCategory($parent.bayesFactorCommonVariation)}} evidence</li>
                                            </ul>
                                            <!-- Common variation color bar plot -->
                                            <div style v-if="$parent.eglData">
                                                <br />
                                                <color-bar-plot
                                                    v-if="$parent.bayesFactorCommonVariation"
                                                    :category="$parent.determineCategory($parent.bayesFactorCommonVariation)"
                                                    :elementid="'commonVariation'"
                                                    :score="$parent.bayesFactorCommonVariation"
                                                ></color-bar-plot>
                                            </div>
                                            <hr style="margin: 40px" />
                                            <!-- LZ plot if GWAS significant (Common variation) -->

                                            <h5>{{$parent.selectedGene[0]}} is GWAS Significant for {{$store.state.bioPortal.phenotypeMap[$parent.selectedPhenotype[0]].description}}</h5>
                                            <div class="col-md-8 gene-page-header-body regionInfo">
                                                {{ $parent.regionString }}
                                                <button
                                                    class="btn btn-primary text-nowrap text-right explore-region-btn"
                                                    style="margin-left: 20px"
                                                    @click="$parent.exploreExpanded()"
                                                    @click.prevent
                                                >Expand &plusmn; 50 kb</button>
                                            </div>
                                            <locuszoom
                                                v-if="$parent.region"
                                                ref="locuszoom"
                                                :chr="$parent.region.chromosome"
                                                :start="$parent.region.start -50000"
                                                :end="$parent.region.end +50000"
                                                :refSeq="true"
                                                :ldpop="true"
                                            >
                                                <lz-associations-panel
                                                    :phenotype="$parent.selectedPhenotype[0]"
                                                    @input="$parent.updateAssociationsTable"
                                                ></lz-associations-panel>
                                            </locuszoom>
                                        </div>

                                        <!-- If NOT GWAS significant -->
                                        <div v-else class="col-md-6">
                                            <h4>
                                                Common Variation
                                                <tooltip-documentation
                                                    name="hugecal.commonvariation.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>
                                            <ul>
                                                <li>{{$parent.selectedGene[0]}} is not GWAS Significant for {{$parent.selectedPhenotype[0]}}- p-value greater than 5e-8</li>
                                                <ul>
                                                    <li>
                                                        Bayes Factor =
                                                        <span>{{$parent.bayesFactorCommonVariation}}</span>
                                                    </li>
                                                </ul>
                                                <li>{{$parent.selectedGene[0]}} does not have any Genetic or Regulatory evidence for {{$parent.selectedPhenotype[0]}}</li>
                                                <li>Total Bayes Factor = {{$parent.bayesFactorCommonVariation}}</li>

                                                <li>{{$parent.determineCategory($parent.bayesFactorCommonVariation)}} evidence</li>
                                            </ul>

                                            <div>
                                                <br />
                                                <color-bar-plot
                                                    v-if="$parent.bayesFactorCommonVariation"
                                                    :category="$parent.determineCategory($parent.bayesFactorCommonVariation)"
                                                    :elementid="'commonVariation'"
                                                    :score="$parent.bayesFactorCommonVariation"
                                                ></color-bar-plot>
                                            </div>
                                            <hr style="margin: 40px" />
                                            <div>
                                                <h5>
                                                    {{ $parent.selectedGene[0]}}
                                                    is not GWAS significant for {{$store.state.bioPortal.phenotypeMap[$parent.selectedPhenotype[0]].description}}
                                                </h5>

                                                <div
                                                    class="col-md-8 gene-page-header-body regionInfo"
                                                >
                                                    {{ $parent.regionString }}
                                                    <button
                                                        class="btn btn-primary text-nowrap text-right explore-region-btn"
                                                        style="margin-left: 20px"
                                                        @click="$parent.exploreExpanded()"
                                                    >Expand &plusmn; 50 kb</button>
                                                </div>
                                                <locuszoom
                                                    v-if="$parent.region"
                                                    ref="locuszoom"
                                                    :chr="$parent.region.chromosome"
                                                    :start="$parent.region.start - 50000"
                                                    :end="$parent.region.end + 50000"
                                                    :ldpop="true"
                                                    :refSeq="true"
                                                >
                                                    <lz-associations-panel
                                                        :phenotype="$parent.selectedPhenotype[0]"
                                                        @input="$parent.updateAssociationsTable"
                                                    ></lz-associations-panel>
                                                </locuszoom>
                                            </div>
                                        </div>

                                        <!-- Rare Variation - If EXOME WIDE SIGNIFICANT-->
                                        <div
                                            v-if="$parent.isExomeWideSignificant(this.$store.state.geneAssociations52k.data, $parent.selectedPhenotype[0])"
                                            class="col-md-6"
                                            style="border-left: 1px dashed #444 "
                                        >
                                            <h4>
                                                Rare Variation
                                                <tooltip-documentation
                                                    name="hugecal.rarevariation.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>
                                            <ul style="margin-block-end: 40px ">
                                                <li>
                                                    <span>Exome-Wide significant - p-value less than 2.5e-6</span>
                                                    <ul>
                                                        <li>
                                                            Bayes Factor =
                                                            <span>{{$parent.bayesFactorRareVariation}}</span>
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>Total Bayes Factor(Multiply all) = {{$parent.bayesFactorRareVariation}}</li>
                                                <li>
                                                    <span>Extreme evidence</span>
                                                </li>
                                            </ul>

                                            <div style="margin-block-end: 60px">
                                                <br />
                                                <color-bar-plot
                                                    v-if="$parent.bayesFactorRareVariation"
                                                    :category="$parent.determineCategory($parent.bayesFactorRareVariation)"
                                                    :elementid="'rareVariation'"
                                                    :score="$parent.bayesFactorRareVariation"
                                                ></color-bar-plot>
                                            </div>
                                            <div class="EGLT-table fiftytwo masktable">
                                                <mask-table
                                                    v-if="$parent.masks.length"
                                                    :maskData="$parent.masks"
                                                    :index="`${$parent.selectedGene}_0`"
                                                    :dichotomous="true"
                                                ></mask-table>
                                            </div>
                                            <div v-if="$parent.masks.length == 0">
                                                <ul>
                                                    <li>No mask data available</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <!-- Rare Variation - If not Exome wide significant -->
                                        <div
                                            v-else
                                            class="col-md-6"
                                            style="border-left: 1px dashed #444 "
                                        >
                                            <h4>
                                                Rare Variation
                                                <tooltip-documentation
                                                    name="hugecal.rarevariation.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </h4>
                                            <ul>
                                                <li>
                                                    <span>
                                                        Not Exome-Wide
                                                        significant - p-value
                                                        greater than 2.5e-6
                                                    </span>
                                                </li>

                                                <li>
                                                    Prior Variance
                                                    <tooltip-documentation
                                                        name="hugecal.rarevariation.changePrior"
                                                        :content-fill="$parent.documentationMap"
                                                        :isHover="true"
                                                        :noIcon="false"
                                                    ></tooltip-documentation>
                                                    <input
                                                        v-model.number="$store.state.prior"
                                                        type="number"
                                                        placeholder="Prior Variance"
                                                        id="prior_variance_input"
                                                    />
                                                    <ul>
                                                        <li>
                                                            Total Bayes Factor =
                                                            <span>
                                                                {{
                                                                $parent.bayesFactorRareVariation
                                                                }}
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    <span>{{$parent.determineCategory($parent.bayesFactorRareVariation)}} evidence</span>
                                                </li>
                                            </ul>
                                            <div style="margin-block-end: 40px">
                                                <br />
                                                <color-bar-plot
                                                    v-if="$parent.bayesFactorRareVariation"
                                                    :category="$parent.determineCategory($parent.bayesFactorRareVariation)"
                                                    :elementid="'rareVariation'"
                                                    :score="$parent.bayesFactorRareVariation"
                                                ></color-bar-plot>
                                            </div>
                                            <div class="EGLT-table fiftytwo masktable">
                                                <mask-table
                                                    v-if="$parent.masks.length"
                                                    :maskData="$parent.masks"
                                                    :index="`${$parent.selectedGene}_1`"
                                                    :dichotomous="true"
                                                ></mask-table>
                                            </div>
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
.color-bar-plot-wrapper {
    width: calc(100% - 32px);
    margin-left: 16px;
}

.color-bars-wrapper {
    background-color: #eee;
    font-weight: 500;
    font-size: 13px;
}

.color-bar-plot-wrapper .each-bar-section {
    width: calc(100% / 7);
    text-align: center;
}

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
    /*height: 40px;*/
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid rgb(195, 21, 21);
    animation: moveright 1s alternate 1s;
    margin-left: auto;
    margin-right: auto;
}
.arrow-side {
    width: 0;
    /*height: 40px;*/
    border-left: 10px solid transparent;
    border-bottom: 0px solid transparent;
    border-top: 10px solid black;
    animation: moveright 1s alternate 1s;
    margin-left: auto;
    margin-right: auto;
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

#commonVariation .variationEquivocal {
    background-color: #edd7f6;
}

#commonVariation .variationNoEvidence {
    background-color: #efe6f1;
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
#rareVariation .variationEquivocal {
    background-color: #eee8d4;
}
#rareVariation .variationNoEvidence {
    background-color: #ebe8de;
}

#combinedVariation .variationCausal {
    background-color: rgba(48, 175, 164, 1);
}
#combinedVariation .variationStrong {
    background-color: rgba(48, 175, 164, 0.85);
}
#combinedVariation .variationModerate {
    background-color: rgba(48, 175, 164, 0.7);
}
#combinedVariation .variationPossible {
    background-color: rgba(48, 175, 164, 0.55);
}
#combinedVariation .variationPotential {
    background-color: rgba(48, 175, 164, 0.4);
}
#combinedVariation .variationWeak {
    background-color: rgba(48, 175, 164, 0.25);
}
#combinedVariation .variationEquivocal {
    background-color: rgba(48, 175, 164, 0.15);
}

#combinedVariation .variationNoEvidence {
    background-color: rgba(48, 175, 164, 0.1);
}

.divider {
    border-bottom: 1px solid black;
    margin-block-end: 30px;
    font-weight: bold;
}
</style>
