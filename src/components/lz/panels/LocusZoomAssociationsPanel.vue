<template>
    <div></div>
</template>

<script>
import Vue from "vue";

export default Vue.component("lz-associations-panel", {
    props: {
        phenotype: {
            type: String
            // required: true
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
            this.id = this.$parent.addAssociationsPanel(
                this.phenotype,
                this.finishHandler,
                this.resolveHandler,
                this.errHandler
            );
        }
    },
    watch: {
        phenotype(newPhenotype) {
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        }
    }
});
</script>
