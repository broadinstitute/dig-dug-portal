<template>
    <div></div>
</template>

<script>
import Vue from "vue";

export default Vue.component("lz-phewas-panel", {
    props: {
        varId: {
            type: String,
            required: true
        },
        phenotypeMap: {
            type: Object,
            required: true
        },
        finishHandler: {
            type: Function,
            required: false
        },
        resolveHandler: {
            type: Function,
            required: false
        },
        errHandler: {
            type: Function,
            required: false
        }
    },
    data() {
        return {
            id: null
        };
    },
    mounted() {
        this.updatePanel();
    },
    methods: {
        updatePanel() {
            this.id = this.$parent.addPhewasPanel(
                this.varId,
                this.phenotypeMap,
                this.finishHandler,
                this.resolveHandler,
                this.errHandler
            );
        }
    },
    watch: {
        varId(newVarId) {
            // this is good enough
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        }
    }
});
</script>
