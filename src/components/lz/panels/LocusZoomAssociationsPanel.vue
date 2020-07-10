<template>
    <div :ref="`${index}_${salt}`">
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
    mounted() {
        this.id = this.$parent.addAssociationsPanel(this.phenotype);
    },
    destroy() {
        this.$parent.plot.removePanel(this.id);
    }
})

</script>

