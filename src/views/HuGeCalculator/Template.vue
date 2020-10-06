<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-6 gene-page-header-title">
                        Gene
                        <a
                            class="edit-btn"
                            @click="
                                $parent.showHideElement(
                                    'variantSearchHolder',
                                    'gene_search_input'
                                )
                            "
                        >Search gene</a>
                    </div>
                    <div class="col-md-6 gene-page-header-title">
                        Phenotype
                        <a
                            class="edit-btn"
                            @click="
                                $parent.showHideElement(
                                    'phenotypeSearchHolder',
                                    'phenotype_search_input'
                                )
                            "
                        >Select Phenotype</a>
                    </div>

                    <div class="col-md-6 gene-page-header-body">
                        <div id="variantSearchHolder" class="gene-page-header-search-holder hidden">
                            <gene-selectpicker
                                @onGeneChange="$store.dispatch('queryGeneName', $event)"
                            ></gene-selectpicker>
                        </div>
                        <div v-if="$parent.symbolName">
                            <span>
                                {{ $parent.symbolName }}
                                <span
                                    v-if="$parent.symbolName.toLowerCase() !==$store.state.geneName.toLowerCase()"
                                >({{ $store.state.geneName }})</span>
                            </span>
                        </div>
                    </div>

                    <div class="col-md-6 gene-page-header-body">
                        <div
                            id="phenotypeSearchHolder"
                            class="gene-page-header-search-holder hidden"
                        >
                            <!-- change the input of phenotypes to bioportal.phenotypes when we have data for all the phenotypes -->
                            <phenotype-selectpicker
                                v-if="$store.state.phenotype"
                                :phenotypes="$store.state.phenotypes"
                                :default-phenotype="
                                    $store.state.phenotype.description
                                "
                            ></phenotype-selectpicker>
                        </div>
                        <span v-if="$store.state.phenotype">
                            {{
                            $store.state.phenotype.description
                            }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Page header -->
            <!-- <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        <documentation
                            name="hugecal.title.header"
                            :content-fill="$parent.documentationMap"
                        ></documentation>
                    </h4>
                </div>
            </div>-->

            <!-- Card for combined Evidence -->
            <div class="card mdkp-card">
                <div class="card-body" style="margin-block-end: 20px; ">
                    <div class="row">
                        <div class="col-md-7">
                            <h4>
                                Combined Evidence
                                <tooltip-documentation
                                    name="gene.function.tooltip.hover"
                                    :content-fill="$parent.documentationMap"
                                    :isHover="true"
                                    :noIcon="false"
                                ></tooltip-documentation>
                            </h4>

                            <h5>{{$store.state.geneName}} has {{$parent.finalCategory}} Evidence of a disease-susceptibility.</h5>

                            <!-- traffic light -->
                            <div style="width:600px;">
                                <br />
                                <div
                                    v-if="$parent.rareVariationCategoryAndScore.categoryScore + $parent.commonVariationCategoryAndScore.categoryScore >=5"
                                    class="arrow-up causalclass"
                                ></div>
                                <div
                                    v-if="$parent.rareVariationCategoryAndScore.categoryScore + $parent.commonVariationCategoryAndScore.categoryScore ==4"
                                    class="arrow-up strongclass"
                                ></div>
                                <div
                                    v-if="$parent.rareVariationCategoryAndScore.categoryScore + $parent.commonVariationCategoryAndScore.categoryScore == 3"
                                    class="arrow-up moderateclass"
                                ></div>
                                <div
                                    v-if="$parent.rareVariationCategoryAndScore.categoryScore + $parent.commonVariationCategoryAndScore.categoryScore == 2"
                                    class="arrow-up possibleclass"
                                ></div>
                                <div
                                    v-if="$parent.rareVariationCategoryAndScore.categoryScore + $parent.commonVariationCategoryAndScore.categoryScore == 1"
                                    class="arrow-up weakclass"
                                ></div>
                                <div
                                    v-if="$parent.rareVariationCategoryAndScore.categoryScore + $parent.commonVariationCategoryAndScore.categoryScore<1"
                                    class="arrow-up noEvidenceclass"
                                ></div>
                                <div
                                    v-if="$parent.rareVariationCategoryAndScore.categoryScore + $parent.commonVariationCategoryAndScore.categoryScore==0"
                                    class="arrow-up noEvidenceclass"
                                ></div>
                                <div>
                                    <div class="container">
                                        <div class="row">
                                            <div class="col-sm combinedVariationCausal">
                                                <strong>Causal</strong>
                                            </div>
                                            <div class="col-sm combinedVariationStrong">
                                                <strong>Strong</strong>
                                            </div>
                                            <div class="col-sm combinedVariationModerate">
                                                <strong>Moderate</strong>
                                            </div>
                                            <div class="col-sm combinedVariationPossible">
                                                <strong>Possible</strong>
                                            </div>
                                            <div class="col-sm combinedVariationWeak">
                                                <strong>Weak</strong>
                                            </div>

                                            <div class="col- combinedVariationNoEvidence">
                                                <strong>No Evidence</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-5">
                            <documentation
                                name="hugecal.combinedscore.help"
                                :content-fill="$parent.documentationMap"
                            ></documentation>
                        </div>
                    </div>
                </div>
            </div>
            <!-- End of combined evidence -->

            <!-- card for Common and Rare Variation -->
            <div class="card mdkp-card">
                <div class="card-body" style="margin-block-end: 20px;">
                    <div class="row">
                        <div class="col-md-7">
                            <!-- Common Variation -->
                            <h4>
                                Common Variation
                                <tooltip-documentation
                                    name="gene.function.tooltip.hover"
                                    :content-fill="$parent.documentationMap"
                                    :isHover="true"
                                    :noIcon="false"
                                ></tooltip-documentation>
                            </h4>

                            <h5>
                                <documentation
                                    name="hugecal.commonVaration.header.evidence"
                                    :content-fill="$parent.documentationMap"
                                ></documentation>
                            </h5>
                            <ul>
                                <!-- genetic -->
                                <li v-if="$store.state.effectorGeneData.genetic">
                                    Genetic Evidence:
                                    <span
                                        v-if="$store.state.effectorGeneData.genetic == '1C'"
                                        class="codingEvidence1C"
                                    >{{$store.state.effectorGeneData.genetic}}</span>
                                    <span
                                        v-else-if="$store.state.effectorGeneData.genetic == '2C'"
                                        class="codingEvidence2C"
                                    >{{$store.state.effectorGeneData.genetic}}</span>
                                </li>

                                <!-- genomic -->
                                <li v-if="$store.state.effectorGeneData.genomic">
                                    Regulatory Evidence:
                                    <span
                                        v-if="$store.state.effectorGeneData.genomic == '2R'"
                                        class="regulatoryEvidence2R"
                                    >{{$store.state.effectorGeneData.genomic}}</span>
                                    <span
                                        v-if="$store.state.effectorGeneData.genomic == '3R'"
                                        class="regulatoryEvidence3R"
                                    >{{$store.state.effectorGeneData.genomic}}</span>
                                </li>

                                <!-- perturbational -->
                                <li v-if="$store.state.effectorGeneData.perturbational">
                                    Perturbational Evidence:
                                    <span
                                        v-if="$store.state.effectorGeneData.perturbational == '1P'"
                                        class="perturbationalEvidence1P"
                                    >{{$store.state.effectorGeneData.perturbational}}</span>
                                    <span
                                        v-if="$store.state.effectorGeneData.perturbational == '2P'"
                                        class="perturbationalEvidence2P"
                                    >{{$store.state.effectorGeneData.perturbational}}</span>
                                    <span
                                        v-if="$store.state.effectorGeneData.perturbational == '3P'"
                                        class="perturbationalEvidence3P"
                                    >{{$store.state.effectorGeneData.perturbational}}</span>
                                </li>
                            </ul>

                            <div style="width:600px" v-if="$store.state.effectorGeneData">
                                <br />
                                <div
                                    v-if="$store.state.effectorGeneData.category == 'CAUSAL'"
                                    class="arrow-up causalclass"
                                ></div>
                                <div
                                    v-if="$store.state.effectorGeneData.category == 'STRONG'"
                                    class="arrow-up strongclass"
                                ></div>
                                <div
                                    v-if="$store.state.effectorGeneData.category == 'MODERATE'"
                                    class="arrow-up moderateclass"
                                ></div>
                                <div
                                    v-if="$store.state.effectorGeneData.category == 'POSSIBLE'"
                                    class="arrow-up possibleclass"
                                ></div>
                                <div
                                    v-if="$store.state.effectorGeneData.category == 'WEAK'"
                                    class="arrow-up weakclass"
                                ></div>
                                <div
                                    v-if="$store.state.effectorGeneData.category == 'No'"
                                    class="arrow-up noEvidenceclass"
                                ></div>
                                <!-- traffic light for common varation when gene is and is not genome wide significant -->
                                <div>
                                    <div class="container">
                                        <div class="row">
                                            <div class="col-sm commonVariationCausal">
                                                <strong>Causal</strong>
                                            </div>
                                            <div class="col-sm commonVariationStrong">
                                                <strong>Strong</strong>
                                            </div>
                                            <div class="col-sm commonVariationModerate">
                                                <strong>Moderate</strong>
                                            </div>
                                            <div class="col-sm commonVariationPossible">
                                                <strong>Possible</strong>
                                            </div>
                                            <div class="col-sm commonVariationWeak">
                                                <strong>Weak</strong>
                                            </div>

                                            <div class="col- commonVariationNoEvidence">
                                                <strong>No Evidence</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <hr style="margin:40px" />
                            <!-- End of common variation evidence -->

                            <!-- gwas associations -->
                            <div v-if="$store.state.associations.data">
                                <div v-if="$parent.isSignificantAssociationCommonVariation">
                                    <h5>
                                        <documentation
                                            name="hugecal.commonVaration.header.gwasSignificant"
                                            :content-fill="$parent.documentationMap"
                                        ></documentation>
                                    </h5>

                                    <h6>
                                        <documentation
                                            name="hugecal.commonVaration.subheader.gwasSignificant"
                                            :content-fill="$parent.documentationMap"
                                        ></documentation>
                                    </h6>
                                    <locuszoom
                                        v-if="$parent.region"
                                        ref="locuszoom"
                                        :chr="$parent.region.chromosome"
                                        :start="$parent.region.start - 50000"
                                        :end="$parent.region.end + 50000"
                                        :refSeq="true"
                                    >
                                        <lz-associations-panel
                                            :phenotype="$store.state.phenotype.name"
                                            :finishHandler="$parent.updateAssociationsTable"
                                        ></lz-associations-panel>
                                    </locuszoom>
                                </div>
                                <div
                                    v-else-if="$parent.isSignificantAssociationCommonVariation == false"
                                >
                                    <h5>
                                        <documentation
                                            name="hugecal.commonVaration.header.notgwasSignificant"
                                            :content-fill="$parent.documentationMap"
                                        ></documentation>
                                    </h5>

                                    <h6>
                                        <documentation
                                            name="hugecal.commonVaration.subheader.notgwasSignificant"
                                            :content-fill="$parent.documentationMap"
                                        ></documentation>
                                    </h6>
                                    <locuszoom
                                        v-if="$parent.region"
                                        ref="locuszoom"
                                        :chr="$parent.region.chromosome"
                                        :start="$parent.region.start - 50000"
                                        :end="$parent.region.end + 50000"
                                        :refSeq="true"
                                    >
                                        <lz-associations-panel
                                            :phenotype="$store.state.phenotype.name"
                                            :finishHandler="$parent.updateAssociationsTable"
                                        ></lz-associations-panel>
                                    </locuszoom>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-5" style="border-left: 1px dashed #444">
                            <!-- </p> -->

                            <!-- Start Rare Variation -->
                            <h4>
                                Rare Variation
                                <tooltip-documentation
                                    name="gene.function.tooltip.hover"
                                    :content-fill="$parent.documentationMap"
                                    :isHover="true"
                                    :noIcon="false"
                                ></tooltip-documentation>
                            </h4>
                            <div v-if="$parent.isSignificant52kAssociationRareVariation">
                                <h5>
                                    <documentation
                                        name="hugecal.rareVaration.header"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                </h5>
                                <ul>
                                    <li>
                                        Genetic Evidence
                                        <span
                                            class="codingEvidence1C"
                                        >{{$store.state.effectorGeneData.genetic}}</span>
                                    </li>
                                    <li>
                                        <span>
                                            <strong>{{$parent.stage2Category.evidence}}</strong>
                                        </span>
                                    </li>
                                </ul>
                                <!-- Traffic Light for rare variation when gene is exome significant -->
                                <div style="width:600px" v-if="$parent.stage2Category">
                                    <br />
                                    <div
                                        v-if="$parent.stage2Category.category == 'CAUSAL'"
                                        class="arrow-up causalclass"
                                    ></div>
                                    <div
                                        v-if="$parent.stage2Category.category == 'STRONG'"
                                        class="arrow-up strongclass"
                                    ></div>
                                    <div
                                        v-if="$parent.stage2Category.category == 'MODERATE'"
                                        class="arrow-up moderateclass"
                                    ></div>
                                    <div
                                        v-if="$parent.stage2Category.category == 'POSSIBLE'"
                                        class="arrow-up possibleclass"
                                    ></div>
                                    <div
                                        v-if="$parent.stage2Category.category == 'WEAK'"
                                        class="arrow-up weakclass"
                                    ></div>
                                    <div
                                        v-if="$parent.stage2Category.category == 'No'"
                                        class="arrow-up noEvidenceclass"
                                    ></div>
                                    <div>
                                        <div class="container">
                                            <div class="row">
                                                <div class="col-sm rareVariationCausal">
                                                    <strong>Causal</strong>
                                                </div>
                                                <div class="col-sm rareVariationStrong">
                                                    <strong>Strong</strong>
                                                </div>
                                                <div class="col-sm rareVariationModerate">
                                                    <strong>Moderate</strong>
                                                </div>
                                                <div class="col-sm rareVariationPossible">
                                                    <strong>Possible</strong>
                                                </div>
                                                <div class="col-sm rareVariationWeak">
                                                    <strong>Weak</strong>
                                                </div>

                                                <div class="col- rareVariationNoEvidence">
                                                    <strong>No Evidence</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr style="margin:40px" />
                                <h5>
                                    <documentation
                                        name="hugecal.rareVaration.header.isExomeSignificant"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                </h5>
                                <h6>
                                    <documentation
                                        name="hugecal.rareVariation.isExomeSignificant"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                </h6>
                            </div>

                            <!-- Rare variation when NOT Exome wide significant -->
                            <div
                                v-else-if="$parent.isSignificant52kAssociationRareVariation == false"
                            >
                                <h5>
                                    <documentation
                                        name="hugecal.rareVaration.header"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                </h5>
                                <h6>
                                    <documentation
                                        name="hugecal.rareVaration.evidence.description"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                </h6>

                                <!-- Traffic Light -->
                                <div
                                    v-if="$parent.rareVariationCategoryAndScore.category"
                                    style="width:600px"
                                >
                                    <br />
                                    <div
                                        v-if="$parent.rareVariationCategoryAndScore.category == 'CAUSAL'"
                                        class="arrow-up causalclass"
                                    ></div>
                                    <div
                                        v-if="$parent.rareVariationCategoryAndScore.category == 'STRONG'"
                                        class="arrow-up strongclass"
                                    ></div>
                                    <div
                                        v-if="$parent.rareVariationCategoryAndScore.category == 'MODERATE'"
                                        class="arrow-up moderateclass"
                                    ></div>
                                    <div
                                        v-if="$parent.rareVariationCategoryAndScore.category == 'POSSIBLE'"
                                        class="arrow-up possibleclass"
                                    ></div>
                                    <div
                                        v-if="$parent.rareVariationCategoryAndScore.category == 'WEAK'"
                                        class="arrow-up weakclass"
                                    ></div>
                                    <div
                                        v-if="$parent.rareVariationCategoryAndScore.category == 'No'"
                                        class="arrow-up noEvidenceclass"
                                    ></div>
                                    <div>
                                        <div class="container">
                                            <div class="row">
                                                <div class="col-sm rareVariationCausal">
                                                    <strong>Causal</strong>
                                                </div>
                                                <div class="col-sm rareVariationStrong">
                                                    <strong>Strong</strong>
                                                </div>
                                                <div class="col-sm rareVariationModerate">
                                                    <strong>Moderate</strong>
                                                </div>
                                                <div class="col-sm rareVariationPossible">
                                                    <strong>Possible</strong>
                                                </div>
                                                <div class="col-sm rareVariationWeak">
                                                    <strong>Weak</strong>
                                                </div>

                                                <div class="col- rareVariationNoEvidence">
                                                    <strong>No Evidence</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <hr style="margin:40px" />
                                <h5>
                                    <documentation
                                        v-if="$parent.rareVariationCategoryAndScore.category"
                                        name="hugecal.priorVariance.header.notExomeSignificant"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                </h5>
                                <h6>
                                    <documentation
                                        v-if="$parent.rareVariationCategoryAndScore.category"
                                        name="hugecal.priorVariance.notExomeSignificant"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                </h6>
                                <div v-if="$parent.geneAssociations52k">
                                    <div style="margin-block-end: 10px; ">
                                        Prior variance:
                                        <input
                                            v-model.number="$store.state.priorVariance"
                                            type="number"
                                            placeholder="Prior Variance"
                                            id="prior_variance_input"
                                        />
                                    </div>

                                    <posterior-probability-plot
                                        :geneAssociationsData="$parent.geneAssociations52k"
                                        :priorVariance="$store.state.priorVariance"
                                        :isDichotomous="true"
                                    ></posterior-probability-plot>
                                </div>
                            </div>
                            <!-- Close Rare Variation -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Confidence interval and it's explaination -->
            <div class="card mdkp-card">
                <div class="card-body" style="margin-block-end: 20px; ">
                    <div class="row">
                        <div class="col-md-7">
                            <!-- loftee -->
                            <div v-if="$parent.geneAssociations52k">
                                <div
                                    v-if="$parent.geneAssociationsLoftee.length > 0"
                                    class="border"
                                >
                                    <h5>
                                        <documentation
                                            name="hugecal.loftee.header"
                                            :content-fill="$parent.documentationMap"
                                        ></documentation>
                                    </h5>

                                    <forest-plot :data=" $parent.geneAssociationsLoftee"></forest-plot>
                                </div>
                                <div v-else>
                                    <h5>
                                        <documentation
                                            name="hugecal.noloftee.header"
                                            :content-fill="$parent.documentationMap"
                                        ></documentation>
                                    </h5>

                                    <ul>
                                        <li>
                                            <strong>
                                                <documentation
                                                    name="hugecal.rareVaration.noLoftee"
                                                    :content-fill="$parent.documentationMap"
                                                ></documentation>
                                            </strong>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-5">
                            <div v-if="$parent.geneAssociations52k">
                                <div v-if="$parent.geneAssociationsLoftee.length > 0">
                                    <documentation
                                        name="hugecal.confidenceInterval.help"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                </div>
                                <div v-else>
                                    <documentation
                                        name="hugecal.confidenceInterval.help"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import $ from "jquery";
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";
import Filters from "@/utils/filters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("test", {
    props: [],
    data() {
        return {};
    },

    computed: {},

    methods: {}
});
// window.onload = function() {
//     document.getElementById("fademe2s").style.opacity = 1;
//     document.getElementById("fademe5s").style.opacity = 1;
//     document.getElementById("fademe5ss").style.opacity = 1;
//     // document.getElementById("fademe6s").style.opacity = 1;
//     // document.getElementById("fademe8s").style.opacity = 1;
// };
</script>


