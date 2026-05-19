<template>
  <filter-slider-template
    class="filter-col-md"
    :field="field"
    :values="values"
    :placeholder="placeholder"
    :predicate="predicate"
    :pillFormatter="pillFormatter"
    @input-change="$emit('input-change', $event)"
    :color="color"
    :multiple="false"
    :inclusive="false"
    :splitBy="splitBy"
    :computedField="computedField"
    :presets="presets"
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
    values: Array,
    splitBy: String,
    inclusive: {
      type: Boolean,
      default: true,
    },
    predicate: {
      type: Function,
      default: (item, threshold) => item >= threshold.min && item <= threshold.max,
    },
    pillFormatter: {
      type: Function,
      default: (filterDefinition) =>
        `${filterDefinition.threshold[0]} ≤ ${filterDefinition.field} ≤ ${filterDefinition.threshold[1]}`,
    },
    computedField: Function,
    presets: Array
  },
  components: {
    FilterSliderTemplate,
  },
});
</script>
