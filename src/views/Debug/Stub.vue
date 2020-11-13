<template>
    <locuszoom ref="locuszoom" :chr="chromosome" :start="start" :end="end" :refSeq="true">
        <lz-associations-panel
            :phenotype="selectedphenotype"
            :finishHandler="this.updateAssociationsTable"
        ></lz-associations-panel>
    </locuszoom>
</template>
<script>
</script>