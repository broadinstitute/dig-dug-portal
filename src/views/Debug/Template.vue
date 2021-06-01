<template>
    <!-- Header -->
    <div>
        <lz-plot
            :base_layout="$parent.geneLayout"
            :base_sources="$parent.dataSources"
            :chr="'10'"
            :start="114735424"
            :end="114835424">
            <lz-associations
                :phenotype="'T2D'"
                @input="$parent.tap"
            ></lz-associations>
        </lz-plot>
    </div>
</template>
