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
                            @click="$parent.showHideElement('variantSearchHolder','gene_search_input')"
                        >Search gene</a>
                    </div>

                    <div class="col-md-12 gene-page-header-body">
                        <div id="variantSearchHolder" class="gene-page-header-search-holder hidden">
                            <gene-selectpicker
                                @onGeneChange="$store.dispatch('queryGeneName',$event)"
                            ></gene-selectpicker>
                        </div>
                        <div v-if="$parent.symbolName">
                            <span>
                                {{$parent.symbolName}}
                                <span
                                    v-if="$parent.symbolName.toLowerCase() !== $store.state.geneName.toLowerCase()"
                                >({{$store.state.geneName}})</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- <div id="fademe6s" class="card mdkp-card">
                <div class="card-body">
                    <h4>Fade me in!</h4>
                </div>
            </div>-->

            <!-- <div class="card mdkp-card"> -->
            <!-- <div class="col card-body"> -->
            <!-- Stage 1 -->
            <b-container class="bv-example-row" fluid>
                <!-- Stage 1 and traffic light -->
                <b-row>
                    <b-col cols="6">
                        <!-- Stage 1 -->
                        <div id="fademe2s" class="mdkp-body">
                            <div class="card mdkp-card slideInLeft .animated1">
                                <div
                                    class="card-body"
                                    v-if="$parent.isSignificantAssociationCommonVariation"
                                >
                                    <h5>
                                        Common Variation: Is {{$store.state.geneName}} is genome wide significant?
                                        <tooltip-documentation
                                            name="gene.function.tooltip.hover"
                                            :content-fill="$parent.documentationMap"
                                            :isHover="true"
                                            :noIcon="false"
                                        ></tooltip-documentation>
                                    </h5>
                                    <documentation
                                        name="hugecal.stage1.subheader"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                    <strong v-if="$store.state.effectorGeneData.category">
                                        {{$store.state.effectorGeneData.category}}
                                        <span
                                            style="background-color:#ffc107; padding:5px; border-radius:25px"
                                            v-if="$store.state.effectorGeneData.genetic"
                                        >{{$store.state.effectorGeneData.genetic}}</span>&nbsp;
                                    </strong>
                                    <div v-if="$parent.category">
                                        <strong
                                            v-if="$parent.category.length >1"
                                        >{{$parent.category}}</strong>
                                    </div>

                                    <div v-if="$store.state.effectorGeneData.genomic">
                                        <strong>
                                            Regulatory Evidence:
                                            <span
                                                v-if="$store.state.effectorGeneData.genomic"
                                            >{{$store.state.effectorGeneData.genomic}}</span>&nbsp;
                                        </strong>
                                    </div>
                                    <div>
                                        <strong>
                                            Perturbational Evidence:
                                            <span
                                                style="background-color:#007bff; padding:5px; border-radius:25px"
                                                v-if="$store.state.effectorGeneData.perturbational"
                                            >{{$store.state.effectorGeneData.perturbational}}</span>&nbsp;
                                        </strong>
                                    </div>
                                </div>
                                <div v-else>
                                    <h5>Common Variation: Is {{$store.state.geneName}} is genome wide significant?</h5>
                                    <documentation
                                        name="hugecal.stage1.subheader"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                    <strong>No Evidence available.The {{$store.state.geneName}} is not genome wide significant</strong>
                                </div>

                                <!-- <h4
                                    v-if="$store.state.phenotype"
                                    class="card-title"
                                >Associations for {{$store.state.phenotype.name}} in {{$parent.symbolName}}</h4>-->
                                <div class="huge-calculator-show-associations-wrapper">
                                    <b-button
                                        block
                                        v-on:click="() => $parent.showAssociations == true ? $parent.showAssociations = false : $parent.showAssociations=true"
                                        class="btn-sm huge-calculator-show-associations to-previous-page"
                                    >Show Associations Data</b-button>
                                </div>
                                <!-- <div class="card mdkp-card" >
                                <div class="card-body" >-->
                                <b-col cols="6">
                                    <div></div>
                                </b-col>
                                <div
                                    class="col-md-12 mdkp-card"
                                    id="gwasAssocHolder"
                                    v-if="$parent.showAssociations"
                                >
                                    <locuszoom
                                        v-if="$parent.region"
                                        ref="locuszoom"
                                        :chr="$parent.region.chromosome"
                                        :start="$parent.region.start"
                                        :end="$parent.region.end"
                                        :refSeq="true"
                                    >
                                        <lz-associations-panel
                                            :phenotype="$store.state.phenotype.name"
                                            :finishHandler="$parent.updateAssociationsTable"
                                        ></lz-associations-panel>
                                    </locuszoom>
                                </div>

                                <!-- </div>
                                </div>-->
                                <!-- <associations-table
                                            :phenotypes="$parent.phenotypes"
                                            :associations="$parent.associationsData"
                                ></associations-table>-->
                            </div>
                        </div>
                    </b-col>

                    <!-- Color gradient -->
                    <b-col cols="6">
                        <div class="mdkp-body">
                            <div class="card mdkp-card slideInRight animated">
                                <div class="card-body">
                                    color gradient
                                    <div class="gradient">
                                        <div class="arrow-up causalclass"></div>
                                        <div>
                                            <strong>Causal</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </b-col>
                </b-row>

                <!-- Stage 2 and confidence interval -->
                <b-row>
                    <b-col cols="6">
                        <!-- Stage 1 -->
                        <div class="mdkp-body" v-if="$store.state.effectorGeneData.category">
                            <div class="card mdkp-card slideInLeft .animated2">
                                <div
                                    class="card-body"
                                    v-if="$store.state.effectorGeneData.category != 'CAUSAL'"
                                >
                                    <h5>Stage 2</h5>
                                    <documentation
                                        name="hugecal.stage2.subheader"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                    <div class="col-md-4 gene-page-header-title">
                                        Prior Variance
                                        <a
                                            class="edit-btn"
                                            @click="$parent.showHideElement('priorVarianceHolder','prior_variance_input')"
                                        >Set Prior Variance</a>
                                    </div>
                                    <div class="col-md-4 gene-page-header-body">
                                        <div
                                            id="priorVarianceHolder"
                                            class="gene-page-header-search-holder hidden"
                                        >
                                            <div class="input-group">
                                                <input
                                                    class="form-control input-default"
                                                    v-model.number="$store.state.priorVariance"
                                                    type="number"
                                                    placeholder="Prior Variance"
                                                    id="prior_variance_input"
                                                />
                                            </div>
                                        </div>
                                        <span>{{$store.state.priorVariance}}</span>
                                    </div>
                                    <div v-if="$parent.geneAssociations52k">
                                        <div
                                            v-if="$parent.isSignificant52kAssociationRareVariation"
                                        >
                                            <strong>{{$parent.stage2Category.category}}:{{$parent.stage2Category.Evidence}}</strong>
                                        </div>
                                        <posterior-probability-plot
                                            v-else
                                            :geneAssociationsData="$parent.geneAssociations52k"
                                            :priorVariance="$store.state.priorVariance"
                                            :isDichotomous="true"
                                        ></posterior-probability-plot>
                                    </div>
                                </div>
                                <div class="card-body" v-else>
                                    <!-- <div class="mdkp-body">
                                        <div class="card mdkp-card slideInLeft animated">
                                    <div >-->
                                    <h5>Stage 2</h5>
                                    <documentation
                                        name="hugecal.stage2NoAssociation.subheader"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                    <strong>{{$store.state.geneName}} is Causal</strong>
                                    &nbsp;
                                    <span
                                        style="background-color:#ffc107; padding:5px; border-radius:25px"
                                    >1C</span>&nbsp;
                                    <!-- </div>
                                        </div>
                                    </div>-->
                                </div>
                            </div>
                        </div>
                    </b-col>

                    <!-- confidence interval -->
                    <b-col cols="6">
                        <div class="mdkp-body">
                            <div class="card mdkp-card slideInRight .animated3">
                                <div class="card-body">
                                    <documentation
                                        name="hugecal.stage3.subheader"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                    <div v-if="$parent.geneAssociations52k">
                                        <div
                                            v-if="$parent.geneAssociationsLoftee.length >0"
                                            class="border"
                                        >
                                            <forest-plot :data="$parent.geneAssociationsLoftee"></forest-plot>
                                        </div>
                                        <div v-else>
                                            <strong>There are no loss-of-function variants detected in this gene</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </b-col>
                </b-row>
            </b-container>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import $ from "jquery";
import "jquery-ui";
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

window.onload = function() {
    document.getElementById("fademe2s").style.opacity = 1;
    // document.getElementById("fademe4s").style.opacity = 1;
    // document.getElementById("fademe6s").style.opacity = 1;
    // document.getElementById("fademe8s").style.opacity = 1;
};
</script>


<style>
.gradient {
    width: 800px;
    height: 60px;
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
    height: 75px;

    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid black;
    animation: moveright 1s alternate 1s;
}

.causalclass {
    position: absolute;
    left: 80px;
}

.strongclass {
    position: absolute;
    left: 100px;
}

.moderateclass {
    position: absolute;
    left: 200px;
}

.possibleclass {
    position: absolute;
    left: 250px;
}

.weakclass {
    position: absolute;
    left: 400px;
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



