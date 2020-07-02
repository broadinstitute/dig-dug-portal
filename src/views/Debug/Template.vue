<template>
    <div>

        <input v-model="$parent.addPhenotype"/>
        <button @click="$parent.addAPhenotype">Add Phenotype</button>

        <input v-model="$parent.removePhenotype"/>
        <button @click="$parent.removeAPhenotype">Remove Phenotype</button>

        <div class="filtering-ui-wrapper">
            <div class="row filtering-ui-content">
                <div class="col filter-col-lg">
                    <div class="label">Annotation Method Track</div>
                    <annotation-method-selectpicker
                        :annotations="$parent.globalEnrichmentAnnotations"
                        @annotation="$parent.addIntervalsPanel($event)"/>
                </div>

                <div class="col filter-col-sm">
                    <div class="label">pValue (&le;)</div>
                    <input v-model.number="$parent.pValue" class="form-control" />
                </div>
                <div class="col filter-col-sm">
                    <div class="label">Fold (&ge;)</div>
                    <input v-model.number="$parent.fold" class="form-control" />
                </div>

                <div class="col divider">&nbsp;</div>
                <div class="col filter-col-lg">
                    <div class="label">Credible Sets Track</div>
                    <credible-sets-selectpicker
                        :credibleSets="$parent.credibleSets"
                        @credibleset="$parent.addCredibleVariantsPanel($event)"/>
                </div>

                <div class="col divider">&nbsp;</div>
                <div class="col filter-col-lg">
                    <div class="label">View region in Variant Prioritizer</div>
                    <b-button
                        class="btn btn-sm btn-2-vptz"
                        :href="`http://v2f-pancakeplot.broadinstitute.org/pancakeplot/index.html?phenotype=${$store.state.phenotype.name}&chr=${$store.state.chr}&start=${$store.state.start}&end=${$store.state.end}`"
                        target="_blank"
                    >{{`Trait: ${$store.state.phenotype.name}, Region: ${$parent.regionString}`}}</b-button>
                </div>
            </div>
        </div>

        <locuszoom
            :chr="$store.state.chr"
            :start="$store.state.start"
            :end="$store.state.end">

            <lz-associations-panel
                v-for="phenotype in $parent.phenotypes"
                :key="phenotype"
                :phenotype="phenotype">
            </lz-associations-panel>

        </locuszoom>
    </div>
</template>
