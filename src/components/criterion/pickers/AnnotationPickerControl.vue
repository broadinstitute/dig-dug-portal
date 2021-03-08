<template>
     <criterion-function-group v-model="tmpValue">

        <div class="col filter-col-lg">
            <div class="label" style="margin-bottom: 5px">Add annotation</div>
            <annotation-method-selectpicker
                :annotations="globalEnrichmentAnnotations"
                :clearOnSelected="true"
                @annotation="$emit('annotation', $event)"/>
        </div>

        <slot name="extraPickers"></slot>

        <div class="col divider"></div>

        <span style="display: inline-block">
            <div class="label">Filter annotations by global enrichment</div>
            <filter-enumeration-control
                :field="'method'"
                :options="globalEnrichmentMethods"
            ></filter-enumeration-control>
            <filter-enumeration-control
                :field="'tissue'"
                :options="globalEnrichmentTissues"
            ></filter-enumeration-control>
            <filter-enumeration-control
                :field="'ancestry'"
                :options="globalEnrichmentAncestry"
            ></filter-enumeration-control>
            <filter-pvalue-control
                :field="'pValue'">
                <div class="label">P-Value (&le;)</div>
            </filter-pvalue-control>
            <filter-greater-control
                :field="'fold'" 
                :computedField="enrichment => enrichment.expectedSNPs / enrichment.SNPs">
                <div class="label">Fold (&ge;)</div>
            </filter-greater-control>
        </span>

        <template #filtered="filter">
            <slot name="filtered" :filter="filter"></slot>
        </template>

    </criterion-function-group>
</template>
<script>
import Vue from "vue"
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"
import FilterPValue from "@/components/criterion/FilterPValue.vue"
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue"
import AnnotationSelectPicker from "@/components/AnnotationMethodSelectPicker.vue"
import sortUtils from "@/utils/sortUtils";

export default Vue.component('criterion-annotation-picker', {
    props: ['globalEnrichments', 'value', 'onPick'],
    data() {
        return {
            tmpValue: this.value,
        }
    },
    components: {
        CriterionFunctionGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        AnnotationSelectPicker,
    },
    computed: {
        globalEnrichmentTissues() {
            return Array.from(new Set(this.filteredGlobalEnrichments.map(enrichment => enrichment.tissue)))
        },
        globalEnrichmentTissueIds() {
            return Array.from(new Set(this.filteredGlobalEnrichments.map(enrichment => enrichment.tissueId)))
        },
        // globalEnrichmentAnnotations() {
        //     return Array.from(new Set(this.filteredGlobalEnrichments.map(enrichment => enrichment.annotation)))
        // },
        globalEnrichmentMethods() {
            return Array.from(new Set(this.filteredGlobalEnrichments.map(enrichment => enrichment.method)))
        },
        globalEnrichmentAncestry() {
            return Array.from(new Set(this.filteredGlobalEnrichments.map(enrichment => enrichment.ancestry)))
        },
        filteredGlobalEnrichments() {
            return this.globalEnrichments.filter(this.value)
        },
        globalEnrichmentAnnotations() {
            // an array of annotations
            return sortUtils.uniqBy(
                this.filteredGlobalEnrichments,
                el =>
                    JSON.stringify(
                        [el.annotation, !!el.method ? el.method : ""].join()
                    )
            );
        },
    },
    watch: {
        value(newValue) {
            this.tmpValue = newValue;
        },
        tmpValue(newValue) {
            this.$emit('input', newValue);
        }
    }
})
</script>