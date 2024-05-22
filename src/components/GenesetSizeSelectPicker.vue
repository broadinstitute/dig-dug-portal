<template>
    <select v-model="size" class="form-control">
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
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

export default Vue.component("geneset-size-selectpicker", {
    props: [],
    data() {
        return {
            size: keyParams.genesetSize,
        };
    },
    computed: {
        keyParamsSize() {
            return keyParams.genesetSize;
        },
    },
    watch: {
        size(newSize) {
            this.$store.state.genesetSizeToQuery = newSize;
            this.$emit("onGenesetSizeChange", newSize);
        },
        keyParamsSize(newKey) {
            if (this.size === null) {
                this.size = newKey;
            }
        },
    },
});
</script>
