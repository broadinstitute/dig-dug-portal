<script>


import Vue from "vue"

export default Vue.component('lz-panel', {
    props: {
        panelClass: Object,
        layout: Object,
        source: Object,
        filter: Function
    },
    data() {
        return {
            id: null,
        };
    },
    mounted() {
        this.updatePanel();
        this.$parent.plot.on("panel_removed", (panel) => {
            if (panel.data === this.id) {
            }
        });
    },
    beforeDestroy() {
        this.$parent.plot.removePanel(this.id);
    },
    methods: {
        updatePanel() {
            if (!!this.$parent.addPanels) {
                this.$parent.addPanels(
                    this.panelClass.layouts,
                    this.panelClass.sources
                )
            }
            this.$emit('create', this.panelClass);
        },
    },
    watch: {
        filter() {
        }
    }
})

</script>
<template>
    <div :id="this.id"></div>
</tempate>