<style>
.arrow-up {
    width: 0;
    height: 40px;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid black;
    animation: moveright 1s alternate 1s;
}

.commonVariationCausal {
    background-color: #884ea0;
}
.commonVariationStrong {
    background-color: #9b59b6;
}
.commonVariationModerate {
    background-color: #af7ac5;
}
.commonVariationPossible {
    background-color: #c39bd3;
}
.commonVariationWeak {
    background-color: #d7bde2;
}
.commonVariationNoEvidence {
    background-color: #ebdef0;
}

.rareVariationCausal {
    background-color: #f1c40f;
}
.rareVariationStrong {
    background-color: #f4d03f;
}
.rareVariationModerate {
    background-color: #f7dc6f;
}
.rareVariationPossible {
    background-color: #f9e79f;
}
.rareVariationWeak {
    background-color: #fcf3cf;
}
.rareVariationNoEvidence {
    background-color: #fef9e7;
}

.combinedVariationCausal {
    background-color: #28b463;
}
.combinedVariationStrong {
    background-color: #2ecc71;
}
.combinedVariationModerate {
    background-color: #58d68d;
}
.combinedVariationPossible {
    background-color: #82e0aa;
}
.combinedVariationWeak {
    background-color: #abebc6;
}
.combinedVariationNoEvidence {
    background-color: #d5f5e3;
}

