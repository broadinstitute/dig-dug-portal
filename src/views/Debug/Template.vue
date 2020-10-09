<template>
    <div>
        <input type="checkbox" id="checkbox" v-model="$parent.inclusive" />
        <label for="checkbox">{{ $parent.inclusive ? "inclusive filter" : "exclusive filter" }}</label>

        <!-- FilterGroup -->
        <!-- "looseMatch=true" means objects that don't have all the properties will pass through by default
             On the Region page this is necessary
             "inclusive" means that the filter will be inclusive predicates (akin to a series of ORs) by default, unless the child controls override.
        -->
        <filter-group v-model="$parent.filterFunction" :looseMatch="true">
            <filter-enumeration-control
                :field="'consequence'"
                :options="$parent.associationConsequences"
            >Consequence</filter-enumeration-control>

            <filter-enumeration-control
                :field="'nearest'"
                :options="$parent.associationNearestGenes"
            >Closest Genes</filter-enumeration-control>

            <filter-pvalue-control :field="'pValue'"></filter-pvalue-control>

            <filter-effect-direction-control :field="'beta'"></filter-effect-direction-control>

            <filter-multi-control :field="'nearest'" :options="$parent.associationNearestGenes"></filter-multi-control>
        </filter-group>

        <!-- Div is dummy to fit components in slot -->
        <div>
            <locuszoom
                ref="locuszoom"
                :chr="$parent.chr"
                :start="$parent.start"
                :end="$parent.end"
                :refSeq="true"
            >
                <lz-associations-panel :phenotype="$parent.phenotypes[0].name"></lz-associations-panel>
            </locuszoom>

            <associations-table
                :associations="$parent.associations"
                :phenotypes="$parent.phenotypes"
            ></associations-table>
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
