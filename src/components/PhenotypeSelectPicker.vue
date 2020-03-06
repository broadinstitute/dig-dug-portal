<template>
    <v-select
        v-model="selectedPhenotype"
        @input="$store.dispatch('onPhenotypeChange', selectedPhenotype);"
        label="description"
        :options="phenotypeOptions"
    ></v-select>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import vSelect from "vue-select";

Vue.component("v-select", vSelect);

import "vue-select/dist/vue-select.css";

export default Vue.component("phenotype-selectpicker", {
    props: ["phenotypes"],

    data() {
        return {
            selectedPhenotype: null
        };
    },
    computed: {
        phenotypeOptions() {
            return this.phenotypes.sort((a, b) => {
                if (a.group < b.group) return -1;
                if (b.group < a.group) return 1;

                if (a.description < b.description) return -1;
                if (b.description < a.description) return 1;

                return 0;
            });
        }
    }
});
</script>
