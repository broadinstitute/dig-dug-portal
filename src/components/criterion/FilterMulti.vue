<template>
  <filter-control-template
    class="filter-col-md"
    :field="field"
    :predicate="predicate"
    :pillFormatter="pillFormatter"
    :options="options"
    @input-change="$emit('input-change', $event)"
    :color="color"
    :multiple="true"
    :inclusive="inclusive"
    :computedField="computedField"
    :splitBy="splitBy"
  >
    <slot> </slot>
  </filter-control-template>
</template>
<script>
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
export default {
  name: "filter-multi-control",
  props: {
    field: String,
    computedField: Function,
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
    pillFormatter: {
      type: Function,
      default: (filterDefinition) =>
        `${filterDefinition.field} = ${filterDefinition.threshold}`,
    },
    predicate: {
      type: Function,
      default: (string, selection) => string === selection,
    },
  },
  emits: ["input-change"],
  components: {
    FilterControlTemplate,
  },
};
</script>
