<template>
    <input
        v-shows="text"
        class="form-control"
        type="text"
        :id="id || ownId"
        :disabled="disabled"
        :placeholder="placeholder"
        @input="take"
        @change="take"
        @blur="take"
    />
</template>

<script>
import { checksUse, nextId } from "./helpers";

const toText = (value) =>
    value === null || value === undefined ? "" : String(value);

export default {
    name: "BFormInput",
    // attributes, listeners and v-model as in plain Vue 3, also under a compat parent
    compatConfig: { MODE: 3 },
    mixins:
        process.env.NODE_ENV === "production"
            ? []
            : [
                  checksUse("b-form-input", {
                      listeners: true,
                      attributes: [
                          "inputmode",
                          "maxlength",
                          "minlength",
                          "pattern",
                          "spellcheck",
                      ],
                      // BootstrapVue's own events, with the text as payload
                      not: ["onInput", "onChange", "onUpdate"],
                      slots: [],
                  }),
              ],
    directives: {
        // Sets the property only: Vue's `:value` sets the attribute too, and its v-model waits for a composition to end.
        shows: {
            beforeMount(el, { value }) {
                el.value = value;
            },
            updated(el, { value }) {
                if (el.value !== value) {
                    el.value = value;
                }
            },
        },
    },
    props: {
        disabled: Boolean,
        id: String,
        modelValue: { type: [Number, String], default: "" },
        placeholder: String,
    },
    emits: ["update:modelValue"],
    data() {
        const text = toText(this.modelValue);
        // `sent` is what the parent knows
        return { text, sent: text, ownId: nextId() };
    },
    watch: {
        modelValue(value) {
            this.text = this.sent = toText(value);
        },
    },
    methods: {
        take(event) {
            this.text = event.target.value;
            if (this.text !== this.sent) {
                this.sent = this.text;
                this.$emit("update:modelValue", this.text);
            }
        },
    },
};
</script>
