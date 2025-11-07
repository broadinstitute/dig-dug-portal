<template>
    <select v-model="traitGroup" class="form-control">
        <option value="all">All</option>
        <option value="all_but_hpo">All but HPO</option>
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
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

export default Vue.component("trait-group-selectpicker", {
    props: [],
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
            let bioindexGroups = bioIndexUtils.TRAIT_GROUPS;
            return Object.keys(bioIndexUtils.TRAIT_GROUPS).map(
                g => [g, bioindexGroups[g]]);
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
                this.size = newKey;
            }
        },
    },
});
</script>
