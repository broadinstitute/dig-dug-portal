<template>
    <div class="container-fluid mdkp-body">
        <div class="card mdkp-card">
            <div class="row card-body">
                <div class="col-md-6">
                    <div
                        class="login-required-wrapper"
                    >Please log in with an authorized Google account to see content.</div>
                </div>
                <div class="col-md-6">
                    <div class="fail-loading-wrapper">Failed to load: reason for fail goes here.</div>
                </div>
                <!--
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

                    <button
                        @click="$parent.addComputedCredibleVariantsPanel({ phenotype: 'T2D' })"
                    >Add Computed Variants</button>
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
                ></locuszoom>-->
            </div>
        </div>
    </div>
</template>
