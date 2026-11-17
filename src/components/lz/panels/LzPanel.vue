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
            panelId: null,
        };
    },
    mounted() {
        this.updatePanel();
        this.$parent.plot.on("panel_removed", (panel) => {
            if (panel.data === this.panelId) {
            }
        });
    },
    beforeDestroy() {
        this.$parent.plot.removePanel(this.panelId);
    },
    methods: {
        updatePanel() {
            this.panelId = this.$parent.addPanels(
                this.panelClass
            );
            this.$emit('updated', { panelId: this.panelId, panelClass: this.panelClass })
        },
    },
})

</script>
<template>
    <div :id="this.panelId"></div>
</tempate>