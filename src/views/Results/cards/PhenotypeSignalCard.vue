<template>
    <div>
        <result-card-template :title="title" :parent="parent">
            <template #content>
                <phenotype-signal-mixed :phenotypes="phenotypes"></phenotype-signal-mixed>
            </template>
        </result-card-template>
    </div>
</template>
<script>
import Vue from "vue";

import PhenotypeSignalMixed from "../components/PhenotypeSignalMixed.vue"
import ResultCardTemplate from "./ResultCardTemplate"

export default Vue.component('phenotype-signal-card', {
    props: ['title','parent','topAssociations', 'phenotypeMap'],
    components: {
        PhenotypeSignalMixed,
    },
    computed: {
        phenotypes() {
            let data = this.topAssociations;
            let assocMap = {};

            for (let i in data) {
                const assoc = data[i];

                // skip associations not part of the disease group
                if (
                    !this.phenotypeMap[assoc.phenotype]
                ) {
                    continue;
                }

                const curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }
            // region loaded, hide search
            // uiUtils.hideElement("regionSearchHolder");
            // convert to an array, sorted by p-value
            return Object.values(assocMap).sort((a, b) => a.pValue - b.pValue);
        },
    }
})
</script>
