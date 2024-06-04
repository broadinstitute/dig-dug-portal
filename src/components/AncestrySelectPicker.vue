<template>
    <select class="form-control"
        v-model="$store.state.selectedAncestry"
        ref="ancestrySelect"
        @change="onAncestrySelected()">
        <option value="" selected>
            {{ defaultMixed ? "Mixed (meta-analysis)" : "All ancestries" }}
        </option>
        <option v-for="ancestry in ancestryOptions" :value="ancestry">{{ ancestryFormatter(ancestry) }}</option>
    </select>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Formatters from "@/utils/formatters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

export default Vue.component("ancestry-selectpicker", {
    props: ["ancestries", "defaultMixed"],

    data() {
        return {
            userText: "",
            ancestryList : null
        };
    },
    computed: {
        ancestryOptions: function() {
            if (!this.ancestries) {
                return [];
            }
            let ancestryList = [];
            for (const ancestry of this.ancestries){
                // "Mixed" in this context refers only to meta-analysis across datasets, not to an ancestry descriptor.
                // So it's a misnomer here and won't return anything from an ancestry endpoint.
                if (!ancestryList.includes(ancestry) && ancestry != 'Mixed'){
                    ancestryList.push(ancestry);
                }
            }
            return ancestryList.sort();
        },
    },
    methods: {
        ancestryFormatter: Formatters.ancestryFormatter,
        onAncestrySelected() {
            this.$store.dispatch("onAncestryChange");
        },

        setFocus() {
            this.$nextTick(() => {
                this.$refs.ancestrySelect.$refs.input.focus();
            });
        },
    },
});
</script>
