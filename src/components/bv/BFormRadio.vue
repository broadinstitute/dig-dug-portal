<template>
    <div
        class="custom-control custom-control-inline custom-radio"
        :class="$attrs.class"
        :style="$attrs.style"
    >
        <input
            v-shows="{ text, checked }"
            v-bind="inputAttrs"
            :id="id || ownId"
            class="custom-control-input"
            type="radio"
            :name="group ? group.groupId : null"
            @change="check"
        />
        <label class="custom-control-label" :for="id || ownId"
            ><slot></slot
        ></label>
    </div>
</template>

<script>
import { warn } from "vue";
import { checksUse, nextId, same } from "./helpers";

const showText = (el, text) => {
    if (el.value !== text) {
        el.value = text;
    }
};

export default {
    name: "BFormRadio",
    // attributes, listeners and v-model as in plain Vue 3, also under a compat parent
    compatConfig: { MODE: 3 },
    mixins: checksUse("b-form-radio"),
    directives: {
        // Sets the properties only: Vue's `:checked` sets the attribute too.
        shows: {
            beforeMount(el, { value }) {
                showText(el, value.text);
                el.checked = value.checked;
            },
            updated(el, { value, oldValue }) {
                showText(el, value.text);
                if (value.checked !== oldValue.checked) {
                    el.checked = value.checked;
                }
            },
        },
    },
    inject: {
        group: { from: "bvRadioGroup", default: null },
    },
    inheritAttrs: false,
    props: {
        id: String,
        value: [Number, String],
    },
    data() {
        return { ownId: nextId() };
    },
    computed: {
        text() {
            return this.value === null || this.value === undefined
                ? ""
                : String(this.value);
        },
        checked() {
            return !!this.group && same(this.value, this.group.checked);
        },
        inputAttrs() {
            const { class: className, style, ...attrs } = this.$attrs;
            return attrs;
        },
    },
    created() {
        if (process.env.NODE_ENV !== "production" && !this.group) {
            warn(
                "[bv] <b-form-radio> is only supported in a <b-form-radio-group>"
            );
        }
    },
    methods: {
        check() {
            if (this.group) {
                this.group.checked = this.value;
            }
        },
    },
};
</script>
