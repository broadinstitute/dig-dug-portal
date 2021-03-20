<template>
  <filter-control-template
    class="filter-col-md"
    :field="field"
    :placeholder="placeholder"
    :predicate="predicate"
    :pillFormatter="pillFormatter"
    :options="options"
    @input-change="$emit('input-change', $event)"
    :color="color"
    :multiple="false"
    :inclusive="inclusive"
    :splitBy="splitBy"
    :computedField="computedField"
  >
    <slot> </slot>
  </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
export default Vue.component("filter-basic-control", {
  props: {
    field: String,
    placeholder: String,
    options: {
      type: Array,
      required: false,
    },
    color: String,
    splitBy: String,
    inclusive: {
      type: Boolean,
      default: true,
    },
    predicate: {
      type: Function,
      default: (string, selection) => string === selection,
    },
    pillFormatter: {
      type: Function,
      default: (filterDefinition) =>
        `${filterDefinition.field} = ${filterDefinition.threshold}`,
    },
    computedField: Function,
  },
  components: {
    FilterControlTemplate,
  },
});
</script>
