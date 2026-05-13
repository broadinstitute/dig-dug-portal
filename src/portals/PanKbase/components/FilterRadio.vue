<template>
  <filter-radio-template
    class="filter-col-md"
    :field="field"
    :placeholder="placeholder"
    :predicate="predicate"
    :options="dedupedOptions"
    @input-change="$emit('input-change', $event)"
    :color="color"
    :multiple="false"
    :inclusive="false"
    :splitBy="splitBy"
    :computedField="computedField"
  >
    <slot> </slot>
  </filter-radio-template>
</template>
<script>
import Vue from "vue";
import FilterRadioTemplate from "./FilterRadioTemplate.vue";
export default Vue.component("filter-radio", {
  props: {
    field: String,
    placeholder: String,
    options: Array,
    color: String,
    splitBy: String,
    inclusive: {
      type: Boolean,
      default: true,
    },
    predicate: {
      type: Function,
      default: (item, threshold) => item === threshold,
    },
    computedField: Function,
  },
  components: {
    FilterRadioTemplate,
  },
  computed: {
    dedupedOptions(){
      return Array.from(new Set(this.options));
    }
  }
});
</script>
