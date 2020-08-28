<template>
    <div>
        <div class="filtering-ui-wrapper">
            <div class="row filtering-ui-content">
                <div class="col filter-col-lg">
                    <div class="label">Annotation Method Track</div>
                    <annotation-method-selectpicker
                        :annotations="$parent.globalEnrichmentAnnotations"
                        @annotation="$parent.addAnnotationIntervalsPanel($event)"
                    />
                </div>

                <div class="col divider">&nbsp;</div>
                <div class="col filter-col-lg">
                    <div class="label">Credible Sets Track</div>
                    <credible-sets-selectpicker
                        :credibleSets="$parent.credibleSets"
                        @credibleset="$parent.addCredibleVariantsPanel($event)"
                    />

                    <button @click="$parent.addComputedCredibleVariantsPanel({ phenotype: 'T2D' })">Add Computed Variants</button>

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
            @regionchanged="$parent.requestCredibleSets($event.data)"
        ></locuszoom>
    </div>
</template>
