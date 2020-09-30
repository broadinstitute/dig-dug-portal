<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

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
                            >Search gene</a
                        >
                    </div>

                    <div class="col-md-12 gene-page-header-body">
                        <div
                            id="variantSearchHolder"
                            class="gene-page-header-search-holder hidden"
                        >
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
                                    >({{ $store.state.geneName }})</span
                                >
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div class="row">

                        <div class="col-md-5">
                            <h4>{{$store.state.geneName}} is {{"CAUSAL"}}
                            </h4>

                            <!-- traffic light -->
                            <div class="gradient">
                                <div class="arrow-up causalclass"></div>
                                <div>
                                    <strong>Causal</strong>
                                </div>
                            </div>
                            <hr style="margin:60px" />

                            <!-- loftee -->
                            <documentation
                                name="hugecal.stage3.subheader"
                                :content-fill="$parent.documentationMap"
                            ></documentation>
                            <div v-if="$parent.geneAssociations52k">
                                <div
                                    v-if="
                                        $parent.geneAssociationsLoftee
                                            .length > 0
                                    "
                                    class="border"
                                >
                                    <forest-plot
                                        :data="
                                            $parent.geneAssociationsLoftee
                                        "
                                    ></forest-plot>
                                </div>
                                <div v-else>
                                    <strong
                                        >There are no loss-of-function
                                        variants detected in this
                                        gene</strong
                                    >
                                </div>
                            </div>
                        </div>

                        <div class="col-md-7" style="border-left: 1px dashed #444">

                            <!-- stage 1 -->
                            <h4>
                                Common Variation
                                <tooltip-documentation
                                    name="gene.function.tooltip.hover"
                                    :content-fill="$parent.documentationMap"
                                    :isHover="true"
                                    :noIcon="false"
                                ></tooltip-documentation>
                            </h4>
                            TODO: &lt;documentation&gt; tag here...

                            <!-- associations -->
                            <p>
                                <h5>Is {{ $store.state.geneName }} is genome-wide significant?</h5>
                                <div id="gwasAssocHolder">
                                    <locuszoom
                                        v-if="$parent.region"
                                        ref="locuszoom"
                                        :chr="$parent.region.chromosome"
                                        :start="$parent.region.start"
                                        :end="$parent.region.end"
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
                            </p>

                            <!-- mccarthy EGL -->
                            <p v-if="$store.state.effectorGeneData.category">
                                <h5>Evidence for {{ $store.state.geneName }} in {{ $store.state.phenotype.description }}...</h5>
                                <ul>

                                    <!-- genetic -->
                                    <li v-if="$store.state.effectorGeneData.genetic">
                                    {{$store.state.effectorGeneData.category}}

                                    <span
                                        style="
                                            background-color: #ffc107;
                                            padding: 5px;
                                            border-radius: 25px;
                                            font-weight: 700;
                                        "

                                        >{{$store.state.effectorGeneData.genetic}}</span>
                                    </li>

                                    <!-- genomic -->
                                    <li v-if="$store.state.effectorGeneData.genomic">
                                        Regulatory Evidence:
                                        <span
                                            style="
                                                background-color: #ffc107;
                                                padding: 5px;
                                                border-radius: 25px;
                                                font-weight: 700;
                                            ">
                                            {{$store.state.effectorGeneData.genomic}}
                                        </span>
                                    </li>

                                    <!-- perturbational -->
                                    <li v-if="$store.state.effectorGeneData.perturbational">
                                        Perturbational Evidence:
                                        <span
                                            style="
                                                color: #fff;
                                                background-color: #007bff;
                                                padding: 5px;
                                                border-radius: 25px;
                                                font-weight: 700;
                                            ">
                                                {{$store.state.effectorGeneData.perturbational}}
                                        </span>
                                    </li>
                                </ul>
                            </p>
                            <hr style="margin:60px" />

                            <!-- stage 2 -->
                            <h4>
                                Rare Variation
                                <tooltip-documentation
                                    name="gene.function.tooltip.hover"
                                    :content-fill="$parent.documentationMap"
                                    :isHover="true"
                                    :noIcon="false"
                                ></tooltip-documentation>
                            </h4>
                            TODO: &lt;documentation&gt; tag here...

                            <!-- 52k -->
                            <p v-if="$parent.geneAssociations52k">
                                <h5>Posterior Probability vs. Prior Variance</h5>
                                <div class="input-group">
                                    Prior variance:
                                    <input
                                        class="form-control input-default"
                                        v-model.number="$store.state.priorVariance"
                                        type="number"
                                        placeholder="Prior Variance"
                                        id="prior_variance_input"
                                    />
                                </div>


                                <strong>
                                    {{$parent.stage2Category.category}}:{{$parent.stage2Category.Evidence}}
                                </strong>
                                <posterior-probability-plot
                                    :geneAssociationsData="$parent.geneAssociations52k"
                                    :priorVariance="$store.state.priorVariance"
                                    :isDichotomous="true"
                                ></posterior-probability-plot>
                            </p>
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

    methods: {},
});

window.onload = function () {
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
