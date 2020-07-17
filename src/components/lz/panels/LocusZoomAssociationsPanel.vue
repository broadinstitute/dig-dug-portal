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
    // beforeDestroy() {
    //     this.$parent.plot.removePanel(this.id);
    // },
    watch: {
        phenotype(newPhenotype) {
            // This is good enough
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }

            this.updatePanel();

            // this.$parent.addAssociationsPanelComponent(this, {
            //     phenotype: newPhenotype
            // });
        }
    }
});
</script>
