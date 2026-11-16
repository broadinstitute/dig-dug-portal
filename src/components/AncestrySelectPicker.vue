<template>
    <autocomplete
        :matches="['DEFAULT'].concat(ancestryOptions)"
        :labelFormatter="(val) => labelText(val)"
        @item-select="onAncestrySelected($event)"
        :placeholder="labelText($store.state.selectedAncestry)"
    ></autocomplete>
</template>

<script>
import Vue from "vue";
import Autocomplete from "@/components/Autocomplete.vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Formatters from "@/utils/formatters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

export default Vue.component("ancestry-selectpicker", {
    props: ["ancestries", "defaultMixed", "pageLevel"],

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
        defaultLabel(){
            return this.defaultMixed ? "Mixed (meta-analysis)" : "All ancestries"
        }
    },
    methods: {
        ancestryFormatter: Formatters.ancestryFormatter,
        onAncestrySelected(ancestry) {
            if (ancestry === 'DEFAULT'){
                ancestry = '';
            }
            this.$store.dispatch("onAncestryChange", ancestry);
        },

        setFocus() {
            this.$nextTick(() => {
                this.$refs.ancestrySelect.$refs.input.focus();
            });
        },
        labelText(ancestry){
            if (ancestry === '' || ancestry === 'DEFAULT'){
                return this.defaultLabel;
            }
            return Formatters.ancestryFormatter(ancestry);
        }
    },
});
</script>
