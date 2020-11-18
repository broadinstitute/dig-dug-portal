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
                                @onGeneChange="
                                    $store.dispatch('queryGeneName', $event)
                                "
                            ></gene-selectpicker>
                        </div>
                        <div v-if="$parent.symbolName">
                            <span>
                                {{ $parent.symbolName }}
                                <span
                                    v-if="
                                        $parent.symbolName.toLowerCase() !==
                                        $store.state.geneName.toLowerCase()
                                    "
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
                                :phenotypes="$store.state.bioPortal.phenotypes"
                                :default-phenotype="$store.state.phenotype.description"
                            ></phenotype-selectpicker>
                        </div>
                        <span v-if="$store.state.phenotype">{{ $store.state.phenotype.description }}</span>
                    </div>
                </div>
            </div>

            <!-- Card for combined Evidence -->
            <div class="card mdkp-card">
                <div class="card-body" style="margin-block-end: 20px">
                    <div class="row">
                        <div class="col-md-6">
                            <h4>
                                Combined Evidence
                                <tooltip-documentation
                                    name="gene.function.tooltip.hover"
                                    :content-fill="$parent.documentationMap"
                                    :isHover="true"
                                    :noIcon="false"
                                ></tooltip-documentation>
                            </h4>

                            <h5>
                                {{ $store.state.geneName }} has
                                {{$parent.combinedVariationCategory.category}}evidence of a
                                disease-susceptibility.
                            </h5>

                            <!-- traffic light -->

                            <div style="width: 700px" v-if="$parent.eglData">
                                <br />
                                <color-bar-plot
                                    v-if="$parent.eglData"
                                    :category="$parent.combinedVariationCategory.category"
                                    :elementid="'combinedVariation'"
                                ></color-bar-plot>
                            </div>

                            <!-- //ppa plot goes here. -->
                        </div>
                    </div>
                </div>
            </div>
            <!-- End of combined evidence -->

            <!-- card for Common and Rare Variation -->
            <div class="card mdkp-card">
                <div class="card-body" style="margin-block-end: 20px">
                    <div class="row">
                        <div class="col-md-6">
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
                            <ul v-if="$parent.isSignificantAssociationCommonVariation">
                                <!-- genetic -->
                                <li v-if="$parent.eglData.category">
                                    Genetic Evidence:
                                    <span
                                        v-if="$parent.eglData.genetic == '1C'"
                                        class="codingEvidence1C"
                                    >{{$parent.eglData.genetic}}</span>
                                    <span
                                        v-else-if="$parent.eglData.genetic == '2C'
                                        "
                                        class="codingEvidence2C"
                                    >{{$parent.eglData.genetic}}</span>
                                </li>
                                <!-- genomic -->
                                <li v-if="$parent.eglData.genomic">
                                    Regulatory Evidence:
                                    <span
                                        v-if="
                                            $parent.eglData.genomic == '2R'
                                        "
                                        class="regulatoryEvidence2R"
                                    >
                                        {{
                                        $parent.eglData.genomic
                                        }}
                                    </span>
                                    <span
                                        v-if="
                                            $parent.eglData.genomic == '3R'
                                        "
                                        class="regulatoryEvidence3R"
                                    >
                                        {{
                                        $parent.eglData.genomic
                                        }}
                                    </span>
                                </li>

                                <!-- perturbational -->
                                <li
                                    v-if="
                                        $parent.eglData.perturbational
                                    "
                                >
                                    Perturbational Evidence:
                                    <span
                                        v-if="
                                           $parent.eglData.perturbational == '1P'
                                        "
                                        class="perturbationalEvidence1P"
                                    >
                                        {{
                                        $parent.eglData.perturbational
                                        }}
                                    </span>
                                    <span
                                        v-if="
                                            $parent.eglData.perturbational == '2P'
                                        "
                                        class="perturbationalEvidence2P"
                                    >
                                        {{
                                        $parent.eglData.perturbational
                                        }}
                                    </span>
                                    <span
                                        v-if="
                                            $parent.eglData.perturbational == '3P'
                                        "
                                        class="perturbationalEvidence3P"
                                    >
                                        {{
                                        $parent.eglData.perturbational
                                        }}
                                    </span>
                                </li>
                            </ul>
                            <!-- Common variation color bar plot -->
                            <div style="width: 700px" v-if="$parent.eglData">
                                <br />
                                <color-bar-plot
                                    :category="$parent.commonVariationCategory.category.toUpperCase()"
                                    :elementid="'commonVariation'"
                                ></color-bar-plot>
                            </div>
                            <hr style="margin: 40px" />
                            <!-- End of common variation evidence -->

                            <!-- gwas associations -->
                            <div v-if="$store.state.associations.data">
                                <div
                                    v-if="
                                        $parent.isSignificantAssociationCommonVariation
                                    "
                                >
                                    <h5>
                                        <documentation
                                            name="hugecal.commonVaration.header.gwasSignificant"
                                            :content-fill="
                                                $parent.documentationMap
                                            "
                                        ></documentation>
                                    </h5>

                                    <h6>
                                        <documentation
                                            name="hugecal.commonVaration.subheader.gwasSignificant"
                                            :content-fill="
                                                $parent.documentationMap
                                            "
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
                                            :phenotype="
                                                $store.state.phenotype.name
                                            "
                                            :finishHandler="
                                                $parent.updateAssociationsTable
                                            "
                                        ></lz-associations-panel>
                                    </locuszoom>
                                </div>
                                <div
                                    v-else-if="
                                        $parent.isSignificantAssociationCommonVariation ==
                                        false
                                    "
                                >
                                    <h5>
                                        <documentation
                                            name="hugecal.commonVaration.header.notgwasSignificant"
                                            :content-fill="
                                                $parent.documentationMap
                                            "
                                        ></documentation>
                                    </h5>

                                    <h6>
                                        <documentation
                                            name="hugecal.commonVaration.subheader.notgwasSignificant"
                                            :content-fill="
                                                $parent.documentationMap
                                            "
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
                                            :phenotype="
                                                $store.state.phenotype.name
                                            "
                                            :finishHandler="
                                                $parent.updateAssociationsTable
                                            "
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
                                        >{{$parent.stage2Category.genetic}}</span>
                                    </li>
                                    <li>
                                        <span>
                                            <strong>{{$parent.stage2Category.evidence }}</strong>
                                        </span>
                                    </li>
                                </ul>
                                <!-- Traffic Light for rare variation when gene is exome significant -->
                                <color-bar-plot
                                    :category="$parent.rareVariationCategory.category.toUpperCase()"
                                    :elementid="'rareVariation'"
                                ></color-bar-plot>

                                <hr style="margin: 40px" />
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
                                v-else-if="$parent.isSignificant52kAssociationRareVariation ==false"
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
                                <color-bar-plot
                                    :category="$parent.rareVariationCategory.category.toUpperCase()"
                                    :elementid="'rareVariation'"
                                ></color-bar-plot>

                                <hr style="margin: 40px" />
                                <h5>
                                    <documentation
                                        v-if="$parent.rareVariationCategory.category"
                                        name="hugecal.priorVariance.header.notExomeSignificant"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                </h5>
                                <h6>
                                    <documentation
                                        v-if="$parent.rareVariationCategory.category"
                                        name="hugecal.priorVariance.notExomeSignificant"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                </h6>
                                <div v-if="$parent.geneAssociations52k">
                                    <div style="margin-block-end: 10px">
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
#commonVariation .variationWeak {
    background-color: #deb3f1;
}
#commonVariation .variationInGWAS {
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
#rareVariation .variationWeak {
    background-color: #f3e3a4;
}
#rareVariation .variationInGWAS {
    background-color: #f3e9c5;
}
#rareVariation .variationNoEvidence {
    background-color: #ebe8de;
}

#combinedVariation .variationCausal {
    background-color: rgb(9, 85, 79);
}
#combinedVariation .variationStrong {
    background-color: rgb(22, 92, 86);
}
#combinedVariation .variationModerate {
    background-color: rgb(29, 109, 102);
}
#combinedVariation .variationPossible {
    background-color: rgb(35, 134, 126);
}
#combinedVariation .variationWeak {
    background-color: rgb(50, 160, 151);
}
#combinedVariation .variationInGWAS {
    background-color: rgb(70, 182, 173);
}
#combinedVariation .variationNoEvidence {
    background-color: rgb(109, 212, 204);
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
.inGWASclass {
    position: absolute;
    left: 550px;
}
.noEvidenceclass {
    position: absolute;
    left: 650px;
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
