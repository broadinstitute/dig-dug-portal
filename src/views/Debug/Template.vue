<template>
    <div>
        <!-- Header -->
        <div>
            <button @click="$parent.diseases.push('CAD')">Add CAD</button>
            <button @click="$parent.diseases.pop()">Remove CAD</button>
            {{$parent.diseases}}
            <locuszoom
                :chr="9"
                :start="21940000"
                :end="22190000"
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
        <br>
        <div>
            <lz-plot
                ref="phewas_plot"
                :base_layout="$parent.base_phewas_layout"
                :base_sources="$parent.base_phewas_sources"
                :show_loading="true"
                @connected="$parent.receivePlot"
            ></lz-plot>
        </div>
    </div>
</template>
