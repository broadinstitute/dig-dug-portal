<template>
    <select v-model="traitGroup" class="form-control">
        <option value="all">All</option>
        <option value="portal">A2F</option>
        <option value="gcat_trait">GWAS Catalog</option>
        <option value="rare_v2">Orphanet</option>
    </select>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import keyParams from "@/utils/keyParams";
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
