<template>
    <select v-model="traitGroup" class="form-control">
        <option value="all">All</option>
        <option v-if="!cvdi" value="all_but_hpo">All but HPO</option>
        <option v-if="!cvdi" value="all_complex">Complex traits</option>
        <option v-for="group in groups" :value="group[0]">
            {{ group[1] }}
        </option>
    </select>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import keyParams from "@/utils/keyParams";
import bioIndexUtils from "@/utils/bioIndexUtils";
import cvdiBioIndexUtils from "@/views/CVDI_Pigean/utils/cvdiBioIndexUtils";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

export default Vue.component("trait-group-selectpicker", {
    props: {
        cvdi: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            traitGroup: keyParams.traitGroup,
        };
    },
    computed: {
        keyParamsTraitGroup() {
            return keyParams.traitGroup;
        },
        groups(){
            let bioindexGroups = !this.cvdi ? bioIndexUtils.TRAIT_GROUPS : cvdiBioIndexUtils.TRAIT_GROUPS;
            let output = Object.keys(bioindexGroups).map(
                g => [g, bioindexGroups[g]]);
            console.log(JSON.stringify(output));
            return output;
        }
    },
    watch: {
        traitGroup(newGroup) {
            this.$store.state.traitGroupToQuery = newGroup;
            this.$emit("onTraitGroupChange", newGroup);
        },
        keyParamsTraitGroup(newKey) {
            // do we need this?
            if (this.size === null) {
                console.log("Is this thing firing?");
                this.size = newKey;
            }
        },
    },
});
</script>
