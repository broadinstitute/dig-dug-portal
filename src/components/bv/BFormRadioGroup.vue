<template>
    <div
        v-bind="$attrs"
        :id="groupId"
        class="bv-no-focus-ring"
        role="radiogroup"
        tabindex="-1"
    >
        <slot></slot>
    </div>
</template>

<script>
import { checksUse, nextId, same } from "./helpers";

export default {
    name: "BFormRadioGroup",
    // attributes, listeners and v-model as in plain Vue 3, also under a compat parent
    compatConfig: { MODE: 3 },
    mixins: checksUse("b-form-radio-group", {
        not: ["aria-describedby", "aria-labelledby"],
    }),
    provide() {
        return { bvRadioGroup: this };
    },
    inheritAttrs: false,
    props: {
        id: String,
        modelValue: {},
    },
    emits: ["update:modelValue"],
    data() {
        return { checked: this.modelValue, ownId: nextId() };
    },
    computed: {
        // also the name of the radios
        groupId() {
            return this.id || this.ownId;
        },
    },
    watch: {
        modelValue(value) {
            this.checked = value;
        },
        checked(value, old) {
            if (!same(value, old)) {
                this.$emit("update:modelValue", value);
            }
        },
    },
};
</script>
