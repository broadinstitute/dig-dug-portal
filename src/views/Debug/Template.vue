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

            <div class="slideInRight animated card mdkp-card">
                <div class="col card-body">
                    <!-- Stage 1 -->

                    <div class="row card mdkp-card">
                        <div class="col-md-6 card-body">
                            <div v-if="$parent.isSignificantAssociationCommonVariation">
                                <h5>Common Variation: Is {{$store.state.geneName}} is genome wide significant</h5>
                                <documentation
                                    name="hugecal.stage1.subheader"
                                    :content-fill="$parent.documentationMap"
                                ></documentation>
                                <strong v-if="$store.state.effectorGeneData.category">
                                    {{$store.state.effectorGeneData.category}}:
                                    <span
                                        v-if="$store.state.effectorGeneData.genetic"
                                    >{{$store.state.effectorGeneData.genetic}}</span>&nbsp;
                                </strong>
                                <div v-if="$parent.category">
                                    <strong v-if="$parent.category.length >1">{{$parent.category}}</strong>
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
                                            v-if="$store.state.effectorGeneData.perturbational"
                                        >{{$store.state.effectorGeneData.perturbational}}</span>&nbsp;
                                    </strong>
                                </div>
                            </div>
                            <b-col class="col-md-auto" v-else>
                                <h5>Common Variation: Is {{$store.state.geneName}} is genome wide significant</h5>
                                <documentation
                                    name="hugecal.stage1.subheader"
                                    :content-fill="$parent.documentationMap"
                                ></documentation>
                                <strong>No Evidence available.The {{$store.state.geneName}} is not genome wide significant</strong>
                            </b-col>

                            <div class="card mdkp-card">
                                <div class="card-body">
                                    <h4
                                        v-if="$store.state.phenotype"
                                        class="card-title"
                                    >Associations for {{$store.state.phenotype.name}} in {{$parent.symbolName}}</h4>

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
                                    <!-- <associations-table
                                            :phenotypes="$parent.phenotypes"
                                            :associations="$parent.associationsData"
                                    ></associations-table>-->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Stage 2 -->

                    <b-row class="slideInRight animated2">
                        <b-col md="6" v-if="$store.state.effectorGeneData.category">
                            <div v-if="$store.state.effectorGeneData.category != 'CAUSAL'">
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
                                    <div v-if="$parent.isSignificant52kAssociationRareVariation">
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
                            <div v-else>
                                <h5>Stage 2</h5>
                                <documentation
                                    name="hugecal.stage2NoAssociation.subheader"
                                    :content-fill="$parent.documentationMap"
                                ></documentation>
                                <strong>{{$store.state.geneName}} is Causal</strong>
                            </div>
                        </b-col>
                    </b-row>

                    <!-- Stage 3 -->

                    <!-- <b-row class="mb-3 border-right">
                        <b-col md="6">
                            <h5 class="card-title">Stage 3</h5>
                            <documentation
                                name="hugecal.stage3.subheader"
                                :content-fill="$parent.documentationMap"
                            ></documentation>
                            <div v-if="$parent.geneAssociations52k">
                                <div v-if="$parent.geneAssociationsLoftee.length >0" class="border">
                                    <forest-plot :data="$parent.geneAssociationsLoftee"></forest-plot>
                                </div>
                                <div v-else>
                                    <strong>There are no loss-of-function variants detected in this gene</strong>
                                </div>
                            </div>
                        </b-col>
                    </b-row>-->
                </div>
            </div>
            <!-- <div class="huge-calculator-show-associations-wrapper">
                <b-button
                    block
                    v-on:click="() => $parent.showAssociations == true ? $parent.showAssociations = false : $parent.showAssociations=true"
                    class="btn-sm huge-calculator-show-associations to-previous-page"
                >Show Associations Data</b-button>
            </div>-->
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

// window.onload = function() {
//     document.getElementById("fademe3s").style.opacity = 1;
//     document.getElementById("fademe6s").style.opacity = 1;
// };
</script>


<style>
.wrap {
    overflow-x: hidden;
}
.slideInRight {
    animation-name: slideInRight;
}
.animated {
    animation-duration: 4s;
    animation-fill-mode: both;
}

.animated2 {
    animation-duration: 8s;
    animation-fill-mode: both;
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

#fademe3s {
    opacity: 0;
    transition: 4s;
}

#fademe6s {
    opacity: 0;
    transition: 8s;
}

#fademe9s {
    opacity: 0;
    transition: 12s;
}
</style> 



