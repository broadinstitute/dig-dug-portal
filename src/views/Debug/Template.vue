<template>
    <!-- Header -->
    <div>
        <button @click="$parent.diseases.push('CAD')">Add CAD</button>
        <button @click="$parent.diseases.pop()">Remove CAD</button>
        {{$parent.diseases}}
        <locuszoom
            :chr="9"
            :start="21940000"
            :end="22190000"
            @regionchanged="$parent.tap"
            :ldpop="true"
            :refSeq="true">
            <span v-for="phenotype in $parent.diseases" :key="phenotype">
                <lz-associations-panel 
                    :phenotype="phenotype"
                ></lz-associations-panel>
                <lz-catalog-annotations-panel 
                    :phenotype="phenotype">
                </lz-catalog-annotations-panel>
            </span>
        </locuszoom>
    </div>
</template>
