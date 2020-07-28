<template>
    <div>
        <phenotype-selectpicker
            v-if="selectedphenotype"
            :phenotypes="dropdownphenotypes"
           
        ></phenotype-selectpicker>
        <locuszoom ref="locuszoom" :chr="chromosome" :start="start" :end="end" :refSeq="true">
            <lz-associations-panel
                :phenotype="selectedphenotype"
                :finishHandler="this.updateAssociationsTable"
            ></lz-associations-panel>
        </locuszoom>
        <associations-table :phenotypes="phenotypes" :associations="associations"></associations-table>
    </div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";
import AssociationsTable from "@/components/AssociationsTable";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("locuszoom", LocusZoom);
Vue.component("lz-associations-panel", LocusZoomAssociationsPanel);
Vue.component("associations-table", AssociationsTable);
Vue.component("phenotype-selectpicker", PhenotypeSelectPicker);

export default Vue.component("huge-calculator", {
    props: [
        "chromosome",
        "start",
        "end",
        "selectedphenotype",
        "dropdownphenotypes",
        "phenotypes",
        "associations"
    ],

    data() {
        return {};
    },

    computed: {},

    methods: {
        updateAssociationsTable(data) {
            this.$store.commit(`associations/setResponse`, data);
        }
    },

    watch: {}
});
</script>
