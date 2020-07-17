<template>
    <div>
        <locuszoom ref="locuszoom" :chr="chromosome" :start="start" :end="end" :refSeq="true">
            <lz-associations-panel
                v-if="phenotype"
                :phenotype="phenotype"
                :finish-handler="dataLoaded"
            ></lz-associations-panel>
        </locuszoom>
        <associations-table :phenotype="phenotype" :associations="associations"></associations-table>
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

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("locuszoom", LocusZoom);
Vue.component("lz-associations-panel", LocusZoomAssociationsPanel);
Vue.component("associations-table", AssociationsTable);

export default Vue.component("huge-calculator", {
    props: ["chromosome", "start", "end", "phenotype", "associations"],

    data() {
        return {};
    },

    computed: {},

    methods: {
        dataLoaded(data) {
            console.log(data);
        },
       
    },

    watch: {}
});
</script>
