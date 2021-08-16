<template>
    <div id="huge">
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
                            :field="'gene'"
                            placeholder="Select a gene ..."
                            :options="$parent.matchingGenes"
                            :pillFormatter="(filter) => filter.threshold"
                            @input-change="$parent.lookupGenes($event)"
                        >
                            <div class="label">Gene</div>
                        </filter-enumeration-control>
                        <!-- select phenotype -->
                        <filter-enumeration-control
                            ref="phenotype"
                            :field="'phenotype'"
                            placeholder="Select a phenotype ..."
                            :pillFormatter="
                                (filter) =>
                                    !!$store.state.bioPortal.phenotypeMap[filter.threshold] ? $store.state.bioPortal.phenotypeMap[filter.threshold].description : filter.threshold "
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
                            <div class="card-body">
                                <span class="lead" style="font-size: 12px;">
                                    *BF=Bayes Factor
                                    <div
                                        class="row"
                                        id="suggestionBox"
                                        style="color: #3fb54a; font-size: 15px; font-weight : bold; border-radius: 10px; background-color: #e4f4e4; padding:5px 5px 5px 5px"
                                    >
                                        <div class="col-md-6">
                                            HuGe Score(Combined Evidence)
                                            <tooltip-documentation
                                                name="hugecal.combined.tooltip.hover"
                                                :content-fill="$parent.documentationMap"
                                                :isHover="true"
                                                :noIcon="false"
                                            ></tooltip-documentation>
                                        </div>
                                        <div class="col-md-6" style="text-align: right;">
                                            {{$parent.bayesFactorCommonVariation}}(Common variation BF) * {{$parent.bayesFactorRareVariation}}(Rare variation BF) = {{
                                            $parent.bayesFactorCombinedEvidence($parent.bayesFactorCommonVariation,$parent.bayesFactorRareVariation)
                                            }}
                                        </div>
                                    </div>*HuGe Score(combined evidence) = BF of common variation * BF of rare variation
                                </span>
                                <div style="margin-block-end: 60px"></div>
                                <div class="row">
                                    <div class="col-md-2"></div>
                                    <div class="col-md-6">
                                        <hugescore-table
                                            :commonBF="parseInt($parent.bayesFactorCommonVariation)"
                                            :rareBF="parseInt($parent.bayesFactorRareVariation)"
                                            :hugeScore="parseInt($parent.bayesFactorCombinedEvidence(
                                                                $parent.bayesFactorCommonVariation,
                                                                $parent.bayesFactorRareVariation))"
                                        ></hugescore-table>
                                    </div>
                                    <div class="col-md-4" style="padding:40px 0px 40px 0px">
                                        <a
                                            href="#"
                                            @click.prevent="$parent.resetPriorAllelicVariance()"
                                        >Reset Prior Allelic variance</a>
                                    </div>
                                </div>

                                <div style="padding:10px 250px 10px 250px">
                                    <br />
                                    <span style="padding:10px 290px 10px 310px; font-weight:bold">
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

                                <!-- <div class="arrow-side"></div> -->
                                <div
                                    style="cursor:pointer"
                                    v-on:click="$parent.togglePosteriorProbability()"
                                >
                                    <h6>Posterior probability</h6>
                                    <hr />
                                </div>
                                <div v-show="$parent.showPosteriorProbability" class="row">
                                    <div class="col-md-8">
                                        <hugecal-table
                                            style="padding:30px 250px 30px 250px"
                                            :hugeScore="parseInt($parent.bayesFactorCombinedEvidence(
                                                                $parent.bayesFactorCommonVariation,
                                                                $parent.bayesFactorRareVariation))"
                                        ></hugecal-table>
                                    </div>
                                    <div class="col-md-4">
                                        <posterior-probability-plot
                                            v-if="$parent.geneAssociations52k"
                                            :geneAssociationsData=" $parent.geneAssociations52k"
                                            :priorVariance="this.$store.state.prior"
                                            :bayes_factor="parseInt($parent.bayesFactorCombinedEvidence(
                                                        $parent.bayesFactorCommonVariation,
                                                        $parent.bayesFactorRareVariation))"
                                            :isDichotomous="this.$store.state.bioPortal.phenotypeMap[$parent.selectedPhenotype[0]].dichotomous"
                                            :suggestedPriorNew="$parent.suggestedPriorNewOne"
                                        ></posterior-probability-plot>
                                    </div>
                                </div>
                            </div>

                            <!-- NEW COMMON VARIATION -->

                            <div class="card-body" style="margin-block-end:20px cursor">
                                <span
                                    style="cursor:pointer"
                                    v-on:click="$parent.toggleCommonVariation()"
                                >
                                    <div
                                        v-if="this.$store.state.associations.data"
                                        class="row"
                                        id="suggestionBox"
                                        style="color: #254CA6; font-size: 15px; font-weight : bold; border-radius: 10px; background-color: #E7EDF7; padding:5px 5px 5px 5px"
                                    >
                                        <div class="col-md-6">
                                            Common Variation
                                            <tooltip-documentation
                                                name="hugecal.commonvariation.tooltip.hover"
                                                :content-fill="$parent.documentationMap"
                                                :isHover="true"
                                                :noIcon="false"
                                            ></tooltip-documentation>
                                        </div>
                                        <div
                                            class="col-md-6"
                                            style="text-align: right;"
                                        >BF:{{$parent.bayesFactorCommonVariation}}</div>
                                    </div>
                                </span>
                                <div v-show="$parent.showCommonVariationSection">
                                    <div
                                        v-if="$parent.isGenomeWideSignificant(this.$store.state.associations.data, $parent.selectedPhenotype[0])"
                                    >
                                        <span class="lead" style="font-size:12px ">
                                            *Common variation BF = 1 if a gene is not genome wide significant
                                            <br />*If a gene is genome-wide significant, common variation BF = BF of GWAS evidence * BF of coding evidence * BF of regulatory evidence
                                        </span>
                                        <br />
                                        <span
                                            style="font-weight:bold; padding: 650px"
                                        >Is genome-wide significant?</span>
                                        <div style="padding:5px 0px 5px 0px"></div>
                                        <div id="wrapper" style="padding:0px 650px 0px 650px">
                                            <div
                                                style="padding-left: 5px;float:left; border-radius:20px; background: #3a5dae;width:35px;height: 20px; color:white;"
                                                id="1"
                                            >Yes</div>
                                            <div style="float:right;color:gray" id="2">No</div>
                                        </div>
                                        <commonvariation-genomesig-table
                                            style="padding:0px 300px 0px 300px"
                                            v-if="$parent.eglData"
                                            :isGenomeWideSignificant="true"
                                            :gwasEvidence="'3(P-value <= 5e-8)'"
                                            :codingEvidence="$parent.commonVariationMap['codingEvidence']"
                                            :regulatoryEvidence="$parent.commonVariationMap['regulatoryEvidence']"
                                            :commonBF="parseInt($parent.bayesFactorCommonVariation)"
                                        ></commonvariation-genomesig-table>
                                    </div>
                                    <div v-else>
                                        <span
                                            style="font-weight:bold; padding:0px 150px 0px 650px"
                                        >Is genome-wide significant?</span>
                                        <div style="padding:5px 0px 5px 0px"></div>
                                        <div id="wrapper" style="padding:0px 650px 0px 650px">
                                            <div style="float:left;color:gray" id="1">Yes</div>
                                            <div
                                                style="padding-left: 5px;float:right; border-radius:20px; background: #3a5dae;width:35px;height: 20px; color:white;"
                                                id="2"
                                            >No</div>
                                        </div>
                                        <commonvariation-genomesig-table
                                            style="padding:0px 300px 0px 300px"
                                            v-if="$parent.eglData"
                                            :isGenomeWideSignificant="false"
                                            :gwasEvidence="'1(P-value > 5e-8)'"
                                            :codingEvidence="$parent.commonVariationMap['codingEvidence']"
                                            :regulatoryEvidence="$parent.commonVariationMap['regulatoryEvidence']"
                                            :commonBF="parseInt($parent.bayesFactorCommonVariation)"
                                        ></commonvariation-genomesig-table>
                                    </div>
                                    <div style="padding:10px 250px 10px 250px">
                                        <br />
                                        <span
                                            style="padding:10px 290px 10px 310px; font-weight:bold"
                                        >HuGe score {{$parent.bayesFactorCommonVariation}} falls in {{$parent.determineCategory($parent.bayesFactorCommonVariation)}} evidence scale</span>
                                        <color-bar-plot
                                            v-if="$parent.bayesFactorCommonVariation"
                                            :category=" $parent.determineCategory($parent.bayesFactorCommonVariation)"
                                            :elementid="'commonVariation'"
                                            :score="$parent.bayesFactorCommonVariation"
                                        ></color-bar-plot>
                                    </div>

                                    <div
                                        style="cursor:pointer"
                                        v-on:click="$parent.toggleLocuszoom()"
                                    >
                                        <span
                                            class="toggleIcon"
                                            id="toggleIcon"
                                        >{{$parent.toggleIcon}}</span>
                                        View {{$parent.selectedGene[0]}} on Locuszoom
                                    </div>
                                    <div v-show="$parent.showLZSection">
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
                                </div>

                                <br />
                                <!-- NEW RARE VARIATION -->
                                <div>
                                    <span
                                        style="cursor:pointer"
                                        v-on:click="$parent.toggleRareVariation()"
                                    >
                                        <div
                                            v-if="this.$store.state.associations.data"
                                            class="row"
                                            id="suggestionBox"
                                            style="color: #af5934; font-size: 15px; font-weight : bold; border-radius: 10px; background-color: #fef8dc; padding:5px 5px 5px 5px"
                                        >
                                            <div class="col-md-6">
                                                Rare Variation
                                                <tooltip-documentation
                                                    name="hugecal.rarevariation.tooltip.hover"
                                                    :content-fill="$parent.documentationMap"
                                                    :isHover="true"
                                                    :noIcon="false"
                                                ></tooltip-documentation>
                                            </div>
                                            <div
                                                class="col-md-6"
                                                style="text-align: right;"
                                            >BF:{{$parent.bayesFactorRareVariation}}</div>
                                        </div>
                                    </span>
                                    <div
                                        ref="rareVariationExomeSig"
                                        id="rareVariationExomeSig"
                                        v-show="$parent.showRareVariationSection"
                                        v-if="$parent.isExomeWideSignificant(this.$store.state.geneAssociations52k.data, $parent.selectedPhenotype[0])"
                                    >
                                        <span
                                            style="font-weight:bold; padding: 650px"
                                        >Is exome-wide significant?</span>
                                        <div style="padding:5px 0px 5px 0px"></div>
                                        <div id="wrapper" style="padding:0px 650px 0px 650px">
                                            <div
                                                style="padding-left: 5px;float:left; border-radius:20px; background: #af5934;width:35px;height: 20px; color:white;"
                                                id="1"
                                            >Yes</div>
                                            <div style="float:right;color:gray" id="2">No</div>
                                        </div>
                                        <rarevariation-exomesig-table
                                            style="padding:0px 300px 0px 300px"
                                            :isExomeWideSignificant="true"
                                            :exomeEvidence="$parent.rareVariationScoreEvidenceMap['exomeEvidence']"
                                            :rareBF="parseInt($parent.bayesFactorRareVariation)"
                                        ></rarevariation-exomesig-table>
                                        <div style="padding:10px 250px 10px 250px">
                                            <br />
                                            <span
                                                style="padding:10px 290px 10px 310px; font-weight:bold"
                                            >HuGe score {{$parent.bayesFactorRareVariation}} falls in {{$parent.determineCategory($parent.bayesFactorRareVariation)}} evidence scale</span>
                                            <color-bar-plot
                                                v-if="$parent.bayesFactorRareVariation"
                                                :category=" $parent.determineCategory($parent.bayesFactorRareVariation)"
                                                :elementid="'rareVariation'"
                                                :score="parseInt($parent.bayesFactorRareVariation)"
                                            ></color-bar-plot>
                                        </div>
                                        <div
                                            style="cursor:pointer"
                                            v-on:click="$parent.toggleRareVariationMaskTable()"
                                        >
                                            <span
                                                class="toggleIcon"
                                                id="toggleIcon"
                                            >{{$parent.toggleIcon}}</span>
                                            View Burden Association Summary statistics
                                        </div>
                                        <div
                                            v-show="$parent.showMaskTableSection"
                                            class="EGLT-table fiftytwo masktable"
                                        >
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
                                    <div
                                        ref="rareVariationExomeSig"
                                        id="rareVariationNonExomeSig"
                                        style="cursor:pointer"
                                        v-show="$parent.showRareVariationSection"
                                        v-else
                                    >
                                        <span
                                            style="font-weight:bold; padding: 650px"
                                        >Is exome-wide significant?</span>
                                        <div style="padding:5px 0px 5px 0px"></div>
                                        <div id="wrapper" style="padding:0px 650px 0px 650px">
                                            <div style="float:right;color:gray" id="1">Yes</div>
                                            <div
                                                style="padding-left: 5px;float:left; border-radius:20px; background: #af5934;width:35px;height: 20px; color:white;"
                                                id="2"
                                            >No</div>
                                        </div>
                                        <rarevariation-exomesig-table
                                            style="padding:0px 300px 0px 300px"
                                            :isExomeWideSignificant="false"
                                            :priorVariance="$store.state.prior"
                                            :rareBF="parseInt($parent.bayesFactorRareVariation)"
                                        ></rarevariation-exomesig-table>

                                        <div style="padding:0px 300px 0px 300px">
                                            <br />
                                            <span
                                                style="padding:0px 300px 0px 300px; font-weight:bold"
                                            >HuGe score {{$parent.bayesFactorRareVariation}} falls in {{$parent.determineCategory($parent.bayesFactorRareVariation)}} evidence scale</span>
                                            <color-bar-plot
                                                v-if="$parent.bayesFactorRareVariation"
                                                :category=" $parent.determineCategory($parent.bayesFactorRareVariation)"
                                                :elementid="'rareVariation'"
                                                :score="parseInt($parent.bayesFactorRareVariation)"
                                            ></color-bar-plot>
                                        </div>
                                        <div
                                            style="cursor:pointer"
                                            v-on:click="$parent.toggleRareVariationMaskTable()"
                                        >
                                            <span
                                                class="toggleIcon"
                                                id="toggleIcon"
                                            >{{$parent.toggleIcon}}</span>
                                            View Burden Association Summary statistics
                                        </div>
                                        <div
                                            v-show="$parent.showMaskTableSection"
                                            class="EGLT-table fiftytwo masktable"
                                        >
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
    border-bottom: 10px solid #de202c;
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
    background-color: #375fbd;
    font-weight: bold;
}
#commonVariation .variationStrong {
    background-color: #496fc9;
    font-weight: bold;
}
#commonVariation .variationModerate {
    background-color: #587dd6;
    font-weight: bold;
}
#commonVariation .variationPossible {
    background-color: #6488de;
    font-weight: bold;
}
#commonVariation .variationPotential {
    background-color: #7193e3;
    font-weight: bold;
}
#commonVariation .variationWeak {
    background-color: #85a4ed;
    font-weight: bold;
}

