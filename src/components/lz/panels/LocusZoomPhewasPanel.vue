<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

export default Vue.component("lz-phewas-panel", {
    props: {
        id: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        phenotypeMap: {
            type: Object,
            required: true,
        },
        finishHandler: {
            type: Function,
            required: false,
        },
        resolveHandler: {
            type: Function,
            required: false,
        },
        errHandler: {
            type: Function,
            required: false,
        },
        // for use with v-model
        value: {
            required: false,
        },
    },
    data() {
        return {
            panelId: null,
        };
    },
    mounted() {
        this.updatePanel();
    },
    methods: {
        updatePanel() {
            // TODO: what *should* happen when this.finishHandler and this.value are both defined?
            // NOTE: result.data is bioindex-shaped data, NOT locuszoom-shaped data (which is good)
            const finishHandler =
                typeof this.value !== "undefined"
                    ? (result) => this.$emit("input", result.data)
                    : this.finishHandler;

            this.panelId = this.$parent.addPhewasPanel(
                this.id,
                this.type,
                this.phenotypeMap,
                this.value,
                finishHandler,
                this.resolveHandler,
                this.errHandler
            );
        },
    },
    watch: {
        value(newVal, oldVal) {
            // the first clause prevents infinite loops
            // the second clause here prevents us from updating the panel twice when locuszoom pushes data to the page
            if (!isEqual(newVal, oldVal) && !isEmpty(oldVal)) {
                if (!!this.panelId) {
                    this.$parent.plot.removePanel(this.panelId);
                }
                this.updatePanel();
            }
        },
        varOrGeneId(newVarOrGeneId) {
            // this is good enough
            if (!!this.panelId) {
                this.$parent.plot.removePanel(this.panelId);
            }
            this.updatePanel();
        },
    },
});
</script>
