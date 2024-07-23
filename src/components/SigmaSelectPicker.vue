<template>
    <select v-model="sigma" class="form-control">
        <option value="sigma0">Large</option>
        <option value="sigma2">Medium</option>
        <option value="sigma4">Small</option>
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

export default Vue.component("sigma-selectpicker", {
    props: [],
    data() {
        return {
            sigma: keyParams.sigma,
        };
    },
    computed: {
        keyParamsSigma() {
            return keyParams.sigma;
        },
    },
    watch: {
        sigma(newSigma) {
            this.$store.state.sigmaToQuery = newSigma;
            this.$emit("onSigmaChange", newSigma);
        },
        keyParamsSigma(newKey) {
            // On some pages, keyParams.sigma is set after initial page load.
            // This captures that.
            if (this.sigma === null) {
                this.sigma = newKey;
            }
        },
    },
});
</script>