.causalclass {
    position: absolute;
    left: 60px;
}
.strongclass {
    position: absolute;
    left: 160px;
}
.moderateclass {
    position: absolute;
    left: 260px;
}
.possibleclass {
    position: absolute;
    left: 360px;
}
.weakclass {
    position: absolute;
    left: 460px;
}
.noEvidenceclass {
    position: absolute;
    left: 560px;
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
.perturbationalEvidence1P {
    background-color: #add3f0;
    padding: 5px;
    border-radius: 25px;
    font-weight: 700;
}
.perturbationalEvidence2P {
    background-color: #add3f075;
    padding: 5px;
    border-radius: 25px;
    font-weight: 700;
}
.perturbationalEvidence3P {
    background-color: #add3f050;
    padding: 5px;
    border-radius: 25px;
    font-weight: 700;
}
@keyframes moveup {
    to {
        transform: translateY(-50%);
    }
}
@keyframes moveup {
    to {
        transform: translateY(-50%);
    }
}
.wrap {
    overflow-x: hidden;
}
.slideInRight {
    animation-name: slideInRight;
}
.slideInLeft {
    animation-name: slideInLeft;
}
.animated1 {
    animation-duration: 2s;
    animation-fill-mode: both;
}
.animated2 {
    animation-duration: 2s;
    animation-fill-mode: both;
    animation-delay: 1s;
}
.animated3 {
    animation-duration: 2s;
    animation-fill-mode: both;
    animation-delay: 2s;
}
.animated4 {
    animation-duration: 2s;
    animation-fill-mode: both;
    animation-delay: 3s;
}
@keyframes slideInRight {
    from {
        transform: translate3d(100%, 0, 0);
        visibility: visible;
    }
    to {
        transform: translate3d(0, 0, 0);
    }
}
@keyframes slideInLeft {
    from {
        transform: translate3d(-100%, 0, 0);
        visibility: visible;
    }
    to {
        transform: translate3d(0, 0, 0);
    }
}
#fademe2s {
    opacity: 0;
    transition: 1s;
}
#fademe5s {
    opacity: 0;
    transition: 8s;
}

#fademe5ss {
    opacity: 0;
    transition: 8s;
}
#fademe6s {
    opacity: 0;
    transition: 6s;
}
#fademe8s {
    opacity: 0;
    transition: 8s;
}
</style>
