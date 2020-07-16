<template>
    <div :ref="`${index}_${salt}`">
        <pre></pre>
    </div>
</template>
<script>
import Vue from "vue";

export default Vue.component('lz-phewas-panel', {

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
            id: null,
        }
    },
    mounted() {
        this.id = this.$parent.addPhewasPanel(this.phenotype);
    },
    watch: {
        varId(newVarId) {
            // this is good enough
            this.$parent.plot.removePanel(this.id);
            this.id = null;
            this.id = this.$parent.addPhewasPanel(newVarId);
        }
    },
  
})

</script>

