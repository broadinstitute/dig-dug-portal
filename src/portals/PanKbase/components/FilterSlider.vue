<template>
  <filter-slider-template
    class="filter-col-md"
    :field="field"
    :rangeMin="range[0]"
    :rangeMax="range[1]"
    :placeholder="placeholder"
    :predicate="predicate"
    :pillFormatter="pillFormatter"
    @input-change="$emit('input-change', $event)"
    :color="color"
    :multiple="false"
    :inclusive="false"
    :splitBy="splitBy"
    :computedField="computedField"
  >
    <slot> </slot>
  </filter-slider-template>
</template>
<script>
import Vue from "vue";
import FilterSliderTemplate from "./FilterSliderTemplate";
export default Vue.component("filter-slider", {
  props: {
    field: String,
    placeholder: String,
    color: String,
    range: Array,
    splitBy: String,
    inclusive: {
      type: Boolean,
      default: true,
    },
    predicate: {
      type: Function,
      default: (item, thresholdArray) => item >= thresholdArray[0] && item <= thresholdArray[1],
    },
    pillFormatter: {
      type: Function,
      default: (filterDefinition) =>
        `${filterDefinition.field} = ${filterDefinition.threshold}`,
    },
    computedField: Function,
  },
  components: {
    FilterSliderTemplate,
  },
});
</script>
