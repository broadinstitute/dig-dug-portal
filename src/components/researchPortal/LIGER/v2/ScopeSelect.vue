<script>
import Vue from "vue";

// The tissue and cell-type dropdowns in the header band. One component for both:
// they differ only in their options and their disabled reason.
//
// Not a native <select>, though the original reason for that is gone: options used
// to carry a secondary line (each cell type's expression reading) that a native
// select cannot render, and that line now lives in the Source data tab instead. What
// keeps it custom is the rest -- the band's label/control/error layout, the disabled
// reason standing in for the placeholder, and the keyboard handling. **If this is
// ever revisited, a native select is a legitimate option again.**
export default Vue.component("ScopeSelect", {
    props: {
        label: {
            type: String,
            required: true
        },
        // [{ key, label }]
        options: {
            type: Array,
            default: () => []
        },
        // the selected option's key
        value: {
            type: String,
            default: ""
        },
        placeholder: {
            type: String,
            default: "Select"
        },
        // why the control cannot be used yet, e.g. "Search a gene first". Shown in
        // place of the placeholder; the control renders disabled.
        disabledReason: {
            type: String,
            default: ""
        },
        loading: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: ""
        },
        emptyText: {
            type: String,
            default: "Nothing available"
        }
    },

    data() {
        return {
            open: false,
            activeIndex: -1
        };
    },

    computed: {
        disabled() {
            return !!this.disabledReason || this.loading;
        },

        selectedOption() {
            return this.options.find((option) => option.key === this.value) || null;
        },

        buttonText() {
            if (this.selectedOption) {
                return this.selectedOption.label;
            }

            if (this.loading) {
                return "Loading…";
            }

            return this.disabledReason || this.placeholder;
        },

        isPlaceholder() {
            return !this.selectedOption;
        }
    },

    watch: {
        options() {
            this.activeIndex = -1;
        },

        disabled(isDisabled) {
            if (isDisabled) {
                this.close();
            }
        }
    },

    beforeDestroy() {
        this.unbindDocument();
    },

    methods: {
        toggle() {
            if (this.disabled) {
                return;
            }

            if (this.open) {
                this.close();
                return;
            }

            this.open = true;
            this.activeIndex = this.options.findIndex((option) => option.key === this.value);
            this.bindDocument();
        },

        bindDocument() {
            if (this.documentListener) {
                return;
            }

            this.documentListener = (event) => {
                if (this.$el && !this.$el.contains(event.target)) {
                    this.close();
                }
            };
            document.addEventListener("pointerdown", this.documentListener);
        },

        unbindDocument() {
            if (!this.documentListener) {
                return;
            }

            document.removeEventListener("pointerdown", this.documentListener);
            this.documentListener = null;
        },

        close() {
            this.open = false;
            this.activeIndex = -1;
            this.unbindDocument();
        },

        onKeydown(event) {
            if (this.disabled) {
                return;
            }

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();

                if (this.open && this.activeIndex >= 0 && this.options[this.activeIndex]) {
                    this.pick(this.options[this.activeIndex]);
                    return;
                }

                this.toggle();
                return;
            }

            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                if (!this.options.length) {
                    return;
                }

                event.preventDefault();

                if (!this.open) {
                    this.toggle();
                    return;
                }

                let step = event.key === "ArrowDown" ? 1 : -1;
                let count = this.options.length;
                this.activeIndex = (this.activeIndex + step + count) % count;
                return;
            }

            if (event.key === "Escape" && this.open) {
                event.stopPropagation();
                this.close();
            }
        },

        pick(option) {
            this.close();

            if (option.key === this.value) {
                return;
            }

            this.$emit("select", option);
        }
    }
});
</script>

<template>
    <div class="scope-select" :class="{ 'is-open': open, 'is-disabled': disabled }">
        <div class="band-label">{{ label }}</div>

        <div class="select-row">
            <button
                type="button"
                class="select-button"
                :class="{ placeholder: isPlaceholder }"
                :disabled="disabled"
                :aria-expanded="open ? 'true' : 'false'"
                aria-haspopup="listbox"
                @click="toggle"
                @keydown="onKeydown"
            >
                <span class="select-text">{{ buttonText }}</span>
                <span v-if="loading" class="spinner" aria-hidden="true"></span>
                <span v-else class="caret" aria-hidden="true"></span>
            </button>

            <div v-if="open" class="option-panel" role="listbox">
                <div v-if="!options.length" class="option-note">{{ emptyText }}</div>
                <button
                    v-for="(option, index) in options"
                    :key="option.key"
                    type="button"
                    class="option"
                    :class="{ active: index === activeIndex, selected: option.key === value }"
                    role="option"
                    :aria-selected="option.key === value ? 'true' : 'false'"
                    @mouseenter="activeIndex = index"
                    @click="pick(option)"
                >
                    <span class="option-label">{{ option.label }}</span>
                </button>
            </div>
        </div>

        <!-- Errors only. There was a status line here reporting the option count and
             the selected cell type's expression reading; both were band chrome for
             facts the reader can get from the canvas and the Source data tab, and it
             reserved a row under all three selectors to say them. An error is
             different: it is the one thing nothing else on the page will mention. -->
        <div v-if="error" class="band-error">{{ error }}</div>
    </div>
</template>

<style scoped>
.scope-select{
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}
.band-label{
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--ce-muted);
}
.select-row{
    position: relative;
}
.select-button{
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 34px;
    padding: 0 10px;
    border: 1px solid var(--ce-line);
    border-radius: 8px;
    background: #fff;
    font-size: 13px;
    font-weight: 700;
    color: var(--ce-ink);
    cursor: pointer;
    text-align: left;
}
.select-button:focus-visible{
    outline: none;
    border-color: var(--ce-accent);
    box-shadow: 0 0 0 3px var(--ce-accent-soft);
}
.select-button:disabled{
    cursor: not-allowed;
    background: var(--ce-sunken);
    color: var(--ce-muted);
}
.select-button.placeholder{
    font-weight: 400;
    color: var(--ce-muted);
}
.select-text{
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.caret{
    flex: none;
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 5px solid var(--ce-muted);
}
.spinner{
    flex: none;
    width: 12px;
    height: 12px;
    border: 2px solid var(--ce-line);
    border-top-color: var(--ce-accent);
    border-radius: 50%;
    animation: ce-spin .7s linear infinite;
}
@keyframes ce-spin{ to { transform: rotate(360deg); } }

.option-panel{
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 30;
    max-height: 288px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid var(--ce-line);
    border-radius: 8px;
    box-shadow: 0 10px 26px rgba(23,38,43,.14);
    padding: 4px;
}
.option{
    display: flex;
    align-items: baseline;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    border: none;
    border-radius: 6px;
    background: none;
    text-align: left;
    cursor: pointer;
}
.option.active{ background: var(--ce-sunken); }
.option.selected{ background: var(--ce-accent-soft); }
.option-label{
    flex: 1;
    min-width: 0;
    font-size: 12px;
    font-weight: 700;
    color: var(--ce-ink);
}
.option.selected .option-label{ color: var(--ce-accent); }
.option-note{
    padding: 6px 8px;
    font-size: 11px;
    color: var(--ce-muted);
}

/* Only rendered when there is an error, so it does not reserve a row. */
.band-error{
    font-size: 11px;
    line-height: 16px;
    color: #b42318;
}
</style>
