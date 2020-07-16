<template>
    <div :ref="`${id}_el`">
        <pre></pre>
    </div>
</template>
<script>
import Vue from "vue";

export default Vue.component('lz-associations-panel', {

    props: {
        phenotype: {
            type: String,
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
            id: null,
        }
    },
    // TODO: destroying needs to attach a new Vue component to the LocusZoom, need to get that to work
    mounted() {
        this.id = this.$parent.addAssociationsPanel(this.phenotype);
    },
    beforeDestroy() {
        this.$parent.plot.removePanel(this.id);
    },
    watch: {
        phenotype(newPhenotype) {
            this.$parent.addAssociationsPanel(newPhenotype);
            this.$parent.plot.removePanel(this.id);
            this.$destroy();
        }
    }
})

</script>

