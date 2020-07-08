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
                        @annotation="$parent.addAnnotationIntervalsPanel($event)"/>
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

            </div>
        </div>

        <locuszoom
            ref="locuszoom"
            :chr="$store.state.chr"
            :start="$store.state.start"
            :end="$store.state.end"
            :colorScheme="$parent.tissueColorScheme"
            @panelremoved="$parent.tap($event)"
            @regionchanged="$parent.requestCredibleSets($event.data)">
        </locuszoom>
        
    </div>
</template>
