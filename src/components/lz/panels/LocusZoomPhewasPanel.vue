<template>
    <div :ref="`${id}_el`">
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
        this.id = this.$parent.addPhewasPanel(this.varId, this.phenotypeMap);
    },
    destroy() {
        this.$parent.plot.removePanel(this.id);
    }
})

</script>

