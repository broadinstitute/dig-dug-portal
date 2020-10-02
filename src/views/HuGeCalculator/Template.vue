<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">
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

                    <div class="col-md-12 gene-page-header-body">
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
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body" style="margin-block-end: 20px; ">
                    <div class="row">
                        <div class="col-md-7">
                            <h5 v-if="$store.state.effectorGeneData.category">
                                {{$store.state.geneName}} has {{$store.state.effectorGeneData.category}} Evidence
                                <tooltip-documentation
                                    name="gene.function.tooltip.hover"
                                    :content-fill="$parent.documentationMap"
                                    :isHover="true"
                                    :noIcon="false"
                                ></tooltip-documentation>
                            </h5>

                            <!-- traffic light -->
                            <div style="width:600px;" v-if="$store.state.effectorGeneData">
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
                                    v-if="$store.state.effectorGeneData.category == 'No Evidence'"
                                    class="arrow-up noEvidenceclass"
                                ></div>
                                <div>
                                    <div class="container">
                                        <div class="row">
                                            <div style="background-color:#3352FF" class="col-sm">
                                                <strong>Causal</strong>
                                            </div>
                                            <div style="background-color:#337AFF" class="col-sm">
                                                <strong>Strong</strong>
                                            </div>
                                            <div style="background-color:#3393FF" class="col-sm">
                                                <strong>Moderate</strong>
                                            </div>
                                            <div style="background-color:#33ACFF" class="col-sm">
                                                <strong>Possible</strong>
                                            </div>
                                            <div style="background-color:#33E0FF" class="col-sm">
                                                <strong>Weak</strong>
                                            </div>

                                            <div style="background-color:#b3fcf7" class="col-">
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
                            <!-- associations -->
                            <!-- <p> -->
                            <h5>Is {{ $store.state.geneName }} genome-wide significant?</h5>
                            <h6
                                v-if="$parent.isSignificantAssociationCommonVariation"
                            >{{ $store.state.geneName }} is genome wide significant since it's p-value is less than the threshold p-value of 5e-6 as shown below in this locuszoom interactive visualization.</h6>

                            <h6
                                v-else
                            >{{ $store.state.geneName }} is not genome wide significant since it's p-value is greater than the threshold p-value of 5e-6 as shown below in this locuszoom interactive visualization</h6>
                            <div id="gwasAssocHolder">
                                <locuszoom
                                    v-if="$parent.region"
                                    ref="locuszoom"
                                    :chr="$parent.region.chromosome"
                                    :start="$parent.region.start-50000"
                                    :end="$parent.region.end+ 50000"
                                    :refSeq="true"
                                >
                                    <lz-associations-panel
                                        :phenotype="$store.state.phenotype.name"
                                        :finishHandler="$parent.updateAssociationsTable"
                                    ></lz-associations-panel>
                                </locuszoom>
                            </div>
                            <!-- </p> -->

                            <!-- mccarthy EGL -->
                            <!-- <p v-if="$store.state.effectorGeneData.category"> -->
                            <h5>Common variation evidence for {{ $store.state.geneName }} in {{ $store.state.phenotype.description }}...</h5>
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
                                    v-if="$store.state.effectorGeneData.category == 'No Evidence'"
                                    class="arrow-up noEvidenceclass"
                                ></div>
                                <div>
                                    <div class="container">
                                        <div class="row">
                                            <div
                                                style="background-color:#3352FF"
                                                class="col-sm"
                                            >Causal</div>
                                            <div
                                                style="background-color:#337AFF"
                                                class="col-sm"
                                            >Strong</div>
                                            <div
                                                style="background-color:#3393FF"
                                                class="col-sm"
                                            >Moderate</div>
                                            <div
                                                style="background-color:#33ACFF"
                                                class="col-sm"
                                            >Possible</div>
                                            <div
                                                style="background-color:#33E0FF"
                                                class="col-sm"
                                            >Weak</div>

                                            <div
                                                style="background-color:#b3fcf7"
                                                class="col-"
                                            >No Evidence</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Close Common Varation -->
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

                            <h5>Is {{ $store.state.geneName }} Exome-wide significant?</h5>

                            <div v-if="$parent.isSignificant52kAssociationRareVariation">
                                <documentation
                                    name="hugecal.priorVariance.isExomeSignificant"
                                    :content-fill="$parent.documentationMap"
                                ></documentation>

                                <hr style="margin:40px" />
                                <h5>Rare variation evidence for {{ $store.state.geneName }} in {{ $store.state.phenotype.description }}...</h5>
                                <ul>
                                    <li>
                                        Genetic Evidence
                                        <span
                                            class="codingEvidence1C"
                                        >{{$store.state.effectorGeneData.genetic}}</span>
                                    </li>
                                    <li>
                                        <span>
                                            Evidence:
                                            <strong>{{$parent.stage2Category.evidence}}</strong>
                                        </span>
                                    </li>
                                </ul>
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
                                        v-if="$parent.stage2Category.category == 'No Evidence'"
                                        class="arrow-up noEvidenceclass"
                                    ></div>
                                    <div>
                                        <div class="container">
                                            <div class="row">
                                                <div
                                                    style="background-color:#3352FF"
                                                    class="col-sm"
                                                >Causal</div>
                                                <div
                                                    style="background-color:#337AFF"
                                                    class="col-sm"
                                                >Strong</div>
                                                <div
                                                    style="background-color:#3393FF"
                                                    class="col-sm"
                                                >Moderate</div>
                                                <div
                                                    style="background-color:#33ACFF"
                                                    class="col-sm"
                                                >Possible</div>
                                                <div
                                                    style="background-color:#33E0FF"
                                                    class="col-sm"
                                                >Weak</div>

                                                <div
                                                    style="background-color:#b3fcf7"
                                                    class="col-"
                                                >No Evidence</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-else>
                                <h6>
                                    <documentation
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
                            <hr style="margin:60px" />

                            <!-- loftee -->
                            <documentation
                                name="hugecal.stage3.subheader"
                                :content-fill="$parent.documentationMap"
                            ></documentation>
                            <div v-if="$parent.geneAssociations52k">
                                <div
                                    v-if="$parent.geneAssociationsLoftee.length > 0"
                                    class="border"
                                >
                                    <forest-plot :data=" $parent.geneAssociationsLoftee"></forest-plot>
                                </div>
                                <div v-else>
                                    <strong>
                                        <documentation
                                            name="hugecal.rareVaration.noLoftee"
                                            :content-fill="$parent.documentationMap"
                                        ></documentation>
                                    </strong>
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
</script>


<style>
.predictionRow {
    width: 500px;
    height: 25px;
    background: rgb(255, 193, 7);
    background: linear-gradient(
        90deg,
        rgba(255, 193, 7, 1) 27%,
        rgba(40, 167, 69, 1) 59%,
        rgba(0, 123, 255, 1) 90%
    );
}
.arrow-up {
    width: 0;
    height: 40px;

    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid black;
    animation: moveright 1s alternate 1s;
}

.causalclass {
    position: absolute;
    left: 60px;
}

.strongclass {
    position: absolute;
    left: 200px;
}

.moderateclass {
    position: absolute;
    left: 360px;
}

.possibleclass {
    position: absolute;
    left: 400px;
}

.weakclass {
    position: absolute;
    left: 470px;
}

.noEvidenceclass {
    position: absolute;
    left: 540px;
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
    transition: 4s;
}
#fademe4s {
    opacity: 0;
    transition: 4s;
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
