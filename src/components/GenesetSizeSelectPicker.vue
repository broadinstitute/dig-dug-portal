<template>
    <select v-model="size" class="form-control">
        <option value="small">Small</option>
        <!-- <option value="medium">Medium</option> -->
        <option value="large">Large</option>
    </select>
</template>

<script>
import keyParams from "@/utils/keyParams";

export default {
    name: "geneset-size-selectpicker",
    props: [],
    emits: ["onGenesetSizeChange"],
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
};
</script>