#commonVariation .variationEquivocal {
    background-color: #92aef0;
    font-weight: bold;
}

#commonVariation .variationNoEvidence {
    background-color: #a3bcf7;
    font-weight: bold;
}
#rareVariation .variationCausal {
    background-color: #f1c206;
    font-weight: bold;
}
#rareVariation .variationStrong {
    background-color: #f3d14a;
    font-weight: bold;
}
#rareVariation .variationModerate {
    background-color: #f5db74;
    font-weight: bold;
}
#rareVariation .variationPossible {
    background-color: #f6e5a0;
    font-weight: bold;
}
#rareVariation .variationPotential {
    background-color: #f3e3a4;
    font-weight: bold;
}
#rareVariation .variationWeak {
    background-color: #f3e9c5;
    font-weight: bold;
}
#rareVariation .variationEquivocal {
    background-color: #eee8d4;
    font-weight: bold;
}
#rareVariation .variationNoEvidence {
    background-color: #ebe8de;
    font-weight: bold;
}

#combinedVariation .variationCausal {
    background-color: #3fb54a;
    font-weight: bold;
}
#combinedVariation .variationStrong {
    background-color: #4ebf59;
    font-weight: bold;
}
#combinedVariation .variationModerate {
    background-color: #5ecc69;
    font-weight: bold;
}
#combinedVariation .variationPossible {
    background-color: #71d97b;
    font-weight: bold;
}
#combinedVariation .variationPotential {
    background-color: #7ee087;
    font-weight: bold;
}
#combinedVariation .variationWeak {
    background-color: #91eb9a;
    font-weight: bold;
}
#combinedVariation .variationEquivocal {
    background-color: #a1f0a9;
    font-weight: bold;
}

#combinedVariation .variationNoEvidence {
    background-color: #b8f5be;
    font-weight: bold;
}

.divider {
    border: 0;
    height: 3px;
    background: #095484;
    background-image: linear-gradient(to right, #ccc, #095484, #ccc);
}

.hr {
    width: 70%;
    margin-left: auto;
    margin-right: auto;
    height: 3px;
    border: 6 6 6 6;
    background: #042e47;
    padding: 10px;
}
#toggle {
    display: block;
}
</style>
